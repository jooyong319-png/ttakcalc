'use client';
import { useState, useMemo } from 'react';
import { calcCarTax, calcPropertyTax } from '@/lib/calc/localTax';
import { calcComprehensiveTax, calcYearEnd, calcParentalLeave } from '@/lib/calc/income';
import { Breakdown, InputCard, Field, calcStyles as s } from './Breakdown';
import { AmountInput } from './AmountInput';

const 억 = 100_000_000;
const 만 = 10_000;
const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');

/** Step[] → Breakdown Row[]. tone은 계산 쪽에서 이미 정해서 온다. */
const toRows = (steps: { label: string; value: number | string; basis?: string; tone?: 'minus' | 'total' | 'result' | 'info' }[]) =>
  steps.map(st => ({ label: st.label, value: st.value, basis: st.basis, tone: st.tone }));

/* ─────────────── 자동차세 ─────────────── */
export function CarTaxCalc({ year }: { year: string }) {
  const [cc, setCc] = useState(1998);
  const [ageYears, setAgeYears] = useState(3);
  const [business, setBusiness] = useState(false);
  const r = useMemo(() => calcCarTax({ year, cc, ageYears, business }), [year, cc, ageYears, business]);

  return (
    <>
      <InputCard>
        <Field label="배기량" hint="1,000cc 이하 80원 / 1,600cc 이하 140원 / 초과 200원 (cc당)">
          <AmountInput value={cc} onChange={setCc} unit="cc" step={100} />
        </Field>
        <div className={s.quick}>
          {[998, 1598, 1998, 2497, 2999].map(v => (
            <button key={v} type="button" className={`${s.chip} ${cc === v ? s.chipOn : ''}`} onClick={() => setCc(v)}>
              {fmt(v)}cc
            </button>
          ))}
        </div>
        <div className={s.grid}>
          <Field label="차령" hint="3년째부터 매년 5%씩 경감, 12년 50% 한도">
            <div className={s.row}>
              <input type="number" step={1} min={0} max={30} className={`${s.input} num`} value={ageYears}
                onChange={e => setAgeYears(Math.max(0, Number(e.target.value)))} />
              <span className={s.unit}>년</span>
            </div>
          </Field>
          <Field label="용도">
            <div className={s.segment}>
              <button type="button" className={`${s.segmentBtn} ${!business ? s.segmentBtnOn : ''}`} onClick={() => setBusiness(false)}>비영업용</button>
              <button type="button" className={`${s.segmentBtn} ${business ? s.segmentBtnOn : ''}`} onClick={() => setBusiness(true)}>영업용</button>
            </div>
          </Field>
        </div>
      </InputCard>

      <Breakdown
        headlineLabel="연간 자동차세 (지방교육세 포함)"
        headlineValue={r.total}
        headlineSub={`6월·12월에 ${fmt(r.halfYear)}원씩`}
        rows={[...toRows(r.steps.slice(0, -1)), { label: '연간 총액', value: r.total, tone: 'result' as const }]}
        caption="계산 근거 — 왜 이 금액인지"
        footer={<span>{r.note} · 최종 확인 {r.verifiedAt}</span>}
      />

      <Breakdown
        headlineLabel="1월 연납 시 납부액"
        headlineValue={r.prepayments[0].payable}
        headlineSub={`${fmt(r.prepayments[0].discount)}원 절약`}
        caption="연납 신청 시기별 공제"
        rows={r.prepayments.map(p => ({
          label: `${p.month}월 연납`,
          value: p.payable,
          basis: `공제 ${fmt(p.discount)}원 (연세액 × ${(p.dayRatio * 100).toFixed(1)}% × 5%)`,
          tone: p.month === 1 ? ('result' as const) : undefined,
        }))}
        footer={<span>일찍 신청할수록 공제 대상 기간이 길어 할인이 커집니다 · 위택스에서 신청</span>}
      />
    </>
  );
}

