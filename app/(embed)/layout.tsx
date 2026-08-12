import type { Metadata } from 'next';
import '../globals.css';

/** 임베드 전용 **루트** 레이아웃.
 *
 *  왜 루트를 따로 두나 — 처음엔 사이트 레이아웃 아래 중첩 레이아웃으로 만들었는데,
 *  그러면 헤더 네비게이션과 푸터가 그대로 딸려 들어간다. CSS로 숨기는 건 더 나쁘다:
 *  **숨겨진 링크가 위젯에 담겨 여러 사이트에 뿌려지는 것**은 검색엔진이 링크 조작이라고
 *  콕 집어 말하는 형태다. 아예 렌더하지 않아야 한다.
 *
 *  방문 분석 스크립트도 넣지 않는다. 남의 글에 들어가는 화면이라, 그 사이트 방문자를
 *  우리가 추적하는 셈이 된다. 유입은 출처 링크의 utm 파라미터로만 본다.
 *
 *  테마는 시스템 설정만 따른다. 우리 사이트에서 고른 테마를 남의 페이지 안에까지
 *  들고 갈 이유가 없다. */
export const metadata: Metadata = {
  // 임베드가 검색 결과에 뜨면 원본 계산기 페이지와 중복이 된다
  robots: { index: false, follow: false },
};

export default function EmbedRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" href="/fonts/pretendard/pretendard.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
