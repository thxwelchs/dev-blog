// giscus(GitHub Discussions 댓글) 설정.
// giscus.app 에서 레포 입력 → 매핑 pathname → 카테고리 선택 후 나오는 값을 채우면 활성화됨.
// (그 전엔 글 하단에 "설정 대기" 안내만 보이고, 이전 Disqus 댓글은 그대로 보존)
export const GISCUS = {
  repo: 'thxwelchs/thxwelchs.github.io',
  repoId: '', // 예: R_kgD...
  category: 'Comments',
  categoryId: '', // 예: DIC_kwD...
};

export const giscusReady = () => GISCUS.repoId !== '' && GISCUS.categoryId !== '';
