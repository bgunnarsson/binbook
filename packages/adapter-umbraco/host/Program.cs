using System.Dynamic;
using System.Runtime.Loader;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.Razor;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging;

// Binbook Razor render host (mvc mode).
//
// A long-lived process the Node adapter spawns once and talks to over stdio:
// one JSON request per line on stdin, one JSON response per line on stdout.
//   request:  { "id": 1, "templatePath": "/abs/Button.cshtml", "args": { ... } }
//   response: { "id": 1, "html": "..." }   or   { "id": 1, "error": "..." }
// stdout carries ONLY protocol frames; diagnostics go to stderr.
//
// Rendering goes through the real ASP.NET Core MVC Razor view engine with
// runtime compilation, so Tag Helpers, layouts, partials, and view components
// all work. `umbraco`-mode stories bypass this host entirely (the adapter POSTs
// to the consumer site's live render endpoint instead).

// Tag Helper assemblies referenced by templates (`@addTagHelper *, MyAssembly`),
// passed as an OS-path-delimited list. Load them into the default context so the
// compiled views can resolve tag helper types at runtime.
var refPaths = (Environment.GetEnvironmentVariable("BINBOOK_RAZOR_REFS") ?? "")
    .Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    .Select(Path.GetFullPath)
    .Where(File.Exists)
    .ToArray();
foreach (var dll in refPaths)
{
    try { AssemblyLoadContext.Default.LoadFromAssemblyPath(dll); }
    catch (Exception ex) { Console.Error.WriteLine($"binbook: could not load tag helper assembly {dll}: {ex.Message}"); }
}

// Runtime compilation resolves views by application-relative path. Rooting a
// physical file provider at the filesystem root lets us address templates by
// their absolute path (and lets MVC walk up to find _ViewImports.cshtml).
var fsRoot = Path.GetPathRoot(Directory.GetCurrentDirectory());
if (string.IsNullOrEmpty(fsRoot)) fsRoot = Path.DirectorySeparatorChar.ToString();
var rootProvider = new PhysicalFileProvider(fsRoot);

var builder = WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders(); // keep stdout free of framework log noise
builder.Services
    .AddControllersWithViews()
    .AddRazorRuntimeCompilation(options =>
    {
        options.FileProviders.Clear();
        options.FileProviders.Add(rootProvider);
        foreach (var dll in refPaths) options.AdditionalReferencePaths.Add(dll);
    });

var app = builder.Build();
var renderer = new RazorRenderer(app.Services, fsRoot);

var stdout = Console.Out;
var jsonOptions = new JsonSerializerOptions
{
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
};

string? line;
while ((line = await Console.In.ReadLineAsync()) != null)
{
    if (string.IsNullOrWhiteSpace(line)) continue;

    int id = 0;
    try
    {
        using var doc = JsonDocument.Parse(line);
        var root = doc.RootElement;
        id = root.GetProperty("id").GetInt32();
        var templatePath = root.GetProperty("templatePath").GetString()
            ?? throw new InvalidOperationException("missing templatePath");

        var modelArgs = new Dictionary<string, object?>();
        if (root.TryGetProperty("args", out var argsEl) && argsEl.ValueKind == JsonValueKind.Object)
        {
            foreach (var prop in argsEl.EnumerateObject())
                modelArgs[prop.Name] = ToClr(prop.Value);
        }

        var html = await renderer.RenderAsync(templatePath, new SafeModel(modelArgs));
        Respond(new Response { Id = id, Html = html });
    }
    catch (Exception ex)
    {
        Respond(new Response { Id = id, Error = ex.Message });
    }
}

void Respond(Response r)
{
    stdout.Write(JsonSerializer.Serialize(r, jsonOptions));
    stdout.Write('\n');
    stdout.Flush();
}

static object? ToClr(JsonElement e) => e.ValueKind switch
{
    JsonValueKind.True => true,
    JsonValueKind.False => false,
    JsonValueKind.String => e.GetString(),
    JsonValueKind.Null => null,
    JsonValueKind.Number => e.TryGetInt64(out var l) ? l : e.GetDouble(),
    _ => e.GetRawText(),
};

sealed class Response
{
    public int Id { get; set; }
    public string? Html { get; set; }
    public string? Error { get; set; }
}

/// Renders a .cshtml file (addressed by absolute path) to a string through the
/// MVC Razor view engine, with a minimal in-memory request/action context.
sealed class RazorRenderer
{
    private readonly IServiceProvider _services;
    private readonly IRazorViewEngine _viewEngine;
    private readonly ITempDataProvider _tempDataProvider;
    private readonly IModelMetadataProvider _metadataProvider;
    private readonly string _fsRoot;

    public RazorRenderer(IServiceProvider services, string fsRoot)
    {
        _services = services;
        _viewEngine = services.GetRequiredService<IRazorViewEngine>();
        _tempDataProvider = services.GetRequiredService<ITempDataProvider>();
        _metadataProvider = services.GetRequiredService<IModelMetadataProvider>();
        _fsRoot = fsRoot;
    }

    public async Task<string> RenderAsync(string absolutePath, object model)
    {
        // Make the path application-relative to the root file provider: strip the
        // filesystem root and use a leading '/' so the engine treats it as such.
        var appRelative = "/" + Path.GetFullPath(absolutePath)
            .Substring(_fsRoot.Length)
            .Replace(Path.DirectorySeparatorChar, '/')
            .TrimStart('/');

        var result = _viewEngine.GetView(executingFilePath: null, viewPath: appRelative, isMainPage: true);
        if (!result.Success)
        {
            var searched = result.SearchedLocations is null ? "" : string.Join(", ", result.SearchedLocations);
            throw new InvalidOperationException($"view not found: {appRelative} (searched: {searched})");
        }

        var httpContext = new DefaultHttpContext { RequestServices = _services };
        var actionContext = new ActionContext(httpContext, new RouteData(), new ActionDescriptor());
        await using var sw = new StringWriter();
        var viewData = new ViewDataDictionary(_metadataProvider, new ModelStateDictionary()) { Model = model };
        var tempData = new TempDataDictionary(httpContext, _tempDataProvider);
        var viewContext = new ViewContext(actionContext, result.View, viewData, tempData, sw, new HtmlHelperOptions());
        await result.View.RenderAsync(viewContext);
        return sw.ToString();
    }
}

/// A dynamic model that yields "" for any member the story didn't supply, so a
/// template referencing an absent arg renders empty instead of throwing.
sealed class SafeModel : DynamicObject
{
    private readonly Dictionary<string, object?> _values;
    public SafeModel(Dictionary<string, object?> values) => _values = values;

    public override bool TryGetMember(GetMemberBinder binder, out object? result)
    {
        result = _values.TryGetValue(binder.Name, out var v) ? v : "";
        return true;
    }
}
