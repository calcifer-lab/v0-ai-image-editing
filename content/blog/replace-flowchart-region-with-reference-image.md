---
title: "Replace Part of a Flowchart Using a Reference Image"
date: "2026-11-03"
slug: "replace-flowchart-region-with-reference-image"
description: "Prepare a clean replacement, select the destination, and inspect the result. A practical Direct Patch workflow for repairing a diagram image."
keywords: ["replace part of diagram", "flowchart reference image replacement", "repair diagram image"]
coverImage: "/images/blog/diagram-guides/reference.png"
toolHref: "/editor"
toolLabel: "Try a reference patch"
---

A reference patch is useful when you already know what the corrected part should look like. Instead of describing a replacement repeatedly, prepare it as an image and place it into a selected region of the original diagram.

This walkthrough uses an illustrative task: replacing a small approval panel with a corrected panel containing the right role, threshold, and background color. It is a preparation guide, not a measured success-rate claim.

## Check that the repair is local

A good candidate is a label, legend, box, or self-contained panel. The surrounding layout is already acceptable, and the reference contains the content you want to use.

If the change requires moving several boxes or rerouting a branch across the page, first reconsider the output format. A diagram editor with editable shapes may be a better fit. The [screenshot editing guide](/blog/edit-flowchart-screenshot-without-source-file) explains that decision.

## 1. Prepare the replacement artwork

Make a small reference image in a tool that lets you control text and geometry. Include the complete corrected box when its fill, border, and label all need to change.

For example, a replacement approval panel could contain:

- Role: “Finance review.”
- Condition: “Amount > $5,000.”
- Timing: “Respond within 24 hours.”

Check those values against the actual process before exporting the reference. These are example values, not a recommended approval policy.

Use approximately the same aspect ratio as the destination. Leave a little background around the element if the old border or lettering needs to be covered. Avoid adding unrelated artwork to the reference crop.

## 2. Open the editor and provide both images

Open the [ReDiagram editor](/editor). Use the diagram you want to repair as the base image and the corrected artwork as the reference image. The reference supplies the replacement; the base supplies the surrounding composition.

Select the relevant part of the reference. If you uploaded a larger page containing the corrected panel, narrow the source selection so unrelated elements are not included.

## 3. Mark the destination and choose Direct Patch

Select the area to replace in the base image. Cover all of the old content that should disappear, while avoiding neighboring labels and connectors where possible.

Under **Patch Mode**, choose **Direct Patch**. Its starting operation places the selected reference into the destination area. The current workflow also attempts background removal before placement. This can remove a flat panel fill or other content you intended to keep; inspect the prepared replacement and final result carefully. **AI Compose** is a separate mode that asks AI to reinterpret the reference.

Do not assume that either mode guarantees exact text, exact colors, or a correctly connected graph. The finished result needs review.

## 4. Inspect the result before downloading

Read the replacement word by word. Check decimal points, currency symbols, inequality signs, and units. A threshold of “> $5,000” and one of “≥ $5,000” describe different rules.

Then inspect the surrounding pixels. Is part of the old label still visible? Did the replacement cover an arrowhead? Is the background noticeably lighter inside the patch? Does a line end at the new border or appear to pass through it?

Finally, review the whole diagram at its intended presentation size. A patch that looks clean when enlarged may be too small to read on a slide.

## Common problems and the next adjustment

| Symptom | What to try |
| --- | --- |
| Old characters show around the new label | Expand the destination to cover the old content; include matching background in the reference |
| Lettering looks stretched | Prepare a reference with a closer aspect ratio instead of repeatedly resizing it |
| Border or background does not match | Replace the whole panel or improve the reference background; inspect the final result |
| An arrow appears disconnected | Review the complete connector path; use a larger self-contained repair or rebuild that connection |
| The reference loses its panel background | Background removal may have treated the fill as removable; use a workflow that preserves the full panel if the result cannot cover the old content |

## Keep the materials for the next revision

Save the original image, the corrected reference, and the approved exported result. Add a short note describing the repair. If the next request only changes the threshold, you can update the reference rather than reconstructing your intent from the final image.

A reference patch is a way to repair a raster image. It does not recover editable labels, chart data, or bound connectors. If the client needs those, include an editable reconstruction step in the handoff plan.
