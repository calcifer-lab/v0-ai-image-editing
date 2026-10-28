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
import s from "./workbench.module.css";

const cases = [
  {
    name: "01 · 改时限",
    path: "/revision-lab/round-1.png",
    task: "将 SLA 从 48 hours 改成 24 hours，其余不变。",
    region: { x: 425, y: 565, width: 175, height: 35 },
  },
  {
    name: "02 · 改配色",
    path: "/revision-lab/round-2.png",
    task: "财务审批框改为紫色，保留 24 hours 和其余内容。",
    region: { x: 375, y: 503, width: 275, height: 125 },
  },
  {
    name: "03 · 改关系",
    path: "/revision-lab/round-3.png",
    task: "Team lead review 应先连到 Director approval，不再直接连到 Place order。",
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
    "选择演示，或打开你的图。图片处理在本机浏览器完成。",
  );
  const [mode, setMode] = useState<"current" | "candidate" | "accepted">(
    "current",
  );
  const [saved, setSaved] = useState(true);
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
      if (!saved) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saved]);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失败，请重试。");
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
      revisions: [{ id, parent: null, name: "原始版本", image }],
    });
    setBase(raster);
    clearCandidate();
    setSaved(false);
    setMessage("原图已载入。添加候选结果，再框选要保留的修改。");
  }
  async function loadCandidate(url: string) {
    const raster = await decodeImage(url);
    setCandidate({ url: encodeImage(raster), raster });
    setRegions([]);
    setMode("candidate");
    setMessage("候选图已载入。请在图上拖动框选，只采纳选区内的内容。");
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
    if (!base || !sameSize || busy || event.button !== 0) return;
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
      throw new Error("选区内没有变化，无需创建新版本。");
    if (project.revisions.length >= 12)
      throw new Error("实验版最多 12 个版本，请导出后以当前 PNG 开始新项目。");
    const id = crypto.randomUUID();
    setProject({
      ...project,
      currentId: id,
      revisions: [
        ...project.revisions,
        {
          id,
          parent: current.id,
          name: (note.trim() || `修订 ${project.revisions.length}`).slice(
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
    setMessage("修改已采纳。选区外保留当前版本像素，可继续添加下一轮候选。");
  }
  async function restore(id: string) {
    const revision = project!.revisions.find((r) => r.id === id)!;
    const raster = await decodeImage(revision.image);
    setProject({ ...project!, currentId: id });
    setBase(raster);
    clearCandidate();
    setSaved(false);
    setMessage("已回到此版本，之后的新修改会创建分支，旧版本仍保留。");
  }
  function saveProject() {
    const json = JSON.stringify(project);
    if (json.length > 64 * 1024 * 1024) {
      setMessage("项目超过 64 MB，请先导出当前 PNG。");
      return;
    }
    download(
      new Blob([json], { type: "application/json" }),
      "rediagram.revision.json",
    );
    setSaved(true);
    setMessage("项目文件已导出；以后可以打开它继续修改。");
  }
  return (
    <main className={s.app} lang="zh-CN">
      <header className={s.header}>
        <a href="/">
          ReDiagram<span> / Revision lab</span>
        </a>
        <span className={s.badge}>本地实验版 · 不连接模型</span>
      </header>
      <section className={s.intro}>
        <p>让每次修改，累积成进展。</p>
        <h1>只留下你满意的改动。</h1>
        <div>把模型改好的部分采纳到当前图里，保住其余内容，继续下一轮。</div>
      </section>
      <div className={s.toolbar}>
        <button
          disabled={busy || !!project}
          onClick={() =>
            run(() => start("/revision-lab/source.png", "采购审批流程"))
          }
        >
          体验真实修图样例
        </button>
        <label className={busy || !!project ? s.disabled : ""}>
          打开原图
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
          打开项目
          <input
            disabled={busy || !!project}
            type="file"
            accept=".json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f)
                run(async () => {
                  if (f.size > 64 * 1024 * 1024)
                    throw new Error("项目文件不能超过 64 MB。");
                  const p = await parseProject(await f.text());
                  const r = await decodeImage(
                    p.revisions.find((r) => r.id === p.currentId)!.image,
                  );
                  setProject(p);
                  setBase(r);
                  clearCandidate();
                  setSaved(true);
                  setMessage("项目已恢复。");
                });
              e.target.value = "";
            }}
          />
        </label>
        <button
          disabled={busy || !project}
          onClick={() => {
            if (
              saved ||
              window.confirm("尚未导出项目。确定关闭？未保存的修订会丢失。")
            ) {
              setProject(null);
              setBase(null);
              clearCandidate();
              setSaved(true);
            }
          }}
        >
          关闭项目
        </button>
        <span className={s.spacer} />
        <button
          disabled={busy || !current}
          onClick={() => download(current!.image, "rediagram.png")}
        >
          导出当前 PNG
        </button>
        <button disabled={busy || !project} onClick={saveProject}>
          保存项目{!saved ? " ·" : ""}
        </button>
      </div>
      <div className={s.workspace}>
        <aside className={s.panel}>
          <h2>01 / 当前修订</h2>
          <p>演示使用同一张自制流程图，连续测试数字、配色与关系修改。</p>
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
            候选图来自 Codex
            内置图像工具，底层模型不可核验。示例不是准确率评测。
          </p>
          <label
            className={`${s.upload} ${!project || busy ? s.disabled : ""}`}
          >
            ＋ 导入你自己的候选图
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
            本轮修改说明
            <textarea
              value={note}
              maxLength={200}
              disabled={busy}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例如：增加一条审批分支，保留原有文案"
            />
          </label>
          <h2>版本记录</h2>
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
                {r.id === project.currentId && <small>当前</small>}
              </button>
            ))}
          </div>
        </aside>
        <section className={s.canvasPanel}>
          <nav className={s.tabs} aria-label="对比视图">
            {(
              [
                ["current", "当前版本"],
                ["candidate", "模型候选"],
                ["accepted", "局部采纳预览"],
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
              {base ? `${base.width} × ${base.height}` : "等待打开图像"}
            </span>
          </nav>
          <div className={s.stage}>
            {imageUrl && base ? (
              <div
                className={s.imageWrap}
                style={{ aspectRatio: `${base.width}/${base.height}` }}
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
                  src={imageUrl}
                  alt={
                    mode === "current"
                      ? "当前已采纳的版本"
                      : mode === "candidate"
                        ? "模型生成的完整候选图"
                        : "仅应用选区的预览"
                  }
                  draggable={false}
                />
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
                <h2>先打开一张需要修订的图</h2>
                <p>不用重画整张，也不用接受每一个变化。</p>
                <button
                  disabled={busy || !!project}
                  onClick={() =>
                    run(() => start("/revision-lab/source.png", "采购审批流程"))
                  }
                >
                  从演示开始
                </button>
              </div>
            )}
          </div>
          <div className={s.status} role="status" aria-live="polite">
            {busy ? "正在处理…" : message}
          </div>
        </section>
        <aside className={s.panel}>
          <h2>02 / 决定保留哪里</h2>
          <p>
            拖动框选，可添加多个区域。颜色、文字与连线都可采纳；选区外保持当前版本。
          </p>
          {candidate && base && !sameSize && (
            <div className={s.warning}>
              <strong>候选尺寸发生变化</strong>
              <p>
                {candidate.raster.width} × {candidate.raster.height} →{" "}
                {base.width} × {base.height}
              </p>
              <p>对齐会重采样，不代表内容位置一致。请仔细比较边界。</p>
              <button
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const url = await resizeCandidate(
                      candidate.url,
                      base.width,
                      base.height,
                    );
                    await loadCandidate(url);
                    setMessage(
                      "已按尺寸对齐。请检查图形位置；如果布局移动，请放弃本轮。",
                    );
                  })
                }
              >
                确认按当前尺寸对齐
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
                } else setMessage("请在图上拖动框选。");
              }}
            >
              使用样例选区
            </button>
            <button
              disabled={busy || !regions.length}
              onClick={() => {
                setRegions([]);
                setMode("candidate");
              }}
            >
              清空
            </button>
          </div>
          <p>{regions.length} 个选区</p>
          {regions.map((r, i) => (
            <button
              className={s.regionRow}
              key={i}
              disabled={busy}
              onClick={() => {
                setRegions(regions.filter((_, j) => j !== i));
                setMode("candidate");
              }}
            >
              选区 {i + 1} · {r.width} × {r.height} <span>移除</span>
            </button>
          ))}
          {result && (
            <div className={s.metrics}>
              <small>候选图在选区外的变化</small>
              <strong>
                {result.stats.outsideChanged.toLocaleString()} <em>像素</em>
              </strong>
              <p>
                其中通道差 &gt;16：
                {result.stats.outsideVisibleChanged.toLocaleString()}{" "}
                像素。像素差不等于视觉错误。
              </p>
              <hr />
              <small>局部采纳后，选区外的变化</small>
              <strong className={s.good}>
                0 <em>像素</em>
              </strong>
              <p>基于解码后的 RGBA。选区内的文字、关系和拼接边缘仍需你检查。</p>
            </div>
          )}
          <button
            className={s.primary}
            disabled={busy || !result || !result.stats.insideChanged}
            onClick={() => run(accept)}
          >
            采纳选区，继续修订 →
          </button>
          <button disabled={busy || !candidate} onClick={clearCandidate}>
            放弃这次候选
          </button>
          <p className={s.hint}>
            此原型不自动理解箭头、不生成可编辑
            PPT。边界穿过连线或阴影时，局部采纳可能产生断线或接缝。
          </p>
        </aside>
      </div>
    </main>
  );
}
