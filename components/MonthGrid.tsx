'use client';
import { useEffect, useState } from 'react';
import s from './MonthGrid.module.css';

/**
 * 그 달의 실제 날짜 격자. 납부·신고 기간을 칠한다.
 *
 * 왜 필요한가 (2026-09-08) — "9월 16일~30일"이라고 글자로 적혀 있어도 그게 몇째 주인지,
 * 주말이 끼는지는 머릿속에서 달력을 그려야 안다. 칠해 놓으면 그냥 보인다.
 *
 * ## 클라이언트에서 그리는 이유
 *
 * 요일은 **연도가 있어야** 정해진다. 이 사이트는 정적 생성이라 서버에서 올해로 그리면
 * 빌드한 날의 연도에 굳어 버린다 — 해가 바뀌면 요일이 통째로 틀린 달력이 남는다.
 *
 * 서버 HTML에는 기간이 글자로 이미 있으므로(그 페이지 본문) 이 격자가 비어도 검색엔진과
 * 자바스크립트가 꺼진 브라우저는 손해를 보지 않는다. 격자는 **덧붙이는 표현**이다.
 */
export function MonthGrid({
  month, ranges,
}: {
  month: number;
  /** [시작일, 종료일] — 같은 달 안의 날짜만 받는다 */
  ranges: { from: number; to: number; label: string }[];
}) {
  const [year, setYear] = useState<number | null>(null);
  const [today, setToday] = useState<number | null>(null);

  useEffect(() => {
    const now = new Date();
    setYear(now.getFullYear());
    setToday(now.getMonth() + 1 === month ? now.getDate() : null);
  }, [month]);

  // 연도를 모르는 동안(하이드레이션 전)에는 자리만 잡는다. 레이아웃이 튀지 않게.
  if (year === null) return <div className={s.placeholder} aria-hidden="true" />;

  const first = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const leading = first.getDay();               // 0=일요일
  const cells = leading + daysInMonth;
  const rows = Math.ceil(cells / 7);

  // find가 아니라 filter다 — 9월처럼 **같은 기간에 두 건**이 걸린 달이 있다.
  // 하나만 적으면 나머지 한 건이 격자에서 사라진다.
  const marked = (d: number) => ranges.filter(r => d >= r.from && d <= r.to);

  return (
    <figure className={s.wrap}>
      <table className={s.table}>
        <caption className={s.caption}>
          <span className="num">{year}</span>년 <span className="num">{month}</span>월 — 색칠된 날이 납부·신고 기간입니다
        </caption>
        <thead>
          <tr>
            {['일', '월', '화', '수', '목', '금', '토'].map((w, i) => (
              <th key={w} scope="col" className={i === 0 ? s.sun : i === 6 ? s.sat : undefined}>{w}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
            <tr key={r}>
              {Array.from({ length: 7 }, (_, c) => {
                const d = r * 7 + c - leading + 1;
                if (d < 1 || d > daysInMonth) return <td key={c} className={s.empty} />;
                const hit = marked(d);
                const starts = hit.filter(r => r.from === d);
                return (
                  <td
                    key={c}
                    className={[
                      hit.length ? s.on : '',
                      d === today ? s.today : '',
                      c === 0 ? s.sun : c === 6 ? s.sat : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <span className="num">{d}</span>
                    {/* 색만으로 알리지 않는다 — 기간이 시작하는 날에 이름을 적는다 */}
                    {starts.map(r => <span key={r.label} className={s.label}>{r.label}</span>)}
                    {d === today && <span className="sr-only">오늘</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
