import { useEffect, useState } from "react";
import { useStore } from "../store";
import { fetchDocs, renderStory } from "../api";
import { buildSrcDoc } from "../canvas-srcdoc";
import type { ArgSpec } from "@bgunnarsson/binbook-types";

function controlLabel(spec: ArgSpec): string {
  if (spec.type === "select") return `select [${(spec.options ?? []).join(" | ")}]`;
  return spec.type;
}

function DocsPreview({ storyId, variant }: { storyId: string; variant: string }) {
  const [srcDoc, setSrcDoc] = useState("");

  useEffect(() => {
    let cancelled = false;
    renderStory({ storyId, variant, args: {} })
      .then((result) => {
        if (!cancelled)
          setSrcDoc(buildSrcDoc(result.html, { assets: result.assets, clientScript: result.clientScript }));
      })
      .catch(() => {
        if (!cancelled) setSrcDoc("");
      });
    return () => {
      cancelled = true;
    };
  }, [storyId, variant]);

  return (
    <iframe
      title="Docs preview"
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      className="h-40 w-full min-h-[120px] border-0 bg-white"
    />
  );
}

export function DocsView() {
  const selected = useStore((s) => s.selected);
  const stories = useStore((s) => s.stories);
  const [source, setSource] = useState("");

  const story = selected ? stories.find((s) => s.id === selected.storyId) : undefined;

  useEffect(() => {
    if (!selected) return;
    fetchDocs(selected.storyId)
      .then((d) => setSource(d.source ?? ""))
      .catch(() => setSource(""));
  }, [selected]);

  if (!story || !selected) {
    return (
      <div className="flex-1 overflow-auto p-5 at-fade sm:p-11">
        <div className="mx-auto max-w-[760px] text-muted text-[13px]">Select a story to see its docs.</div>
      </div>
    );
  }

  const args = Object.entries(story.args);
  const titleSegments = story.title.split("/");
  const docsTitle = titleSegments[titleSegments.length - 1];
  const crumb = `${story.title} / ${selected.variant}`;

  return (
    <div className="flex-1 overflow-auto p-5 at-fade sm:p-11">
      <div className="mx-auto max-w-[760px]">
        <div className="mb-2 text-[11px] uppercase tracking-[0.12em] text-dim">{crumb}</div>
        <h1 className="mb-3 text-2xl font-bold tracking-tight sm:text-[30px]">{docsTitle}</h1>
        {story.description && (
          <p className="mb-8 max-w-[620px] text-[14px] leading-relaxed text-muted">{story.description}</p>
        )}

        <div className="mb-9 flex items-center justify-center rounded-xl border border-line bg-panel p-5 sm:p-12">
          <DocsPreview storyId={story.id} variant={selected.variant} />
        </div>

        <h2 className="mb-3.5 text-[15px] font-bold text-text">Props</h2>
        <div className="mb-9 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[420px] text-left">
            <thead>
              <tr className="bg-panel text-[11px] uppercase tracking-[0.08em] text-dim">
                <th className="px-4 py-2.5 font-normal">Name</th>
                <th className="px-4 py-2.5 font-normal">Control</th>
                <th className="px-4 py-2.5 font-normal">Default</th>
              </tr>
            </thead>
            <tbody>
              {args.map(([name, spec]) => (
                <tr key={name} className="border-t border-row-line text-[12.5px]">
                  <td className="px-4 py-3 font-semibold text-accent-bright">{name}</td>
                  <td className="px-4 py-3 text-muted">{controlLabel(spec)}</td>
                  <td className="px-4 py-3 text-[#cfd3e4]">{JSON.stringify(spec.default)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mb-3.5 text-[15px] font-bold text-text">Usage</h2>
        <pre className="overflow-auto rounded-lg border border-line-soft bg-inset p-4 text-[12.5px] leading-relaxed text-[#cfd3e4]">
          {source}
        </pre>
      </div>
    </div>
  );
}
