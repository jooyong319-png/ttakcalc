import type { ReactNode } from 'react';
import { manLabel } from '@/lib/format';
import { breadcrumbLd, ldJson } from '@/lib/jsonLd';
import type { Tone } from '@/lib/catalog';
import s from './AnswerPage.module.css';

/** 검색어 하나에 답을 하나 주는 정적 페이지의 공통 껍데기.
 *  /salary/[man], /acquisition-tax/[man], /brokerage-fee/[man]이 전부 이걸 쓴다 —
 *  라우트가 늘어날 때마다 레이아웃을 복사하지 않기 위해서. */
export function AnswerPage({
  tone, category, categoryHref, meta, title, lead, children,
}: {
  tone: Tone;
  category: string;
  categoryHref: string;
  /** 눈썹줄 오른쪽에 붙는 기준(예: "2026년 기준") */
  meta: string;
  title: string;
  lead: ReactNode;
  children: ReactNode;
}) {
  // 값별 페이지는 수가 많아 검색 결과에서 서로 구분이 안 된다. 어느 갈래의 몇 번째
  // 값인지 경로를 붙여 준다 — 현재 페이지 항목은 URL 없이 이름만 넣는다.
  const crumbLd = breadcrumbLd([{ name: category, href: categoryHref }, { name: title }]);

  return (
    <div className={`container-narrow ${s[tone]}`}>
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ldJson(crumbLd) }} />
      <header className={s.head}>
        <p className={s.eyebrow}>
          <a href={categoryHref} className={s.category}>{category}</a>
          <span aria-hidden="true"> · </span>{meta}
        </p>
        <h1 className={s.title}>{title}</h1>
        <p className={s.lead}>{lead}</p>
      </header>
      {children}
    </div>
  );
}

export function AnswerSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={s.section}>
      <h2 className={s.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

/** 본문 아래 각주 — 가정·주의·다른 페이지로 가는 안내 */
export function AnswerNote({ children }: { children: ReactNode }) {
  return <p className={s.note}>{children}</p>;
}

/** 가정 칩 — 고정 조건을 화면에 그대로 드러낸다. 안 밝히면 그냥 틀린 숫자다. */
export function Assumptions({ items }: { items: ReactNode[] }) {
  return (
    <ul className={s.assumptions}>
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ul>
  );
}

/** 가로로 넘칠 수 있는 표를 감싼다 — 본문이 가로 스크롤되지 않게 */
export function AnswerTable({ children, label }: { children: ReactNode; label?: string }) {
  // 좁은 화면에서 가로로 넘치면 그 영역은 키보드로도 스크롤할 수 있어야 한다
  // (axe scrollable-region-focusable). tabIndex만 주면 스크린리더에 정체불명의
  // 정지점이 생기므로 이름도 함께 붙인다 — 감싸는 섹션 제목을 넘겨 쓰면 된다.
  return (
    <div className={s.tableWrap} tabIndex={0} role="region" aria-label={label ?? '표'}>
      <table className={s.table}>{children}</table>
    </div>
  );
}

/** 앞뒤 값 + 주요 값 링크. 크롤링 경로이자 실제로 비교하려는 사용자에게도 쓸모 있다. */
export function AnswerNav({
  base, prev, next, chips, current, allHref, allLabel,
  label = '다른 금액으로 보기',
  format = manLabel,
}: {
  base: string;
  prev: number | null;
  next: number | null;
  chips: number[];
  current: number;
  allHref?: string;
  allLabel?: string;
  label?: string;
  /** 값 → 라벨. 금액 라우트는 만원 단위지만 자동차세는 cc라 여기서 갈아끼운다. */
  format?: (v: number) => string;
}) {
  return (
    <nav className={s.nav} aria-label={label}>
      <h2 className={s.sectionTitle}>{label}</h2>
      <div className={s.navRow}>
        {prev !== null && <a href={`${base}/${prev}`} className={s.navBtn}>← {format(prev)}</a>}
        {next !== null && <a href={`${base}/${next}`} className={s.navBtn}>{format(next)} →</a>}
      </div>
      <ul className={s.chips}>
        {chips.filter(c => c !== current).map(c => (
          <li key={c}><a href={`${base}/${c}`} className={s.chip}>{format(c)}</a></li>
        ))}
      </ul>
      {allHref && (
        <p className={s.note}>
          <a href={allHref}>{allLabel}</a>에서 전체를 볼 수 있습니다.
        </p>
      )}
    </nav>
  );
}

export { s as answerStyles };
