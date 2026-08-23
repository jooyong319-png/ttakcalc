'use client';
import { useEffect, useState } from 'react';
import { TAX_EVENTS, upcoming, type EventStatus } from '@/lib/taxCalendar';
import s from './UpcomingTax.module.css';

/**
 * "지금 임박한 세금 일정".
 *
 * 클라이언트에서 계산하는 이유 — 이 사이트는 정적 생성이라 서버에서 오늘을 계산하면
 * **빌드한 날에 굳는다.** "3주 남음"이라고 써 놓고 두 달 뒤에도 같은 말을 하게 된다.
 *
 * 대신 서버 HTML에는 전체 일정표가 그대로 들어간다(아래 페이지 본문). 검색엔진은 그걸
 * 읽으므로 이 블록이 비어 있어도 색인에는 아무 손해가 없다. 자바스크립트가 꺼져 있으면
 * 강조만 사라지고 표는 멀쩡하다.
 */
/** "09-16" → "9월 16일" */
const md = (mmdd: string) => {
  const [m, d] = mmdd.split('-').map(Number);
  return `${m}월 ${d}일`;
};

export function UpcomingTax() {
  const [rows, setRows] = useState<EventStatus[] | null>(null);

  useEffect(() => {
    setRows(upcoming(TAX_EVENTS, new Date(), 3));
  }, []);

  if (!rows) {
    // 하이드레이션 전에는 자리만 잡아 둔다. 레이아웃이 튀지 않게 높이를 비슷하게.
    return <div className={s.placeholder} aria-hidden="true" />;
  }

  return (
    <section className={s.wrap} aria-label="다가오는 세금 일정">
      <h2 className={s.title}>지금 챙길 것</h2>
      <ul className={s.list}>
        {rows.map(({ event, ongoing, daysUntil, daysLeft }) => (
          <li key={event.id} className={ongoing ? s.ongoing : undefined}>
            <div className={s.head}>
              <span className={s.name}>{event.name}</span>
              <span className={ongoing ? s.badgeNow : s.badge}>
                {ongoing
                  ? (daysLeft === 0 ? '오늘 마감' : `${daysLeft}일 남음`)
                  : (daysUntil === 0 ? '오늘 시작' : `${daysUntil}일 뒤`)}
              </span>
            </div>
            {/* "09월"이 아니라 "9월" — 앞의 0을 떼야 사람이 읽는 표기가 된다 */}
            <p className={s.period}>
              <span className="num">{md(event.from)}</span>
              {' ~ '}
              <span className="num">{md(event.to)}</span>
            </p>
            <p className={s.what}>{event.what}</p>
            <a className={s.calc} href={event.calc}>{event.calcLabel}로 계산해 보기 →</a>
          </li>
        ))}
      </ul>
    </section>
  );
}
