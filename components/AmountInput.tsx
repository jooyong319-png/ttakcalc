'use client';
import { useLayoutEffect, useRef } from 'react';
import s from './Breakdown.module.css';

/** 금액 입력칸 — 천 단위 콤마를 찍는다.
 *
 *  결과는 전부 콤마가 있는데 입력만 `50000000`처럼 날것이면 자릿수를 눈으로 세야 한다.
 *  `type="number"`로는 콤마를 표시할 수 없어(브라우저가 값을 거부한다) text + inputMode로 바꿨다.
 *  대신 잃는 것들을 손으로 되돌려 놓는다:
 *   · 숫자 키패드 → inputMode="numeric"
 *   · 위/아래 화살표 증감 → onKeyDown에서 step만큼
 *   · 커서 위치 → 재포맷 후 "앞에 있던 숫자 개수"를 기준으로 복원(안 하면 커서가 끝으로 튄다)
 */
export function AmountInput({
  value, onChange, unit, step = 1, min = 0, max, ariaLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  /** 입력칸 오른쪽 단위 표기(원, cc, ㎡ …) */
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  /** 재포맷 후 커서를 되돌릴 위치 — "왼쪽에 숫자가 몇 개 있었는지" */
  const digitsBefore = useRef<number | null>(null);

  const clamp = (n: number) => {
    let v = Math.max(min, n);
    if (max !== undefined) v = Math.min(max, v);
    return v;
  };

  useLayoutEffect(() => {
    const el = ref.current;
    const want = digitsBefore.current;
    if (!el || want === null) return;
    digitsBefore.current = null;

    const text = el.value;
    let seen = 0;
    let pos = 0;
    while (pos < text.length && seen < want) {
      if (/\d/.test(text[pos])) seen++;
      pos++;
    }
    el.setSelectionRange(pos, pos);
  });

  return (
    <div className={s.row}>
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        aria-label={ariaLabel}
        className={`${s.input} num`}
        value={value.toLocaleString('ko-KR')}
        onChange={e => {
          const el = e.target;
          const caret = el.selectionStart ?? el.value.length;
          digitsBefore.current = el.value.slice(0, caret).replace(/\D/g, '').length;
          const digits = el.value.replace(/\D/g, '');
          onChange(clamp(digits === '' ? 0 : Number(digits)));
        }}
        onKeyDown={e => {
          // type="number"에서 쓰던 위/아래 증감을 되살린다
          if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
          e.preventDefault();
          onChange(clamp(value + (e.key === 'ArrowUp' ? step : -step)));
        }}
        onFocus={e => e.currentTarget.select()}
      />
      {unit && <span className={s.unit}>{unit}</span>}
    </div>
  );
}
