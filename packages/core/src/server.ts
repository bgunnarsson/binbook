import type { Connect, Plugin, ViteDevServer } from "vite";
import { WebSocketServer } from "ws";
import type { BinbookConfig, CanvasConfig, DocsMeta, Dispose, RenderResult, Story, TreeNode } from "@bgunnarsson/binbook-types";
import { discoverStories } from "./discover";
import { buildTree } from "./tree";
import { AdapterRegistry } from "./registry";
import { renderStory } from "./render";
import { resolveCanvasConfig } from "./canvas-config";
import { runChat } from "./chat";

export interface ApiHandlers {
  stories(): Promise<{ tree: TreeNode[]; stories: Story[] }>;
  render(body: { storyId: string; variant: string; args: Record<string, unknown> }): Promise<RenderResult>;
  docs(body: { storyId: string }): Promise<DocsMeta>;
  canvas(): CanvasConfig;
  reload(): Promise<void>;
}

export async function createApiHandlers(opts: {
  root: string;
  config: BinbookConfig;
}): Promise<ApiHandlers> {
  const registry = new AdapterRegistry(opts.config.adapters);
  let stories = await discoverStories(opts.config, opts.root);

  return {
    async stories() {
      return { tree: buildTree(stories), stories };
    },
    async render({ storyId, variant, args }) {
      const story = stories.find((s) => s.id === storyId);
      if (!story) throw new Error(`Unknown story ${storyId}`);
      return renderStory(registry, story, variant, args ?? {}, opts.root);
    },
    async docs({ storyId }) {
      const story = stories.find((s) => s.id === storyId);
      if (!story) throw new Error(`Unknown story ${storyId}`);
      const adapter = registry.forStory(story);
      return (await adapter.docs?.(story)) ?? {};
    },
    canvas() {
      return resolveCanvasConfig(opts.config, opts.root);
    },
    async reload() {
      stories = await discoverStories(opts.config, opts.root);
    },
  };
}

/** JSON body reader for connect middleware. */
function readJson(req: Connect.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

export function binbookServer(opts: { root: string; config: BinbookConfig }): Plugin {
  return {
    name: "binbook-server",
    async configureServer(server: ViteDevServer) {
      const api = await createApiHandlers(opts);
      const wss = new WebSocketServer({ noServer: true });

      server.httpServer?.on("upgrade", (req, socket, head) => {
        if (req.url === "/__binbook_ws") {
          wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws));
        }
      });

      const pushReload = () => wss.clients.forEach((c) => c.readyState === 1 && c.send("reload"));

      // Watch story files + component files; re-discover + push reload.
      let disposers: Dispose[] = [];

      const onChange = async () => {
        try {
          await api.reload();
          await subscribeWatchers();
          pushReload();
        } catch (err) {
          console.warn("[binbook] reload failed:", (err as Error).message);
        }
      };

      async function subscribeWatchers() {
        disposers.forEach((d) => d());
        disposers = [];
        const list = (await api.stories()).stories;
        const adapter = opts.config.adapters[0];
        for (const story of list) {
          const d = adapter.watch?.(story, onChange);
          if (d) disposers.push(d);
        }
      }

      await subscribeWatchers();

      server.httpServer?.on("close", () => {
        disposers.forEach((d) => d());
        disposers = [];
        wss.close();
      });

      server.middlewares.use("/api/stories", async (_req, res) => {
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify(await api.stories()));
      });

      server.middlewares.use("/api/render", async (req, res) => {
        try {
          const body = await readJson(req);
          const result = await api.render(body);
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify(result));
        } catch (err) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: (err as Error).message }));
        }
      });

      server.middlewares.use("/api/config", async (_req, res) => {
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify(api.canvas()));
      });

      server.middlewares.use("/api/docs", async (req, res) => {
        try {
          const body = await readJson(req);
          const result = await api.docs(body);
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify(result));
        } catch (err) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: (err as Error).message }));
        }
      });

      server.middlewares.use("/api/chat", async (req, res) => {
        try {
          const body = await readJson(req);
          const result = await runChat(body);
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify(result));
        } catch (err) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: (err as Error).message }));
        }
      });
    },
  };
}

/** Programmatic dev server used by the CLI. */
export async function createDevServer(opts: {
  root: string;
  viewerRoot: string;
  config: BinbookConfig;
}) {
  const { createServer, searchForWorkspaceRoot } = await import("vite");
  return createServer({
    root: opts.viewerRoot,
    server: {
      port: opts.config.port ?? 6006,
      // Allow the dev server to serve project files (e.g. configured `styles`)
      // via /@fs, not just files under the viewer root.
      fs: { allow: [searchForWorkspaceRoot(opts.root), opts.root, opts.viewerRoot] },
    },
    plugins: [binbookServer({ root: opts.root, config: opts.config })],
  });
}
