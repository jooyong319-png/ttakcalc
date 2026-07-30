'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { calcSalary } from '@/lib/calc/salary';
import styles from './SalaryCalculator.module.css';

interface Props {
  years: string[];
  defaultYear: string;
}

const fmt = (n: number) => n.toLocaleString('ko-KR');

export function SalaryCalculator({ years, defaultYear }: Props) {
  const [annual, setAnnual] = useState(50_000_000);
  const [year, setYear] = useState(defaultYear);
  const [dependents, setDependents] = useState(1);
  const [children, setChildren] = useState(0);
  const [nonTaxable, setNonTaxable] = useState(200_000);
  const [copied, setCopied] = useState(false);

  // URL 파라미터로 들어오면 그 값으로 시작 — 결과 공유 링크가 실제로 재현되게.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const n = (k: string, d: number) => {
      const v = Number(q.get(k));
      return Number.isFinite(v) && v > 0 ? v : d;
    };
    if (q.get('annual')) setAnnual(n('annual', 50_000_000));
    if (q.get('dep')) setDependents(n('dep', 1));
    if (q.get('child')) setChildren(Number(q.get('child')) || 0);
    if (q.get('nt')) setNonTaxable(Number(q.get('nt')) || 0);
    const y = q.get('year');
    if (y && years.includes(y)) setYear(y);
  }, [years]);

  const result = useMemo(
    () => calcSalary({
      annualSalary: annual, year,
      dependents, childrenUnder20: children,
      monthlyNonTaxable: nonTaxable,
    }),
    [annual, year, dependents, children, nonTaxable],
  );

  const share = useCallback(async () => {
    const q = new URLSearchParams({
      annual: String(annual), year, dep: String(dependents),
      child: String(children), nt: String(nonTaxable),
    });
    const url = `${window.location.origin}${window.location.pathname}?${q}`;
    try {
      await navigator.clipboard.writeText(url);
      window.history.replaceState(null, '', `?${q}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* 클립보드 거부 시 무시 */ }
  }, [annual, year, dependents, children, nonTaxable]);

  return (
    <div className={styles.wrap}>
      <section className={styles.inputs} aria-label="입력">
        <label className={styles.field}>
          <span className={styles.label}>연봉 (세전)</span>
          <div className={styles.inputRow}>
            <input
              type="number" inputMode="numeric" min={0} step={1_000_000}
              value={annual}
              onChange={e => setAnnual(Math.max(0, Number(e.target.value)))}
              className={`${styles.input} num`}
            />
            <span className={styles.unit}>원</span>
          </div>
          <div className={styles.quick}>
            {[30, 40, 50, 60, 80, 100].map(m => (
              <button key={m} type="button" className={styles.chip}
                onClick={() => setAnnual(m * 1_000_000 * 10 / 10)}>
                {m >= 100 ? '1억' : `${m}00만`}
              </button>
            ))}
          </div>
        </label>

        <div className={styles.grid}>
          <label className={styles.field}>
            <span className={styles.label}>적용 연도</span>
            <select className={styles.input} value={year} onChange={e => setYear(e.target.value)}>
              {years.map(y => <option key={y} value={y}>{y}년</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>부양가족 (본인 포함)</span>
            <input type="number" min={1} max={20} value={dependents}
              onChange={e => setDependents(Math.max(1, Number(e.target.value)))}
              className={`${styles.input} num`} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>20세 이하 자녀</span>
            <input type="number" min={0} max={10} value={children}
              onChange={e => setChildren(Math.max(0, Number(e.target.value)))}
              className={`${styles.input} num`} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>월 비과세액 (식대 등)</span>
            <input type="number" min={0} step={10_000} value={nonTaxable}
              onChange={e => setNonTaxable(Math.max(0, Number(e.target.value)))}
              className={`${styles.input} num`} />
          </label>
        </div>
      </section>

      <section className={styles.result} aria-live="polite">
        <div className={styles.headline}>
          <span className={styles.headlineLabel}>월 실수령액</span>
          <strong className={`${styles.headlineNum} num`}>{fmt(result.monthlyNet)}<em>원</em></strong>
          <span className={styles.headlineSub}>
            연 {fmt(result.annualNet)}원 · 세전 대비 공제 {(result.deductionRate * 100).toFixed(1)}%
          </span>
        </div>

        {/* 차별화 핵심: 결과 숫자만 던지지 않고 어떻게 나왔는지 전부 보여준다 */}
        <table className={styles.table}>
          <caption className={styles.caption}>공제 내역 — 왜 이 금액인지</caption>
          <tbody>
            <tr className={styles.rowGross}>
              <th scope="row">월 급여 (세전)</th>
              <td className="num">{fmt(result.monthlyGross)}원</td>
              <td className={styles.basis}>연봉 {fmt(annual)}원 ÷ 12</td>
            </tr>
            <tr className={styles.rowInfo}>
              <th scope="row">비과세 제외</th>
              <td className="num">−{fmt(result.monthlyNonTaxable)}원</td>
              <td className={styles.basis}>과세 대상 급여 {fmt(result.monthlyTaxable)}원</td>
            </tr>
            {result.deductions.map(d => (
              <tr key={d.key}>
                <th scope="row">{d.name}</th>
                <td className={`num ${styles.minus}`}>−{fmt(d.amount)}원</td>
                <td className={styles.basis}>{d.basis}</td>
              </tr>
            ))}
            <tr className={styles.rowTotal}>
              <th scope="row">공제 합계</th>
              <td className={`num ${styles.minus}`}>−{fmt(result.totalDeduction)}원</td>
              <td className={styles.basis} />
            </tr>
            <tr className={styles.rowNet}>
              <th scope="row">실수령액</th>
              <td className="num">{fmt(result.monthlyNet)}원</td>
              <td className={styles.basis} />
            </tr>
          </tbody>
        </table>

        <div className={styles.actions}>
          <button type="button" onClick={share} className={styles.shareBtn}>
            {copied ? '링크 복사됨 ✓' : '이 계산 결과 링크 복사'}
          </button>
          <span className={styles.verified}>
            {year}년 기준 · 최종 확인 {result.verifiedAt}
          </span>
        </div>
      </section>
    </div>
  );
}
