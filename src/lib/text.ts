// 마크다운 본문에서 평문 발췌
export function excerpt(body: string | undefined, n = 160): string {
  if (!body) return '';
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, n);
}

export function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// 태그 URL 슬러그 (한글 유지, 공백→-)
export function tagSlug(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, '-');
}
