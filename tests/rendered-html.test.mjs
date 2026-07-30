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
  assert.match(html, /康定情歌/);
  assert.match(html, /成方圆/);
  assert.match(html, /一张寄往未来的音乐明信片/);
  assert.doesNotMatch(html, /把此刻的心动，寄给未来的自己。/);
  assert.doesNotMatch(html, /传统民歌/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("keeps the requested postcard sharing behaviors", async () => {
  const page = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );
  const css = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(page, /window\.localStorage/);
  assert.match(page, /const DEFAULT_NOTES: MemoryNote\[\] = \[/);
  assert.match(page, /selectedShareNoteIds/);
  assert.match(page, /displayedNote/);
  assert.match(page, /label="分享"/);
  assert.match(page, /选择要分享的明信片/);
  assert.match(page, /postcard-note/);
  assert.match(page, /更多功能暂时留白/);
  assert.match(page, /createPostcardFile/);
  assert.match(page, /navigator\.canShare/);
  assert.match(page, /navigator\.share/);
  assert.match(page, /download = file\.name/);
  assert.match(page, /share-preview/);
  assert.match(page, /className="paper-indicator"/);
  assert.match(page, /查看这首歌的明信片/);
  assert.match(page, /className="lyric-quote"/);
  assert.match(page, /♪ “\$\{note\.lyric\}”/);
  assert.doesNotMatch(page, /url\.searchParams\.set\("song"/);
  assert.doesNotMatch(page, /url\.searchParams\.set\("notes"/);
  assert.doesNotMatch(page, /className="note-markers"/);
  assert.doesNotMatch(css, /paper-indicator::before/);
  assert.doesNotMatch(css, /note-markers/);
  assert.match(page, /<audio/);
  assert.match(page, /type="range"/);
});
