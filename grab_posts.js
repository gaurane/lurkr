// Paste into Chrome DevTools console on any Instagram profile page (logged in).
// Passive: hooks the page's own network responses and records every post the
// page loads while scrolling. Makes NO requests of its own.
// Downloads rait_posts.json when done. Stop early anytime with:  window.__stop = true
(async () => {
  const SINCE = new Date("2025-01-01");   // <-- change: only keep posts on/after this date
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const posts = new Map();          // code -> post
  const pick = m => m?.image_versions2?.candidates?.[0]?.url;

  // walk any object; collect things that look like a post
  const harvest = obj => {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) { obj.forEach(harvest); return; }
    if (obj.code && obj.taken_at && (obj.image_versions2 || obj.carousel_media)) {
      if (!posts.has(obj.code)) {
        posts.set(obj.code, {
          code: obj.code,
          date: new Date(obj.taken_at * 1000).toISOString(),
          caption: obj.caption?.text || "",
          likes: obj.like_count ?? null,
          images: (obj.carousel_media ? obj.carousel_media.map(pick) : [pick(obj)]).filter(Boolean),
        });
      }
      return;
    }
    Object.values(obj).forEach(harvest);
  };

  const harvestText = text => {
    for (const chunk of text.split("\n")) {
      if (!chunk.includes("taken_at")) continue;
      try { harvest(JSON.parse(chunk)); } catch (e) {}
    }
  };

  // 1) posts already embedded in the page
  document.querySelectorAll('script[type="application/json"]').forEach(s => harvestText(s.textContent));

  // 2) hook XHR
  const xo = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (m, u) {
    this.addEventListener("load", () => { try { if (typeof this.responseText === "string") harvestText(this.responseText); } catch (e) {} });
    return xo.apply(this, arguments);
  };
  // 3) hook fetch
  const f0 = window.fetch;
  window.fetch = async function () {
    const res = await f0.apply(this, arguments);
    try { res.clone().text().then(harvestText).catch(() => {}); } catch (e) {}
    return res;
  };

  console.log(`hooked. ${posts.size} posts found in page so far. scrolling...`);
  window.__stop = false;
  let idle = 0, last = posts.size;
  while (!window.__stop) {
    window.scrollTo(0, document.body.scrollHeight);
    await sleep(2500);
    const oldest = [...posts.values()].reduce((a, p) => (p.date < a ? p.date : a), "9999");
    console.log(`${posts.size} posts, oldest so far ${oldest.slice(0, 10)}`);
    if (new Date(oldest) < SINCE) { console.log("reached pre-2025, stopping"); break; }
    idle = posts.size === last ? idle + 1 : 0; last = posts.size;
    if (idle >= 8) { console.log("grid stopped loading"); break; }
  }

  const out = [...posts.values()].filter(p => new Date(p.date) >= SINCE)
                                 .sort((a, b) => b.date.localeCompare(a.date));
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
  const a = Object.assign(document.createElement("a"),
    { href: URL.createObjectURL(blob), download: "posts.json" });
  document.body.appendChild(a); a.click(); a.remove();
  console.log(`DONE — ${out.length} posts (2025+) saved to posts.json (check Downloads)`);
})();
