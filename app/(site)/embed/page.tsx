import type { Metadata } from 'next';
import { EMBEDS } from '@/lib/embeds';
import { SITE } from '@/lib/site';
import { breadcrumbLd, ldJson } from '@/lib/jsonLd';
import { EmbedPicker } from '@/components/EmbedPicker';
import s from './embedGuide.module.css';

export const metadata: Metadata = {
  title: '계산기 임베드',
  description:
    '딱칼크 계산기를 블로그·웹사이트에 그대로 넣을 수 있습니다. 코드 한 줄을 붙여 넣으면 되고, 요율이 바뀌면 자동으로 최신 기준으로 계산됩니다.',
  alternates: { canonical: `${SITE.url}/embed` },
};

export default function EmbedGuidePage() {
  const crumbLd = breadcrumbLd([{ name: '계산기 임베드' }]);

  return (
    <div className="container-narrow" style={{ paddingTop: '1.8rem' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(crumbLd) }} />

      <header className={s.head}>
        <h1 className={s.title}>계산기 임베드</h1>
        <p className={s.lead}>
          블로그나 웹사이트에 딱칼크 계산기를 그대로 넣을 수 있습니다. 코드 한 줄이면 되고,
          비용도 가입도 없습니다. <strong>요율이 바뀌면 넣어 둔 계산기도 함께 최신 기준으로 바뀝니다</strong> —
          글을 다시 손보지 않아도 됩니다.
        </p>
      </header>

      <EmbedPicker embeds={EMBEDS} base={SITE.url} siteName={SITE.name} />

      <section className={s.section}>
        <h2 className={s.h2}>알아 두실 것</h2>
        <ul className={s.list}>
          <li>
            <strong>출처 한 줄은 지우지 말아 주세요.</strong> 계산기를 무료로 열어 두는 대신
            받는 유일한 것입니다. 위치나 글꼴은 글에 맞게 바꾸셔도 됩니다.
          </li>
          <li>
            <strong>계산 결과는 참고용 추정치입니다.</strong> 실제 원천징수액이나 고지세액은
            개별 사정에 따라 달라집니다. 이 문구는 계산기 안에도 함께 표시됩니다.
          </li>
          <li>
            <strong>높이는 고정값입니다.</strong> 넓은 화면에서 딱 맞는 높이를 넣어 뒀지만,
            휴대폰처럼 좁은 화면에서는 입력칸이 세로로 쌓여 더 길어집니다. 그때는 계산기 안에서
            스크롤됩니다. 코드의 <code className={s.code}>height</code> 숫자를 직접 늘리셔도 되고,
            아래 스크립트를 넣으면 화면 크기에 맞게 자동으로 조절됩니다.
          </li>
          <li>
            <strong>일부 블로그 서비스는 iframe을 막습니다.</strong> 네이버 블로그처럼 제한이
            있는 곳에서는 <a href="/">계산기 링크</a>를 거는 편이 확실합니다.
          </li>
        </ul>
      </section>

      <section className={s.section}>
        <h2 className={s.h2}>높이 자동 조절 (선택)</h2>
        <p className={s.p}>
          스크립트를 넣을 수 있는 곳이라면, 아래 한 조각을 글 어디에든 함께 넣어 주세요.
          계산기가 필요한 높이를 알려 주면 프레임이 그만큼 늘어납니다. 넣지 않아도 계산기는
          그대로 동작합니다.
        </p>
        <pre className={s.pre} tabIndex={0} role="region" aria-label="높이 자동 조절 스크립트">
          <code>{`<script>
window.addEventListener('message', function (e) {
  // 다른 사이트가 보낸 메시지에 반응하지 않도록 보낸 곳을 먼저 확인합니다
  if (e.origin !== '${SITE.url}') return;
  if (!e.data || e.data.type !== 'ttakcalc:height') return;
  document.querySelectorAll('iframe[src*="${SITE.url.replace('https://', '')}/embed/"]')
    .forEach(function (f) {
      if (f.contentWindow === e.source) f.height = e.data.height;
    });
});
</script>`}</code>
        </pre>
      </section>

      <section className={s.section}>
        <h2 className={s.h2}>요율은 어떻게 관리하나요</h2>
        <p className={s.p}>
          모든 계산의 요율과 세율은 공식 고시·법령 원문을 대조해 관리하고, 계산기마다 마지막
          대조 날짜와 근거 조문을 화면에 함께 표시합니다. 무엇이 언제 어떻게 바뀌었는지는{' '}
          <a href="/changes">제도 변화</a>에 남깁니다. 넣어 두신 계산기도 같은 기준을 따라갑니다.
        </p>
        <p className={s.p}>
          문의는 <a href={`mailto:${SITE.email}`}>{SITE.email}</a>으로 주세요.
        </p>
      </section>
    </div>
  );
}
