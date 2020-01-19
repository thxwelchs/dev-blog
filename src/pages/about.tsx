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
              디지털 문화와 데이터 구체화를 좋아하고 DevOps, Agile문화에 적극적으로 기여해보고 싶은 이태훈입니다.

              저는 스마트팩토리 관련 소프트웨어 스타트업 초기 창업멤버로 시작하면서부터 본격적으로 개발을 시작하였고,
              스타트업 근무 환경 여건상 다양한 개발업무(요구사항 분석, AWS 인프라, DB 설계, 백엔드, 프론트엔드)를 경험 했습니다.

              아직 경험은 많이 부족하지만 여러가지 기술들에 대한 조언 혹은 논의를 통해 배워 갈 수 있는 기회가 있다면 언제든 환영입니다.

              최근 마이크로 서비스 아키텍처(MSA)에 관심이 많이 있고 공부하고 있으며, 변화 해가는 IT 트렌드를 따라가려고 자기 주도적으로 노력하는 편이라고 생각합니다.

              앞으로 어떤 환경에서든지 좋은 팀원 분들과 함께 앞으로 좋은 개발했으면 합니다.
              </p>

              <p>
                <h4>다음 사항들을 항상 명심하면서 개발해보기!</h4>
                <ul>
                  <li>컴퓨터는 거짓말을 하지 않는다. 문제가 있다면 대부분 사람이 문제</li>
                  <li>거의 대부분의 문제는 로그를 보면 나와 있다.</li>
                  <li>디버거를 반드시 활용하기!</li>
                  <li>TDD를 하다보면 코드가 자연스럽게 유닛화 된다.</li>
                  <li>의심을 습관화 하자. 뭔가 이상하면 그 때 바로 찾아보기</li>
                  <li>무지를 드러내고 물어보는걸 두려워 하지 말자.(차라리 잠깐의 쪽팔림이 더 낫다.)</li>
                </ul>
              </p>

              <p>
              아직 저를 개발자라고 부를 수 있을지 모르겠습니다. 아직 코더의 단계에 머물러 있는 것 같기도 합니다만

              그래도 문제에 봉착 했을 때 해결방법을 강구하고, 항상 할 수 있다는 마음가짐으로 임하고 있습니다. 

              프로그래밍 주력 언어는 <strong>Kotlin, Java, javascript</strong>입니다.

              Kotlin은 최근 접하여 서버 사이드에서 활용하여 프로그래밍 하고 있습니다.
              </p>
              <p>
                <h4>일 할 때는</h4>
                <ul>
                  <li>MacOS에서 주로 작업합니다.</li>
                  <li>Slack으로 팀원들과 소통하며</li> 
                  <li>이슈 트래킹 툴을 활용하여, 태스크 관리와 이슈 추적하기</li>
                  <li>Notion에 꼼꼼히 다 적어보기</li> 
                  <li>VIM을 주로 사용하려고 하기 때문에 IDE나 편집 툴 에 플러그인으로 설치하여 주력 에디팅 도구로 사용합니다 ( Intellij IdeaVim plgin, VScode Vim extension 활용 등  )</li> 
                </ul>

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
