#!/usr/bin/env python3
"""엔지니어링 글 커버 생성기 (표준 포맷).
크림 배경 + 더블 프레임 + 상단 카테고리(· LABEL ·) + 큰 세리프 제목 + 러스트 밑줄 + 하단 도메인.
- 입력: src/posts/*.md (category == "엔지니어링")
- 출력: public/img/covers/eng/<slug>.png  (그리고 각 글 frontmatter의 image: 를 이걸로 갱신)
- 한글 제목은 AppleMyungjo(명조), 영문 제목은 Hoefler Text 로 렌더.
"""
import glob
import os
import re

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSTS = os.path.join(ROOT, "src", "posts")
OUTDIR = os.path.join(ROOT, "public", "img", "covers", "eng")

W, H = 1200, 630
BG = (241, 237, 228)
INK = (40, 39, 42)
BORDER = (43, 42, 42)
BORDER_IN = (158, 158, 152)
RUST = (164, 76, 30)
MUTED = (140, 134, 122)
DOMAIN = "thxwelchs.github.io"

F_TITLE_EN = "/System/Library/Fonts/Supplemental/Hoefler Text.ttc"
F_TITLE_KR = "/System/Library/Fonts/Supplemental/AppleMyungjo.ttf"
F_LABEL = "/System/Library/Fonts/Supplemental/Georgia.ttf"
# Georgia 에는 한글 글리프가 없어 한글 라벨이 두부(□)로 깨진다. 한글이면 명조로 그린다.
F_LABEL_KR = "/System/Library/Fonts/Supplemental/AppleMyungjo.ttf"

# 상단 라벨로 우선 쓰는 기술/언어 태그(소문자 매칭). 없으면 tags[0].
TECH = ["java", "kotlin", "spring", "elasticsearch", "redis", "javascript", "typescript",
        "react", "python", "mqtt", "activemq", "jackson", "webflux", "jvm", "git",
        "시스템 디자인", "코틀린", "자바"]


def has_kr(s):
    return bool(re.search(r"[가-힣]", s))


def parse_fm(text):
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.S)
    if not m:
        return {}
    fm = {}
    for line in m.group(1).splitlines():
        mm = re.match(r"^([A-Za-z0-9_]+):\s*(.*)$", line)
        if mm:
            fm[mm.group(1)] = mm.group(2).strip()
    return fm


def parse_tags(val):
    import json
    try:
        return [str(t) for t in json.loads(val)]
    except Exception:
        return [t.strip().strip("\"'") for t in val.strip("[]").split(",") if t.strip()]


def pick_label(tags, category):
    low = {t.lower(): t for t in tags}
    for t in TECH:
        if t.lower() in low:
            return low[t.lower()]
    return tags[0] if tags else category


def font(path, size):
    return ImageFont.truetype(path, size)


def text_w(d, s, f, tracking=0):
    w = d.textlength(s, font=f)
    if tracking:
        w += tracking * max(0, len(s) - 1)
    return w


def draw_tracked(d, cx, y, s, f, fill, tracking):
    total = text_w(d, s, f, tracking)
    x = cx - total / 2
    for ch in s:
        d.text((x, y), ch, font=f, fill=fill, anchor="lm")
        x += d.textlength(ch, font=f) + tracking


def wrap(d, text, f, maxw):
    words = text.split(" ")
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if d.textlength(trial, font=f) <= maxw or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    # 한 줄이 여전히 너무 길면 글자 단위로 끊기
    fixed = []
    for ln in lines:
        if d.textlength(ln, font=f) <= maxw:
            fixed.append(ln)
            continue
        chunk = ""
        for ch in ln:
            if d.textlength(chunk + ch, font=f) <= maxw or not chunk:
                chunk += ch
            else:
                fixed.append(chunk)
                chunk = ch
        if chunk:
            fixed.append(chunk)
    return fixed


def line_h(f):
    a, de = f.getmetrics()
    return a + de + 12


def fit_title(d, text, fpath, maxw, max_block_h=220):
    # 폭과 블록 높이 둘 다 만족하는 가장 큰 폰트 (최대치 살짝 낮춤)
    size = 76
    while size >= 34:
        f = font(fpath, size)
        lines = wrap(d, text, f, maxw)
        if len(lines) * line_h(f) <= max_block_h:
            return f, lines
        size -= 3
    f = font(fpath, 34)
    return f, wrap(d, text, f, maxw)


def make_cover(title, label, out):
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)

    # 더블 프레임
    d.rectangle([30, 30, W - 30, H - 30], outline=BORDER, width=3)
    d.rectangle([44, 44, W - 44, H - 44], outline=BORDER_IN, width=1)

    cx = W / 2

    # 상단 카테고리(· LABEL ·)
    lab = label.upper() if label.isascii() else label
    lf = font(F_LABEL_KR if has_kr(lab) else F_LABEL, 27)
    track = 8
    lab_w = text_w(d, lab, lf, track)
    dot_gap = 26
    draw_tracked(d, cx, 112, lab, lf, RUST, track)
    dotf = font(F_LABEL, 27)
    d.text((cx - lab_w / 2 - dot_gap, 112), "·", font=dotf, fill=RUST, anchor="mm")
    d.text((cx + lab_w / 2 + dot_gap, 112), "·", font=dotf, fill=RUST, anchor="mm")

    # 제목 (폭+높이 자동 맞춤, 중앙 밴드에 배치)
    tpath = F_TITLE_KR if has_kr(title) else F_TITLE_EN
    tf, lines = fit_title(d, title, tpath, maxw=W - 2 * 150)
    lh = line_h(tf)
    block_h = lh * len(lines)
    cy = 300  # 제목 블록 세로 중심
    ty = cy - block_h / 2 + lh / 2
    for ln in lines:
        d.text((cx, ty), ln, font=tf, fill=INK, anchor="mm")
        ty += lh

    # 러스트 밑줄: 제목 블록 바로 아래(하단 도메인과 겹치지 않게 클램프)
    rule_y = min(int(cy + block_h / 2 + 42), 470)
    d.rectangle([cx - 82, rule_y, cx + 82, rule_y + 4], fill=RUST)

    # 하단 도메인 (고정)
    df = font(F_LABEL, 24)
    d.text((cx, 540), DOMAIN, font=df, fill=MUTED, anchor="mm")

    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out)


def main():
    n = 0
    for path in sorted(glob.glob(os.path.join(POSTS, "*.md"))):
        raw = open(path, encoding="utf-8").read()
        fm = parse_fm(raw)
        if fm.get("category", "").strip().strip("\"'") != "엔지니어링":
            continue
        slug = os.path.splitext(os.path.basename(path))[0]
        title = fm.get("title", "").strip().strip("\"'")
        tags = parse_tags(fm.get("tags", ""))
        label = pick_label(tags, "엔지니어링")
        out = os.path.join(OUTDIR, f"{slug}.png")
        make_cover(title, label, out)

        # frontmatter image 갱신
        rel = f"/img/covers/eng/{slug}.png"
        new = re.sub(r"^image:.*$", f"image: {rel}", raw, count=1, flags=re.M)
        if new != raw:
            open(path, "w", encoding="utf-8").write(new)
        n += 1
    print(f"커버 생성: {n}편 → {OUTDIR}")


if __name__ == "__main__":
    main()
