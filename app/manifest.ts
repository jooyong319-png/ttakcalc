import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

/** 웹 앱 매니페스트 — 홈 화면에 추가했을 때의 이름·아이콘·색을 정한다.
 *  아이콘은 app/icon.png(512)와 app/apple-icon.png(180)를 Next가 자동으로 연결하므로
 *  여기서는 매니페스트가 요구하는 항목만 채운다. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — 연봉·세금·부동산 계산기`,
    short_name: SITE.name,
    description:
      '연봉 실수령액, 퇴직금, 세금을 근거까지 명세서처럼 보여드립니다. 제도가 바뀌면 바로 반영합니다.',
    start_url: '/',
    display: 'standalone',
    lang: 'ko',
    background_color: '#ffffff',
    // 설치형으로 열었을 때의 상단 색. 사이트 액센트와 맞춘다(globals.css --accent).
    theme_color: '#1d4ed8',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
