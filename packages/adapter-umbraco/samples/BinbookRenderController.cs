// Binbook — Umbraco render endpoint (REFERENCE / STARTING POINT)
//
// Drop this into your Umbraco site (e.g. Vettvangur.Site) to let Binbook render
// full partials — Tag Helpers, block lists, @inherits UmbracoViewPage, DI, the
// works — inside your real, running Umbraco process. Binbook's Umbraco adapter
// POSTs to it for any story with `"umbraco": { "mode": "live" }`.
//
// It is intentionally minimal and version-agnostic-ish; adjust the content
// lookup and model shape to match your Umbraco version and your partials'
// @model. Targets Umbraco 13+ (.NET 8) idioms.
//
// SECURITY: dev-only. It renders arbitrary server views and MUST NOT be exposed
// in production. The environment guard below returns 404 outside Development.
//
// Wire the adapter to it:
//   umbraco({ umbracoEndpoint: "https://localhost:44300/binbook/render" })

using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Umbraco.Cms.Core.Models.Blocks;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Web;

namespace Binbook.Site;

[ApiController]
[Route("binbook/render")]
public sealed class BinbookRenderController : ControllerBase
{
    private readonly IWebHostEnvironment _env;
    private readonly IConfiguration _config;
    private readonly IUmbracoContextFactory _umbracoContextFactory;
    private readonly ICompositeViewEngine _viewEngine;
    private readonly ITempDataProvider _tempDataProvider;
    private readonly IModelMetadataProvider _metadataProvider;

    public BinbookRenderController(
        IWebHostEnvironment env,
        IConfiguration config,
        IUmbracoContextFactory umbracoContextFactory,
        ICompositeViewEngine viewEngine,
        ITempDataProvider tempDataProvider,
        IModelMetadataProvider metadataProvider)
    {
        _env = env;
        _config = config;
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

    public sealed class BlockRef
    {
        /// Alias of the block-list property on the content node, e.g. "blocks".
        public string Property { get; set; } = "";
        /// Content-type alias of the block to render; null renders the whole list.
        public string? Type { get; set; }
        /// View-path template resolved per block from its alias. Supports `{alias}`
        /// (verbatim) and `{Alias}` (PascalCase). Null falls back to the Umbraco
        /// convention. Binbook always sends this; it varies per project.
        public string? ViewPath { get; set; }
    }

    public sealed class RenderRequest
    {
        public string View { get; set; } = "";
        public ContentRef? Content { get; set; }
        public Dictionary<string, object?>? Args { get; set; }
        /// When true, return the view's raw source instead of rendering it.
        public bool Source { get; set; }
        /// When true, enumerate `Content`'s block-list `Property` instead of rendering.
        public bool List { get; set; }
        /// For List mode: the block-list property alias to enumerate.
        public string? Property { get; set; }
        /// When set, render a Block List block out of `Content`'s block-list property.
        public BlockRef? Block { get; set; }
    }

    [HttpPost]
    public async Task<IActionResult> Render([FromBody] RenderRequest req)
    {
        if (!_env.IsDevelopment()) return NotFound();

        // This endpoint reads view source and renders arbitrary views, so even in
        // dev it must not be anonymously callable. Umbraco 14+ backoffice auth uses
        // OpenIddict bearer tokens (no copyable cookie), so gate on a shared dev
        // secret the Node adapter sends as X-Binbook-Secret. Set `Binbook:Secret`
        // in your dev config (e.g. appsettings.Development.json / user-secrets) and
        // pass the same value via the adapter's `headers` option.
        var expectedSecret = _config["Binbook:Secret"];
        var providedSecret = Request.Headers["X-Binbook-Secret"].ToString();
        if (string.IsNullOrEmpty(expectedSecret)
            || string.IsNullOrEmpty(providedSecret)
            || !CryptographicOperations.FixedTimeEquals(
                    Encoding.UTF8.GetBytes(providedSecret),
                    Encoding.UTF8.GetBytes(expectedSecret)))
        {
            return Unauthorized();
        }

        try
        {
            if (req.Source)
            {
                if (string.IsNullOrWhiteSpace(req.View)) return BadRequest(new { error = "missing view" });
                return Ok(new { source = ReadSource(req.View) });
            }

            using var cref = _umbracoContextFactory.EnsureUmbracoContext();
            var content = ResolveContent(cref.UmbracoContext, req.Content);

            // Enumerate a showcase node's block list so Binbook can expand it into
            // one story per block type.
            if (req.List)
            {
                if (string.IsNullOrWhiteSpace(req.Property)) return BadRequest(new { error = "missing property" });
                return Ok(new { blocks = ListBlocks(content, req.Property) });
            }

            // Render a single Block List block (by content-type alias) or the whole
            // list, against the node's block-list property.
            if (req.Block is not null)
            {
                if (string.IsNullOrWhiteSpace(req.Block.Property)) return BadRequest(new { error = "missing block property" });
                var html = await RenderBlocks(content, req.Block, req.Args);
                return Ok(new { html });
            }

            if (string.IsNullOrWhiteSpace(req.View)) return BadRequest(new { error = "missing view" });
            var viewHtml = await RenderViewToString(req.View, content, req.Args);
            return Ok(new { html = viewHtml });
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

    // Umbraco's built-in Block List view convention — the fallback when a story
    // sends no `viewPath`. The view path is normally supplied per request so it
    // can vary per project; you shouldn't need to edit this.
    private const string DefaultBlockView = "~/Views/Partials/blocklist/Components/{alias}.cshtml";

    /// Resolve a view-path template against a content-type alias, mirroring the
    /// adapter: `{alias}` verbatim, `{Alias}` PascalCase.
    private static string ResolveBlockView(string? template, string alias)
    {
        var pascal = alias.Length == 0 ? alias : char.ToUpperInvariant(alias[0]) + alias[1..];
        return (template ?? DefaultBlockView).Replace("{alias}", alias).Replace("{Alias}", pascal);
    }

    private static BlockListModel? GetBlockList(IPublishedContent? content, string property) =>
        content?.Value<BlockListModel>(property);

    /// Enumerate the distinct block types in a node's block list — alias + name —
    /// so Binbook can build a story per type. View paths are resolved adapter-side
    /// from the story's `viewPath`, so they aren't returned here.
    private object[] ListBlocks(IPublishedContent? content, string property)
    {
        var blocks = GetBlockList(content, property);
        if (blocks is null) return Array.Empty<object>();
        return blocks
            .Select(b => b.Content.ContentType.Alias)
            .Distinct()
            .Select(alias => new { alias, name = alias })
            .ToArray();
    }

    /// Render one block (first whose content-type alias matches `block.Type`) or,
    /// when no type is given, every block in order — mirroring how the list would
    /// render on the page. Each block renders through the view resolved from
    /// `block.ViewPath` with the real `BlockListItem` model (content + settings),
    /// not an `IPublishedContent`.
    private async Task<string> RenderBlocks(IPublishedContent? content, BlockRef block, Dictionary<string, object?>? args)
    {
        var blocks = GetBlockList(content, block.Property);
        if (blocks is null) return "";

        var items = string.IsNullOrWhiteSpace(block.Type)
            ? blocks.ToList()
            : blocks.Where(b => b.Content.ContentType.Alias == block.Type).Take(1).ToList();

        var sb = new System.Text.StringBuilder();
        foreach (var item in items)
            sb.Append(await RenderViewToString(ResolveBlockView(block.ViewPath, item.Content.ContentType.Alias), item, args));
        return sb.ToString();
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
