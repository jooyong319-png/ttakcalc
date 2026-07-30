'use client';
import { useState, useMemo } from 'react';
import { calcSeverance, calcFreelancer, calcUnemployment, calcHolidayPay } from '@/lib/calc/labor';
import { Breakdown, InputCard, Field, calcStyles as s } from './Breakdown';

const today = () => new Date().toISOString().slice(0, 10);
const yearsAgo = (n: number) => {
  const d = new Date(); d.setFullYear(d.getFullYear() - n);
  return d.toISOString().slice(0, 10);
};

/* ─────────────── 퇴직금 ─────────────── */
export function SeveranceCalc({ year }: { year: string }) {
  const [joinDate, setJoinDate] = useState(yearsAgo(3));
  const [leaveDate, setLeaveDate] = useState(today());
  const [monthlySalary, setMonthlySalary] = useState(3_500_000);
  const [annualBonus, setAnnualBonus] = useState(0);
  const [annualLeavePay, setAnnualLeavePay] = useState(0);

  const r = useMemo(
    () => calcSeverance({ year, joinDate, leaveDate, monthlySalary, annualBonus, annualLeavePay }),
    [year, joinDate, leaveDate, monthlySalary, annualBonus, annualLeavePay],
  );

  return (
    <>
      <InputCard>
        <div className={s.grid}>
          <Field label="입사일"><input type="date" className={s.input} value={joinDate} onChange={e => setJoinDate(e.target.value)} /></Field>
          <Field label="퇴사일" hint="마지막 근무일의 다음날">
            <input type="date" className={s.input} value={leaveDate} onChange={e => setLeaveDate(e.target.value)} />
          </Field>
        </div>
        <Field label="퇴직 전 3개월 월평균 임금 (세전)" hint="기본급 + 고정수당 등 매월 받는 임금">
          <input type="number" step={100000} className={`${s.input} num`} value={monthlySalary}
            onChange={e => setMonthlySalary(Math.max(0, Number(e.target.value)))} />
        </Field>
        <div className={s.grid}>
          <Field label="연간 상여금" hint="퇴직 전 1년간 받은 총액">
            <input type="number" step={100000} className={`${s.input} num`} value={annualBonus}
              onChange={e => setAnnualBonus(Math.max(0, Number(e.target.value)))} />
          </Field>
          <Field label="연차수당" hint="퇴직 전 1년치">
            <input type="number" step={100000} className={`${s.input} num`} value={annualLeavePay}
              onChange={e => setAnnualLeavePay(Math.max(0, Number(e.target.value)))} />
          </Field>
        </div>
      </InputCard>

      {!r.eligible && (
        <p style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.8rem 1rem', fontSize: '0.88rem', color: 'var(--danger)', margin: 0 }}>
          ⚠️ {r.reason}
        </p>
      )}
      <Breakdown
        headlineLabel="예상 퇴직금"
        headlineValue={r.severance}
        headlineSub={`재직 ${r.serviceDays.toLocaleString()}일 · 1일 평균임금 ${Math.round(r.avgDailyWage).toLocaleString()}원`}
        rows={r.steps.map(st => ({ label: st.label, value: st.value, basis: st.basis, tone: st.label === '퇴직금' ? 'result' as const : undefined }))}
        footer={<span>3개월을 91.25일(365÷4)로 환산한 근사치 · {year}년 기준 · 최종 확인 {r.verifiedAt}</span>}
      />
    </>
  );
}

/* ─────────────── 프리랜서 3.3% ─────────────── */
export function FreelancerCalc({ year }: { year: string }) {
  const [amount, setAmount] = useState(3_000_000);
  const [mode, setMode] = useState<'gross' | 'net'>('gross');
  const r = useMemo(() => calcFreelancer(amount, year, mode), [amount, year, mode]);

  return (
    <>
      <InputCard>
        <Field label="계산 방식">
          <div className={s.segment}>
            <button type="button" className={`${s.segmentBtn} ${mode === 'gross' ? s.segmentBtnOn : ''}`} onClick={() => setMode('gross')}>
              계약금액 → 실수령
            </button>
            <button type="button" className={`${s.segmentBtn} ${mode === 'net' ? s.segmentBtnOn : ''}`} onClick={() => setMode('net')}>
              실수령 → 계약금액
            </button>
          </div>
        </Field>
        <Field label={mode === 'gross' ? '계약금액 (세전)' : '받고 싶은 실수령액'}>
          <div className={s.row}>
            <input type="number" step={100000} className={`${s.input} num`} value={amount}
              onChange={e => setAmount(Math.max(0, Number(e.target.value)))} />
            <span className={s.unit}>원</span>
          </div>
        </Field>
        <div className={s.quick}>
          {[1_000_000, 2_000_000, 3_000_000, 5_000_000, 10_000_000].map(v => (
            <button key={v} type="button" className={s.chip} onClick={() => setAmount(v)}>
              {(v / 10000).toLocaleString()}만
            </button>
          ))}
        </div>
      </InputCard>

      <Breakdown
        headlineLabel={mode === 'gross' ? '실수령액' : '필요한 계약금액'}
        headlineValue={mode === 'gross' ? r.net : r.gross}
        headlineSub={`원천징수 ${r.totalTax.toLocaleString()}원 (3.3%)`}
        rows={r.steps.map(st => ({
          label: st.label, value: st.value, basis: st.basis,
          tone: st.label === '실수령액' ? 'result' as const
              : st.label.includes('세') ? 'minus' as const : undefined,
        }))}
        footer={<span>5월 종합소득세 신고로 정산(환급 또는 추가납부) · 최종 확인 {r.verifiedAt}</span>}
      />
    </>
  );
}

