'use client';
import { useState, useMemo } from 'react';
import { calcAcquisitionTax, calcBrokerage, calcLoan, type LoanMethod } from '@/lib/calc/property';
import { Breakdown, InputCard, Field, calcStyles as s } from './Breakdown';
import { AmountInput } from './AmountInput';

const 억 = 100_000_000;

/* ─────────────── 취득세 ─────────────── */
export function AcquisitionTaxCalc({ year }: { year: string }) {
  const [price, setPrice] = useState(5 * 억);
  const [areaSqm, setAreaSqm] = useState(84);
  const [houseCount, setHouseCount] = useState<1 | 2 | 3>(1);
  const [regulated, setRegulated] = useState(false);

  const r = useMemo(
    () => calcAcquisitionTax({ year, price, areaSqm, houseCount, regulated }),
    [year, price, areaSqm, houseCount, regulated],
  );

  return (
    <>
      <InputCard>
        <Field label="취득가액">
          <AmountInput value={price} onChange={setPrice} unit="원" step={10_000_000} />
        </Field>
        <div className={s.quick}>
          {[3, 5, 6, 9, 12, 15].map(v => (
            <button key={v} type="button" className={`${s.chip} ${price === v * 억 ? s.chipOn : ''}`} onClick={() => setPrice(v * 억)}>
              {v}억
            </button>
          ))}
        </div>
        <div className={s.grid}>
          <Field label="전용면적" hint="85㎡ 초과 시 농어촌특별세 0.2% 추가">
            <div className={s.row}>
              <input type="number" step={1} className={`${s.input} num`} value={areaSqm}
                onChange={e => setAreaSqm(Math.max(0, Number(e.target.value)))} />
              <span className={s.unit}>㎡</span>
            </div>
          </Field>
          <Field label="취득 후 주택 수">
            <select className={s.select} value={houseCount} onChange={e => setHouseCount(Number(e.target.value) as 1 | 2 | 3)}>
              <option value={1}>1주택</option>
              <option value={2}>2주택</option>
              <option value={3}>3주택 이상</option>
            </select>
          </Field>
        </div>
        {houseCount === 2 && (
          <Field label="조정대상지역 여부" hint="조정대상지역 2주택은 8% 중과">
            <div className={s.segment}>
              <button type="button" className={`${s.segmentBtn} ${!regulated ? s.segmentBtnOn : ''}`} onClick={() => setRegulated(false)}>비조정</button>
              <button type="button" className={`${s.segmentBtn} ${regulated ? s.segmentBtnOn : ''}`} onClick={() => setRegulated(true)}>조정대상지역</button>
            </div>
          </Field>
        )}
      </InputCard>

      <Breakdown
        headlineLabel="총 납부액 (취득세 + 부가세목)"
        headlineValue={r.total}
        headlineSub={`실효세율 ${(r.effectiveRate * 100).toFixed(2)}%`}
        rows={r.steps.map(st => ({
          label: st.label, value: st.value, basis: st.basis,
          tone: st.label === '총 납부액' ? 'result' as const : undefined,
        }))}
        footer={<span>{r.note} · 최종 확인 {r.verifiedAt}</span>}
      />
    </>
  );
}

