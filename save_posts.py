#!/usr/bin/env python3
"""
Reads posts.json (made by grab_posts.js in Chrome) and downloads every image into

    <out>/<profile>/<YYYY-MM-DD>_<first line of caption>/
        <YYYY-MM-DD>_1.jpg, <YYYY-MM-DD>_2.jpg, ...   (all carousel images)
        caption.txt

Usage:
    python3 save_posts.py ~/Downloads/posts.json --profile dypatilrait --out ~/Documents/archive

Needs only the 'requests' package:  pip3 install requests
"""
import argparse
import json
import re
import sys
import time
from datetime import datetime
from pathlib import Path

import requests


def safe_title(caption: str, limit: int = 60) -> str:
    if not caption:
        return "untitled"
    line = caption.strip().splitlines()[0]
    line = re.sub(r"#\w+", "", line)                       # drop hashtags
    line = re.sub(r'[\\/:*?"<>|\n\r\t]', "", line)         # illegal path chars
    line = re.sub(r"\s+", " ", line).strip(" .")
    return line[:limit].rstrip() or "untitled"


def main() -> None:
    ap = argparse.ArgumentParser(description="Download images + captions from posts.json")
    ap.add_argument("json", nargs="?", default="~/Downloads/posts.json",
                    help="posts.json from grab_posts.js (default: ~/Downloads/posts.json)")
    ap.add_argument("--profile", default="instagram", help="folder name for this profile")
    ap.add_argument("--out", default="downloads", help="base output folder (default: ./downloads)")
    ap.add_argument("--delay", type=float, default=0.3, help="seconds between image downloads")
    args = ap.parse_args()

    src = Path(args.json).expanduser()
    if not src.exists():
        sys.exit(f"{src} not found")
    posts = json.loads(src.read_text(encoding="utf-8"))
    out = Path(args.out).expanduser() / args.profile
    out.mkdir(parents=True, exist_ok=True)
    print(f"{len(posts)} posts -> {out}\n")

    s = requests.Session()
    s.headers["User-Agent"] = "Mozilla/5.0"
    saved = 0
    for i, p in enumerate(posts, 1):
        dt = datetime.fromisoformat(p["date"].replace("Z", "+00:00")).astimezone()
        date = dt.strftime("%Y-%m-%d")
        folder = out / f"{date}_{safe_title(p.get('caption', ''))}"
        if (folder / "caption.txt").exists():
            print(f"[{i}/{len(posts)}] skip  {folder.name}")
            continue
        folder.mkdir(parents=True, exist_ok=True)

        for n, url in enumerate(p.get("images", []), 1):
            dest = folder / f"{date}_{n}.jpg"
            if dest.exists():
                continue
            try:
                r = s.get(url, timeout=30)
                r.raise_for_status()
                dest.write_bytes(r.content)
            except Exception as e:  # keep going on a single bad image
                print(f"   image {n} failed: {e}")
            time.sleep(args.delay)

        (folder / "caption.txt").write_text(
            f"Post: https://www.instagram.com/p/{p['code']}/\n"
            f"Date: {dt:%Y-%m-%d %H:%M}\n"
            f"Likes: {p.get('likes')}\n\n{p.get('caption', '')}\n",
            encoding="utf-8",
        )
        saved += 1
        print(f"[{i}/{len(posts)}] saved {folder.name} ({len(p.get('images', []))} img)")

    print(f"\nDone. {saved} new posts saved to {out}")


if __name__ == "__main__":
    main()
