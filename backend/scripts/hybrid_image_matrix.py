from __future__ import annotations

import argparse
import html
import json
import mimetypes
import sys
import time
from pathlib import Path
from typing import Any, Dict, Iterable, Optional
from urllib.parse import quote

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.services.gemini_vision_service import gemini_vision_service
from app.services.pollution_image_service import pollution_image_service
from app.services.severity_service import severity_service


ROOT_DIR = Path(__file__).resolve().parents[2]
IMAGES_DIR = ROOT_DIR / "images"
OUTPUTS_DIR = ROOT_DIR / "outputs"
DOCS_DIR = ROOT_DIR / "docs"
DETAIL_JSON = OUTPUTS_DIR / "hybrid_image_severity_matrix.json"
REPORT_MD = DOCS_DIR / "hybrid_image_severity_matrix.md"
REPORT_HTML = DOCS_DIR / "hybrid_image_severity_matrix.html"


VISUAL_CATEGORIES = {
    "smoke": "Air Pollution - smoke",
    "dust_haze": "Air Pollution - dust haze",
    "garbage_accumulation": "Waste Management - garbage accumulation",
    "water_contamination": "Water Contamination",
    "wastewater_sewerage": "Wastewater / Sewerage",
}


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".bmp", ".tif", ".tiff"}


def main() -> int:
    args = _parse_args()
    OUTPUTS_DIR.mkdir(exist_ok=True)
    DOCS_DIR.mkdir(exist_ok=True)

    cache = _load_cache()
    image_paths = sorted(
        path
        for path in IMAGES_DIR.iterdir()
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
    )

    report_rows = []
    total = len(image_paths) * len(VISUAL_CATEGORIES)
    completed = 0

    for image_path in image_paths:
        image_key = image_path.name
        cache.setdefault(image_key, {})

        for image_type, category_hint in VISUAL_CATEGORIES.items():
            if image_type in cache[image_key] and not (
                args.retry_failures and _has_failure(cache[image_key][image_type])
            ):
                completed += 1
                print(f"[{completed}/{total}] cached {image_key} :: {image_type}")
                continue

            print(f"[{completed + 1}/{total}] analyzing {image_key} :: {image_type}")
            cache[image_key][image_type] = _analyze_one(
                image_path=image_path,
                image_type=image_type,
                category_hint=category_hint,
                sleep_seconds=args.sleep_seconds,
                rate_limit_sleep_seconds=args.rate_limit_sleep_seconds,
                max_retries=args.max_retries,
            )
            completed += 1
            _write_json(cache)

        report_rows.append(_row_from_cache(image_path, cache[image_key]))

    _write_markdown(report_rows, cache)
    _write_html(report_rows, cache)
    _write_json(cache)

    print(f"Wrote {REPORT_MD}")
    print(f"Wrote {REPORT_HTML}")
    print(f"Wrote {DETAIL_JSON}")
    return 0


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate hybrid Gemini/OpenCV image severity matrix reports.",
    )
    parser.add_argument(
        "--retry-failures",
        action="store_true",
        help="Retry only cached failed cells. Successful cached cells are reused.",
    )
    parser.add_argument(
        "--sleep-seconds",
        type=float,
        default=4.0,
        help="Delay before each live Gemini call. Cached cells do not sleep. Default: 4.",
    )
    parser.add_argument(
        "--rate-limit-sleep-seconds",
        type=float,
        default=75.0,
        help="Delay before retrying after Gemini returns quota/rate-limit errors. Default: 75.",
    )
    parser.add_argument(
        "--max-retries",
        type=int,
        default=2,
        help="Maximum Gemini retries for a rate-limited cell. Default: 2.",
    )
    return parser.parse_args()


