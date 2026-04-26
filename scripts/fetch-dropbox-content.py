#!/usr/bin/env python3
from __future__ import annotations

import io
import json
import os
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path
from urllib import request, error


DROPBOX_DOWNLOAD_ZIP_URL = "https://content.dropboxapi.com/2/files/download_zip"
MEDIA_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".gif",
    ".avif",
    ".mp4",
    ".webm",
    ".ogg",
    ".mov",
    ".heic",
    ".heif",
}


def require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def ensure_clean_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def download_zip(access_token: str, dropbox_path: str) -> bytes:
    payload = json.dumps({"path": dropbox_path}).encode("utf-8")
    req = request.Request(
        DROPBOX_DOWNLOAD_ZIP_URL,
        method="POST",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Dropbox-API-Arg": payload.decode("utf-8"),
        },
    )
    try:
        with request.urlopen(req) as res:
            return res.read()
    except error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Dropbox download_zip failed for {dropbox_path}: {exc.code} {body}") from exc


def extract_zip_bytes(zip_bytes: bytes, destination: Path) -> None:
    ensure_clean_dir(destination)
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        zf.extractall(destination)


def find_first_file(root: Path, filename: str) -> Path | None:
    for path in sorted(root.rglob(filename), key=lambda p: len(p.parts)):
        if path.is_file():
            return path
    return None


def copy_timeline_assets(extracted_root: Path, timeline_assets_dir: Path) -> int:
    timeline_assets_dir.mkdir(parents=True, exist_ok=True)
    copied = 0
    for file_path in extracted_root.rglob("*"):
        if not file_path.is_file():
            continue
        if file_path.name == "items.json":
            continue
        if file_path.suffix.lower() not in MEDIA_EXTENSIONS:
            continue
        target = timeline_assets_dir / file_path.name
        shutil.copy2(file_path, target)
        copied += 1
    return copied


def main() -> int:
    try:
        access_token = require_env("DROPBOX_ACCESS_TOKEN")
        article_path = os.environ.get("DROPBOX_ARTICLE_PATH", "/nattsu-gallery/article").strip() or "/nattsu-gallery/article"
        timeline_path = os.environ.get("DROPBOX_TIMELINE_PATH", "/nattsu-gallery/timeline").strip() or "/nattsu-gallery/timeline"

        repo_root = Path(__file__).resolve().parent.parent
        article_target = repo_root / "src" / "data" / "article" / "markdown"
        timeline_items_target = repo_root / "src" / "data" / "timeline" / "items.json"
        timeline_assets_target = repo_root / "public" / "timeline"

        with tempfile.TemporaryDirectory(prefix="dropbox-sync-") as tmp:
            tmp_dir = Path(tmp)

            # Article
            article_zip = download_zip(access_token, article_path)
            extract_zip_bytes(article_zip, article_target)
            print(f"[dropbox] synced article markdown -> {article_target}")

            # Timeline
            timeline_extract_dir = tmp_dir / "timeline"
            timeline_zip = download_zip(access_token, timeline_path)
            extract_zip_bytes(timeline_zip, timeline_extract_dir)

            items_source = find_first_file(timeline_extract_dir, "items.json")
            if not items_source:
                raise RuntimeError("items.json was not found in Dropbox timeline path")
            timeline_items_target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(items_source, timeline_items_target)
            print(f"[dropbox] synced timeline items -> {timeline_items_target}")

            copied_assets = copy_timeline_assets(timeline_extract_dir, timeline_assets_target)
            print(f"[dropbox] synced timeline assets -> {timeline_assets_target} ({copied_assets} files)")

        return 0
    except Exception as exc:  # noqa: BLE001
        print(f"[dropbox] ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
