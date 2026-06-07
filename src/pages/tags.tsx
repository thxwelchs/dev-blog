import { graphql, Link } from 'gatsby';
import { kebabCase } from 'lodash';
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

const TagCloud = css`
  display: flex;
  flex-wrap: wrap;
  margin-top: 8px;

  a {
    display: inline-block;
    margin: 0 12px 12px 0;
    padding: 6px 14px;
    border: 1px solid #d9d9d9;
    border-radius: 20px;
    color: #333;
    font-size: 1.5rem;
    text-decoration: none;
    transition: border-color 0.2s, color 0.2s;
  }

  a:hover {
    border-color: #4a7cec;
    color: #4a7cec;
  }

  a .count {
    margin-left: 6px;
    color: #aaa;
    font-size: 1.3rem;
  }
`;

interface TagsPageProps {
  data: {
    allMarkdownRemark: {
      group: Array<{ tag: string; totalCount: number }>;
    };
  };
}

const TagsPage: React.FC<TagsPageProps> = ({ data }) => {
  const tags = [...data.allMarkdownRemark.group].sort((a, b) => b.totalCount - a.totalCount);

  return (
    <IndexLayout>
      <Helmet>
        <title>Tags</title>
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
              <PostFullTitle>Tags</PostFullTitle>
            </PostFullHeader>

            <PostFullContent className="post-full-content">
              <div className="post-content">
                <div css={TagCloud}>
                  {tags.map(t => (
                    <Link key={t.tag} to={`/tags/${kebabCase(t.tag)}/`}>
                      {t.tag}
                      <span className="count">{t.totalCount}</span>
                    </Link>
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

export default TagsPage;

export const pageQuery = graphql`
  query {
    allMarkdownRemark(filter: { frontmatter: { draft: { ne: true } } }) {
      group(field: frontmatter___tags) {
        tag: fieldValue
        totalCount
      }
    }
  }
`;
