'use client';
import { useState, useMemo } from 'react';
import {
  calcAnnualLeave, calcGiftTax, calcCarAcquisitionTax,
  calcRentConversion, calcComprehensivePropertyTax, calcTransferTax,
} from '@/lib/calc/extra';
import { getRates } from '@/lib/rates';
import { Breakdown, InputCard, Field, calcStyles as s } from './Breakdown';
import { AmountInput } from './AmountInput';

const 억 = 100_000_000;
const 만 = 10_000;
const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');
const toRows = (steps: { label: string; value: number | string; basis?: string; tone?: 'minus' | 'total' | 'result' | 'info' }[]) =>
  steps.map(st => ({ label: st.label, value: st.value, basis: st.basis, tone: st.tone }));

/* ─────────────── 연차수당 ─────────────── */
export function AnnualLeaveCalc({ year }: { year: string }) {
  const [years, setYears] = useState(3);
  const [months, setMonths] = useState(6);
  const [monthlyWage, setWage] = useState(3_000_000);
  const [unusedDays, setUnused] = useState(5);
  const under1 = years < 1;
  const r = useMemo(
    () => calcAnnualLeave(years, monthlyWage, unusedDays, year, months),
    [years, monthlyWage, unusedDays, year, months],
  );

  return (
    <>
      <InputCard>
        <div className={s.grid}>
          <Field label="계속근로 연수" hint="입사일부터 지금까지">
            <div className={s.row}>
              <input type="number" step={1} min={0} max={40} className={`${s.input} num`} value={years}
                onChange={e => setYears(Math.max(0, Number(e.target.value)))} />
              <span className={s.unit}>년</span>
            </div>
          </Field>
          {under1 ? (
            <Field label="개근한 개월 수" hint="1개월 개근마다 1일 발생 (최대 11일)">
              <div className={s.row}>
                <input type="number" step={1} min={0} max={11} className={`${s.input} num`} value={months}
                  onChange={e => setMonths(Math.max(0, Number(e.target.value)))} />
                <span className={s.unit}>개월</span>
              </div>
            </Field>
          ) : (
            <Field label="미사용 연차" hint={`올해 발생한 ${r.days}일 중`}>
              <div className={s.row}>
                <input type="number" step={1} min={0} className={`${s.input} num`} value={unusedDays}
                  onChange={e => setUnused(Math.max(0, Number(e.target.value)))} />
                <span className={s.unit}>일</span>
              </div>
            </Field>
          )}
        </div>
        <Field label="월 통상임금" hint="기본급 + 고정수당. 성과급처럼 실적에 따라 달라지는 건 보통 빠집니다.">
          <AmountInput value={monthlyWage} onChange={setWage} unit="원" step={100_000} />
        </Field>
        {under1 && (
          <Field label="미사용 연차">
            <div className={s.row}>
              <input type="number" step={1} min={0} className={`${s.input} num`} value={unusedDays}
                onChange={e => setUnused(Math.max(0, Number(e.target.value)))} />
              <span className={s.unit}>일</span>
            </div>
          </Field>
        )}
      </InputCard>

      <Breakdown
        headlineLabel="미사용 연차수당"
        headlineValue={r.unusedPay}
        headlineSub={`올해 발생 ${r.days}일 · 1일 ${fmt(r.dailyWage)}원`}
        rows={toRows(r.steps)}
        footer={
          <span>
            {r.cappedByMax && '25일 한도에 도달했습니다. '}
            회계연도 기준으로 관리하는 회사는 발생 시점이 다를 수 있습니다 · 근거 {r.source}
          </span>
        }
      />
    </>
  );
}

