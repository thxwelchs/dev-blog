import { Link } from 'gatsby';
import * as React from 'react';
import { css } from '@emotion/core';
import Helmet from 'react-helmet';

import IndexLayout from '../layouts';
import Wrapper from '../components/Wrapper';
import SiteNav from '../components/header/SiteNav';
import Footer from '../components/Footer';
import { SiteHeader, outer, inner, SiteMain } from '../styles/shared';
import { PostFullHeader, PostFullTitle, NoImage, PostFull } from '../templates/post';
import { PostFullContent } from '../components/PostContent';

const PageTemplate = css`
  .site-main {
    background: #fff;
    padding-bottom: 4vw;
  }
`;

const SearchBox = css`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 6px 0 4px;

  input {
    flex: 1 1 auto;
    padding: 14px 18px;
    border: 1px solid #d9dde2;
    border-radius: 10px;
    font-size: 1.7rem;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  input:focus {
    border-color: #3b6ee0;
    box-shadow: 0 0 0 3px rgba(59, 110, 224, 0.15);
  }
`;

const Hint = css`
  margin: 10px 2px 0;
  color: #9aa0a8;
  font-size: 1.4rem;
`;

const ResultList = css`
  margin: 22px 0 0;
  padding: 0;
  list-style: none;

  li {
    margin: 0;
    padding: 18px 2px;
    border-bottom: 1px solid #eef0f2;
  }

  li:last-of-type {
    border-bottom: none;
  }

  a.title {
    display: inline-block;
    margin-bottom: 6px;
    color: #15171a;
    font-size: 1.9rem;
    font-weight: 600;
    text-decoration: none;
  }

  a.title:hover {
    color: #3b6ee0;
  }

  .badges {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-left: 10px;
    vertical-align: middle;
  }

  .badge {
    padding: 2px 9px;
    border-radius: 12px;
    font-size: 1.15rem;
    font-weight: 600;
    line-height: 1.7;
  }

  .badge.cat {
    background: #eef1f6;
    color: #5a616b;
  }

  .badge.series {
    background: #e7effd;
    color: #3b6ee0;
  }

  .excerpt {
    margin: 4px 0 0;
    color: #5a616b;
    font-size: 1.5rem;
    line-height: 1.6;
  }

  .date {
    margin-top: 6px;
    color: #aab0b8;
    font-size: 1.3rem;
    font-variant-numeric: tabular-nums;
  }

  mark {
    background: #fff1a8;
    color: inherit;
    padding: 0 1px;
    border-radius: 2px;
  }
`;

interface Doc {
  slug: string;
  title: string;
  tags: string[];
  category: string;
  series: string;
  date: string;
  excerpt: string;
  text: string;
  tokens: string;
}

function highlight(text: string, q: string): React.ReactNode {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

// 본문에서 검색어 주변 문맥을 잘라 스니펫으로
function snippet(doc: Doc, q: string): string {
  if (!q) return doc.excerpt;
  const i = doc.text.indexOf(q.toLowerCase());
  if (i === -1) return doc.excerpt;
  const start = Math.max(0, i - 40);
  return (start > 0 ? '…' : '') + doc.text.slice(start, start + 160);
}

interface SearchPageProps {
  location: { search: string };
}

const SearchPage: React.FC<SearchPageProps> = ({ location }) => {
  const initial =
    typeof window !== 'undefined'
      ? new URLSearchParams(location.search).get('q') || ''
      : '';

  const [query, setQuery] = React.useState(initial);
  const [docs, setDocs] = React.useState<Doc[]>([]);
  const indexRef = React.useRef<any>(null);
  const mapRef = React.useRef<{ [slug: string]: Doc }>({});
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    fetch('/search-index.json')
      .then(r => r.json())
      .then((data: Doc[]) => {
        if (!alive) return;
        // FlexSearch는 브라우저에서만 (SSR 회피)
        const FlexSearch = require('flexsearch');
        const index = new FlexSearch.Document({
          tokenize: 'forward',
          document: {
            id: 'slug',
            index: ['title', 'tokens', 'tags', 'text'],
          },
        });
        const map: { [slug: string]: Doc } = {};
        data.forEach(d => {
          map[d.slug] = d;
          index.add({
            slug: d.slug,
            title: d.title,
            tokens: d.tokens,
            tags: d.tags.join(' '),
            text: d.text,
          });
        });
        indexRef.current = index;
        mapRef.current = map;
        setDocs(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  const results: Doc[] = React.useMemo(() => {
    const q = query.trim();
    if (!q || !indexRef.current) return [];
    // 필드 우선순위(title > tokens > tags > text)대로 합치고 중복 제거
    const hits = indexRef.current.search(q, { limit: 60 });
    const order: string[] = [];
    const seen = new Set<string>();
    ['title', 'tokens', 'tags', 'text'].forEach(field => {
      const group = hits.find((h: any) => h.field === field);
      if (group) {
        group.result.forEach((slug: string) => {
          if (!seen.has(slug)) {
            seen.add(slug);
            order.push(slug);
          }
        });
      }
    });
    return order.map(slug => mapRef.current[slug]).filter(Boolean);
  }, [query, loaded]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    if (typeof window !== 'undefined') {
      const url = v.trim() ? `/search/?q=${encodeURIComponent(v.trim())}` : '/search/';
      window.history.replaceState({}, '', url);
    }
  };

  const q = query.trim();

  return (
    <IndexLayout>
      <Helmet>
        <title>Search</title>
      </Helmet>
      <Wrapper css={PageTemplate}>
        <header css={[outer, SiteHeader]}>
          <div css={inner}>
            <SiteNav />
          </div>
        </header>
        <main id="site-main" className="site-main" css={[SiteMain, outer]}>
          <article className="post page" css={[PostFull, NoImage]}>
            <PostFullHeader>
              <PostFullTitle>Search</PostFullTitle>
            </PostFullHeader>

            <PostFullContent className="post-full-content">
              <div className="post-content">
                <div css={SearchBox}>
                  <input
                    type="search"
                    autoFocus
                    placeholder="제목·내용·태그로 검색…"
                    value={query}
                    onChange={onChange}
                  />
                </div>

                {!q && (
                  <p css={Hint}>
                    {loaded ? `${docs.length}개의 글에서 검색합니다.` : '색인 불러오는 중…'}
                  </p>
                )}

                {q && (
                  <p css={Hint}>
                    "{q}" 검색 결과 {results.length}건
                  </p>
                )}

                <ul css={ResultList}>
                  {results.map(d => (
                    <li key={d.slug}>
                      <Link className="title" to={d.slug}>
                        {highlight(d.title, q)}
                      </Link>
                      <span className="badges">
                        {d.category && <span className="badge cat">{d.category}</span>}
                        {d.series && <span className="badge series">{d.series}</span>}
                      </span>
                      <p className="excerpt">{highlight(snippet(d, q), q)}</p>
                      <div className="date">{d.date}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </PostFullContent>
          </article>
        </main>
        <Footer />
      </Wrapper>
    </IndexLayout>
  );
};

export default SearchPage;
