# RD-BENCH-02: Chinese workflow with a return loop

Date: November 3, 2026. One synthetic fixture, one actual model call, no retries. This is a feasibility probe, **not** a model ranking, customer trial, or product conversion result.

## Reproduce

- [Source SVG](./source.svg) and [raster input](./source.png): seven nodes, a monetary branch, a material-resubmission loop, Chinese labels, and protected identifying text. All data is synthetic.
- [Exact prompt](./prompt.txt): change 48 to 24 hours, recolor Finance, and redirect the manager branch to the director while deleting its old purchase connector.
- [Unmodified model output](./candidate.png): Codex built-in imagegen. The tool did not expose a model ID; `modelId` is null. Do not describe this as a GPT Image 2.5 test or as a call through the website API.
- [Selection manifest](./manifest.json), [machine-readable report](./report.json), [tight acceptance](./accepted-tight.png), and [whole-branch acceptance](./accepted-whole-branch.png).

```sh
node --experimental-strip-types scripts/evaluate-revision-candidate.mjs docs/revision-lab/evaluation/manifest.json
```

Input was 1024 × 1024; output was 1254 × 1254. We explicitly resized the candidate with Sharp Lanczos3 for this offline test. The web editor uses Canvas, so its resampling pixels may differ. File hashes are retained in the report. PNG artifacts are retained so future reviewers do not have to reproduce the nondeterministic model call.

## Findings

Visual review of the full images found the requested 24-hour label, purple Finance node, and manager → director connector. The old manager → purchase connector was removed. The director → purchase path, Finance → supplement-materials path, return loop, threshold, budget, owner, and footer remained readable and semantically consistent with the source. This was human-style visual inspection by the coding agent, not OCR or graph-validator verification.

The model also re-rendered background textures, glyphs, and strokes beyond the requested edits. Its purple fill was approximate: aligned sample pixel (410, 460) is RGB (237, 231, 253), versus the requested (237, 233, 254). The background sample at (190, 800) is (247, 248, 251), versus the source (248, 250, 252). These are illustrative samples, not a whole-image color score.

| Selection strategy | Fraction of image selected | Candidate changed pixels outside selection | Outside differences with max channel delta >16 | Accepted PNG changed pixels outside selection |
| --- | ---: | ---: | ---: | ---: |
| Tight: Finance + new connector + old connector removal | 5.95% | 983,420 | 20,085 | 0 |
| Finance + entire lower branch | 19.57% | 840,970 | 15,423 | 0 |

Counts compare decoded RGBA. Widespread small differences do **not** mean widespread semantic errors. Acceptance uses the production prototype's `acceptRegions`; a separate loop checks the encoded/decoded exported PNG. Both strategies changed selected pixels and preserved every protected pixel.

Both accepted outputs retained the intended text and relationship changes on visual inspection. Tight selection retained more original node styling, but there is a faint rectangular background patch along the removed connector and subtle line/edge transitions. Selecting the whole branch provides more surrounding context, but also accepts more unwanted texture and re-rendered nodes. **Neither is a demonstrated pixel-perfect, seamless edit.** We did not measure an end-user's repair time or ask a user to approve the output.

## Product decision

This model can already perform the three edits in a single request on this case. “AI changes text, colors, and relationships” alone is not a defensible paid benefit. The prototype's additional demonstrated property is deterministic preservation outside user-chosen regions plus versioned acceptance; whether that saves enough work to pay for is still unproven.

Keep the PR in draft. Prioritize boundary inspection and layout alignment over adding more tools. Avoid automatic blur/feathering across protected pixels: that would silently weaken the preservation guarantee. A useful next local experiment is a magnified boundary comparison that helps users reject or expand problematic selections; automatic suggestions must show what additional content will be accepted.

## Next evaluation gates

1. Collect at least 20 permitted real-world diagrams across English/Chinese, dense connectors, swimlanes, and low-resolution screenshots. Keep customer content private; only synthetic/redacted fixtures belong in this repository.
2. Use the same task per diagram for direct model output, Fix/reference patching, and Diagram Revision. Record elapsed **human + generation + retry + repair** time, required text/edge checks, obvious seams, number of attempts, and final user acceptance. Do not count “0 protected pixels changed” as task success.
3. Provisional internal go/no-go targets: no accepted critical text/edge error, at least 80% reviewer-approved tasks within two candidates, and at least 30% median total-time improvement over the best available baseline. These are proposed targets, not achieved results or statistically established thresholds.
4. Only then run a small paid pilot with repeat users. Track a second completed job and willingness to pay. Do not open billing based on this synthetic probe.
