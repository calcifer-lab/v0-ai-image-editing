# English SEO content supporting the tool matrix

Date: 2026-11-03. Local branch only; no publication, PR, or deployment.

## Editorial direction

Use task-focused English guides to help a visitor choose and complete a diagram repair. Each guide needs a concrete input, an output requirement, steps, a review checklist, and an accurate tool destination. Avoid generic model-news traffic, unverified superiority claims, invented customer results, keyword-volume claims, and duplicate articles for minor keyword variants.

This follows [Google Search Central's people-first content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content). It is an editorial approach, not a ranking or traffic guarantee. No keyword-volume research or Search Console data was available for this iteration; the queries below are intent hypotheses derived from the product task.

## First three articles

| Article / search intent | Role | Destination | Publication state |
| --- | --- | --- | --- |
| How to Edit a Flowchart Screenshot Without the Source File / edit flowchart screenshot | Help users decide between patching an image and rebuilding editable shapes | Existing `/editor`; related reference tutorial | Ready for local review; included in the production content set if later deployed |
| Replace Part of a Flowchart Using a Reference Image / replace part of diagram | Show preparation, selection, failure modes, and review | Existing `/editor`, Direct Patch | Ready for local review; included in the production content set if later deployed |
| How to Review AI Diagram Edits Before Accepting Them / review AI diagram edits | Explain the new workflow and report the actual small experiment | `/lab/revisions` | `draft: true`; development only, noindex, excluded from sitemap |

The original articles remain in place. The new guides link to each other where useful. The local tool matrix links to all three. Blog navigation and article headers reuse the homepage BrandMark. Article CTAs have explicit tool destinations instead of sending every visitor back to the homepage.

## Evidence and boundaries

- Instructions checked against `hooks/use-image-editor.ts`, `components/control-panel.tsx`, and the new revision workbench.
- Direct Patch currently crops/prepares the reference, attempts background removal (with fallback), then composites. `runFusionPass` exists but is not called by the current Direct Patch path. Do not repeat the stale code comments or older marketing claim that automatic AI fusion always runs. Background removal may remove a desired panel fill; the tutorial discloses this.
- The revision article reports the synthetic six-node experiment documented in `RESEARCH.md`; it does not claim a model ID, superiority, paid-user evidence, or successful live API integration.
- New covers are original workflow illustrations, not before/after evidence. SVG sources and PNG share images are stored under `public/images/blog/diagram-guides/`.
- No editable PPT, automatic relationship validation, cloud sync, exact generated spelling, or speed guarantees are promised.

## Technical implementation

The existing Markdown loader now supports `draft`, `toolHref`, and `toolLabel`. Drafts are accessible only in development, get a visible preview notice and noindex metadata, and are excluded from the sitemap even in development. Production listing and direct lookup both reject draft content. Sitemap uses the same loader rather than independently discovering Markdown files.

Article pages provide canonical URL, description, Open Graph article data, Twitter share metadata, and Article JSON-LD with an organizational author and English language. The blog index has its own canonical URL. JSON-LD escapes `<` before embedding. Existing editor components and homepage remain unchanged.

## Next content cycle

1. Finish the real-diagram evaluation first. For each reproducible result, save permitted input/output images, the exact task, the actual review time, and failures.
2. Turn the strongest verified use case into one illustrated tutorial. Update these pages when the tool or workflow changes rather than multiplying near-duplicates.
3. Publish the revision guide only after its tool has a public supported route, live generation has been verified (or the guide accurately describes an import-only release), and the availability wording and CTA are updated.
4. After an approved deployment, inspect indexing and query impressions in Search Console. Then evaluate article-to-editor clicks and completed usable outputs. Do not equate page views with paid demand.

No new analytics or outbound submission was enabled in this change.

## Local verification

- Scoped TypeScript check includes blog pages, loader, sitemap, and new tool components.
- Nine tests pass: existing seven revision tests plus draft publication isolation and public-content link/asset checks.
- Browser verification: English tool matrix and revision UI, article list, full tutorial, draft banner, and draft robots metadata (`noindex, nofollow`). Saved screenshots: `seo-article-preview.png` and `toolbox-english-preview.png`.
- Production Webpack build passed. Parsed the prerendered article HTML: each new public guide has one H1, its own canonical URL, description, article Open Graph data, Twitter card, and valid Article JSON-LD. The draft is absent from production prerender output and sitemap; both public guides are present.
- The repository still configures production builds to skip global type validation. The separately run scoped check covers the files changed here; this is not a claim that the whole repository is type-error free.
- React review: shared headers remain server components; no new client fetches or dependencies. Links are not nested, images have alternate text, tables have horizontal overflow handling, and new guide navigation is keyboard accessible.
