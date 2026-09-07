'use client';
import { useEffect, useState } from 'react';
import s from './MonthJump.module.css';

/**
 * 달 바로가기.
 *
 * 왜 필요한가 (2026-09-08) — 달력 한 장에 1년치를 1월부터 늘어놓으니, 9월에 방문한
 * 사람이 자기 달을 보려면 모바일에서 3,253px를 스크롤해야 했다. 전체 높이가 5,073px다.
 *
 * 서버 렌더 순서는 1→12월 그대로 둔다. 검색엔진과 처음 읽는 사람에게는 그게 자연스럽고,
 * 정적 생성이라 "이번 달"을 서버에서 정하면 빌드한 날에 굳어 버린다. 대신 **이번 달을
 * 클라이언트가 표시**하고, 누르면 앵커로 바로 간다.
 */
export function MonthJump({ months }: { months: number[] }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(new Date().getMonth() + 1);
  }, []);

  return (
    <nav className={s.wrap} aria-label="달 바로가기">
      <ul className={s.list}>
        {months.map(m => {
          // 이번 달이거나, 이번 달에 일정이 없으면 가장 가까운 다음 달을 표시한다
          const isNow = now !== null && (
            m === now || (!months.includes(now) && m === (months.find(x => x > now) ?? months[0]))
          );
          return (
            <li key={m}>
              <a
                href={`#m${m}`}
                className={`${s.chip} ${isNow ? s.now : ''}`}
                aria-current={isNow ? 'true' : undefined}
              >
                <span className="num">{m}</span>월
                {/* 색만으로 알리면 색각 이상에서 구분이 안 된다 — 글자도 함께 */}
                {isNow && <span className={s.badge}>지금</span>}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
