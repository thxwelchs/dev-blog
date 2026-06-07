import styled from '@emotion/styled';
import * as React from 'react';
import { useEffect, useState } from 'react';

import { colors } from '../styles/colors';

interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w가-힣\s-]/g, '')
    .replace(/\s+/g, '-');
}

const Toc: React.FC = () => {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [shown, setShown] = useState<boolean>(false);

  useEffect(() => {
    const content = document.querySelector('.post-full-content');
    if (!content) {
      return undefined;
    }

    const els = Array.from(
      content.querySelectorAll('h1, h2, h3'),
    ) as HTMLElement[];

    const seen: { [key: string]: number } = {};
    const items: HeadingItem[] = els.map(el => {
      let id = el.id;
      if (!id) {
        const base = slugify(el.textContent || '') || 'section';
        if (seen[base] === undefined) {
          seen[base] = 0;
          id = base;
        } else {
          seen[base] += 1;
          id = `${base}-${seen[base]}`;
        }
        el.id = id;
      }
      return {
        id,
        text: el.textContent || '',
        level: Number(el.tagName.substring(1)),
      };
    });
    setHeadings(items);

    const onScroll = () => {
      let current = '';
      for (const el of els) {
        if (el.getBoundingClientRect().top <= 120) {
          current = el.id;
        } else {
          break;
        }
      }
      if (!current && items.length > 0) {
        current = items[0].id;
      }
      setActiveId(current);
      setShown(window.pageYOffset > 240);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (headings.length < 2) {
    return null;
  }

  const minLevel = headings.reduce((m, h) => Math.min(m, h.level), 6);

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <TocNav aria-label="목차" shown={shown}>
      <TocHeading>목차</TocHeading>
      <TocList>
        {headings.map(h => (
          <TocEntry key={h.id} depth={h.level - minLevel}>
            <TocLink
              href={`#${h.id}`}
              active={h.id === activeId}
              onClick={e => handleClick(e, h.id)}
            >
              {h.text}
            </TocLink>
          </TocEntry>
        ))}
      </TocList>
    </TocNav>
  );
};

export default Toc;

const TocNav = styled.nav<{ shown: boolean }>`
  display: none;

  @media (min-width: 1500px) {
    display: block;
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    left: calc(50% + 520px + 36px);
    width: calc(50% - 520px - 60px);
    max-width: 240px;
    max-height: 80vh;
    overflow-y: auto;
    padding-right: 8px;
    z-index: 700;
    opacity: ${props => (props.shown ? 1 : 0)};
    visibility: ${props => (props.shown ? 'visible' : 'hidden')};
    transition: opacity 0.3s ease, visibility 0.3s ease;
  }
`;

const TocHeading = styled.div`
  margin: 0 0 12px;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${colors.midgrey};
`;

const TocList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const TocEntry = styled.li<{ depth: number }>`
  margin: 0;
  padding: 0;
  margin-left: ${props => props.depth * 12}px;
`;

const TocLink = styled.a<{ active: boolean }>`
  display: block;
  padding: 4px 0 4px 12px;
  font-size: 1.4rem;
  line-height: 1.4;
  text-decoration: none;
  border-left: 2px solid
    ${props => (props.active ? colors.blue : 'rgba(0, 0, 0, 0.08)')};
  color: ${props => (props.active ? colors.blue : colors.midgrey)};
  font-weight: ${props => (props.active ? 600 : 400)};
  transition: color 0.2s, border-color 0.2s;

  :hover {
    color: ${colors.darkgrey};
  }
`;
