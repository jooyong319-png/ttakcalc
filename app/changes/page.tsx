import type { Metadata } from 'next';
import { yearDiffs } from '@/lib/diff';
import s from './changes.module.css';

export const metadata: Metadata = {
  title: '제도 변화',
  description:
    '4대보험 요율, 세법, 최저임금 등 계산에 영향을 주는 제도가 언제 어떻게 바뀌었는지 연도별로 비교해 기록합니다.',
  alternates: { canonical: 'https://ttakcalc.com/changes' },
};

// 이 페이지가 이 사이트의 차별화 축이다 — 계산기는 유입, 제도 변화 추적이 재방문·신뢰를 만든다.
// 변경 내역은 손으로 적지 않는다. lib/diff.ts가 rates.json의 연도 간 차이를 계산해서 만든다 —
// 그래야 데이터와 설명이 어긋나지 않는다.
export default function ChangesPage() {
  const diffs = yearDiffs();
  const changed = diffs.filter(d => d.changes.length > 0);

  return (
    <div className="container-narrow">
      <header className={s.head}>
        <p className={s.eyebrow}>제도 변화</p>
        <h1 className={s.title}>제도는 바뀝니다.<br />계산은 <span className={s.mark}>항상 최신</span>으로.</h1>
        <p className={s.lead}>
          4대보험 요율·세법·최저임금이 <strong>언제 어떻게 바뀌었는지</strong> 연도별로 비교해
          기록합니다. 공식 고시를 대조해 관리하고, 바뀌면 계산기도 같은 날 갱신됩니다.
        </p>
      </header>

      {changed.map(d => (
        <section key={d.year} className={s.year}>
          <div className={s.yearHead}>
            <h2 className={s.yearTitle}>
              {d.label} <span className={s.vs}>← {d.prevYear}년 대비</span>
            </h2>
            <span className={s.verified}>최종 확인 {d.verifiedAt}</span>
          </div>

          <ul className={s.list}>
            {d.changes.map(c => (
              <li key={c.key}>
                <div className={s.itemHead}>
                  <strong className={s.name}>{c.label}</strong>
                  <span className={`${s.change} num`}>
                    <span className={s.from}>{c.from}</span>
                    <span className={c.direction === 'up' ? s.arrowUp : s.arrowDown} aria-hidden="true">→</span>
                    <span className={s.to}>{c.to}</span>
                    <span className={s.srOnly}>
                      {c.direction === 'up' ? '에서 인상' : '에서 인하'}
                    </span>
                  </span>
                </div>
                <p className={s.note}>{c.note}</p>
                <p className={s.source}>근거 · {c.source}</p>
              </li>
            ))}
          </ul>

          {d.unchanged.length > 0 && (
            <p className={s.frozen}>
              <strong>동결</strong> {d.unchanged.map(u => u.label).join(' · ')}
            </p>
          )}
        </section>
      ))}

      <section className={s.year}>
        <div className={s.yearHead}>
          <h2 className={s.yearTitle}>{diffs[diffs.length - 1].label} 기준</h2>
          <span className={s.verified}>비교 기준이 되는 가장 오래된 연도</span>
        </div>
        <ul className={s.list}>
          {diffs[diffs.length - 1].unchanged.map(u => (
            <li key={u.label}>
              <div className={s.itemHead}>
                <strong className={s.name}>{u.label}</strong>
                <span className={`${s.value} num`}>{u.value}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <p className={s.outro}>
        연도별 기준을 그대로 보관하기 때문에, 계산기에서 <strong>과거 연도를 선택하면 그 시점 기준</strong>으로
        계산됩니다. 지난달 받은 급여를 확인하거나, 내년에 얼마나 달라지는지 비교할 때 쓰세요.
      </p>
    </div>
  );
}
