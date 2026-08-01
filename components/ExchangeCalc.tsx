'use client';
import { useState, useMemo } from 'react';
import { calcExchange, type Rate } from '@/lib/exchange';
import { Breakdown, InputCard, Field, calcStyles as s } from './Breakdown';
import { AmountInput } from './AmountInput';

const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');

/** 자주 쓰는 통화를 앞으로 — 목록이 40개가 넘어서 그냥 두면 못 찾는다 */
const PINNED = ['USD', 'JPY', 'EUR', 'CNH', 'GBP', 'AUD', 'CAD', 'HKD', 'THB', 'VND'];

export function ExchangeCalc({ rates, date, stale }: { rates: Rate[]; date: string; stale: boolean }) {
  const sorted = useMemo(() => {
    // 고시 목록에 KRW가 섞여 있다 — 원화를 원화로 환전할 일은 없으니 뺀다
    const usable = rates.filter(r => r.code !== 'KRW');
    const pin = PINNED.map(c => usable.find(r => r.code === c)).filter(Boolean) as Rate[];
    const rest = usable.filter(r => !PINNED.includes(r.code));
    return [...pin, ...rest];
  }, [rates]);

  const [code, setCode] = useState(sorted[0]?.code ?? 'USD');
  const [amount, setAmount] = useState(1000);
  const [direction, setDirection] = useState<'buy' | 'sell'>('buy');
  const [spreadPercent, setSpread] = useState(1.75);
  const [preferentialPercent, setPref] = useState(0);

  const rate = sorted.find(r => r.code === code) ?? sorted[0];
  const r = useMemo(
    () => calcExchange({ amount, rate, direction, spreadPercent, preferentialPercent }),
    [amount, rate, direction, spreadPercent, preferentialPercent],
  );

  return (
    <>
      <InputCard>
        <Field label="거래 방향">
          <div className={s.segment}>
            <button type="button" className={`${s.segmentBtn} ${direction === 'buy' ? s.segmentBtnOn : ''}`} onClick={() => setDirection('buy')}>
              외화를 산다 (원화 지불)
            </button>
            <button type="button" className={`${s.segmentBtn} ${direction === 'sell' ? s.segmentBtnOn : ''}`} onClick={() => setDirection('sell')}>
              외화를 판다 (원화 수령)
            </button>
          </div>
        </Field>
        <div className={s.grid}>
          <Field label="통화">
            <select className={s.select} value={code} onChange={e => setCode(e.target.value)}>
              {sorted.map(rt => (
                <option key={rt.code} value={rt.code}>
                  {rt.code} — {rt.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="금액" hint={rate.unit > 1 ? `${rate.unit}단위로 고시되는 통화입니다` : undefined}>
            <AmountInput value={amount} onChange={setAmount} unit={rate.code} step={100} />
          </Field>
        </div>
        <div className={s.quick}>
          {[100, 500, 1000, 3000, 10000].map(v => (
            <button key={v} type="button" className={`${s.chip} ${amount === v ? s.chipOn : ''}`} onClick={() => setAmount(v)}>
              {fmt(v)}
            </button>
          ))}
        </div>
        <div className={s.grid}>
          <Field label="현찰 스프레드" hint="은행 고시 환율과 매매기준율의 차이. 달러는 보통 1.75% 안팎이고 은행마다 다릅니다.">
            <div className={s.row}>
              <input type="number" step={0.05} min={0} className={`${s.input} num`} value={spreadPercent}
                onChange={e => setSpread(Math.max(0, Number(e.target.value)))} />
              <span className={s.unit}>%</span>
            </div>
          </Field>
          <Field label="환전 우대율" hint="90% 우대면 스프레드의 10%만 부담합니다">
            <div className={s.row}>
              <input type="number" step={5} min={0} max={100} className={`${s.input} num`} value={preferentialPercent}
                onChange={e => setPref(Math.min(100, Math.max(0, Number(e.target.value))))} />
              <span className={s.unit}>%</span>
            </div>
          </Field>
        </div>
        <div className={s.quick}>
          {[0, 50, 70, 80, 90, 100].map(v => (
            <button key={v} type="button" className={`${s.chip} ${preferentialPercent === v ? s.chipOn : ''}`} onClick={() => setPref(v)}>
              {v}% 우대
            </button>
          ))}
        </div>
      </InputCard>

      <Breakdown
        headlineLabel={direction === 'buy' ? '내야 할 원화' : '받는 원화'}
        headlineValue={r.krw}
        headlineSub={`적용 환율 ${r.appliedRate.toFixed(2)}원 · 스프레드 손실 ${fmt(r.cost)}원`}
        rows={r.steps}
        caption="계산 근거 — 왜 이 금액인지"
        footer={
          <span>
            <strong>{date}</strong> 한국수출입은행 고시환율 기준
            {stale && ' (오늘은 비영업일이라 가장 최근 고시를 씁니다)'}
            {' '}· 스프레드와 우대율은 은행·지점마다 달라 직접 넣습니다
          </span>
        }
      />
    </>
  );
}
