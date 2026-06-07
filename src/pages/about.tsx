import IndexLayout from '../layouts';
import Wrapper from '../components/Wrapper';
import SiteNav from '../components/header/SiteNav';
import { SiteHeader, outer, inner, SiteMain } from '../styles/shared';
import * as React from 'react';
import { css } from '@emotion/core';

import { PostFullHeader, PostFullTitle, NoImage, PostFull } from '../templates/post';
import { PostFullContent } from '../components/PostContent';
import Footer from '../components/Footer';
import Helmet from 'react-helmet';

const PageTemplate = css`
  .site-main {
    background: #fff;
    padding-bottom: 4vw;
  }
  .interests-content {

    span {
      margin-left: 0.5rem;
      color: #4a7cec;
      cursor: pointer;
    }

    span:first-of-type {
      margin-left: 0;
    }

  }
  
  .notion-page {
    display: inline-flex;
    justify-content: flex-start;
    img {
      display: inline;
      margin: 0;
    }
    a {
      display:flex;
      span {
        align-self: flex-end;
      }
    }

    a:hover {
      opacity: 0.7;
    }

  }
`;

const About: React.FC = () => (
  <IndexLayout>
    <Helmet>
      <title>About</title>
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
            <PostFullTitle>About</PostFullTitle>
          </PostFullHeader>

          <PostFullContent className="post-full-content">
            <div className="post-content">
              <p>
                <strong>Email</strong> · <a href="mailto:thxwelchs@gmail.com">thxwelchs@gmail.com</a>
                <br />
                <strong>GitHub</strong> ·{' '}
                <a href="https://github.com/thxwelchs" target="_blank" rel="noopener noreferrer">
                  github.com/thxwelchs
                </a>
              </p>
            </div>
          </PostFullContent>
        </article>
      </main>
      <Footer />
    </Wrapper>
  </IndexLayout>
);

export default About;
