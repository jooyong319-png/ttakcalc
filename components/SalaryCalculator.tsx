'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { calcSalary } from '@/lib/calc/salary';
import { Breakdown, InputCard, Field, calcStyles as s, type Row } from './Breakdown';

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

  // URL 파라미터로 들어오면 그 값으로 시작 — 공유 링크가 실제로 재현되게.
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

  const rows: Row[] = [
    { label: '월 급여 (세전)', value: result.monthlyGross, basis: `연봉 ${fmt(annual)}원 ÷ 12` },
    { label: '비과세 제외', value: result.monthlyNonTaxable, tone: 'info',
      basis: `과세 대상 급여 ${fmt(result.monthlyTaxable)}원` },
    ...result.deductions.map(d => ({ label: d.name, value: d.amount, basis: d.basis, tone: 'minus' as const })),
    { label: '공제 합계', value: result.totalDeduction, tone: 'total' },
    { label: '실수령액', value: result.monthlyNet, tone: 'result' },
  ];

  return (
    <>
      <InputCard>
        <Field label="연봉 (세전)">
          <div className={s.row}>
            <input
              type="number" inputMode="numeric" min={0} step={1_000_000}
              value={annual}
              onChange={e => setAnnual(Math.max(0, Number(e.target.value)))}
              className={s.input}
            />
            <span className={s.unit}>원</span>
          </div>
          <div className={s.quick} style={{ marginTop: '0.5rem' }}>
            {[30, 40, 50, 60, 80, 100].map(m => (
              <button key={m} type="button"
                className={`${s.chip} ${annual === m * 1_000_000 ? s.chipOn : ''}`}
                onClick={() => setAnnual(m * 1_000_000)}>
                {m >= 100 ? '1억' : `${m}00만`}
              </button>
            ))}
          </div>
        </Field>

        <div className={s.grid}>
          <Field label="적용 연도">
            <select className={s.select} value={year} onChange={e => setYear(e.target.value)}>
              {years.map(y => <option key={y} value={y}>{y}년</option>)}
            </select>
          </Field>
          <Field label="부양가족 (본인 포함)">
            <input type="number" min={1} max={20} value={dependents}
              onChange={e => setDependents(Math.max(1, Number(e.target.value)))}
              className={s.input} />
          </Field>
          <Field label="20세 이하 자녀">
            <input type="number" min={0} max={10} value={children}
              onChange={e => setChildren(Math.max(0, Number(e.target.value)))}
              className={s.input} />
          </Field>
          <Field label="월 비과세액 (식대 등)">
            <input type="number" min={0} step={10_000} value={nonTaxable}
              onChange={e => setNonTaxable(Math.max(0, Number(e.target.value)))}
              className={s.input} />
          </Field>
        </div>
      </InputCard>

      <Breakdown
        headlineLabel="월 실수령액"
        headlineValue={result.monthlyNet}
        headlineSub={`연 ${fmt(result.annualNet)}원 · 공제율 ${(result.deductionRate * 100).toFixed(1)}%`}
        caption="공제 내역 — 왜 이 금액인지"
        rows={rows}
        footer={
          <>
            <button type="button" onClick={share} className={s.shareBtn}>
              {copied ? '링크 복사됨 ✓' : '이 결과 링크 복사'}
            </button>
            <span>{year}년 기준 · 최종 확인 {result.verifiedAt}</span>
          </>
        }
      />
    </>
  );
}
