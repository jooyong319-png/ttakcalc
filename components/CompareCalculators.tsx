'use client';
import { useState, useMemo } from 'react';
import { calcReverseSalary, calcEmployerCost, calcEmploymentCompare } from '@/lib/calc/compare';
import { getRates } from '@/lib/rates';
import { Breakdown, InputCard, Field, calcStyles as s } from './Breakdown';
import { AmountInput } from './AmountInput';

const 만 = 10_000;
const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');

const toRows = (steps: { label: string; value: number | string; basis?: string; tone?: 'minus' | 'total' | 'result' | 'info' }[]) =>
  steps.map(st => ({ label: st.label, value: st.value, basis: st.basis, tone: st.tone }));

/* ─────────────── 역산: 실수령액 → 연봉 ─────────────── */
export function ReverseSalaryCalc({ year }: { year: string }) {
  const nonTaxableMax = getRates(year).nonTaxable.mealAllowanceMonthlyMax;
  const [targetNet, setTargetNet] = useState(3_000_000);
  const [dependents, setDependents] = useState(1);
  const [childrenUnder20, setChildren] = useState(0);
  const [monthlyNonTaxable, setNonTaxable] = useState(nonTaxableMax);

  const r = useMemo(
    () => calcReverseSalary({ year, targetNet, dependents, childrenUnder20, monthlyNonTaxable }),
    [year, targetNet, dependents, childrenUnder20, monthlyNonTaxable],
  );

  return (
    <>
      <InputCard>
        <Field label="목표 월 실수령액" hint="통장에 찍히기를 바라는 금액">
          <AmountInput value={targetNet} onChange={setTargetNet} unit="원" step={100_000} />
        </Field>
        <div className={s.quick}>
          {[200, 250, 300, 350, 400, 500].map(v => (
            <button key={v} type="button" className={`${s.chip} ${targetNet === v * 만 ? s.chipOn : ''}`} onClick={() => setTargetNet(v * 만)}>
              {fmt(v)}만
            </button>
          ))}
        </div>
        <div className={s.grid3}>
          <Field label="부양가족 (본인 포함)">
            <div className={s.row}>
              <input type="number" step={1} min={1} className={`${s.input} num`} value={dependents}
                onChange={e => setDependents(Math.max(1, Number(e.target.value)))} />
              <span className={s.unit}>명</span>
            </div>
          </Field>
          <Field label="8세 이상 자녀">
            <div className={s.row}>
              <input type="number" step={1} min={0} className={`${s.input} num`} value={childrenUnder20}
                onChange={e => setChildren(Math.max(0, Number(e.target.value)))} />
              <span className={s.unit}>명</span>
            </div>
          </Field>
          <Field label="월 비과세액" hint={`식대 한도 ${fmt(nonTaxableMax)}원`}>
            <AmountInput value={monthlyNonTaxable} onChange={setNonTaxable} unit="원" step={10_000} />
          </Field>
        </div>
      </InputCard>

      <Breakdown
        headlineLabel="필요한 세전 연봉"
        headlineValue={r.annualSalary}
        headlineSub={`월 ${fmt(r.actual.monthlyGross)}원 · 공제율 ${(r.actual.deductionRate * 100).toFixed(1)}%`}
        rows={toRows(r.steps)}
        caption="계산 근거 — 왜 이 연봉인지"
        footer={
          <span>
            누진세라 역함수가 없어 이분 탐색으로 되짚습니다. 연봉은 협상 단위에 맞춰 만원 단위로
            올림하므로 실제 실수령액이 목표보다 조금 많을 수 있습니다 · 최종 확인 {r.verifiedAt}
          </span>
        }
      />
    </>
  );
}

