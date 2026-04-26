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


def normalize_dropbox_path(path_value: str) -> str:
    value = (path_value or "").strip()
    if not value:
        return ""
    if not value.startswith("/"):
        value = f"/{value}"
    return value


def unique_paths(paths: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for raw in paths:
        normalized = normalize_dropbox_path(raw)
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        result.append(normalized)
    return result


def build_candidate_paths(primary_path: str, kind: str) -> list[str]:
    defaults = {
        "article": ["/nattsu-gallery/article", "/article", "/_md/article"],
        "opus": ["/nattsu-gallery/opus", "/opus", "/_md/opus"],
        "timeline": ["/nattsu-gallery/timeline", "/timeline", "/_md/timeline"],
    }
    base = normalize_dropbox_path(primary_path)
    derived: list[str] = []
    if base.startswith("/nattsu-gallery/"):
        derived.append(base.replace("/nattsu-gallery", "", 1))
    if base.startswith("/_md/"):
        derived.append(base.replace("/_md", "", 1))
    return unique_paths([base, *derived, *defaults.get(kind, [])])


def download_zip_with_fallback(access_token: str, candidate_paths: list[str], kind: str) -> tuple[bytes, str]:
    errors: list[str] = []
    for path_candidate in candidate_paths:
        try:
            data = download_zip(access_token, path_candidate)
            print(f"[dropbox] resolved {kind} path: {path_candidate}")
            return data, path_candidate
        except RuntimeError as exc:
            errors.append(str(exc))
    raise RuntimeError(
        f"Failed to resolve Dropbox {kind} path. Tried: {', '.join(candidate_paths)}\n"
        f"{errors[-1] if errors else ''}"
    )


def extract_zip_bytes(zip_bytes: bytes, destination: Path) -> None:
    ensure_clean_dir(destination)
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        zf.extractall(destination)


def merge_tree_into(src: Path, dst: Path) -> None:
    """Move all items from src into dst, merging existing directories."""
    if not src.is_dir():
        return
    dst.mkdir(parents=True, exist_ok=True)
    for item in list(src.iterdir()):
        target = dst / item.name
        if item.is_dir() and target.exists() and target.is_dir():
            merge_tree_into(item, target)
            try:
                item.rmdir()
            except OSError:
                shutil.rmtree(item)
        else:
            if target.exists():
                if target.is_dir():
                    shutil.rmtree(target)
                else:
                    target.unlink()
            shutil.move(str(item), str(target))


def flatten_single_named_subdir(root: Path, name: str) -> None:
    """Dropbox zip が 1 階だけ `article/` / `opus/` / `timeline/` で包んでいる場合に中身を root へ寄せる。"""
    child = root / name
    if not child.is_dir():
        return
    merge_tree_into(child, root)
    shutil.rmtree(child)


def normalize_opus_assets_nesting(assets_root: Path) -> None:
    """`data/opus/data/*` の余分なネストを `data/` 直下へ。"""
    nested = assets_root / "opus" / "data"
    if not nested.is_dir():
        return
    merge_tree_into(nested, assets_root)
    shutil.rmtree(assets_root / "opus")


def normalize_timeline_assets_nesting(assets_root: Path) -> None:
    """`data/timeline/data/*` 形式の余分なネストを解消。"""
    nested = assets_root / "timeline" / "data"
    if not nested.is_dir():
        return
    merge_tree_into(nested, assets_root)
    shutil.rmtree(assets_root / "timeline")


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
        rel = file_path.relative_to(extracted_root)
        target = timeline_assets_dir / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(file_path, target)
        copied += 1
    return copied


def copy_opus_assets(extracted_root: Path, opus_assets_dir: Path) -> int:
    opus_assets_dir.mkdir(parents=True, exist_ok=True)
    copied = 0
    for file_path in extracted_root.rglob("*"):
        if not file_path.is_file():
            continue
        if file_path.suffix.lower() not in MEDIA_EXTENSIONS:
            continue
        rel = file_path.relative_to(extracted_root)
        target = opus_assets_dir / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(file_path, target)
        copied += 1
    return copied


def sync_opus_markdown(extracted_root: Path, opus_markdown_dir: Path) -> int:
    ensure_clean_dir(opus_markdown_dir)
    copied = 0
    for file_path in extracted_root.rglob("*"):
        if not file_path.is_file():
            continue
        if file_path.suffix.lower() != ".md":
            continue
        rel = file_path.relative_to(extracted_root)
        target = opus_markdown_dir / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(file_path, target)
        copied += 1
    return copied


def sync_timeline_markdown(extracted_root: Path, timeline_markdown_dir: Path) -> int:
    ensure_clean_dir(timeline_markdown_dir)
    copied = 0
    for file_path in extracted_root.rglob("*"):
        if not file_path.is_file():
            continue
        if file_path.suffix.lower() != ".md":
            continue
        rel = file_path.relative_to(extracted_root)
        target = timeline_markdown_dir / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(file_path, target)
        copied += 1
    return copied


def main() -> int:
    try:
        access_token = require_env("DROPBOX_ACCESS_TOKEN")
        article_path = os.environ.get("DROPBOX_ARTICLE_PATH", "/nattsu-gallery/article").strip() or "/nattsu-gallery/article"
        opus_path = os.environ.get("DROPBOX_OPUS_PATH", "/nattsu-gallery/opus").strip() or "/nattsu-gallery/opus"
        timeline_path = os.environ.get("DROPBOX_TIMELINE_PATH", "/nattsu-gallery/timeline").strip() or "/nattsu-gallery/timeline"
        article_candidates = build_candidate_paths(article_path, "article")
        opus_candidates = build_candidate_paths(opus_path, "opus")
        timeline_candidates = build_candidate_paths(timeline_path, "timeline")

        repo_root = Path(__file__).resolve().parent.parent
        article_target = repo_root / "src" / "data" / "article"
        opus_markdown_target = repo_root / "src" / "data" / "opus"
        opus_assets_target = repo_root / "src" / "data" / "opus" / "data"
        timeline_markdown_target = repo_root / "src" / "data" / "timeline"
        timeline_assets_target = repo_root / "src" / "data" / "timeline" / "data"

        with tempfile.TemporaryDirectory(prefix="dropbox-sync-") as tmp:
            tmp_dir = Path(tmp)

            # Article（zip で余分に `content/` や `article/` が 1 段ある場合は畳む）
            article_zip, _ = download_zip_with_fallback(access_token, article_candidates, "article")
            extract_zip_bytes(article_zip, article_target)
            flatten_single_named_subdir(article_target, "content")
            flatten_single_named_subdir(article_target, "article")
            print(f"[dropbox] synced article markdown -> {article_target}")

            # Opus
            opus_extract_dir = tmp_dir / "opus"
            opus_zip, _ = download_zip_with_fallback(access_token, opus_candidates, "opus")
            extract_zip_bytes(opus_zip, opus_extract_dir)
            flatten_single_named_subdir(opus_extract_dir, "content")
            flatten_single_named_subdir(opus_extract_dir, "opus")
            opus_markdown_count = sync_opus_markdown(opus_extract_dir, opus_markdown_target)
            flatten_single_named_subdir(opus_markdown_target, "content")
            flatten_single_named_subdir(opus_markdown_target, "opus")
            if opus_markdown_count == 0:
                print(
                    f"[dropbox] warning: no markdown files found in Dropbox opus path; "
                    f"continuing with empty {opus_markdown_target}"
                )
            else:
                print(f"[dropbox] synced opus markdown -> {opus_markdown_target} ({opus_markdown_count} files)")
            opus_assets_count = copy_opus_assets(opus_extract_dir, opus_assets_target)
            normalize_opus_assets_nesting(opus_assets_target)
            print(f"[dropbox] synced opus assets -> {opus_assets_target} ({opus_assets_count} files)")

            # Timeline
            timeline_extract_dir = tmp_dir / "timeline"
            timeline_zip, _ = download_zip_with_fallback(access_token, timeline_candidates, "timeline")
            extract_zip_bytes(timeline_zip, timeline_extract_dir)
            flatten_single_named_subdir(timeline_extract_dir, "content")
            flatten_single_named_subdir(timeline_extract_dir, "timeline")
            markdown_count = sync_timeline_markdown(timeline_extract_dir, timeline_markdown_target)
            flatten_single_named_subdir(timeline_markdown_target, "content")
            flatten_single_named_subdir(timeline_markdown_target, "timeline")
            if markdown_count == 0:
                print(
                    f"[dropbox] warning: no markdown files found in Dropbox timeline path; "
                    f"continuing with empty {timeline_markdown_target}"
                )
            else:
                print(f"[dropbox] synced timeline markdown -> {timeline_markdown_target} ({markdown_count} files)")

            copied_assets = copy_timeline_assets(timeline_extract_dir, timeline_assets_target)
            normalize_timeline_assets_nesting(timeline_assets_target)
            print(f"[dropbox] synced timeline assets -> {timeline_assets_target} ({copied_assets} files)")

        return 0
    except Exception as exc:  # noqa: BLE001
        print(f"[dropbox] ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
