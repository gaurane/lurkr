<h1 align="center">👀 lurkr</h1>

<p align="center">
  <b>The Instagram archiver that never asks. It just lurks.</b><br>
  <sub>Every photo · every carousel slide · every caption · tidy dated folders · zero API drama</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/browser-Chrome%20DevTools-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Chrome">
  <img src="https://img.shields.io/badge/python-3.9%2B-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/no%20API%20keys-%E2%9C%93-22c55e?style=for-the-badge" alt="No API keys">
  <img src="https://img.shields.io/badge/no%20scraper%20libs-%E2%9C%93-f59e0b?style=for-the-badge" alt="No scraper libs">
  <img src="https://img.shields.io/badge/license-MIT-a855f7?style=for-the-badge" alt="MIT">
</p>

---

## 🧠 Why this exists

Every scraper library breaks the moment Instagram changes its API, and a fresh script login gets your account slapped with `feedback_required` in minutes. instaloader? Blocked. gallery-dl? Blocked. Hitting the API from the page itself? Redirected to the home page like a stranger at a party.

**lurkr does none of that.**

**It listens instead of asking.** `grab_posts.js` runs *inside* the Instagram tab you already have open and quietly records the post data the page itself downloads while scrolling. Instagram sees nothing but a normal person scrolling a profile. Then `save_posts.py` pulls the images from Instagram's public CDN — which needs no login and never rate-limits you.

```
 ┌──────────────────────────┐        posts.json        ┌──────────────────────────┐
 │  🌐 grab_posts.js        │  ─────────────────────▶  │  🐍 save_posts.py        │
 │  runs in Chrome console  │   code · date · caption  │  downloads images from   │
 │  hooks page's own XHR    │   likes · image URLs     │  CDN into dated folders  │
 └──────────────────────────┘                          └──────────────────────────┘
```

## 📁 What you get

```
downloads/
└── dypatilrait/
    ├── 2026-09-23_National Engineers Day Special  Inauguration of Level Co/
    │   ├── 2026-09-23_1.jpg
    │   ├── 2026-09-23_2.jpg        ← every slide of a carousel
    │   ├── 2026-09-23_3.jpg
    │   └── caption.txt             ← full caption + post link + date + likes
    ├── 2026-09-19_Orientation Day 2026/
    │   ├── 2026-09-19_1.jpg
    │   └── caption.txt
    └── ...
```

Folder names are `<date>_<first line of the caption>` (hashtags and illegal characters stripped, 60 chars max).

## 🚀 Quick start

### 1 · Grab the post list (in Chrome)

1. Log into Instagram in Chrome and open the profile, e.g. `https://www.instagram.com/dypatilrait/`
2. **Reload the page** (the hook must be in place before posts load).
3. Open DevTools console: <kbd>Cmd</kbd>+<kbd>Option</kbd>+<kbd>J</kbd> (Mac) / <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>J</kbd> (Win/Linux).
   If Chrome blocks pasting, type `allow pasting` and press Enter first.
4. Paste the entire contents of [`grab_posts.js`](grab_posts.js) and press Enter.

It scrolls the page on its own and reports progress:

```
hooked. 12 posts found in page so far. scrolling...
45 posts, oldest so far 2026-07-02
78 posts, oldest so far 2026-04-18
...
reached pre-2025, stopping
DONE — 339 posts (2025+) saved to posts.json (check Downloads)
```

> 🛑 Stop early any time: type `window.__stop = true` in the console.

### 2 · Download the images (in a terminal)

```bash
pip3 install requests
python3 save_posts.py ~/Downloads/posts.json --profile dypatilrait --out ~/Documents/archive
```

```
[1/339] saved 2026-09-23_National Engineers Day Special (6 img)
[2/339] saved 2026-09-19_Orientation Day 2026 (1 img)
...
Done. 339 new posts saved to /Users/you/Documents/archive/dypatilrait
```

Re-running is safe — posts already on disk are skipped, so you can rerun later to pick up new ones.

## ⚙️ Options

**`grab_posts.js`** — one line to edit at the top:

```js
const SINCE = new Date("2025-01-01");   // only keep posts on/after this date
```
Set it to `"2000-01-01"` for the whole profile.

**`save_posts.py`**

| flag | default | meaning |
|---|---|---|
| `json` (positional) | `~/Downloads/posts.json` | file produced by `grab_posts.js` |
| `--profile` | `instagram` | sub-folder name for this profile |
| `--out` | `./downloads` | base output folder |
| `--delay` | `0.3` | seconds between image downloads |

## 🩺 Troubleshooting

| symptom | what it means | fix |
|---|---|---|
| `0 posts` and the grid is empty | your account can't see the profile | log in / wait for restrictions to clear |
| `hooked. 0 posts` but count never rises | script was pasted after posts loaded | reload the page, paste again immediately |
| `grid stopped loading` early | end of profile, or Instagram paused loading | scroll manually a bit, or rerun later — reruns merge |
| `image N failed: 403` | CDN link expired (they last ~a day) | rerun `grab_posts.js` for a fresh `posts.json` |

## ⚠️ Please read

- Download only content you own or have permission to archive. Bulk downloading is against Instagram's Terms of Use; this tool exists for personal archives of pages you run.
- Videos are not downloaded — only the cover image of a video post is kept.
- Instagram changes its page internals often. The hook looks for any object with `code`, `taken_at` and `image_versions2`/`carousel_media`, which has been stable, but if it ever stops finding posts, that's where to look.

## 🙏 Credits

Built at 3 a.m. after Instagram said *no* in six different ways. Feedback was, in fact, not required. 🌙

<p align="center"><sub>MIT License · PRs welcome · lurk responsibly</sub></p>