/* ─────────────── 중개보수 ─────────────── */
export function BrokerageCalc({ year }: { year: string }) {
  const [amount, setAmount] = useState(5 * 억);
  const [type, setType] = useState<'sale' | 'lease'>('sale');
  const [includeVat, setIncludeVat] = useState(true);
  const r = useMemo(() => calcBrokerage(amount, year, type, includeVat), [amount, year, type, includeVat]);

  return (
    <>
      <InputCard>
        <Field label="거래 유형">
          <div className={s.segment}>
            <button type="button" className={`${s.segmentBtn} ${type === 'sale' ? s.segmentBtnOn : ''}`} onClick={() => setType('sale')}>매매·교환</button>
            <button type="button" className={`${s.segmentBtn} ${type === 'lease' ? s.segmentBtnOn : ''}`} onClick={() => setType('lease')}>임대차</button>
          </div>
        </Field>
        <Field label="거래금액" hint={type === 'lease' ? '월세는 (보증금 + 월세×100)으로 환산해 입력' : undefined}>
          <AmountInput value={amount} onChange={setAmount} unit="원" step={10_000_000} />
        </Field>
        <div className={s.quick}>
          {[1, 3, 5, 9, 12, 15].map(v => (
            <button key={v} type="button" className={`${s.chip} ${amount === v * 억 ? s.chipOn : ''}`} onClick={() => setAmount(v * 억)}>
              {v}억
            </button>
          ))}
        </div>
        <Field label="부가가치세">
          <div className={s.segment}>
            <button type="button" className={`${s.segmentBtn} ${includeVat ? s.segmentBtnOn : ''}`} onClick={() => setIncludeVat(true)}>포함(일반과세)</button>
            <button type="button" className={`${s.segmentBtn} ${!includeVat ? s.segmentBtnOn : ''}`} onClick={() => setIncludeVat(false)}>제외</button>
          </div>
        </Field>
      </InputCard>

      <Breakdown
        headlineLabel={includeVat ? '중개보수 상한 (VAT 포함)' : '중개보수 상한'}
        headlineValue={r.total}
        headlineSub={`상한요율 ${(r.tier.rate * 100).toFixed(1)}%${r.cappedByMax ? ' · 한도액 적용' : ''}`}
        rows={r.steps.map(st => ({
          label: st.label, value: st.value, basis: st.basis,
          tone: st.label.includes('총 지급액') || st.label === '중개보수' ? 'result' as const : undefined,
        }))}
        footer={<span>{r.note} · 최종 확인 {r.verifiedAt}</span>}
      />
    </>
  );
}

/* ─────────────── 대출 이자 ─────────────── */
export function LoanCalc({ year }: { year: string }) {
  const [principal, setPrincipal] = useState(300_000_000);
  const [rate, setRate] = useState(4.5);
  const [months, setMonths] = useState(360);
  const [method, setMethod] = useState<LoanMethod>('equal-payment');
  const r = useMemo(() => calcLoan(principal, rate, months, method, year), [principal, rate, months, method, year]);

  return (
    <>
      <InputCard>
        <Field label="상환 방식">
          <div className={s.segment}>
            <button type="button" className={`${s.segmentBtn} ${method === 'equal-payment' ? s.segmentBtnOn : ''}`} onClick={() => setMethod('equal-payment')}>원리금균등</button>
            <button type="button" className={`${s.segmentBtn} ${method === 'equal-principal' ? s.segmentBtnOn : ''}`} onClick={() => setMethod('equal-principal')}>원금균등</button>
            <button type="button" className={`${s.segmentBtn} ${method === 'bullet' ? s.segmentBtnOn : ''}`} onClick={() => setMethod('bullet')}>만기일시</button>
          </div>
        </Field>
        <Field label="대출원금">
          <AmountInput value={principal} onChange={setPrincipal} unit="원" step={10_000_000} />
        </Field>
        <div className={s.grid}>
          <Field label="연 이자율">
            <div className={s.row}>
              <input type="number" step={0.1} min={0} className={`${s.input} num`} value={rate}
                onChange={e => setRate(Math.max(0, Number(e.target.value)))} />
              <span className={s.unit}>%</span>
            </div>
          </Field>
          <Field label="대출 기간">
            <div className={s.row}>
              <input type="number" step={12} min={1} className={`${s.input} num`} value={months}
                onChange={e => setMonths(Math.max(1, Number(e.target.value)))} />
              <span className={s.unit}>개월</span>
            </div>
          </Field>
        </div>
        <div className={s.quick}>
          {[12, 36, 60, 120, 240, 360].map(m => (
            <button key={m} type="button" className={`${s.chip} ${months === m ? s.chipOn : ''}`} onClick={() => setMonths(m)}>
              {m / 12}년
            </button>
          ))}
        </div>
      </InputCard>

      <Breakdown
        headlineLabel={method === 'equal-payment' ? '매월 상환액' : '첫 달 상환액'}
        headlineValue={r.firstPayment}
        headlineSub={`총 이자 ${r.totalInterest.toLocaleString()}원 · 총 상환 ${r.totalPayment.toLocaleString()}원`}
        rows={r.steps.map(st => ({
          label: st.label, value: st.value, basis: st.basis,
          tone: st.label === '총 상환액' ? 'result' as const
              : st.label === '총 이자' ? 'minus' as const : undefined,
        }))}
        footer={<span>중도상환수수료·인지세 등 부대비용은 제외 · 최종 확인 {r.verifiedAt}</span>}
      />
    </>
  );
}
