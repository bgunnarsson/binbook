using System.Dynamic;
using System.Text.Json;
using RazorLight;

// Binbook Razor render host.
//
// A long-lived process the Node adapter spawns once and talks to over stdio:
// one JSON request per line on stdin, one JSON response per line on stdout.
//   request:  { "id": 1, "templatePath": "/abs/Button.cshtml", "args": { ... } }
//   response: { "id": 1, "html": "..." }   or   { "id": 1, "error": "..." }
// stdout carries ONLY protocol frames; diagnostics go to stderr.

var engine = new RazorLightEngineBuilder()
    .UseEmbeddedResourcesProject(typeof(Program))
    .UseMemoryCachingProvider()
    .Build();

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

        var template = await File.ReadAllTextAsync(templatePath);
        // Cache key includes content so an edited template recompiles.
        var key = templatePath + ":" + template.GetHashCode();
        var html = await engine.CompileRenderStringAsync(key, template, new SafeModel(modelArgs));

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
