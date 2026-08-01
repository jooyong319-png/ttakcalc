'use client';
import { useState, useMemo } from 'react';
import { calcArea, calcVat, calcPercent, calcCompound, type PercentMode } from '@/lib/calc/basic';
import { Breakdown, InputCard, Field, calcStyles as s } from './Breakdown';

const 만 = 10_000;
const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');
const toRows = (steps: { label: string; value: number | string; basis?: string; tone?: 'minus' | 'total' | 'result' | 'info' }[]) =>
  steps.map(st => ({ label: st.label, value: st.value, basis: st.basis, tone: st.tone }));

/* ─────────────── 평 ↔ ㎡ ─────────────── */
export function AreaCalc({ year }: { year: string }) {
  const [value, setValue] = useState(84);
  const [from, setFrom] = useState<'sqm' | 'pyeong'>('sqm');
  const r = useMemo(() => calcArea(value, from, year), [value, from, year]);

  return (
    <>
      <InputCard>
        <Field label="변환 방향">
          <div className={s.segment}>
            <button type="button" className={`${s.segmentBtn} ${from === 'sqm' ? s.segmentBtnOn : ''}`} onClick={() => setFrom('sqm')}>㎡ → 평</button>
            <button type="button" className={`${s.segmentBtn} ${from === 'pyeong' ? s.segmentBtnOn : ''}`} onClick={() => setFrom('pyeong')}>평 → ㎡</button>
          </div>
        </Field>
        <Field label="면적">
          <div className={s.row}>
            <input type="number" step={1} min={0} className={`${s.input} num`} value={value}
              onChange={e => setValue(Math.max(0, Number(e.target.value)))} />
            <span className={s.unit}>{from === 'sqm' ? '㎡' : '평'}</span>
          </div>
        </Field>
        <div className={s.quick}>
          {(from === 'sqm' ? [59, 74, 84, 101, 114, 134] : [18, 22, 25, 32, 34, 40]).map(v => (
            <button key={v} type="button" className={`${s.chip} ${value === v ? s.chipOn : ''}`} onClick={() => setValue(v)}>
              {v}{from === 'sqm' ? '㎡' : '평'}
            </button>
          ))}
        </div>
      </InputCard>

      <Breakdown
        headlineLabel={from === 'sqm' ? '평' : '제곱미터'}
        headlineValue={from === 'sqm' ? r.pyeong : r.sqm}
        headlineUnit={from === 'sqm' ? '평' : '㎡'}
        headlineSub={`${r.sqm}㎡ = ${r.pyeong}평`}
        rows={toRows(r.steps)}
        footer={
          <span>
            {r.overNationalHousingSize
              ? '⚠ 국민주택 규모(85㎡)를 넘습니다 — 취득세에 농어촌특별세가 붙습니다. '
              : '국민주택 규모(85㎡) 이하라 취득세 농어촌특별세가 없습니다. '}
            <a href="/calc/acquisition-tax">취득세 계산기</a>에서 확인하세요
          </span>
        }
      />
    </>
  );
}

/* ─────────────── 부가가치세 ─────────────── */
export function VatCalc({ year }: { year: string }) {
  const [amount, setAmount] = useState(1_000_000);
  const [mode, setMode] = useState<'supply' | 'total'>('supply');
  const r = useMemo(() => calcVat(amount, mode, year), [amount, mode, year]);

  return (
    <>
      <InputCard>
        <Field label="입력 금액의 종류">
          <div className={s.segment}>
            <button type="button" className={`${s.segmentBtn} ${mode === 'supply' ? s.segmentBtnOn : ''}`} onClick={() => setMode('supply')}>
              공급가액 (세전)
            </button>
            <button type="button" className={`${s.segmentBtn} ${mode === 'total' ? s.segmentBtnOn : ''}`} onClick={() => setMode('total')}>
              합계금액 (세포함)
            </button>
          </div>
        </Field>
        <Field label="금액">
          <div className={s.row}>
            <input type="number" step={10_000} min={0} className={`${s.input} num`} value={amount}
              onChange={e => setAmount(Math.max(0, Number(e.target.value)))} />
            <span className={s.unit}>원</span>
          </div>
        </Field>
        <div className={s.quick}>
          {[10, 50, 100, 300, 500, 1000].map(v => (
            <button key={v} type="button" className={`${s.chip} ${amount === v * 만 ? s.chipOn : ''}`} onClick={() => setAmount(v * 만)}>
              {fmt(v)}만
            </button>
          ))}
        </div>
      </InputCard>

      <Breakdown
        headlineLabel={mode === 'supply' ? '합계금액 (세포함)' : '공급가액 (세전)'}
        headlineValue={mode === 'supply' ? r.total : r.supply}
        headlineSub={`부가세 ${fmt(r.vat)}원`}
        rows={toRows(r.steps)}
        footer={
          <span>
            합계금액에서 공급가액을 되짚을 때 <strong>10%를 빼면 틀립니다</strong> — 1.1로 나눠야 합니다.
            {' '}근거 {r.source}
          </span>
        }
      />
    </>
  );
}

/* ─────────────── 퍼센트 ─────────────── */
const PERCENT_MODES: { key: PercentMode; label: string; aLabel: string; bLabel: string }[] = [
  { key: 'of', label: 'A의 B%는?', aLabel: '기준값 (A)', bLabel: '비율 (B, %)' },
  { key: 'change', label: 'A → B 증감률', aLabel: '이전 값 (A)', bLabel: '이후 값 (B)' },
  { key: 'ratio', label: 'A는 B의 몇 %?', aLabel: '부분 (A)', bLabel: '전체 (B)' },
];

