import { useEffect, useState } from "react";
import { useStore } from "../store";
import { fetchDocs, renderStory } from "../api";

function VariantPreview({ storyId, variant }: { storyId: string; variant: string }) {
  const [doc, setDoc] = useState("");
  useEffect(() => {
    let cancelled = false;
    renderStory({ storyId, variant, args: {} })
      .then((r) => {
        if (!cancelled) setDoc(`<!doctype html><meta charset=utf-8><body>${r.html}</body>`);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [storyId, variant]);
  return (
    <div className="mt-2">
      <div className="text-xs mb-1" style={{ color: "var(--bb-muted)" }}>{variant}</div>
      <iframe
        title={`Preview ${variant}`}
        sandbox="allow-scripts"
        srcDoc={doc}
        className="w-full h-24 rounded bg-white"
        style={{ border: "1px solid var(--bb-border)" }}
      />
    </div>
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

  if (!story) {
    return <div className="p-6" style={{ color: "var(--bb-muted)" }}>Select a story to see its docs.</div>;
  }

  const args = Object.entries(story.args);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl">
        <h1 className="text-xl font-semibold">{story.title}</h1>
        {story.description && (
          <p className="mt-1" style={{ color: "var(--bb-muted)" }}>{story.description}</p>
        )}

        <h2 className="mt-6 font-medium">Args</h2>
        <table className="mt-2 w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="border-b py-1">Name</th>
              <th className="border-b py-1">Type</th>
              <th className="border-b py-1">Default</th>
            </tr>
          </thead>
          <tbody>
            {args.map(([name, spec]) => (
              <tr key={name}>
                <td className="py-1 border-b">{name}</td>
                <td className="py-1 border-b">{spec.type}</td>
                <td className="py-1 border-b">{JSON.stringify(spec.default)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="mt-6 font-medium">Preview</h2>
        {story.variants.map((v) => (
          <VariantPreview key={v.name} storyId={story.id} variant={v.name} />
        ))}

        <h2 className="mt-6 font-medium">Source</h2>
        <pre className="mt-2 p-3 rounded overflow-auto text-xs" style={{ background: "#f5f5f5" }}>
          <code>{source}</code>
        </pre>
      </div>
    </div>
  );
}
