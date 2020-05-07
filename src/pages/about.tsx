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
              <h4>Intro</h4>
              <p>
                <strong>thxwelchs@gmail.com</strong><br/>
              디지털 문화와 데이터 구체화를 좋아하고 DevOps, Agile문화에 적극적으로 기여해보고 싶은 이태훈입니다.

              아직 경험은 많이 부족하지만 여러가지 기술들에 대한 조언 혹은 논의를 통해 배워 갈 수 있는 기회가 있다면 언제든 환영입니다.

              기술적으로 성장하고 실수는 한번만 하기 위해 기록하는 것을 지향하고 있습니다.
              </p>

              <h4>Interests</h4>
              <p className="interests-content">
                <span>#DevOps</span>,
                <span>#MSA</span>,
                <span>#DDD</span>,
                <span>#IaC</span>,
                <span>#Cloud</span>,
                <span>#AWS</span>,
                <span>#Docker</span>,
                <span>#Kubernetes</span>,
                <span>#Spring</span>,
                <span>#Event-Driven</span>
                <span>#Java</span>
                <span>#Kotlin</span>
                <span>#Node.js</span>
                <span>#OOP</span>
              </p>

              <p>
                <a href="https://www.notion.so/thxwelchs/thxwelchs-fe44c93b11024508b8d6b5c4fcd4f829" target="_blank">노션 구경가기</a>
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
