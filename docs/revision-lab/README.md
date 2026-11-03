# Diagram Revision — development preview

Status: **ready for draft review, not for public launch or paid use**. Updated November 3, 2026.

Diagram Revision sits alongside the existing Fix editor. Import a diagram and a complete AI-edited candidate, select the changes worth keeping, inspect the composite, and accept them into version history. Pixels outside the selection are copied unchanged from the accepted source. This guarantee does not validate the meaning or appearance of the edits.

## Run locally

Use Node 22.6+ (tests use TypeScript stripping), install the locked dependencies, then:

```sh
pnpm install --frozen-lockfile
pnpm dev:revision
```

Open <http://127.0.0.1:3100/> → **Explore tools** → **Diagram Revision**. The tool menu in both Fix and Diagram Revision supports switching in either direction. New tool entries and `/lab/*` pages are development-only. Production builds, including ordinary Vercel Preview builds, return 404 for the lab pages and API. This PR does not enable a hosted trial.

If installed dependencies are available but pnpm's build-script checks block startup:

```sh
node node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3100
```

Do not run a production build concurrently with the dev server: both use `.next`. Stop and restart the dev server after building.

## Review the workflow

1. Start with a demo, or open a PNG/JPEG/WebP diagram.
2. Import a candidate. The three bundled examples are actual built-in image-tool outputs, not deterministic mock edits.
3. If dimensions differ, explicitly confirm a same-aspect resize. This does **not** align moved objects. Different aspect ratios are rejected.
4. Draw selections covering the intended edits, including old and new connector paths. Inspect **Selection preview**, differences, and zoom before accepting.
5. Accept, export PNG, and export the project JSON. Restore older versions to try a different revision.

Accepted versions autosave to IndexedDB on this device. Unaccepted candidates, selections, and edit instructions do not autosave. Export projects for backup; device-local storage is not cloud sync. Local tool navigation warns about pending work. It does not transfer work between tools or cover every browser navigation mechanism.

**Align candidate** applies a reversible integer translation of up to ±64 px; it does not rescale or warp individual objects. Selections outside the translated candidate’s coverage block acceptance. **Inspect boundaries** compares 96 × 96-pixel details of the current/candidate/accepted-preview images, with edge selection, position control and optional guides. See the [boundary verification record](./evaluation/BOUNDARY-VERIFICATION.md).

## Optional generation

Candidate import and review require no model key. The local generation route uses the existing Google image provider when `GOOGLE_API_KEY` or `GEMINI_API_KEY` is configured; `REVISION_IMAGE_MODEL` can override its default model. Configuration presence is not a successful provider health check. At the last local verification, GET `/api/lab/revisions` reported `configured: false`.

The website cannot call Codex's built-in image tool. Built-in model experiments documented below were run separately, then imported as files. No successful live request through the website's generation endpoint has been verified. The route has local-origin checks, request limits, one in-process generation slot, and cancellation; these are not a production multi-user quota, authentication, or billing system.

## Evidence

- [Research and positioning](./RESEARCH.md): dated source research, alternatives, and investment assumptions.
- [Current iteration history](./ITERATION-2.md): navigation, branding, storage, generation, and browser checks.
- [Chinese workflow evaluation](./evaluation/RESULTS.md): a real model edit, two selection strategies, preserved-pixel measurements, and unresolved visual defects.
- [Original experiment metadata](./experiment.json) and [browser-export audit](./pixel-audit.json): three sequential edits on the English fixture.
- [SEO content plan](./SEO-CONTENT-PLAN.md): two public Fix guides and a development-only draft Revision guide. The draft is excluded from the production blog and sitemap.

The original Fix processing pipeline is preserved. Its UI changes are limited to tool navigation and pending-work guards. Branding and English copy follow the homepage. Local development skips analytics; production analytics behavior is unchanged.

## Checks

```sh
node --experimental-strip-types --test tests/revision-lab/*.test.mjs tests/blog/*.test.mjs
node node_modules/typescript/bin/tsc -p tsconfig.revision-lab.json --noEmit
node scripts/audit-revision-project.mjs /path/to/exported-demo-project.json
node --experimental-strip-types scripts/evaluate-revision-candidate.mjs docs/revision-lab/evaluation/manifest.json
```

The first audit expects the original four-version English demo export. The second is an offline candidate evaluator using the actual `acceptRegions` implementation and an independent PNG round-trip check. It uses Sharp resizing; it is not evidence of browser Canvas resizing or live provider integration.

Thirteen automated tests and scoped TypeScript checks pass. The last production build passed with the repository's existing `ignoreBuildErrors` configuration. Full-repository TypeScript is not clean: existing async `AuthControls` JSX errors in `app/editor/page.tsx` and `components/landing/header.tsx`, plus a ref type error in `components/results-view.tsx`, remain outside this change's fixes. Browser checks cover sequential revisions, export/reopen, version restoration, two-way switching, pending-work dialogs, and a 390px-wide homepage/menu.

## Limits and release gates

- Maximum 4,194,304 pixels/image, 24 MB input file, 32 rectangular selections, 12 versions, and 64 MB project JSON. PNG output only.
- No editable PowerPoint/vector reconstruction, automatic graph validation, object alignment, or guaranteed seamless patching. Exact color matching is not guaranteed by the model.
- Browser/color-profile/transparent-image export coverage is incomplete. Unit tests cover transparent RGBA copying, not all browser color pipelines.
- Local autosave has no cross-tab conflict resolution. This is not a collaborative editor.
- Before public availability: configure and verify the actual hosted provider path, add appropriate access/quota controls, deliberately enable preview routes, and resolve review findings.
- Before charging: evaluate permitted real-world diagrams against direct model editing and manual repair, recording total time, retries, correctness, seams, and repeat-use intent. Synthetic examples do not establish willingness to pay.

Do not merge or deploy this branch as part of draft review. Keep the new tool experimental until these gates have evidence.
