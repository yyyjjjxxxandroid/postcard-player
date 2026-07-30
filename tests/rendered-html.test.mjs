import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html", host: "localhost" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the postcard music player", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>寄给未来｜明信片播放器<\/title>/);
  assert.match(html, /慢慢喜欢你/);
  assert.match(html, /莫文蔚/);
  assert.match(html, /把此刻的心动，寄给未来的自己。/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("keeps the requested local note and sharing behaviors", async () => {
  const page = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(page, /window\.localStorage/);
  assert.match(page, /Math\.abs\(note\.time - audio\.currentTime\) <= 0\.8/);
  assert.match(page, /setTimeout\(\(\) => setVisibleNote\(null\), 4000\)/);
  assert.match(page, /navigator\.share/);
  assert.match(page, /url\.searchParams\.set\("song"/);
  assert.match(page, /url\.searchParams\.set\("t"/);
  assert.match(page, /<audio/);
  assert.match(page, /type="range"/);
});
