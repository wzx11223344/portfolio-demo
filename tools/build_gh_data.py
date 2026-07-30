#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build assets/gh-data.js from REAL GitHub repo metadata via the `gh` CLI.

Why build-time (not client fetch):
  - Avoids GitHub API rate limits on every page load (anonymous ~5/60, even
    authed 5000/hr is wasteful for a static site).
  - No CORS, offline-friendly, zero runtime dependency.
  - Single source of truth, no fabricated numbers.

Output: window.GH_DATA = { "<slug>": { branch, pushed_at, created_at, stars,
         license, language, description, total_commits, commits[], tree[] } }

Run locally (after `gh auth login`) or in CI (GH_TOKEN set):
  python tools/build_gh_data.py
"""
import json
import os
import subprocess
import sys

OWNER = "wzx11223344"
REPOS = [
    "pyconometrics", "quantlab", "dsgepy", "macrodatahub", "policysim",
    "city-compare", "express-consumption", "causal-inference-ml",
    "mcp-financial-data", "econ-dashboard", "smart-factory-dashboard",
]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "gh-data.js")


def gh(args):
    """Call `gh api` and return parsed JSON. Raises on failure."""
    cmd = ["gh", "api"] + args
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError("gh failed: %s\n%s" % (" ".join(cmd), p.stderr.strip()))
    return json.loads(p.stdout)


def gh_headers(args):
    """Call `gh api -i` and return (headers_dict, parsed_json_body)."""
    cmd = ["gh", "api", "-i"] + args
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError("gh failed: %s\n%s" % (" ".join(cmd), p.stderr.strip()))
    raw = p.stdout
    head, _, body = raw.partition("\n\n")
    headers = {}
    for line in head.splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            headers[k.strip().lower()] = v.strip()
    return headers, json.loads(body)


def build_tree(items):
    """Flatten GitHub tree[] (path strings) into a nested {name,type,children,size?} tree."""
    root = {"type": "tree", "name": "", "children": []}
    dirs = {"": root}
    for it in items:
        parts = it["path"].split("/")
        parent = root
        cur = ""
        for i, part in enumerate(parts):
            last = (i == len(parts) - 1)
            if last:
                node = {"type": it["type"], "name": part}
                if it["type"] == "blob":
                    node["size"] = it.get("size", 0)
                parent["children"].append(node)
            else:
                nxt = part if cur == "" else cur + "/" + part
                if nxt not in dirs:
                    nd = {"type": "tree", "name": part, "children": []}
                    dirs[nxt] = nd
                    parent["children"].append(nd)
                parent = dirs[nxt]
                cur = nxt
    return root["children"]


def fetch_repo(slug):
    repo = gh(["repos/%s/%s" % (OWNER, slug)])
    branch = repo.get("default_branch", "main")
    # commits (latest first). These repos are small; per_page=100 captures all.
    commits_raw = gh(["repos/%s/%s/commits?per_page=100" % (OWNER, slug)])
    commits = []
    for c in commits_raw:
        cm = c.get("commit", {})
        commits.append({
            "date": (cm.get("committer", {}) or {}).get("date", "")[:10],
            "sha": c.get("sha", "")[:7],
            "msg": (cm.get("message") or "").split("\n")[0][:120],
            "url": c.get("html_url", ""),
        })
    # file tree (recursive)
    try:
        tree_resp = gh(["repos/%s/%s/git/trees/%s?recursive=1" % (OWNER, slug, branch)])
        tree = build_tree(tree_resp.get("tree", []))
    except RuntimeError:
        tree = []
    return {
        "branch": branch,
        "pushed_at": repo.get("pushed_at", ""),
        "created_at": repo.get("created_at", ""),
        "stars": repo.get("stargazers_count", 0),
        "license": (repo.get("license") or {}).get("spdx_id") or "NOASSERTION",
        "language": repo.get("language") or "",
        "description": repo.get("description") or "",
        "total_commits": len(commits),
        "commits": commits,
        "tree": tree,
    }


def main():
    if subprocess.run(["gh", "auth", "status"], capture_output=True, text=True).returncode != 0:
        sys.stderr.write("ERROR: `gh` CLI not authenticated. Run `gh auth login` first.\n")
        sys.exit(1)
    data = {}
    for slug in REPOS:
        try:
            data[slug] = fetch_repo(slug)
            print("  ok  %-22s stars=%s commits=%d" % (slug, data[slug]["stars"], data[slug]["total_commits"]))
        except Exception as e:
            sys.stderr.write("  WARN %s: %s\n" % (slug, e))
            data[slug] = {"error": str(e)}
    header = (
        "/* GitHub real repo data - fetched via `gh api` (authenticated). No fabrication.\n"
        "   Generated build artifact. Safe to commit; static, offline-friendly.\n"
        "   Rebuild with: python tools/build_gh_data.py */\n"
    )
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(header)
        f.write("window.GH_DATA = ")
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write(";\n")
    print("Wrote %s (%d repos)" % (OUT, len(data)))


if __name__ == "__main__":
    main()
