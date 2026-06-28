// tslint:disable:no-http-string
import { StaticQuery, graphql, Link, navigate } from 'gatsby';
import * as React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/core';

import { SocialLink } from '../../styles/shared';
import config from '../../website-config';
import Facebook from '../icons/facebook';
import Twitter from '../icons/twitter';
import SubscribeModal from '../subscribe/SubscribeOverlay';
import SiteNavLogo from './SiteNavLogo';

const HomeNavRaise = css`
  @media (min-width: 900px) {
    position: relative;
    top: -70px;
  }
`;

const SiteNavStyles = css`
  position: relative;
  z-index: 300;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  overflow-y: hidden;
  height: 40px;
  font-size: 1.2rem;
`;

const SiteNavLeft = styled.div`
  display: flex;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  margin-right: 10px;
  padding-bottom: 80px;
  letter-spacing: 0.4px;
  white-space: nowrap;

  -ms-overflow-scrolling: touch;

  @media (max-width: 700px) {
    margin-right: 0;
    padding-left: 4vw;
  }
`;

const NavStyles = css`
  display: flex;
  margin: 0 0 0 -12px;
  padding: 0;
  list-style: none;

  li {
    display: block;
    margin: 0;
    padding: 0;
    // text-transform: uppercase;
  }

  li a {
    display: block;
    margin: 0;
    padding: 10px 12px;
    color: #fff;
    opacity: 0.8;
  }

  li a:hover {
    text-decoration: none;
    opacity: 1;
  }
`;

const SiteNavRight = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  height: 40px;

  @media (max-width: 700px) {
    display: none;
  }
`;

const NavAbout = styled.div`
  display: flex;
  align-items: center;
  margin-right: 16px;

  a {
    padding: 4px 2px;
    color: #fff;
    font-size: 1.1rem;
    opacity: 0.55;
  }

  a:hover {
    text-decoration: none;
    opacity: 1;
  }
`;

const SearchForm = styled.form`
  display: flex;
  align-items: center;
  margin-right: 16px;

  input {
    width: 150px;
    padding: 5px 12px;
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
    font-size: 1.2rem;
    line-height: 1.6;
    outline: none;
    transition: width 0.2s, border-color 0.2s, background 0.2s;
  }

  input::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }

  input:focus {
    width: 200px;
    border-color: #fff;
    background: rgba(255, 255, 255, 0.2);
  }
`;

const SocialLinks = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  a:last-of-type {
    padding-right: 20px;
  }
`;

const SubscribeButton = styled.a`
  display: block;
  padding: 4px 10px;
  border: #fff 1px solid;
  color: #fff;
  font-size: 1.2rem;
  line-height: 1em;
  border-radius: 10px;
  opacity: 0.8;

  :hover {
    text-decoration: none;
    opacity: 1;
    cursor: pointer;
  }
`;

interface SiteNavProps {
  isHome?: boolean;
}

class SiteNav extends React.Component<SiteNavProps, { q: string }> {
  subscribe = React.createRef<SubscribeModal>();

  state = { q: '' };

  openModal = () => {
    if (this.subscribe.current) {
      this.subscribe.current.open();
    }
  };

  handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = this.state.q.trim();
    navigate(q ? `/search/?q=${encodeURIComponent(q)}` : '/search/');
  };

  render() {
    const { isHome = false } = this.props;
    return (
      <nav css={[isHome && HomeNavRaise, SiteNavStyles]}>
        <SiteNavLeft>
          {!isHome && <SiteNavLogo />}
          <ul css={NavStyles} role="menu">
            {/* TODO: mark current nav item - add class nav-current */}
            <li role="menuitem">
              <Link to="/">Home</Link>
            </li>
            <StaticQuery
              query={graphql`
                query {
                  allMarkdownRemark {
                    categories: distinct(field: frontmatter___category)
                  }
                }
              `
              }
              render={data => {
                const order = ['엔지니어링', 'PS', '생각'];
                const sorted = [...data.allMarkdownRemark.categories].sort((a: string, b: string) => {
                  const ia = order.indexOf(a); const ib = order.indexOf(b);
                  return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
                });
                const items: JSX.Element[] = [];
                sorted.forEach((category: string) => {
                  items.push(
                    <li role="menuitem" key={category}>
                      <Link to={`/category/${category}/`}>{category}</Link>
                    </li>,
                  );
                  // 엔지니어링 바로 오른쪽에 Series 메뉴
                  if (category === '엔지니어링') {
                    items.push(
                      <li role="menuitem" key="series">
                        <Link to="/series/">Series</Link>
                      </li>,
                    );
                  }
                });
                return items;
              }}
            />
            <li role="menuitem">
              <Link to="/tags/">Tags</Link>
            </li>
            {/* <li role="menuitem">
              <Link to="/tags/getting-started/">Getting Started</Link>
            </li>
            <li role="menuitem">
              <Link to="/tags/speeches/">Speeches</Link>
            </li> */}
          </ul>
        </SiteNavLeft>
        <SiteNavRight>
          <SearchForm onSubmit={this.handleSearchSubmit} role="search">
            <input
              type="search"
              placeholder="검색…"
              aria-label="검색"
              value={this.state.q}
              onChange={e => this.setState({ q: e.target.value })}
            />
          </SearchForm>
          <NavAbout>
            <Link to="/about">About</Link>
          </NavAbout>
          <SocialLinks>
            {config.facebook && (
              <a
                css={SocialLink}
                href={config.facebook}
                target="_blank"
                title="Facebook"
                rel="noopener noreferrer"
              >
                <Facebook />
              </a>
            )}
            {config.twitter && (
              <a
                css={SocialLink}
                href={config.twitter}
                title="Twitter"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter />
              </a>
            )}
          </SocialLinks>
          {config.showSubscribe && (
            <SubscribeButton onClick={this.openModal}>Subscribe</SubscribeButton>
          )}
          {config.showSubscribe && <SubscribeModal ref={this.subscribe} />}
        </SiteNavRight>
      </nav>
    );
  }
}

export default SiteNav;

// export const query = graphql`
//   query {
//     allMarkdownRemark {
//       categories: distinct(field: frontmatter___category)
//     }
//   }
// `
