"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import {
  acceptRegions,
  type Raster,
  type Region,
} from "@/lib/revision-lab/pixels";
import {
  decodeImage,
  download,
  encodeImage,
  parseProject,
  readImage,
  resizeCandidate,
  type Project,
} from "@/lib/revision-lab/browser";
import {
  saveLocalProject,
  recentProjects,
  type StoredProject,
} from "@/lib/revision-lab/storage";
import ToolHeader from "@/components/tools/tool-header";
import s from "./workbench.module.css";

const cases = [
  {
    name: "01 · Update a value",
    path: "/revision-lab/round-1.png",
    task: "Change SLA from 48 hours to 24 hours. Keep everything else unchanged.",
    region: { x: 425, y: 565, width: 175, height: 35 },
  },
  {
    name: "02 · Change a color",
    path: "/revision-lab/round-2.png",
    task: "Make Finance review purple. Keep 24 hours and all other content.",
    region: { x: 375, y: 503, width: 275, height: 125 },
  },
  {
    name: "03 · Fix a connection",
    path: "/revision-lab/round-3.png",
    task: "Connect Team lead review to Director approval instead of Place order.",
    region: { x: 100, y: 640, width: 550, height: 285 },
  },
];
export default function RevisionWorkbench() {
  const [project, setProject] = useState<Project | null>(null);
  const [base, setBase] = useState<Raster | null>(null);
  const [candidate, setCandidate] = useState<{
    url: string;
    raster: Raster;
  } | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [draft, setDraft] = useState<Region | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    "Try a demo or open your diagram. Local edits stay in your browser.",
  );
  const [mode, setMode] = useState<"current" | "candidate" | "accepted">(
    "current",
  );
  const [saved, setSaved] = useState(true);
  const [recent, setRecent] = useState<StoredProject[]>([]);
  const [autoSave, setAutoSave] = useState("Accepted versions are saved on this device");
  const [configured, setConfigured] = useState(false);
  const [modelName, setModelName] = useState("");
  const [highlight, setHighlight] = useState(false);
  const [zoom, setZoom] = useState(1);
  const saveQueue = useRef(Promise.resolve());
  useEffect(() => {
    recentProjects()
      .then(setRecent)
      .catch(() => setAutoSave("Local storage is unavailable. Export your project to keep it."));
    fetch("/api/lab/revisions")
      .then((r) => r.json())
      .then((d) => {
        setConfigured(d.configured === true);
        setModelName(d.model || "");
      })
      .catch(() => setMessage("Could not check the generation service. Local editing is still available."));
  }, []);
  useEffect(() => {
    if (!project) return;
    setAutoSave("Saving locally…");
    let active = true;
    const timer = setTimeout(() => {
      saveQueue.current = saveQueue.current
        .catch(() => {})
        .then(async () => {
          await saveLocalProject(project);
          if (active) {
            setAutoSave("Accepted versions saved on this device");
            setRecent(await recentProjects());
          }
        })
        .catch(() => {
          if (active) setAutoSave("Autosave failed. Please export your project now.");
        });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [project]);
  async function reopen(stored: StoredProject) {
    const p = await parseProject(JSON.stringify(stored.project));
    const image = await decodeImage(
      p.revisions.find((r) => r.id === p.currentId)!.image,
    );
    setProject(p);
    setBase(image);
    clearCandidate();
    setSaved(false);
    setMessage("Project restored. Unaccepted candidates and selections are not autosaved.");
  }
  async function generate() {
    if (!current || !regions.length || !note.trim()) return;
    const selection = regions;
    const response = await fetch("/api/lab/revisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: current.image,
        prompt: note,
        regions: selection,
      }),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Generation failed. Your current version is unchanged.");
    await loadCandidate(data.image);
    setRegions(selection);
    setMessage(`Candidate received from ${data.model}. Review it before accepting.`);
  }
  const anchor = useRef<{ x: number; y: number } | null>(null);
  const current = project?.revisions.find((r) => r.id === project.currentId);
  const sameSize =
    !!base &&
    !!candidate &&
    base.width === candidate.raster.width &&
    base.height === candidate.raster.height;
  const result = useMemo(
    () =>
      base && candidate && sameSize && regions.length
        ? acceptRegions(base, candidate.raster, regions)
        : null,
    [base, candidate, sameSize, regions],
  );
  const preview = useMemo(
    () => (result ? encodeImage(result.image) : ""),
    [result],
  );
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if ((!saved && autoSave !== "Accepted versions saved on this device") || candidate) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saved, autoSave, candidate]);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  function clearCandidate() {
    anchor.current = null;
    setCandidate(null);
    setRegions([]);
    setDraft(null);
    setMode("current");
    setNote("");
  }
  async function start(url: string, name: string) {
    const raster = await decodeImage(url);
    const image = encodeImage(raster),
      id = crypto.randomUUID();
    setProject({
      version: 1,
      name: name.slice(0, 200),
      currentId: id,
      revisions: [{ id, parent: null, name: "Original", image }],
    });
    setBase(raster);
    clearCandidate();
    setSaved(false);
    setMessage("Image loaded. Select an area to edit, or import a candidate.");
  }
  async function loadCandidate(url: string) {
    const raster = await decodeImage(url);
    setCandidate({ url: encodeImage(raster), raster });
    setRegions([]);
    setMode("candidate");
    setMessage("Candidate loaded. Drag to select the changes you want to keep.");
  }
  const imageUrl =
    mode === "candidate"
      ? candidate?.url
      : mode === "accepted"
        ? preview || current?.image
        : current?.image;
  function point(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(
        0,
        Math.min(
          base!.width,
          Math.round(((event.clientX - rect.left) / rect.width) * base!.width),
        ),
      ),
      y: Math.max(
        0,
        Math.min(
          base!.height,
          Math.round(((event.clientY - rect.top) / rect.height) * base!.height),
        ),
      ),
    };
  }
  function begin(event: PointerEvent<HTMLDivElement>) {
    if (!base || (candidate && !sameSize) || busy || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    anchor.current = point(event);
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    if (!anchor.current || !base) return;
    const p = point(event),
      a = anchor.current;
    setDraft({
      x: Math.min(p.x, a.x),
      y: Math.min(p.y, a.y),
      width: Math.abs(p.x - a.x),
      height: Math.abs(p.y - a.y),
    });
  }
  function end(event: PointerEvent<HTMLDivElement>) {
    if (!anchor.current || !base) return;
    const p = point(event),
      a = anchor.current;
    const r = {
      x: Math.min(p.x, a.x),
      y: Math.min(p.y, a.y),
      width: Math.abs(p.x - a.x),
      height: Math.abs(p.y - a.y),
    };
    if (r.width && r.height && regions.length < 32)
      setRegions((old) => [...old, r]);
    anchor.current = null;
    setDraft(null);
  }
  async function accept() {
    if (!project || !result || !preview || !current) return;
    if (!result.stats.insideChanged)
      throw new Error("No changes inside the selection. A new version is not needed.");
    if (project.revisions.length >= 12)
      throw new Error("This preview supports 12 versions. Export your project, then start a new one from the current PNG.");
    const id = crypto.randomUUID();
    setProject({
      ...project,
      currentId: id,
      revisions: [
        ...project.revisions,
        {
          id,
          parent: current.id,
          name: (note.trim() || `Revision ${project.revisions.length}`).slice(
            0,
            200,
          ),
          image: preview,
        },
      ],
    });
    setBase(result.image);
    clearCandidate();
    setSaved(false);
    setMessage("Changes accepted. Pixels outside your selection are preserved. Ready for the next revision.");
  }
  async function restore(id: string) {
    const revision = project!.revisions.find((r) => r.id === id)!;
    const raster = await decodeImage(revision.image);
    setProject({ ...project!, currentId: id });
    setBase(raster);
    clearCandidate();
    setSaved(false);
    setMessage("Version restored. New edits branch from here; later versions are kept.");
  }
  function saveProject() {
    const json = JSON.stringify(project);
    if (json.length > 64 * 1024 * 1024) {
      setMessage("Project exceeds 64 MB. Export the current PNG instead.");
      return;
    }
    download(
      new Blob([json], { type: "application/json" }),
      "rediagram.revision.json",
    );
    setSaved(true);
    setMessage("Project exported. Reopen this file to continue editing later.");
  }
  return (
    <>
    <ToolHeader active="revision" />
    <main className={s.app} lang="en">
      <section className={s.intro}>
        <p>Make every edit count.</p>
        <h1>Keep the changes you want.</h1>
        <div>Accept the parts that work, preserve the rest, and keep refining.</div>
      </section>
      <div className={s.toolbar}>
        <button
          disabled={busy || !!project}
          onClick={() =>
            run(() => start("/revision-lab/source.png", "Purchase approval workflow"))
          }
        >
          Try a demo
        </button>
        <label className={busy || !!project ? s.disabled : ""}>
          Open image
          <input
            disabled={busy || !!project}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) run(async () => start(await readImage(f), f.name));
              e.target.value = "";
            }}
          />
        </label>
        <label className={busy || !!project ? s.disabled : ""}>
          Open project
          <input
            disabled={busy || !!project}
            type="file"
            accept=".json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f)
                run(async () => {
                  if (f.size > 64 * 1024 * 1024)
                    throw new Error("Project files must be under 64 MB.");
                  const p = await parseProject(await f.text());
                  const r = await decodeImage(
                    p.revisions.find((r) => r.id === p.currentId)!.image,
                  );
                  setProject(p);
                  setBase(r);
                  clearCandidate();
                  setSaved(true);
                  setMessage("Project restored.");
                });
              e.target.value = "";
            }}
          />
        </label>
        <button
          disabled={busy || !project}
          onClick={() => {
            if (
              (!candidate &&
                (saved || autoSave === "Accepted versions saved on this device")) ||
              window.confirm(
                "Close with unsaved work or an unaccepted candidate? Accept your changes or export first.",
              )
            ) {
              setProject(null);
              setBase(null);
              clearCandidate();
              setSaved(true);
            }
          }}
        >
          Close project
        </button>
        <span className={s.spacer} />
        <button
          disabled={busy || !current}
          onClick={() => download(current!.image, "rediagram.png")}
        >
          Export PNG
        </button>
        <button disabled={busy || !project} onClick={saveProject}>
          Export project{!saved ? " ·" : ""}
        </button>
      </div>
      <p role="status">{autoSave} · Accept or save candidates separately to keep them</p>
      {!project && recent.length > 0 && (
        <section className={s.toolbar} aria-label="Recent projects">
          <strong>Recent projects</strong>
          {recent.slice(0, 5).map((r) => (
            <button
              key={r.id}
              disabled={busy}
              onClick={() => run(() => reopen(r))}
            >
              {r.project.name} · {r.project.revisions.length} versions
            </button>
          ))}
        </section>
      )}
      <div className={s.workspace}>
        <aside className={s.panel}>
          <h2>01 / Your revision</h2>
          <p>Follow three edits to one sample diagram: a value, a color, and a connection.</p>
          {cases.map((c, i) => (
            <button
              key={c.name}
              className={s.case}
              disabled={!project || busy}
              onClick={() =>
                run(async () => {
                  await loadCandidate(c.path);
                  setNote(c.task);
                })
              }
            >
              <strong>{c.name}</strong>
              <span>{c.task}</span>
            </button>
          ))}
          <p className={s.hint}>
            Demo candidates were created with Codex.
            The underlying model is not disclosed. These examples are not an accuracy benchmark.
          </p>
          <label
            className={`${s.upload} ${!project || busy ? s.disabled : ""}`}
          >
            ＋ Import a candidate
            <input
              disabled={!project || busy}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) run(async () => loadCandidate(await readImage(f)));
                e.target.value = "";
              }}
            />
          </label>
          <label className={s.field}>
            Describe your edit
            <textarea
              value={note}
              maxLength={200}
              disabled={busy}
              onChange={(e) => setNote(e.target.value)}
              placeholder="For example: add an approval branch and keep the existing labels"
            />
          </label>
          <button
            className={s.primary}
            disabled={
              busy || !configured || !current || !regions.length || !note.trim()
            }
            onClick={() => run(generate)}
          >
            Generate candidate
          </button>
          <p>
            {configured
              ? `Generation sends your current image and instructions to Google · ${modelName}`
              : "Generation is not configured. This web tool cannot call the built-in Codex image tool. You can still import a candidate."}
          </p>
          <h2>Version history</h2>
          <div className={s.history}>
            {project?.revisions.map((r, i) => (
              <button
                key={r.id}
                disabled={busy}
                aria-pressed={r.id === project.currentId}
                onClick={() => run(() => restore(r.id))}
              >
                <span>
                  V{i} · {r.name}
                </span>
                {r.id === project.currentId && <small>Current</small>}
              </button>
            ))}
          </div>
        </aside>
        <section className={s.canvasPanel}>
          <nav className={s.tabs} aria-label="Comparison views">
            {(
              [
                ["current", "Current version"],
                ["candidate", "Candidate"],
                ["accepted", "Selection preview"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                aria-pressed={mode === value}
                disabled={
                  busy ||
                  (value === "candidate"
                    ? !candidate
                    : value === "accepted"
                      ? !result
                      : !current)
                }
                onClick={() => setMode(value)}
              >
                {label}
              </button>
            ))}
            <span>
              {base ? `${base.width} × ${base.height}` : "No image loaded"}
            </span>
          </nav>
          <div className={s.toolbar}>
            <label>
              <input
                type="checkbox"
                checked={highlight}
                onChange={(e) => setHighlight(e.target.checked)}
                disabled={!sameSize}
              />{" "}
              Show differences
            </label>
            <label>
              Zoom{" "}
              <select
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              >
                <option value={1}>100%</option>
                <option value={1.5}>150%</option>
                <option value={2}>200%</option>
              </select>
            </label>
          </div>
          <div
            className={s.stage}
            style={{ overflow: "auto", justifyContent: "flex-start" }}
          >
            {imageUrl && base ? (
              <div
                className={s.imageWrap}
                style={{
                  aspectRatio: `${base.width}/${base.height}`,
                  minWidth: `${zoom * 100}%`,
                  maxWidth: "none",
                }}
                onPointerDown={begin}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={() => {
                  anchor.current = null;
                  setDraft(null);
                }}
              >
                {/* Native img avoids optimizer requests for local, user-owned data URLs. */}
                <img
                  src={highlight && sameSize ? current?.image : imageUrl}
                  alt={
                    mode === "current"
                      ? "Current accepted version"
                      : mode === "candidate"
                        ? "Complete model candidate"
                        : "Preview with only selected changes applied"
                  }
                  draggable={false}
                />
                {highlight && sameSize && candidate && (
                  <img
                    src={candidate.url}
                    alt="Candidate difference overlay"
                    style={{
                      position: "absolute",
                      inset: 0,
                      mixBlendMode: "difference",
                    }}
                    draggable={false}
                  />
                )}
                {[...regions, ...(draft ? [draft] : [])].map((r, i) => (
                  <div
                    key={i}
                    className={s.region}
                    style={{
                      left: `${(r.x / base.width) * 100}%`,
                      top: `${(r.y / base.height) * 100}%`,
                      width: `${(r.width / base.width) * 100}%`,
                      height: `${(r.height / base.height) * 100}%`,
                    }}
                  >
                    <span>{i + 1}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={s.empty}>
                <span>↗</span>
                <h2>Open a diagram to get started</h2>
                <p>Refine your diagram without accepting every change.</p>
                <button
                  disabled={busy || !!project}
                  onClick={() =>
                    run(() => start("/revision-lab/source.png", "Purchase approval workflow"))
                  }
                >
                  Start with a demo
                </button>
              </div>
            )}
          </div>
          <div className={s.status} role="status" aria-live="polite">
            {busy ? "Working…" : message}
          </div>
        </section>
        <aside className={s.panel}>
          <h2>02 / Choose what to keep</h2>
          <p>
            Drag to select one or more areas. Keep changes to text, colors, and connections while preserving everything outside.
          </p>
          {candidate && base && !sameSize && (
            <div className={s.warning}>
              <strong>Candidate dimensions differ</strong>
              <p>
                {candidate.raster.width} × {candidate.raster.height} →{" "}
                {base.width} × {base.height}
              </p>
              <p>Resizing does not guarantee alignment. Check shapes and edges carefully.</p>
              <button
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const url = await resizeCandidate(
                      candidate.url,
                      base.width,
                      base.height,
                    );
                    const selection = regions;
                    await loadCandidate(url);
                    setRegions(selection);
                    setMessage(
                      "Dimensions matched. Check alignment before accepting; discard the candidate if the layout shifted.",
                    );
                  })
                }
              >
                Resize to current dimensions
              </button>
            </div>
          )}
          <div className={s.selectionActions}>
            <button
              disabled={!sameSize || busy}
              onClick={() => {
                const c = cases.find((c) => c.task === note);
                if (c && base?.width === 1024 && base?.height === 1024) {
                  setRegions([c.region]);
                } else setMessage("Drag on the diagram to select an area.");
              }}
            >
              Use demo selection
            </button>
            <button
              disabled={busy || !regions.length}
              onClick={() => {
                setRegions([]);
                setMode(candidate ? "candidate" : "current");
              }}
            >
              Clear
            </button>
          </div>
          <p>
            {regions.length} areas selected. Include complete nodes and both old and new connections.
          </p>
          {base &&
            regions.map((r, i) => (
              <fieldset key={`edit-${i}`} disabled={busy}>
                <legend>Adjust selection {i + 1}</legend>
                {(["x", "y", "width", "height"] as const).map((k) => (
                  <label key={k}>
                    {k}
                    <input
                      aria-label={`Selection ${i + 1} ${k}`}
                      type="number"
                      min={k === "width" || k === "height" ? 1 : 0}
                      value={r[k]}
                      style={{ width: 70 }}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        const next = { ...r, [k]: value };
                        if (
                          Number.isInteger(value) &&
                          next.x >= 0 &&
                          next.y >= 0 &&
                          next.width > 0 &&
                          next.height > 0 &&
                          next.x + next.width <= base.width &&
                          next.y + next.height <= base.height
                        )
                          setRegions(
                            regions.map((old, j) => (j === i ? next : old)),
                          );
                      }}
                    />
                  </label>
                ))}
              </fieldset>
            ))}
          {regions.map((r, i) => (
            <button
              className={s.regionRow}
              key={i}
              disabled={busy}
              onClick={() => {
                setRegions(regions.filter((_, j) => j !== i));
                setMode(candidate ? "candidate" : "current");
              }}
            >
              Selection {i + 1} · {r.width} × {r.height} <span>Remove</span>
            </button>
          ))}
          {result && (
            <div className={s.metrics}>
              <small>Candidate changes outside selection</small>
              <strong>
                {result.stats.outsideChanged.toLocaleString()} <em>pixels</em>
              </strong>
              <p>
                With channel difference &gt;16:
                {result.stats.outsideVisibleChanged.toLocaleString()}{" "}
                pixels. Pixel differences are not necessarily visual errors.
              </p>
              <hr />
              <small>Changes outside selection after acceptance</small>
              <strong className={s.good}>
                0 <em>pixels</em>
              </strong>
              <p>Measured in decoded RGBA. Check text, connections, and seams inside the selection yourself.</p>
            </div>
          )}
          <button
            className={s.primary}
            disabled={busy || !result || !result.stats.insideChanged}
            onClick={() => run(accept)}
          >
            Accept selection →
          </button>
          <button disabled={busy || !candidate} onClick={clearCandidate}>
            Discard candidate
          </button>
          <p className={s.hint}>
            This preview does not validate connections or export editable
            PowerPoint files. Selections crossing lines or shadows may create gaps or seams.
          </p>
        </aside>
      </div>
    </main>
    </>
  );
}
