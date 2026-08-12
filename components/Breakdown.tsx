'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { calculatorFromPath, trackCalculate } from '@/lib/analytics';
import styles from './Breakdown.module.css';

const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');

// tone → CSS 클래스. 'result'는 컨테이너 클래스와 이름이 겹쳐 별도 매핑한다.
const TONE_CLASS: Record<string, string> = {
  minus: styles.minus,
  total: styles.total,
  result: styles.resultRow,
  info: styles.info,
};

/** 계산 과정 한 줄. basis(근거)는 선택이 아니라 이 제품의 핵심이라 거의 항상 채운다. */
export interface Row {
  label: string;
  value: number | string;
  /** 이 값이 어떻게 나왔는지 — 화면에 그대로 노출된다. */
  basis?: string;
  /** minus: 빠지는 돈(빨강) / total: 합계선 / result: 최종 결과(초록 강조) / info: 흐리게 */
  tone?: 'minus' | 'total' | 'result' | 'info';
  unit?: string;
}

/** 결과 헤드라인 + 계산 근거 테이블 — 모든 계산기가 공유한다. */
export function Breakdown({
  headlineLabel, headlineValue, headlineUnit = '원', headlineSub,
  caption = '계산 근거 — 왜 이 금액인지',
  rows, footer,
}: {
  headlineLabel: string;
  headlineValue: number | string;
  headlineUnit?: string;
  headlineSub?: ReactNode;
  caption?: string;
  rows: Row[];
  footer?: ReactNode;
}) {
  useCalculateEvent(headlineValue, rows);

  return (
    <section className={styles.result} aria-live="polite">
      <div className={styles.headline}>
        <span className={styles.headlineLabel}>{headlineLabel}</span>
        <strong className={`${styles.headlineNum} num`}>
          {typeof headlineValue === 'number' ? fmt(headlineValue) : headlineValue}
          <em>{headlineUnit}</em>
        </strong>
        {headlineSub && <span className={styles.headlineSub}>{headlineSub}</span>}
      </div>

      <table className={styles.table}>
        <caption className={styles.caption}>{caption}</caption>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.label}-${i}`} className={r.tone ? TONE_CLASS[r.tone] : undefined}>
              {/* span으로 감싸야 항목명 뒤 남는 공간을 점선 리더로 채울 수 있다(CSS ::after) */}
              <th scope="row"><span>{r.label}</span></th>
              <td className="num">
                {r.tone === 'minus' ? '−' : ''}
                {typeof r.value === 'number' ? fmt(r.value) : r.value}
                {r.unit ?? (typeof r.value === 'number' ? '원' : '')}
              </td>
              <td className={styles.basis}>{r.basis ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {footer && <div className={styles.footer}>{footer}</div>}
    </section>
  );
}

/** 이미 센 계산기 경로. 컴포넌트 밖에 두는 이유는 아래 주석 참고. */
const counted = new Set<string>();

/**
 * "이 계산기에서 계산이 일어났다"를 한 번만 알린다.
 *
 * 모든 계산기가 Breakdown을 쓰므로 여기 한 곳에 두면 33종이 전부 덮인다. 계산기마다
 * 이벤트 코드를 넣는 방식은 새 계산기를 만들 때마다 잊어버리기 딱 좋다.
 *
 * 세 가지를 막아야 한다. 전부 실제로 관측하고 고친 것들이다:
 *
 *  1. **폭주** — 결과는 입력할 때마다 다시 계산된다. 숫자를 한 자씩 칠 때마다 보내면
 *     "90000000"을 치는 동안 여덟 번이 나간다. 손을 멈춘 뒤에 한 번만 보낸다.
 *  2. **중복** — 조건을 이리저리 바꿔 보는 것은 계산 한 번이지 여러 번이 아니다.
 *  3. **한 페이지의 계산기 여러 대** — 자동차세 페이지처럼 한 화면에 Breakdown이 둘인
 *     곳이 있다. 컴포넌트마다 세면 2건이 된다. 그래서 기록을 **경로 단위로** 둔다
 *     (ref로 두면 컴포넌트마다 따로 세어 이 경우를 못 막는다).
 *
 * 첫 렌더의 기본값 결과까지 세면 페이지뷰와 다를 게 없어진다. 값이 **바뀐 뒤부터** 센다.
 *
 * 헤드라인 금액만 보지 않고 계산 근거 행까지 지문에 넣는다. 연차수당처럼 조건을 바꿔도
 * 최종 금액은 그대로인 계산기가 있는데(근속연수를 바꿔도 미사용 5일치 수당은 같다),
 * 헤드라인만 보면 그런 계산은 한 번도 세지지 않는다.
 */
function useCalculateEvent(value: number | string, rows: Row[]) {
  const fingerprint = `${value}|${rows.map(r => r.value).join(',')}`;
  const initial = useRef(fingerprint);

  useEffect(() => {
    if (fingerprint === initial.current) return;

    const id = setTimeout(() => {
      const path = window.location.pathname;
      const name = calculatorFromPath(path);
      if (!name || counted.has(path)) return;
      counted.add(path);
      trackCalculate(name);
    }, 1200);
    return () => clearTimeout(id);
  }, [fingerprint]);
}

/** 입력 카드 — 계산기마다 필드 구성이 달라 children으로 받는다. */
export function InputCard({ children }: { children: ReactNode }) {
  return <section className={styles.inputs} aria-label="입력">{children}</section>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {children}
      {hint && <span className={styles.hint}>{hint}</span>}
    </label>
  );
}

export { styles as calcStyles };