/* ─────────────── 재산세 ─────────────── */
export function PropertyTaxCalc({ year }: { year: string }) {
  const [publicPrice, setPublicPrice] = useState(4 * 억);
  const [oneHouse, setOneHouse] = useState(true);
  const [urbanArea, setUrbanArea] = useState(true);
  const r = useMemo(
    () => calcPropertyTax({ year, publicPrice, oneHouse, urbanArea }),
    [year, publicPrice, oneHouse, urbanArea],
  );

  return (
    <>
      <InputCard>
        <Field label="주택 공시가격" hint="부동산공시가격 알리미에서 조회한 공동주택가격·개별주택가격">
          <AmountInput value={publicPrice} onChange={setPublicPrice} unit="원" step={10_000_000} />
        </Field>
        <div className={s.quick}>
          {[2, 3, 5, 6, 9, 12].map(v => (
            <button key={v} type="button" className={`${s.chip} ${publicPrice === v * 억 ? s.chipOn : ''}`} onClick={() => setPublicPrice(v * 억)}>
              {v}억
            </button>
          ))}
        </div>
        <div className={s.grid}>
          <Field label="1세대 1주택" hint="공정시장가액비율 43~45% + 9억 이하는 특례세율">
            <div className={s.segment}>
              <button type="button" className={`${s.segmentBtn} ${oneHouse ? s.segmentBtnOn : ''}`} onClick={() => setOneHouse(true)}>해당</button>
              <button type="button" className={`${s.segmentBtn} ${!oneHouse ? s.segmentBtnOn : ''}`} onClick={() => setOneHouse(false)}>해당 없음</button>
            </div>
          </Field>
          <Field label="도시지역분" hint="대부분의 시·구 지역이 대상">
            <div className={s.segment}>
              <button type="button" className={`${s.segmentBtn} ${urbanArea ? s.segmentBtnOn : ''}`} onClick={() => setUrbanArea(true)}>부과</button>
              <button type="button" className={`${s.segmentBtn} ${!urbanArea ? s.segmentBtnOn : ''}`} onClick={() => setUrbanArea(false)}>미부과</button>
            </div>
          </Field>
        </div>
      </InputCard>

      <Breakdown
        headlineLabel="연간 재산세 (도시지역분·지방교육세 포함)"
        headlineValue={r.total}
        headlineSub={`7월·9월에 ${fmt(r.half)}원씩`}
        rows={[...toRows(r.steps.slice(0, -1)), { label: '연간 총액', value: r.total, tone: 'result' as const }]}
        footer={
          <span>
            {oneHouse && !r.specialRateApplied ? '공시가격 9억 초과라 1세대 1주택 특례세율은 적용되지 않습니다. ' : ''}
            {r.note} · 최종 확인 {r.verifiedAt}
          </span>
        }
      />
    </>
  );
}

/* ─────────────── 종합소득세 ─────────────── */
export function ComprehensiveTaxCalc({ year }: { year: string }) {
  const [revenue, setRevenue] = useState(40_000_000);
  const [expenseRatePercent, setExpenseRate] = useState(64.1);
  const [dependents, setDependents] = useState(1);
  const [otherDeduction, setOther] = useState(0);
  // 3.3% 중 소득세분은 3% — 총수입금액을 바꾸면 같이 따라오게 기본값을 계산해 둔다
  const [withheldTax, setWithheld] = useState(Math.floor(40_000_000 * 0.03));

  const r = useMemo(
    () => calcComprehensiveTax({ year, revenue, expenseRatePercent, dependents, otherDeduction, withheldTax }),
    [year, revenue, expenseRatePercent, dependents, otherDeduction, withheldTax],
  );

  const setRevenueAndWithheld = (v: number) => {
    setRevenue(v);
    setWithheld(Math.floor(v * 0.03));
  };

  return (
    <>
      <InputCard>
        <Field label="연간 총수입금액" hint="3.3% 떼기 전 계약금액의 합">
          <AmountInput value={revenue} onChange={setRevenueAndWithheld} unit="원" step={1_000_000} />
        </Field>
        <div className={s.quick}>
          {[2000, 3000, 4000, 5000, 7000].map(v => (
            <button key={v} type="button" className={`${s.chip} ${revenue === v * 만 ? s.chipOn : ''}`} onClick={() => setRevenueAndWithheld(v * 만)}>
              {fmt(v)}만
            </button>
          ))}
        </div>
        <Field
          label="필요경비율"
          hint="업종별 단순경비율은 국세청 고시라 이 사이트가 추정하지 않습니다. 홈택스 → 조회/발급 → 기준·단순 경비율에서 본인 업종코드로 확인해 넣으세요."
        >
          <div className={s.row}>
            <input type="number" step={0.1} min={0} max={100} className={`${s.input} num`} value={expenseRatePercent}
              onChange={e => setExpenseRate(Math.min(100, Math.max(0, Number(e.target.value))))} />
            <span className={s.unit}>%</span>
          </div>
        </Field>
        <div className={s.grid}>
          <Field label="부양가족 (본인 포함)">
            <div className={s.row}>
              <input type="number" step={1} min={1} className={`${s.input} num`} value={dependents}
                onChange={e => setDependents(Math.max(1, Number(e.target.value)))} />
              <span className={s.unit}>명</span>
            </div>
          </Field>
          <Field label="그 밖의 소득공제" hint="국민연금 보험료 등">
            <AmountInput value={otherDeduction} onChange={setOther} unit="원" step={100_000} />
          </Field>
        </div>
        <Field label="기납부세액" hint="원천징수된 소득세(3.3% 중 3%분). 총수입금액을 바꾸면 자동으로 다시 계산됩니다.">
          <AmountInput value={withheldTax} onChange={setWithheld} unit="원" step={10_000} />
        </Field>
      </InputCard>

      <Breakdown
        headlineLabel={r.refund ? '환급 예상액' : '추가 납부 예상액'}
        headlineValue={Math.abs(r.balance)}
        headlineSub={`결정세액 ${fmt(r.finalTax)}원 · 기납부 ${fmt(r.withheldTax)}원`}
        rows={[
          ...toRows(r.steps.slice(0, -1)),
          { label: r.refund ? '환급 예상액' : '추가 납부액', value: Math.abs(r.balance), tone: 'result' as const },
        ]}
        footer={<span>지방소득세 {fmt(r.localTax)}원은 별도로 정산됩니다 · 최종 확인 {r.verifiedAt}</span>}
      />
    </>
  );
}