def _analyze_one(
    image_path: Path,
    image_type: str,
    category_hint: str,
    sleep_seconds: float,
    rate_limit_sleep_seconds: float,
    max_retries: int,
) -> Dict[str, Any]:
    try:
        content = image_path.read_bytes()
        mime_type = _mime_type(image_path)
        opencv_analysis = pollution_image_service.detect_pollution(
            content,
            category_name=category_hint,
        )
        gemini_analysis = None
        gemini_attempts = 0
        for attempt in range(max(0, max_retries) + 1):
            gemini_attempts = attempt + 1
            if sleep_seconds > 0:
                time.sleep(sleep_seconds)
            gemini_analysis = gemini_vision_service.analyze_image(
                image_content=content,
                mime_type=mime_type,
                category_name=category_hint,
                local_analysis=opencv_analysis,
            )
            if gemini_analysis:
                break
            if not _is_rate_limited(gemini_vision_service.last_error):
                break
            if attempt >= max_retries:
                break
            print(
                "Gemini rate limit hit; sleeping "
                f"{rate_limit_sleep_seconds:.1f}s before retry "
                f"{attempt + 2}/{max_retries + 1}..."
            )
            time.sleep(max(0.0, rate_limit_sleep_seconds))

        evidence_input = dict(opencv_analysis)
        if gemini_analysis:
            evidence_input["gemini_analysis"] = gemini_analysis

        evidence = severity_service.evaluate_image_evidence(
            image_analysis=evidence_input,
            category_name=category_hint,
            requested_type=image_type,
        )

        return {
            "requested_type": image_type,
            "category_hint": category_hint,
            "final_hybrid_score": evidence["hybrid_image_score"],
            "image_relevant": evidence["image_relevant"],
            "gate_reason": evidence["gate_reason"],
            "opencv_raw_score": evidence["opencv_raw_score"],
            "opencv_dominant_type": evidence["opencv_dominant_type"],
            "opencv_agrees_with_gemini": evidence["opencv_agrees_with_gemini"],
            "gemini_returned": bool(gemini_analysis),
            "gemini_pollution_type": evidence["gemini_pollution_type"],
            "gemini_confidence_score": evidence["gemini_confidence_score"],
            "gemini_severity_score": evidence["gemini_severity_score"],
            "gemini_skipped_reason": None if gemini_analysis else gemini_vision_service.last_error,
            "gemini_attempts": gemini_attempts,
        }
    except Exception as exc:
        return {
            "requested_type": image_type,
            "category_hint": category_hint,
            "final_hybrid_score": None,
            "image_relevant": False,
            "gate_reason": "Analysis failed.",
            "error": f"{exc.__class__.__name__}: {exc}",
        }


