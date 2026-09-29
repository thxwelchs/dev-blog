import { defineConfig } from 'astro/config';

// user 페이지(thxwelchs.github.io)는 루트로 서빙 → base 없음.
export default defineConfig({
  site: 'https://thxwelchs.github.io',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  // 옛 Gatsby 사이트에만 있던 주소 → 새 페이지 (구글 색인·외부 링크 보존)
  redirects: {
    '/2': '/',
    '/3': '/',
    '/4': '/',
    '/category/ETC': '/category/엔지니어링/',
    '/category/Git': '/category/엔지니어링/',
    '/category/Java': '/category/엔지니어링/',
    '/category/Javascript': '/category/엔지니어링/',
    '/category/Kotlin': '/category/엔지니어링/',
    '/category/React': '/category/엔지니어링/',
    '/category/Redis': '/category/엔지니어링/',
    '/category/Spring': '/category/엔지니어링/',
    '/tags/5-원칙': '/tags/5원칙/',
    '/tags/deubg': '/tags/debug/',
    '/tags/n-1': '/tags/n+1/',
    '/tags/es-2020': '/tags/es2020/',
    '/tags/intelli-j': '/tags/intellij/',
    '/author/ghost': '/about/',
    '/author/another-author': '/about/',
    '/author/thxwelchs': '/about/',
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});