/* ─────────────── 연말정산 환급금 ─────────────── */
export function YearEndCalc({ year }: { year: string }) {
  const [grossSalary, setGross] = useState(50_000_000);
  const [dependents, setDependents] = useState(1);
  const [childrenUnder20, setChildren] = useState(0);
  const [insurancePaid, setInsurance] = useState(4_500_000);
  const [withheldTax, setWithheld] = useState(1_400_000);
  const [specialDeduction, setSpecial] = useState(0);

  const r = useMemo(
    () => calcYearEnd({ year, grossSalary, dependents, childrenUnder20, insurancePaid, withheldTax, specialDeduction }),
    [year, grossSalary, dependents, childrenUnder20, insurancePaid, withheldTax, specialDeduction],
  );

  return (
    <>
      <InputCard>
        <Field label="총급여" hint="원천징수영수증의 '총급여' 항목(비과세 제외)">
          <AmountInput value={grossSalary} onChange={setGross} unit="원" step={1_000_000} />
        </Field>
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
          <Field label="4대보험료 납부액" hint="1년 합계">
            <AmountInput value={insurancePaid} onChange={setInsurance} unit="원" step={100_000} />
          </Field>
        </div>
        <div className={s.grid}>
          <Field label="기납부세액" hint="원천징수영수증의 '기납부세액 - 소득세'">
            <AmountInput value={withheldTax} onChange={setWithheld} unit="원" step={10_000} />
          </Field>
          <Field label="특별공제 합계" hint="0으로 두면 표준세액공제 13만원을 적용합니다">
            <AmountInput value={specialDeduction} onChange={setSpecial} unit="원" step={100_000} />
          </Field>
        </div>
      </InputCard>

      <Breakdown
        headlineLabel={r.refund ? '환급 예상액' : '추가 납부 예상액'}
        headlineValue={Math.abs(r.balance)}
        headlineSub={`결정세액 ${fmt(r.finalTax)}원 · 기납부 ${fmt(r.withheldTax)}원`}
        rows={[
          ...toRows(r.steps.slice(0, -1)),
          { label: r.refund ? '환급 예상액' : '추가 납부액', value: Math.abs(r.balance), tone: 'result' as const },
        ]}
        footer={
          <span>
            의료비·교육비·기부금·신용카드 공제는 사람마다 달라 자동으로 넣지 않습니다.
            홈택스 간소화 자료의 합계를 &lsquo;특별공제 합계&rsquo;에 넣으면 더 정확해집니다 · 최종 확인 {r.verifiedAt}
          </span>
        }
      />
    </>
  );
}

/* ─────────────── 육아휴직급여 ─────────────── */
export function ParentalLeaveCalc({ year }: { year: string }) {
  const [wage, setWage] = useState(3_000_000);
  const [months, setMonths] = useState(12);
  const r = useMemo(() => calcParentalLeave(wage, months, year), [wage, months, year]);

  return (
    <>
      <InputCard>
        <Field label="월 통상임금" hint="육아휴직 시작일 기준. 기본급 + 고정수당">
          <AmountInput value={wage} onChange={setWage} unit="원" step={100_000} />
        </Field>
        <div className={s.quick}>
          {[200, 250, 300, 350, 400].map(v => (
            <button key={v} type="button" className={`${s.chip} ${wage === v * 만 ? s.chipOn : ''}`} onClick={() => setWage(v * 만)}>
              {fmt(v)}만
            </button>
          ))}
        </div>
        <Field label="휴직 기간">
          <div className={s.row}>
            <input type="number" step={1} min={1} max={12} className={`${s.input} num`} value={months}
              onChange={e => setMonths(Math.min(12, Math.max(1, Number(e.target.value))))} />
            <span className={s.unit}>개월</span>
          </div>
        </Field>
      </InputCard>

      <Breakdown
        headlineLabel={`${months}개월 총 수령액`}
        headlineValue={r.total}
        headlineSub={`월 평균 ${fmt(r.monthlyAverage)}원`}
        rows={[...toRows(r.steps.slice(0, -1)), { label: `${months}개월 총액`, value: r.total, tone: 'result' as const }]}
        footer={<span>{r.note} · 최종 확인 {r.verifiedAt}</span>}
      />

      <Breakdown
        headlineLabel="월별 지급액"
        headlineValue={r.months[0]?.benefit ?? 0}
        headlineSub="첫 달 기준"
        caption="개월별 급여"
        rows={r.months.map(m => ({
          label: `${m.month}개월째`,
          value: m.benefit,
          basis: `통상임금의 ${m.rate * 100}%`
            + (m.capped === 'max' ? ' → 상한 적용' : m.capped === 'min' ? ' → 하한 적용' : ''),
        }))}
      />
    </>
  );
}