def _row_from_cache(image_path: Path, image_results: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    scores = {}
    best_type: Optional[str] = None
    best_score = -1.0

    for image_type in VISUAL_CATEGORIES:
        result = image_results.get(image_type, {})
        scores[image_type] = result
        score = result.get("final_hybrid_score")
        if (
            not _has_failure(result)
            and isinstance(score, (int, float))
            and score > 0
            and score > best_score
        ):
            best_score = float(score)
            best_type = image_type

    return {
        "image": image_path.name,
        "scores": scores,
        "best_type": best_type or "none",
        "best_score": best_score if best_score >= 0 else None,
    }


def _write_markdown(rows: Iterable[Dict[str, Any]], cache: Dict[str, Any]) -> None:
    stats = _cache_stats(cache)
    headers = [
        "Image",
        "Smoke",
        "Dust/Haze",
        "Garbage",
        "Water",
        "Wastewater",
        "Best Match",
    ]
    lines = [
        "# Hybrid Image Severity Matrix",
        "",
        "Gemini is treated as the semantic source of truth. OpenCV is used only as a corroborating visual signal.",
        "",
        f"Coverage: `{stats['gemini_success']}/{stats['total']}` category checks returned usable Gemini results. "
        f"`{stats['quota_failures']}` checks hit Gemini quota/rate limits.",
        "",
        "A score of `0.00` means Gemini returned successfully and did not verify that image as the requested pollution type. "
        "`QTA` means Gemini quota/rate limit blocked that cell. `ERR` means local analysis failed.",
        "",
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]

    for row in rows:
        image_name = row["image"]
        image_link = (
            f'<img src="{_relative_image_link(image_name)}" alt="{_escape_attr(image_name)}" '
            f'width="120"><br>{_escape_cell(image_name)}'
        )
        scores = row["scores"]
        best = row["best_type"]
        best_score = _format_score(row["best_score"])
        if best != "none":
            best = f"{best} ({best_score})"

        lines.append(
            "| "
            + " | ".join(
                [
                    image_link,
                    _format_result(scores["smoke"]),
                    _format_result(scores["dust_haze"]),
                    _format_result(scores["garbage_accumulation"]),
                    _format_result(scores["water_contamination"]),
                    _format_result(scores["wastewater_sewerage"]),
                    best,
                ]
            )
            + " |"
        )

    lines.extend(
        [
            "",
            "## Notes",
            "",
            "- Detailed per-image raw OpenCV and Gemini fields are stored in `outputs/hybrid_image_severity_matrix.json`.",
            "- `noise_pollution` is excluded because still images cannot verify noise.",
            "- `other` is excluded from the comparison table because it is a fallback bucket, not a visual pollution class.",
            "- Gemini failures are recorded in the JSON as `gemini_skipped_reason`.",
            "",
            "## Gemini Failures",
            "",
        ]
    )

    failures = []
    for image_name, image_results in cache.items():
        for image_type, result in image_results.items():
            reason = result.get("gemini_skipped_reason") or result.get("error")
            if reason:
                failures.append((image_name, image_type, reason))

    if failures:
        lines.append("| Image | Category | Reason |")
        lines.append("| --- | --- | --- |")
        for image_name, image_type, reason in failures:
            lines.append(f"| {image_name} | {image_type} | {_escape_cell(str(reason)[:180])} |")
    else:
        lines.append("No Gemini/API failures were recorded.")

    REPORT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")


def _write_html(rows: Iterable[Dict[str, Any]], cache: Dict[str, Any]) -> None:
    rows = list(rows)
    stats = _cache_stats(cache)
    score_headers = [
        ("smoke", "Smoke"),
        ("dust_haze", "Dust/Haze"),
        ("garbage_accumulation", "Garbage"),
        ("water_contamination", "Water"),
        ("wastewater_sewerage", "Wastewater"),
    ]

    table_rows = []
    for row in rows:
        image_name = row["image"]
        image_src = _relative_image_link(image_name)
        score_cells = []
        for image_type, _label in score_headers:
            result = row["scores"][image_type]
            score_cells.append(_html_score_cell(result))

        best = row["best_type"]
        if best != "none":
            best = f"{best}<span>{_format_score(row['best_score'])}</span>"
        else:
            best = "none"

        table_rows.append(
            "<tr>"
            f'<td class="image-cell"><img src="{html.escape(image_src)}" '
            f'alt="{html.escape(image_name)}"><div>{html.escape(image_name)}</div></td>'
            + "".join(score_cells)
            + f'<td class="best-cell">{best}</td>'
            "</tr>"
        )

    failures = []
    for image_name, image_results in cache.items():
        for image_type, result in image_results.items():
            reason = result.get("gemini_skipped_reason") or result.get("error")
            if reason:
                failures.append((image_name, image_type, str(reason)))

    failure_html = '<p class="muted">No Gemini/API failures were recorded.</p>'
    if failures:
        failure_rows = []
        for image_name, image_type, reason in failures:
            failure_rows.append(
                "<tr>"
                f"<td>{html.escape(image_name)}</td>"
                f"<td>{html.escape(image_type)}</td>"
                f"<td>{html.escape(reason[:260])}</td>"
                "</tr>"
            )
        failure_html = (
            '<table class="failure-table">'
            "<thead><tr><th>Image</th><th>Category</th><th>Reason</th></tr></thead>"
            f"<tbody>{''.join(failure_rows)}</tbody></table>"
        )

    html_text = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Hybrid Image Severity Matrix</title>
  <style>
    :root {{
      color-scheme: light;
      --bg: #f6f7f9;
      --panel: #ffffff;
      --text: #18202a;
      --muted: #657180;
      --border: #d8dee8;
      --good: #0f766e;
      --warn: #b45309;
      --bad: #b91c1c;
      --zero: #6b7280;
      --head: #eef2f7;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      background: var(--bg);
      color: var(--text);
    }}
    main {{
      max-width: 1440px;
      margin: 0 auto;
      padding: 28px;
    }}
    h1 {{
      margin: 0 0 8px;
      font-size: 28px;
      letter-spacing: 0;
    }}
    h2 {{
      margin: 28px 0 12px;
      font-size: 18px;
      letter-spacing: 0;
    }}
    p {{
      margin: 8px 0;
      line-height: 1.5;
    }}
    .muted {{ color: var(--muted); }}
    .stats {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 10px;
      margin: 18px 0;
    }}
    .stat {{
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
    }}
    .stat strong {{
      display: block;
      font-size: 24px;
      margin-bottom: 3px;
    }}
    .table-wrap {{
      overflow-x: auto;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 8px;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
    }}
    th, td {{
      border-bottom: 1px solid var(--border);
      padding: 10px;
      text-align: center;
      vertical-align: middle;
      font-size: 14px;
    }}
    th {{
      position: sticky;
      top: 0;
      z-index: 1;
      background: var(--head);
      font-weight: 700;
    }}
    .image-cell {{
      min-width: 190px;
      text-align: left;
      font-weight: 600;
    }}
    .image-cell img {{
      display: block;
      width: 150px;
      height: 105px;
      object-fit: cover;
      border: 1px solid var(--border);
      border-radius: 6px;
      margin-bottom: 8px;
      background: #fff;
    }}
    .image-cell div {{
      max-width: 240px;
      overflow-wrap: anywhere;
      color: var(--muted);
      font-weight: 500;
    }}
    .score {{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 58px;
      height: 30px;
      border-radius: 999px;
      font-weight: 700;
      border: 1px solid transparent;
    }}
    .score.high {{ color: #fff; background: var(--bad); }}
    .score.mid {{ color: #fff; background: var(--warn); }}
    .score.low {{ color: #fff; background: var(--good); }}
    .score.zero {{ color: var(--zero); background: #f3f4f6; border-color: var(--border); }}
    .score.fail {{ color: #fff; background: #4b5563; }}
    .best-cell {{
      min-width: 150px;
      font-weight: 700;
    }}
    .best-cell span {{
      display: block;
      color: var(--muted);
      font-weight: 500;
      margin-top: 4px;
    }}
    .failure-table td, .failure-table th {{
      text-align: left;
    }}
    .legend {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 14px 0 18px;
    }}
    .legend span {{
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 6px 10px;
      color: var(--muted);
      font-size: 13px;
    }}
  </style>
</head>
<body>
  <main>
    <h1>Hybrid Image Severity Matrix</h1>
    <p>Gemini is treated as the semantic source of truth. OpenCV is used only as a corroborating visual signal.</p>
    <div class="stats">
      <div class="stat"><strong>{stats['total']}</strong><span>Total category checks</span></div>
      <div class="stat"><strong>{stats['gemini_success']}</strong><span>Usable Gemini results</span></div>
      <div class="stat"><strong>{stats['quota_failures']}</strong><span>Quota/rate-limit cells</span></div>
      <div class="stat"><strong>{stats['nonzero_scores']}</strong><span>Verified non-zero scores</span></div>
    </div>
    <div class="legend">
      <span>0.00 = Gemini rejected that category</span>
      <span>QTA = Gemini quota/rate limit</span>
      <span>ERR = local analysis failed</span>
      <span>Noise excluded: still images cannot verify sound</span>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Image</th>
            <th>Smoke</th>
            <th>Dust/Haze</th>
            <th>Garbage</th>
            <th>Water</th>
            <th>Wastewater</th>
            <th>Best Match</th>
          </tr>
        </thead>
        <tbody>
          {''.join(table_rows)}
        </tbody>
      </table>
    </div>
    <h2>Failure Details</h2>
    {failure_html}
  </main>
</body>
</html>
"""
    REPORT_HTML.write_text(html_text, encoding="utf-8")


def _load_cache() -> Dict[str, Any]:
    if not DETAIL_JSON.exists():
        return {}
    try:
        loaded = json.loads(DETAIL_JSON.read_text(encoding="utf-8"))
        return loaded if isinstance(loaded, dict) else {}
    except json.JSONDecodeError:
        return {}


def _write_json(cache: Dict[str, Any]) -> None:
    DETAIL_JSON.write_text(json.dumps(cache, indent=2), encoding="utf-8")


def _mime_type(image_path: Path) -> str:
    guessed, _ = mimetypes.guess_type(image_path.name)
    if guessed:
        return guessed
    if image_path.suffix.lower() in {".jpg", ".jpeg"}:
        return "image/jpeg"
    if image_path.suffix.lower() == ".png":
        return "image/png"
    if image_path.suffix.lower() == ".webp":
        return "image/webp"
    return "image/jpeg"


def _relative_image_link(image_name: str) -> str:
    return "../images/" + quote(image_name)


def _format_score(value: Any) -> str:
    if isinstance(value, (int, float)):
        return f"{float(value):.2f}"
    return "ERR"


def _format_result(result: Dict[str, Any]) -> str:
    if not result:
        return "ERR"
    if result.get("error"):
        return "ERR"
    reason = str(result.get("gemini_skipped_reason") or "")
    if reason:
        if "429" in reason or "quota" in reason.lower():
            return "QTA"
        return "ERR"
    return _format_score(result.get("final_hybrid_score"))


def _html_score_cell(result: Dict[str, Any]) -> str:
    text = _format_result(result)
    css_class = "fail"
    title = ""
    if text == "QTA":
        title = "Gemini quota/rate limit blocked this cell."
    elif text == "ERR":
        title = str(result.get("error") or result.get("gemini_skipped_reason") or "Analysis failed.")
    else:
        score = float(result.get("final_hybrid_score") or 0.0)
        title = (
            f"Gemini: {result.get('gemini_pollution_type')} "
            f"severity={result.get('gemini_severity_score')} "
            f"confidence={result.get('gemini_confidence_score')}; "
            f"OpenCV: {result.get('opencv_dominant_type')} "
            f"raw={result.get('opencv_raw_score')}"
        )
        if score <= 0:
            css_class = "zero"
        elif score < 50:
            css_class = "low"
        elif score < 75:
            css_class = "mid"
        else:
            css_class = "high"
    return (
        f'<td title="{html.escape(title)}">'
        f'<span class="score {css_class}">{html.escape(text)}</span>'
        "</td>"
    )


def _has_failure(result: Dict[str, Any]) -> bool:
    return bool(result.get("error") or result.get("gemini_skipped_reason"))


def _is_rate_limited(error: Optional[str]) -> bool:
    if not error:
        return False
    normalized = error.lower()
    return "429" in normalized or "quota" in normalized or "rate" in normalized


def _cache_stats(cache: Dict[str, Any]) -> Dict[str, int]:
    total = 0
    gemini_success = 0
    quota_failures = 0
    nonzero_scores = 0
    for image_results in cache.values():
        for result in image_results.values():
            total += 1
            if result.get("gemini_returned"):
                gemini_success += 1
            score = result.get("final_hybrid_score")
            if isinstance(score, (int, float)) and score > 0:
                nonzero_scores += 1
            reason = str(result.get("gemini_skipped_reason") or result.get("error") or "")
            if "429" in reason or "quota" in reason.lower():
                quota_failures += 1
    return {
        "total": total,
        "gemini_success": gemini_success,
        "quota_failures": quota_failures,
        "nonzero_scores": nonzero_scores,
    }


def _escape_cell(value: str) -> str:
    return value.replace("|", "\\|").replace("\n", " ")


def _escape_attr(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace('"', "&quot;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


if __name__ == "__main__":
    raise SystemExit(main())