export function PercentCalc() {
  const [mode, setMode] = useState<PercentMode>('of');
  const [a, setA] = useState(3_000_000);
  const [b, setB] = useState(15);
  const cfg = PERCENT_MODES.find(m => m.key === mode)!;
  const r = useMemo(() => calcPercent(a, b, mode), [a, b, mode]);

  return (
    <>
      <InputCard>
        <Field label="무엇을 계산할까요">
          <div className={s.segment}>
            {PERCENT_MODES.map(m => (
              <button key={m.key} type="button"
                className={`${s.segmentBtn} ${mode === m.key ? s.segmentBtnOn : ''}`}
                onClick={() => {
                  setMode(m.key);
                  // 모드마다 두 번째 값의 의미가 달라 그대로 두면 엉뚱한 결과가 나온다
                  if (m.key === 'of') setB(15);
                  else setB(a);
                }}>
                {m.label}
              </button>
            ))}
          </div>
        </Field>
        <div className={s.grid}>
          <Field label={cfg.aLabel}>
            <div className={s.row}>
              <input type="number" className={`${s.input} num`} value={a}
                onChange={e => setA(Number(e.target.value))} />
            </div>
          </Field>
          <Field label={cfg.bLabel}>
            <div className={s.row}>
              <input type="number" className={`${s.input} num`} value={b}
                onChange={e => setB(Number(e.target.value))} />
              <span className={s.unit}>{mode === 'of' ? '%' : ''}</span>
            </div>
          </Field>
        </div>
      </InputCard>

      <Breakdown
        headlineLabel={cfg.label}
        headlineValue={mode === 'of' ? r.answer : `${r.answer}%`}
        headlineUnit={mode === 'of' ? '' : ''}
        headlineSub={r.label}
        rows={toRows(r.steps)}
        footer={
          <span>
            연봉 인상률이 궁금하면 <a href="/calc/salary">연봉 실수령액</a>에서 인상 전후 금액을 넣어
            실수령액이 얼마나 늘어나는지도 확인해 보세요
          </span>
        }
      />
    </>
  );
}

/* ─────────────── 복리 (예·적금) ─────────────── */
export function CompoundCalc({ year }: { year: string }) {
  const [principal, setPrincipal] = useState(10_000_000);
  const [annualRatePercent, setRate] = useState(3.5);
  const [months, setMonths] = useState(12);
  const [method, setMethod] = useState<'simple' | 'monthly'>('simple');
  const [taxed, setTaxed] = useState(true);

  const r = useMemo(
    () => calcCompound({ year, principal, annualRatePercent, months, method, taxed }),
    [year, principal, annualRatePercent, months, method, taxed],
  );

  return (
    <>
      <InputCard>
        <Field label="원금">
          <div className={s.row}>
            <input type="number" step={1_000_000} min={0} className={`${s.input} num`} value={principal}
              onChange={e => setPrincipal(Math.max(0, Number(e.target.value)))} />
            <span className={s.unit}>원</span>
          </div>
        </Field>
        <div className={s.quick}>
          {[500, 1000, 3000, 5000, 10000].map(v => (
            <button key={v} type="button" className={`${s.chip} ${principal === v * 만 ? s.chipOn : ''}`} onClick={() => setPrincipal(v * 만)}>
              {v >= 10000 ? `${v / 10000}억` : `${fmt(v)}만`}
            </button>
          ))}
        </div>
        <div className={s.grid}>
          <Field label="연 이자율">
            <div className={s.row}>
              <input type="number" step={0.1} min={0} className={`${s.input} num`} value={annualRatePercent}
                onChange={e => setRate(Math.max(0, Number(e.target.value)))} />
              <span className={s.unit}>%</span>
            </div>
          </Field>
          <Field label="기간">
            <div className={s.row}>
              <input type="number" step={1} min={1} className={`${s.input} num`} value={months}
                onChange={e => setMonths(Math.max(1, Number(e.target.value)))} />
              <span className={s.unit}>개월</span>
            </div>
          </Field>
        </div>
        <div className={s.grid}>
          <Field label="이자 계산 방식">
            <div className={s.segment}>
              <button type="button" className={`${s.segmentBtn} ${method === 'simple' ? s.segmentBtnOn : ''}`} onClick={() => setMethod('simple')}>단리</button>
              <button type="button" className={`${s.segmentBtn} ${method === 'monthly' ? s.segmentBtnOn : ''}`} onClick={() => setMethod('monthly')}>월복리</button>
            </div>
          </Field>
          <Field label="이자소득세" hint="비과세종합저축 등은 '비과세'">
            <div className={s.segment}>
              <button type="button" className={`${s.segmentBtn} ${taxed ? s.segmentBtnOn : ''}`} onClick={() => setTaxed(true)}>15.4% 과세</button>
              <button type="button" className={`${s.segmentBtn} ${!taxed ? s.segmentBtnOn : ''}`} onClick={() => setTaxed(false)}>비과세</button>
            </div>
          </Field>
        </div>
      </InputCard>

      <Breakdown
        headlineLabel="만기 수령액"
        headlineValue={r.total}
        headlineSub={`세후 이자 ${fmt(r.netInterest)}원 · 실효 연 ${(r.effectiveAnnualRate * 100).toFixed(2)}%`}
        rows={toRows(r.steps)}
        footer={
          <span>
            금융소득이 연 2,000만원을 넘으면 종합과세 대상이 됩니다 · 근거 {r.source}
          </span>
        }
      />
    </>
  );
}