/* ─────────────── 증여세 ─────────────── */
export function GiftTaxCalc({ year }: { year: string }) {
  const g = getRates(year).giftTax;
  const [amount, setAmount] = useState(200_000_000);
  const [relation, setRelation] = useState('lineal-ascendant');
  const [prior, setPrior] = useState(0);
  const [filed, setFiled] = useState(true);
  const r = useMemo(
    () => calcGiftTax(amount, relation, prior, filed, year),
    [amount, relation, prior, filed, year],
  );

  return (
    <>
      <InputCard>
        <Field label="증여받은 금액">
          <AmountInput value={amount} onChange={setAmount} unit="원" step={10_000_000} />
        </Field>
        <div className={s.quick}>
          {[5000, 10000, 20000, 50000, 100000].map(v => (
            <button key={v} type="button" className={`${s.chip} ${amount === v * 만 ? s.chipOn : ''}`} onClick={() => setAmount(v * 만)}>
              {v >= 10000 ? `${v / 10000}억` : `${fmt(v)}만`}
            </button>
          ))}
        </div>
        <Field label="누구에게서 받았나요" hint="관계에 따라 공제 한도가 크게 다릅니다">
          <select className={s.select} value={relation} onChange={e => setRelation(e.target.value)}>
            {g.deductions.map(d => (
              <option key={d.key} value={d.key}>
                {d.label} — 공제 {fmt(d.amount)}원
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="10년 내 같은 관계로 받은 금액"
          hint="이 세금의 가장 큰 함정입니다. 10년 안에 이미 공제를 썼다면 그만큼 한도가 줄어듭니다."
        >
          <AmountInput value={prior} onChange={setPrior} unit="원" step={10_000_000} />
        </Field>
        <Field label="기한 내 신고" hint="증여일이 속한 달의 말일부터 3개월 이내">
          <div className={s.segment}>
            <button type="button" className={`${s.segmentBtn} ${filed ? s.segmentBtnOn : ''}`} onClick={() => setFiled(true)}>신고함 (3% 공제)</button>
            <button type="button" className={`${s.segmentBtn} ${!filed ? s.segmentBtnOn : ''}`} onClick={() => setFiled(false)}>안 함</button>
          </div>
        </Field>
      </InputCard>

      <Breakdown
        headlineLabel="납부할 증여세"
        headlineValue={r.finalTax}
        headlineSub={r.finalTax === 0 ? '공제 범위 안이라 세금 없음' : `실효세율 ${(r.effectiveRate * 100).toFixed(2)}%`}
        rows={toRows(r.steps)}
        footer={<span>{g.deductionNote} · 근거 {r.source}</span>}
      />
    </>
  );
}

/* ─────────────── 자동차 취득세 ─────────────── */
export function CarAcquisitionCalc({ year }: { year: string }) {
  const c = getRates(year).carAcquisitionTax;
  const [price, setPrice] = useState(30_000_000);
  const [typeKey, setType] = useState('passenger');
  const r = useMemo(() => calcCarAcquisitionTax(price, typeKey, year), [price, typeKey, year]);

  return (
    <>
      <InputCard>
        <Field label="차량 가격" hint="부가세 포함 실제 취득가액">
          <AmountInput value={price} onChange={setPrice} unit="원" step={1_000_000} />
        </Field>
        <div className={s.quick}>
          {[2000, 3000, 4000, 5000, 8000].map(v => (
            <button key={v} type="button" className={`${s.chip} ${price === v * 만 ? s.chipOn : ''}`} onClick={() => setPrice(v * 만)}>
              {fmt(v)}만
            </button>
          ))}
        </div>
        <Field label="차량 종류">
          <select className={s.select} value={typeKey} onChange={e => setType(e.target.value)}>
            {c.rates.map(t => (
              <option key={t.key} value={t.key}>{t.label} — {(t.rate * 100).toFixed(0)}%</option>
            ))}
          </select>
        </Field>
      </InputCard>

      <Breakdown
        headlineLabel="자동차 취득세"
        headlineValue={r.tax}
        headlineSub={`취득가액의 ${(r.rate * 100).toFixed(0)}%`}
        rows={toRows(r.steps)}
        footer={
          <span>
            {c.note} 경차는 감면 대상이지만 한도가 있고 요건이 매년 바뀌어 여기서는 표준세율만 계산합니다 ·
            근거 {r.source}
          </span>
        }
      />
    </>
  );
}

/* ─────────────── 전월세 전환율 ─────────────── */
export function RentConversionCalc({ year }: { year: string }) {
  const [deposit, setDeposit] = useState(5 * 억);
  const [convert, setConvert] = useState(1 * 억);
  const r = useMemo(() => calcRentConversion(deposit, convert, year), [deposit, convert, year]);

  return (
    <>
      <InputCard>
        <Field label="현재 보증금">
          <AmountInput value={deposit} onChange={setDeposit} unit="원" step={10_000_000} />
        </Field>
        <Field label="월세로 돌릴 금액">
          <AmountInput value={convert} onChange={setConvert} unit="원" step={10_000_000} max={deposit} />
        </Field>
        <div className={s.quick}>
          {[0.5, 1, 2, 3].map(v => (
            <button key={v} type="button" className={`${s.chip} ${convert === v * 억 ? s.chipOn : ''}`} onClick={() => setConvert(Math.min(deposit, v * 억))}>
              {v}억
            </button>
          ))}
        </div>
      </InputCard>

      <Breakdown
        headlineLabel="월세 상한"
        headlineValue={r.maxMonthlyRent}
        headlineSub={`보증금 ${fmt(r.remainingDeposit)}원 + 월세 ${fmt(r.maxMonthlyRent)}원`}
        rows={toRows(r.steps)}
        footer={<span>{r.note2} · 근거 {r.source}</span>}
      />
    </>
  );
}

/* ─────────────── 종합부동산세 ─────────────── */
export function ComprehensivePropertyCalc({ year }: { year: string }) {
  const c = getRates(year).comprehensivePropertyTax;
  const [publicPrice, setPrice] = useState(15 * 억);
  const [oneHouse, setOneHouse] = useState(true);
  const [threeOrMore, setThree] = useState(false);
  const r = useMemo(
    () => calcComprehensivePropertyTax(publicPrice, oneHouse, threeOrMore, year),
    [publicPrice, oneHouse, threeOrMore, year],
  );

  return (
    <>
      <InputCard>
        <Field label="보유 주택 공시가격 합계" hint="여러 채면 다 더한 금액">
          <AmountInput value={publicPrice} onChange={setPrice} unit="원" step={100_000_000} />
        </Field>
        <div className={s.quick}>
          {[9, 12, 15, 20, 30].map(v => (
            <button key={v} type="button" className={`${s.chip} ${publicPrice === v * 억 ? s.chipOn : ''}`} onClick={() => setPrice(v * 억)}>
              {v}억
            </button>
          ))}
        </div>
        <div className={s.grid}>
          <Field label="1세대 1주택" hint={`공제 ${fmt(c.deductionOneHouse)}원 (그 밖은 ${fmt(c.deductionOther)}원)`}>
            <div className={s.segment}>
              <button type="button" className={`${s.segmentBtn} ${oneHouse ? s.segmentBtnOn : ''}`}
                onClick={() => { setOneHouse(true); setThree(false); }}>해당</button>
              <button type="button" className={`${s.segmentBtn} ${!oneHouse ? s.segmentBtnOn : ''}`} onClick={() => setOneHouse(false)}>해당 없음</button>
            </div>
          </Field>
          <Field label="주택 수" hint="3주택 이상은 높은 구간 세율이 올라갑니다">
            <div className={s.segment}>
              <button type="button" disabled={oneHouse} className={`${s.segmentBtn} ${!threeOrMore ? s.segmentBtnOn : ''}`} onClick={() => setThree(false)}>2주택 이하</button>
              <button type="button" disabled={oneHouse} className={`${s.segmentBtn} ${threeOrMore ? s.segmentBtnOn : ''}`} onClick={() => setThree(true)}>3주택 이상</button>
            </div>
          </Field>
        </div>
      </InputCard>

      <Breakdown
        headlineLabel="종합부동산세 + 농어촌특별세"
        headlineValue={r.total}
        headlineSub={r.exempt ? '공제금액 이하라 과세 대상이 아닙니다' : `12월 납부 · 최고세율 ${(r.topRate * 100).toFixed(1)}%`}
        rows={toRows(r.steps)}
        footer={<span>{c.note2} · 근거 {r.source}</span>}
      />
    </>
  );
}

/* ─────────────── 양도소득세 ─────────────── */
export function TransferTaxCalc({ year }: { year: string }) {
  const t = getRates(year).transferTax;
  const [salePrice, setSale] = useState(15 * 억);
  const [buyPrice, setBuy] = useState(8 * 억);
  const [expenses, setExpenses] = useState(30_000_000);
  const [holdYears, setHold] = useState(10);
  const [liveYears, setLive] = useState(10);
  const [oneHouse, setOneHouse] = useState(true);
  const [heavyHouseCount, setHeavy] = useState<0 | 2 | 3>(0);

  const r = useMemo(
    () => calcTransferTax({ year, salePrice, buyPrice, expenses, holdYears, liveYears, oneHouse, heavyHouseCount }),
    [year, salePrice, buyPrice, expenses, holdYears, liveYears, oneHouse, heavyHouseCount],
  );

  return (
    <>
      <InputCard>
        <div className={s.grid}>
          <Field label="양도가액 (판 금액)">
            <AmountInput value={salePrice} onChange={setSale} unit="원" step={100_000_000} />
          </Field>
          <Field label="취득가액 (산 금액)">
            <AmountInput value={buyPrice} onChange={setBuy} unit="원" step={100_000_000} />
          </Field>
        </div>
        <Field label="필요경비" hint="취득세·중개보수·자본적지출(샷시·확장 등). 도배·장판 같은 수선비는 인정 안 됩니다.">
          <AmountInput value={expenses} onChange={setExpenses} unit="원" step={10_000_000} />
        </Field>
        <div className={s.grid}>
          <Field label="보유기간">
            <div className={s.row}>
              <input type="number" step={1} min={0} max={50} className={`${s.input} num`} value={holdYears}
                onChange={e => setHold(Math.max(0, Number(e.target.value)))} />
              <span className={s.unit}>년</span>
            </div>
          </Field>
          <Field label="거주기간" hint="1세대 1주택 장특공제에 필요">
            <div className={s.row}>
              <input type="number" step={1} min={0} max={50} className={`${s.input} num`} value={liveYears}
                onChange={e => setLive(Math.max(0, Number(e.target.value)))} />
              <span className={s.unit}>년</span>
            </div>
          </Field>
        </div>
        <Field label="1세대 1주택" hint={`양도가액 ${fmt(t.oneHouseExemptLimit)}원까지 비과세`}>
          <div className={s.segment}>
            <button type="button" className={`${s.segmentBtn} ${oneHouse ? s.segmentBtnOn : ''}`}
              onClick={() => { setOneHouse(true); setHeavy(0); }}>해당</button>
            <button type="button" className={`${s.segmentBtn} ${!oneHouse ? s.segmentBtnOn : ''}`} onClick={() => setOneHouse(false)}>해당 없음</button>
          </div>
        </Field>
        {!oneHouse && (
          <Field label="조정대상지역 다주택" hint={t.heavySurcharge.note}>
            <div className={s.segment}>
              <button type="button" className={`${s.segmentBtn} ${heavyHouseCount === 0 ? s.segmentBtnOn : ''}`} onClick={() => setHeavy(0)}>해당 없음</button>
              <button type="button" className={`${s.segmentBtn} ${heavyHouseCount === 2 ? s.segmentBtnOn : ''}`} onClick={() => setHeavy(2)}>2주택</button>
              <button type="button" className={`${s.segmentBtn} ${heavyHouseCount === 3 ? s.segmentBtnOn : ''}`} onClick={() => setHeavy(3)}>3주택 이상</button>
            </div>
          </Field>
        )}
      </InputCard>

      <Breakdown
        headlineLabel="양도소득세 + 지방소득세"
        headlineValue={r.total}
        headlineSub={
          r.fullyExempt
            ? `1세대 1주택 ${fmt(t.oneHouseExemptLimit)}원 이하라 비과세`
            : `장기보유공제 ${(r.longTermRate * 100).toFixed(0)}% · ${r.rateLabel}`
        }
        rows={toRows(r.steps)}
        footer={<span>{r.note2}</span>}
      />
    </>
  );
}
