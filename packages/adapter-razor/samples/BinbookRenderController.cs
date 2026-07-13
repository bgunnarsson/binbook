// Binbook — Umbraco render endpoint (REFERENCE / STARTING POINT)
//
// Drop this into your Umbraco site (e.g. Vettvangur.Site) to let Binbook render
// full partials — Tag Helpers, block lists, @inherits UmbracoViewPage, DI, the
// works — inside your real, running Umbraco process. Binbook's Razor adapter
// POSTs to it for any story with `"razor": { "mode": "umbraco" }`.
//
// It is intentionally minimal and version-agnostic-ish; adjust the content
// lookup and model shape to match your Umbraco version and your partials'
// @model. Targets Umbraco 13+ (.NET 8) idioms.
//
// SECURITY: dev-only. It renders arbitrary server views and MUST NOT be exposed
// in production. The environment guard below returns 404 outside Development.
//
// Wire the adapter to it:
//   razor({ umbracoEndpoint: "https://localhost:44300/binbook/render" })

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Web;

namespace Binbook.Site;

[ApiController]
[Route("binbook/render")]
public sealed class BinbookRenderController : ControllerBase
{
    private readonly IWebHostEnvironment _env;
    private readonly IUmbracoContextFactory _umbracoContextFactory;
    private readonly ICompositeViewEngine _viewEngine;
    private readonly ITempDataProvider _tempDataProvider;
    private readonly IModelMetadataProvider _metadataProvider;

    public BinbookRenderController(
        IWebHostEnvironment env,
        IUmbracoContextFactory umbracoContextFactory,
        ICompositeViewEngine viewEngine,
        ITempDataProvider tempDataProvider,
        IModelMetadataProvider metadataProvider)
    {
        _env = env;
        _umbracoContextFactory = umbracoContextFactory;
        _viewEngine = viewEngine;
        _tempDataProvider = tempDataProvider;
        _metadataProvider = metadataProvider;
    }

    public sealed class ContentRef
    {
        public string? Key { get; set; }
        public int? Id { get; set; }
        public string? Route { get; set; }
    }

    public sealed class RenderRequest
    {
        public string View { get; set; } = "";
        public ContentRef? Content { get; set; }
        public Dictionary<string, object?>? Args { get; set; }
        /// When true, return the view's raw source instead of rendering it.
        public bool Source { get; set; }
    }

    [HttpPost]
    public async Task<IActionResult> Render([FromBody] RenderRequest req)
    {
        if (!_env.IsDevelopment()) return NotFound();
        if (string.IsNullOrWhiteSpace(req.View)) return BadRequest(new { error = "missing view" });

        try
        {
            if (req.Source)
                return Ok(new { source = ReadSource(req.View) });

            using var cref = _umbracoContextFactory.EnsureUmbracoContext();
            var content = ResolveContent(cref.UmbracoContext, req.Content);
            var html = await RenderViewToString(req.View, content, req.Args);
            return Ok(new { html });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    private static IPublishedContent? ResolveContent(IUmbracoContext ctx, ContentRef? cref)
    {
        var content = ctx.Content;
        if (content is null || cref is null) return null;
        if (!string.IsNullOrWhiteSpace(cref.Key) && Guid.TryParse(cref.Key, out var key))
            return content.GetById(key);
        if (cref.Id is int id)
            return content.GetById(id);
        if (!string.IsNullOrWhiteSpace(cref.Route))
            return content.GetByRoute(cref.Route);
        return null;
    }

    private string ReadSource(string view)
    {
        var file = _env.ContentRootFileProvider.GetFileInfo(NormalizeToAppRelative(view));
        if (!file.Exists || file.PhysicalPath is null)
            throw new FileNotFoundException($"view not found: {view}");
        return System.IO.File.ReadAllText(file.PhysicalPath);
    }

    private async Task<string> RenderViewToString(string view, object? model, Dictionary<string, object?>? args)
    {
        var result = _viewEngine.GetView(executingFilePath: null, viewPath: view, isMainPage: true);
        if (!result.Success)
        {
            var searched = result.SearchedLocations is null ? "" : string.Join(", ", result.SearchedLocations);
            throw new InvalidOperationException($"view not found: {view} (searched: {searched})");
        }

        var actionContext = new ActionContext(HttpContext, new RouteData(), new ActionDescriptor());
        await using var sw = new StringWriter();
        var viewData = new ViewDataDictionary(_metadataProvider, new ModelStateDictionary()) { Model = model };
        // Layer story args over the model so a partial can be tweaked per story.
        if (args is not null)
            foreach (var (k, v) in args) viewData[k] = v;

        var tempData = new TempDataDictionary(HttpContext, _tempDataProvider);
        var viewContext = new ViewContext(actionContext, result.View, viewData, tempData, sw, new HtmlHelperOptions());
        await result.View.RenderAsync(viewContext);
        return sw.ToString();
    }

    private static string NormalizeToAppRelative(string view) =>
        view.StartsWith("~/") ? view[1..] : view.StartsWith('/') ? view : "/" + view;
}