/* ─────────────── 4대보험 사업주 부담 ─────────────── */
export function EmployerCostCalc({ year }: { year: string }) {
  const rates = getRates(year);
  const tiers = rates.employer.employmentStability;
  const [monthlySalary, setSalary] = useState(3_000_000);
  const [monthlyNonTaxable, setNonTaxable] = useState(rates.nonTaxable.mealAllowanceMonthlyMax);
  const [stabilityTierIndex, setTier] = useState(0);
  const [accidentRatePercent, setAccident] = useState(0.7);

  const r = useMemo(
    () => calcEmployerCost({ year, monthlySalary, monthlyNonTaxable, stabilityTierIndex, accidentRatePercent }),
    [year, monthlySalary, monthlyNonTaxable, stabilityTierIndex, accidentRatePercent],
  );

  return (
    <>
      <InputCard>
        <Field label="직원 월 급여 (세전)">
          <AmountInput value={monthlySalary} onChange={setSalary} unit="원" step={100_000} />
        </Field>
        <div className={s.quick}>
          {[250, 300, 350, 400, 500].map(v => (
            <button key={v} type="button" className={`${s.chip} ${monthlySalary === v * 만 ? s.chipOn : ''}`} onClick={() => setSalary(v * 만)}>
              {fmt(v)}만
            </button>
          ))}
        </div>
        <Field label="사업 규모" hint="고용안정·직업능력개발사업 요율이 달라집니다 (사업주 전액 부담)">
          <select className={s.select} value={stabilityTierIndex} onChange={e => setTier(Number(e.target.value))}>
            {tiers.map((t, idx) => (
              <option key={t.label} value={idx}>{t.label} — {(t.rate * 100).toFixed(2)}%</option>
            ))}
          </select>
        </Field>
        <div className={s.grid}>
          <Field label="산재보험료율" hint="업종별 고시. 근로복지공단에서 본인 사업 종류로 확인하세요.">
            <div className={s.row}>
              <input type="number" step={0.1} min={0} className={`${s.input} num`} value={accidentRatePercent}
                onChange={e => setAccident(Math.max(0, Number(e.target.value)))} />
              <span className={s.unit}>%</span>
            </div>
          </Field>
          <Field label="월 비과세액" hint="식대 등">
            <AmountInput value={monthlyNonTaxable} onChange={setNonTaxable} unit="원" step={10_000} />
          </Field>
        </div>
      </InputCard>

      <Breakdown
        headlineLabel="직원 1명의 실제 월 인건비"
        headlineValue={r.totalCost}
        headlineSub={`급여 대비 +${(r.overheadRate * 100).toFixed(1)}%`}
        rows={toRows(r.steps)}
        footer={<span>{r.note} · 최종 확인 {r.verifiedAt}</span>}
      />

      <Breakdown
        headlineLabel="회사가 쓰는 돈 vs 직원이 받는 돈"
        headlineValue={r.totalCost - r.employeeNet}
        headlineSub="그 차이가 4대보험과 세금으로 갑니다"
        caption="같은 급여, 다른 숫자"
        rows={[
          { label: '회사가 쓰는 돈', value: r.totalCost, basis: '급여 + 사업주 부담 보험료' },
          { label: '직원이 받는 돈', value: r.employeeNet, basis: '부양가족 1명 기준 실수령액' },
          { label: '차이', value: r.totalCost - r.employeeNet, tone: 'result' },
        ]}
        footer={<span>직원 쪽 실수령액은 부양가족 1명·자녀 없음 기준입니다</span>}
      />
    </>
  );
}

/* ─────────────── 정규직 vs 프리랜서 ─────────────── */
export function EmploymentCompareCalc({ year }: { year: string }) {
  const nonTaxableMax = getRates(year).nonTaxable.mealAllowanceMonthlyMax;
  const [amount, setAmount] = useState(3_000_000);
  const [monthlyNonTaxable, setNonTaxable] = useState(nonTaxableMax);
  const r = useMemo(
    () => calcEmploymentCompare(amount, year, monthlyNonTaxable),
    [amount, year, monthlyNonTaxable],
  );

  return (
    <>
      <InputCard>
        <Field label="월 계약금액" hint="두 경우 모두 같은 금액을 받는다고 가정합니다">
          <AmountInput value={amount} onChange={setAmount} unit="원" step={100_000} />
        </Field>
        <div className={s.quick}>
          {[250, 300, 400, 500, 700].map(v => (
            <button key={v} type="button" className={`${s.chip} ${amount === v * 만 ? s.chipOn : ''}`} onClick={() => setAmount(v * 만)}>
              {fmt(v)}만
            </button>
          ))}
        </div>
        <Field label="월 비과세액 (정규직)" hint={`식대 한도 ${fmt(nonTaxableMax)}원. 프리랜서에는 적용되지 않습니다.`}>
          <AmountInput value={monthlyNonTaxable} onChange={setNonTaxable} unit="원" step={10_000} />
        </Field>
      </InputCard>

      <Breakdown
        headlineLabel={r.monthlyDiff > 0 ? '프리랜서가 매달 더 받는 금액' : '정규직이 매달 더 받는 금액'}
        headlineValue={Math.abs(r.monthlyDiff)}
        headlineSub={`연 ${fmt(Math.abs(r.annualDiff))}원 차이`}
        rows={toRows(r.steps)}
        footer={
          <span>
            프리랜서는 5월 종합소득세로 다시 정산됩니다. 경비가 적으면 오히려 더 낼 수도 있습니다 ·
            최종 확인 {r.verifiedAt}
          </span>
        }
      />

      <Breakdown
        headlineLabel="숫자에 안 나오는 것"
        headlineValue="4대보험 · 퇴직금 · 연차"
        headlineUnit=""
        caption="비교할 때 같이 봐야 할 것"
        rows={[
          { label: '4대보험', value: '정규직만', basis: '국민연금·건강보험은 회사가 절반을 더 낸다. 프리랜서는 지역가입자로 전액 본인 부담', tone: 'info' },
          { label: '퇴직금', value: '정규직만', basis: '1년 이상 근무 시 30일분 이상의 평균임금', tone: 'info' },
          { label: '연차·주휴수당', value: '정규직만', basis: '근로기준법 적용 대상이 아니면 발생하지 않는다', tone: 'info' },
          { label: '실업급여', value: '정규직만', basis: '고용보험 가입 이력이 있어야 받을 수 있다', tone: 'info' },
        ]}
        footer={<span>당장의 실수령액만 보고 고르면 대체로 손해입니다</span>}
      />
    </>
  );
}
