import { defineConfig } from 'astro/config';

// user 페이지(thxwelchs.github.io)는 루트로 서빙 → base 없음.
export default defineConfig({
  site: 'https://thxwelchs.github.io',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});
