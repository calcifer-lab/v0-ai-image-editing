import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getAllPosts, getPostBySlug } from "../../app/blog/_lib/posts.ts";

const draftSlug = "review-ai-diagram-edits-before-accepting";

test("experimental guide cannot appear in production listings or direct URLs", (t) => {
  const previous = process.env.NODE_ENV;
  t.after(() => { if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous; });
  process.env.NODE_ENV = "production";
  assert.ok(getAllPosts().length >= 10);
  assert.ok(getAllPosts().every((post) => !post.draft));
  assert.equal(getPostBySlug(draftSlug), null);
  process.env.NODE_ENV = "development";
  assert.equal(getPostBySlug(draftSlug)?.draft, true);
  assert.ok(getAllPosts().some((post) => post.slug === draftSlug));
  // Sitemap uses this explicitly, including during a local preview.
  assert.ok(getAllPosts(false).every((post) => !post.draft));
});

test("public articles do not send readers to experimental tools or draft articles", (t) => {
  const previous = process.env.NODE_ENV;
  t.after(() => { if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous; });
  process.env.NODE_ENV = "production";
  for (const post of getAllPosts()) {
    assert.ok(!post.toolHref.startsWith("/lab/"), post.slug);
    const content = getPostBySlug(post.slug).content;
    assert.ok(!/\]\(\/lab\//.test(content), post.slug);
    for (const [, target] of content.matchAll(/\]\(\/blog\/([a-z0-9-]+)\)/g)) {
      assert.ok(getPostBySlug(target), `${post.slug} links to unpublished ${target}`);
    }
    if (post.coverImage) assert.ok(existsSync(join(process.cwd(), "public", post.coverImage)), post.slug);
  }
  assert.equal(getPostBySlug("../../README"), null);
  assert.equal(getPostBySlug("missing-post"), null);
});
