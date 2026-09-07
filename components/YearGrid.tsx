'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TAX_EVENTS, shortNames } from '@/lib/taxCalendar';
import s from './YearGrid.module.css';

/**
 * 1년 열두 달 격자.
 *
 * 왜 격자인가 (2026-09-08) — 이름이 "달력"인데 세로 목록이라 기대와 어긋났다. 세금은
 * 한 달에 한두 건뿐이라 **날짜** 격자로 그리면 대부분 빈칸이지만, **달** 격자는 다르다.
 * "1년 중 언제 세금이 몰리나"가 한눈에 들어온다 — 7·9월에 두 건씩, 4·6·8·10·11월은 없다.
 *
 * 빈 달도 칸을 차지한다. 그래야 달력이고, "이 달은 낼 게 없다"도 답이다. 다만 페이지가
 * 없으므로 링크하지 않는다(→ app/(site)/calendar/[month]).
 *
 * ## 이번 달 표시를 클라이언트에서 하는 이유
 *
 * 정적 생성이라 서버에서 "오늘"을 정하면 빌드한 날에 굳는다. 격자 자체는 서버 HTML에
 * 그대로 들어가고(링크도 함께), 표시만 하이드레이션 뒤에 붙는다.
 */
export function YearGrid() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(new Date().getMonth() + 1), []);

  return (
    <ol className={s.grid} aria-label="1년 세금 일정">
      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
        const events = TAX_EVENTS.filter(e => Number(e.from.slice(0, 2)) === m);
        const names = shortNames(events);
        const current = now === m;

        const inner = (
          <>
            <span className={s.month}>
              <span className="num">{m}</span>월
              {/* 색·테두리에만 기대지 않도록 글자로도 알린다 */}
              {current && <span className={s.now}>지금</span>}
            </span>
            {names.length > 0 ? (
              <span className={s.names}>
                {names.map(n => <span key={n} className={s.name}>{n}</span>)}
              </span>
            ) : (
              <span className={s.none}>없음</span>
            )}
          </>
        );

        return (
          <li
            key={m}
            className={`${s.cell} ${events.length ? s.on : s.off} ${current ? s.current : ''}`}
            {...(current ? { 'aria-current': 'true' as const } : {})}
          >
            {events.length
              ? <Link href={`/calendar/${m}`} className={s.link}>{inner}</Link>
              : <span className={s.link}>{inner}</span>}
          </li>
        );
      })}
    </ol>
  );
}
