#!/usr/bin/env python3
"""빌드 타임 검색 색인 생성기.
src/content/*.md 를 읽어 프런트매터 + 평문 본문을 뽑고, kiwi 형태소로 토큰화해
static/search-index.json 으로 떨군다. (검색은 브라우저에서 FlexSearch가 수행)

- draft:true / category 없는 글은 제외
- tokens: 조사·어미·기호 제거한 형태소 form (어간 추출 포함), 문서별 중복 제거
"""
import json
import os
import re
import glob

from kiwipiepy import Kiwi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "src", "posts")
OUT = os.path.join(ROOT, "public", "search-index.json")

kiwi = Kiwi()

# 색인에서 뺄 품사: 조사(J*), 어미(E*), 기호(S* 중 일부), 접사 일부
DROP_PREFIX = ("J", "E", "XS")
DROP_EXACT = {"SF", "SP", "SS", "SE", "SO", "SW", "SB"}  # 문장부호류 (SL 외국어/SN 숫자/SH 한자는 유지)


def parse_frontmatter(text):
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", text, re.S)
    if not m:
        return {}, text
    fm_raw, body = m.group(1), m.group(2)
    fm = {}
    for line in fm_raw.splitlines():
        mm = re.match(r"^([A-Za-z0-9_]+):\s*(.*)$", line)
        if not mm:
            continue
        key, val = mm.group(1), mm.group(2).strip()
        fm[key] = val
    return fm, body


def parse_tags(val):
    # tags: ["a", "b"] 형태
    if not val:
        return []
    try:
        return [str(t) for t in json.loads(val)]
    except Exception:
        return [t.strip().strip('"\'') for t in val.strip("[]").split(",") if t.strip()]


def strip_markdown(md):
    s = md
    s = re.sub(r"```.*?```", " ", s, flags=re.S)        # 코드펜스
    s = re.sub(r"`[^`]*`", " ", s)                        # 인라인코드
    s = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", s)           # 이미지
    s = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", s)        # 링크 → 텍스트만
    s = re.sub(r"<[^>]+>", " ", s)                         # html 태그
    s = re.sub(r"[#>*_~|\-]+", " ", s)                     # 마크다운 기호
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def tokenize(text):
    forms = []
    seen = set()
    for tok in kiwi.tokenize(text):
        tag = tok.tag
        if tag.startswith(DROP_PREFIX) or tag in DROP_EXACT:
            continue
        f = tok.form.strip().lower()
        if len(f) < 1 or f in seen:
            continue
        seen.add(f)
        forms.append(f)
    return forms


def main():
    docs = []
    files = sorted(glob.glob(os.path.join(CONTENT, "*.md")))
    skipped = 0
    for path in files:
        with open(path, encoding="utf-8") as f:
            raw = f.read()
        fm, body = parse_frontmatter(raw)
        if fm.get("draft", "").lower() == "true":
            skipped += 1
            continue
        if not fm.get("category"):
            skipped += 1
            continue

        slug = "/" + os.path.splitext(os.path.basename(path))[0] + "/"
        title = fm.get("title", "").strip().strip('"\'')
        tags = parse_tags(fm.get("tags", ""))
        category = fm.get("category", "").strip().strip('"\'')
        series = fm.get("series", "").strip().strip('"\'')
        date = fm.get("date", "").strip().strip('"\'')[:10]

        plain = strip_markdown(body)
        excerpt = plain[:160]
        # 형태소 토큰 = 제목 + 태그 + 본문
        tokens = tokenize(" ".join([title, " ".join(tags), plain]))

        docs.append({
            "slug": slug,
            "title": title,
            "tags": tags,
            "category": category,
            "series": series,
            "date": date,
            "excerpt": excerpt,
            "text": plain.lower(),
            "tokens": " ".join(tokens),
        })

    # 최신순
    docs.sort(key=lambda d: d["date"], reverse=True)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(docs, f, ensure_ascii=False)

    size_kb = os.path.getsize(OUT) / 1024
    print(f"색인 완료: {len(docs)}편 (제외 {skipped}) → {OUT} ({size_kb:.0f} KB)")


if __name__ == "__main__":
    main()