/* ─────────────── 실업급여 ─────────────── */
export function UnemploymentCalc({ year }: { year: string }) {
  const [monthlySalary, setMonthlySalary] = useState(3_000_000);
  const [insuredYears, setInsuredYears] = useState(3);
  const [age50, setAge50] = useState(false);
  const r = useMemo(() => calcUnemployment(monthlySalary, year, insuredYears, age50), [monthlySalary, year, insuredYears, age50]);

  return (
    <>
      <InputCard>
        <Field label="퇴직 전 3개월 월평균 임금 (세전)">
          <div className={s.row}>
            <input type="number" step={100000} className={`${s.input} num`} value={monthlySalary}
              onChange={e => setMonthlySalary(Math.max(0, Number(e.target.value)))} />
            <span className={s.unit}>원</span>
          </div>
        </Field>
        <div className={s.grid}>
          <Field label="고용보험 가입기간" hint="이직 전 총 피보험 단위기간">
            <div className={s.row}>
              <input type="number" min={0} max={40} className={`${s.input} num`} value={insuredYears}
                onChange={e => setInsuredYears(Math.max(0, Number(e.target.value)))} />
              <span className={s.unit}>년</span>
            </div>
          </Field>
          <Field label="연령" hint="이직일 기준">
            <div className={s.segment}>
              <button type="button" className={`${s.segmentBtn} ${!age50 ? s.segmentBtnOn : ''}`} onClick={() => setAge50(false)}>50세 미만</button>
              <button type="button" className={`${s.segmentBtn} ${age50 ? s.segmentBtnOn : ''}`} onClick={() => setAge50(true)}>50세 이상·장애인</button>
            </div>
          </Field>
        </div>
      </InputCard>

      {r.boundsConflict && (
        <p style={{ background: 'var(--bg-sunken)', border: '1px solid var(--danger)', borderRadius: 8, padding: '0.8rem 1rem', fontSize: '0.86rem', color: 'var(--danger)', margin: 0 }}>
          ⚠️ 현재 적용된 데이터에서 <strong>하한액이 상한액보다 큽니다</strong>(최저임금 인상분이 상한액에
          아직 반영되지 않은 상태). 저소득자가 불리해지지 않도록 하한 보장을 우선 적용했습니다.
          공식 고시 확인 후 상한액을 갱신할 예정입니다.
        </p>
      )}
      <Breakdown
        headlineLabel="총 예상 수령액"
        headlineValue={r.total}
        headlineSub={`1일 ${r.dailyBenefit.toLocaleString()}원 × ${r.durationDays}일 · 월 약 ${r.monthlyApprox.toLocaleString()}원`}
        rows={r.steps.map(st => ({
          label: st.label, value: st.value, basis: st.basis,
          tone: st.label === '총 예상 수령액' ? 'result' as const : undefined,
        }))}
        footer={<span>실제 수급 자격·금액은 고용센터 판단에 따릅니다 · 최종 확인 {r.verifiedAt}</span>}
      />
    </>
  );
}

/* ─────────────── 주휴수당 ─────────────── */
export function HolidayPayCalc({ year, minimumWage }: { year: string; minimumWage: number }) {
  const [hourlyWage, setHourlyWage] = useState(minimumWage);
  const [weeklyHours, setWeeklyHours] = useState(20);
  const r = useMemo(() => calcHolidayPay(hourlyWage, weeklyHours, year), [hourlyWage, weeklyHours, year]);

  return (
    <>
      <InputCard>
        <div className={s.grid}>
          <Field label="시급" hint={`${year}년 최저시급 ${minimumWage.toLocaleString()}원`}>
            <div className={s.row}>
              <input type="number" step={10} className={`${s.input} num`} value={hourlyWage}
                onChange={e => setHourlyWage(Math.max(0, Number(e.target.value)))} />
              <span className={s.unit}>원</span>
            </div>
          </Field>
          <Field label="주 소정근로시간" hint="15시간 이상이어야 발생">
            <div className={s.row}>
              <input type="number" min={0} max={68} step={1} className={`${s.input} num`} value={weeklyHours}
                onChange={e => setWeeklyHours(Math.max(0, Number(e.target.value)))} />
              <span className={s.unit}>시간</span>
            </div>
          </Field>
        </div>
        <div className={s.quick}>
          {[15, 20, 30, 40].map(h => (
            <button key={h} type="button" className={`${s.chip} ${weeklyHours === h ? s.chipOn : ''}`} onClick={() => setWeeklyHours(h)}>
              주 {h}시간
            </button>
          ))}
        </div>
      </InputCard>

      {!r.eligible && (
        <p style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.8rem 1rem', fontSize: '0.88rem', color: 'var(--danger)', margin: 0 }}>
          ⚠️ {r.reason}
        </p>
      )}
      {r.belowMinimum && (
        <p style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.8rem 1rem', fontSize: '0.88rem', color: 'var(--danger)', margin: 0 }}>
          ⚠️ 입력한 시급이 {year}년 최저시급({minimumWage.toLocaleString()}원)보다 낮습니다.
        </p>
      )}
      <Breakdown
        headlineLabel="주휴수당 (1주)"
        headlineValue={r.weeklyHolidayPay}
        headlineSub={`월 환산 약 ${r.monthlyApprox.toLocaleString()}원`}
        rows={r.steps.map(st => ({
          label: st.label, value: st.value, basis: st.basis,
          tone: st.label === '주휴수당(1주)' ? 'result' as const : undefined,
        }))}
        footer={<span>{year}년 기준 · 최종 확인 {r.verifiedAt}</span>}
      />
    </>
  );
}
