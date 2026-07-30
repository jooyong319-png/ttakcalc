'use client';
import type { ReactNode } from 'react';
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
