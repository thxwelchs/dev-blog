import { graphql, Link } from 'gatsby';
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

const SeriesGrid = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 30px;
  margin-top: 12px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const SeriesCard = css`
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 1px 3px rgba(39, 44, 49, 0.08), 0 0 1px rgba(39, 44, 49, 0.06);
  transition: box-shadow 0.25s, transform 0.25s;

  :hover {
    box-shadow: 0 16px 36px rgba(39, 44, 49, 0.16);
    transform: translateY(-4px);
  }
`;

const SeriesBanner = css`
  position: relative;
  display: block;
  height: 168px;
  color: #fff;
  text-decoration: none;
  overflow: hidden;

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1);
    transition: transform 0.4s ease;
  }

  :hover img {
    transform: scale(1.06);
  }

  ::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(16, 18, 30, 0.45) 0%,
      rgba(16, 18, 30, 0.7) 50%,
      rgba(16, 18, 30, 0.94) 100%
    );
  }
`;

const BannerInner = css`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
  padding: 18px 22px;

  .count-pill {
    align-self: flex-start;
    margin-bottom: 8px;
    padding: 4px 12px;
    border-radius: 20px;
    background: #3b6ee0;
    color: #fff;
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: 0.3px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  }

  h2 {
    margin: 0;
    color: #fff;
    font-size: 2.3rem;
    line-height: 1.2;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.6);
  }

  .period {
    margin-top: 5px;
    font-size: 1.35rem;
    color: #fff;
    opacity: 0.92;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.55);
  }
`;

const PartList = css`
  margin: 0;
  padding: 8px 10px 12px;
  list-style: none;

  li {
    margin: 0;
    padding: 0;
  }

  li a {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 12px;
    border-radius: 8px;
    color: #353a40;
    text-decoration: none;
    transition: background 0.15s, color 0.15s;
  }

  li a:hover {
    background: #f4f7fe;
    color: #3b6ee0;
  }

  .num {
    flex: 0 0 26px;
    width: 26px;
    height: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #eef1f6;
    color: #79808a;
    font-size: 1.3rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    transition: background 0.15s, color 0.15s;
  }

  li a:hover .num {
    background: #3b6ee0;
    color: #fff;
  }

  .part-title {
    flex: 1 1 auto;
    font-size: 1.55rem;
    line-height: 1.4;
  }

  .chev {
    flex: 0 0 auto;
    color: #c4c9d0;
    font-size: 1.7rem;
    opacity: 0;
    transform: translateX(-4px);
    transition: opacity 0.15s, transform 0.15s;
  }

  li a:hover .chev {
    opacity: 1;
    transform: translateX(0);
    color: #3b6ee0;
  }
`;

interface SeriesNode {
  fields: { slug: string };
  frontmatter: {
    title: string;
    series: string;
    seriesOrder: number;
    userDate: string;
    image?: { childImageSharp?: { fluid?: { src: string } } };
  };
}

interface SeriesPageProps {
  data: {
    allMarkdownRemark: { edges: Array<{ node: SeriesNode }> };
  };
}

// 편 제목에서 중복되는 시리즈명/번호 접두사를 떼어 목록을 깔끔하게
function cleanTitle(seriesName: string, title: string): string {
  let t = title.trim();
  if (t.startsWith(seriesName)) {
    t = t.slice(seriesName.length).trim();
  }
  // 앞쪽의 "- ", ": ", "N편", "N:", "N -" 같은 잔여 마커 제거
  t = t.replace(/^[-:]\s*/, '');
  t = t.replace(/^\d+\s*편\s*[-:]?\s*/, '');
  t = t.replace(/^\d+\s*[-:]\s*/, '');
  t = t.replace(/^[-:]\s*/, '');
  return t || title;
}

const SeriesPage: React.FC<SeriesPageProps> = ({ data }) => {
  // series 이름으로 묶기 (쿼리에서 seriesOrder ASC 정렬됨)
  const groups: { [name: string]: SeriesNode[] } = {};
  data.allMarkdownRemark.edges.forEach(({ node }) => {
    const name = node.frontmatter.series;
    (groups[name] = groups[name] || []).push(node);
  });

  // 최근 활동(마지막 편 날짜)이 빠른 시리즈를 위로
  const series = Object.keys(groups)
    .map(name => {
      const parts = groups[name];
      return {
        name,
        parts,
        cover: parts[0].frontmatter.image?.childImageSharp?.fluid?.src,
        from: parts[0].frontmatter.userDate,
        to: parts[parts.length - 1].frontmatter.userDate,
      };
    })
    .sort((a, b) => (a.to < b.to ? 1 : -1));

  return (
    <IndexLayout>
      <Helmet>
        <title>Series</title>
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
              <PostFullTitle>Series</PostFullTitle>
            </PostFullHeader>

            <PostFullContent className="post-full-content">
              <div className="post-content">
                <div css={SeriesGrid}>
                  {series.map(s => (
                    <div key={s.name} css={SeriesCard}>
                      <Link to={s.parts[0].fields.slug} css={SeriesBanner}>
                        {s.cover && <img src={s.cover} alt={s.name} />}
                        <div css={BannerInner}>
                          <span className="count-pill">SERIES · {s.parts.length}편</span>
                          <h2>{s.name}</h2>
                          <span className="period">
                            {s.from === s.to ? s.from : `${s.from} ~ ${s.to}`}
                          </span>
                        </div>
                      </Link>
                      <ol css={PartList}>
                        {s.parts.map(p => (
                          <li key={p.fields.slug}>
                            <Link to={p.fields.slug}>
                              <span className="num">{p.frontmatter.seriesOrder}</span>
                              <span className="part-title">
                                {cleanTitle(s.name, p.frontmatter.title)}
                              </span>
                              <span className="chev">›</span>
                            </Link>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              </div>
            </PostFullContent>
          </article>
        </main>
        <Footer />
      </Wrapper>
    </IndexLayout>
  );
};

export default SeriesPage;

export const pageQuery = graphql`
  query {
    allMarkdownRemark(
      filter: { frontmatter: { draft: { ne: true }, series: { ne: null } } }
      sort: { fields: [frontmatter___seriesOrder], order: ASC }
    ) {
      edges {
        node {
          fields {
            slug
          }
          frontmatter {
            title
            series
            seriesOrder
            userDate: date(formatString: "YYYY.MM")
            image {
              childImageSharp {
                fluid(maxWidth: 600) {
                  src
                }
              }
            }
          }
        }
      }
    }
  }
`;
