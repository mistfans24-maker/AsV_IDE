import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the AsV_IDE boot experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /AsV_IDE — Build without limits/);
  assert.match(html, /INITIALIZING LOCAL WORKSPACE/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
});

test("ships the public maker experience instead of starter scaffolding", async () => {
  const [page, layout] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(page, /Project Compass/);
  assert.match(page, /Code \+ Canvas/);
  assert.match(page, /Learning Mode/);
  assert.match(page, /https:\/\/github\.com\/mistfans24-maker\/AsV_IDE/);
  assert.match(layout, /AsV_IDE — Build without limits/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
});
