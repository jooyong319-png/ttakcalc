'use client';
import { useState, useMemo } from 'react';
import { calcDividendTax, reverseDividend } from '@/lib/calc/dividend';
import { Breakdown, InputCard, Field, calcStyles as s } from './Breakdown';
import { AmountInput } from './AmountInput';

const 만 = 10_000;
const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');

const toRows = (
  steps: { label: string; value: number | string; basis?: string; tone?: 'minus' | 'total' | 'result' | 'info' }[],
) => steps.map(st => ({ label: st.label, value: st.value, basis: st.basis, tone: st.tone }));

/* ─────────────── 배당소득세 ─────────────── */
export function DividendTaxCalc({ year }: { year: string }) {
  const [dividend, setDividend] = useState(30_000_000);
  const [interest, setInterest] = useState(0);
  const [domestic, setDomestic] = useState(false);
  const [otherIncome, setOtherIncome] = useState(0);
  const [deduction, setDeduction] = useState(1_500_000);

  const r = useMemo(
    () => calcDividendTax({ year, dividend, interest, domestic, otherIncome, deduction }),
    [year, dividend, interest, domestic, otherIncome, deduction],
  );

  return (
    <>
      <InputCard>
        <Field label="연간 배당금" hint="세전 금액. 배당락 전 기준 지급액 총합">
          <AmountInput value={dividend} onChange={setDividend} unit="원" step={1_000_000} />
        </Field>
        <div className={s.quick}>
          {[1000, 2000, 3000, 5000, 10000].map(v => (
            <button
              key={v}
              type="button"
              className={`${s.chip} ${dividend === v * 만 ? s.chipOn : ''}`}
              onClick={() => setDividend(v * 만)}
            >
              {v >= 10000 ? `${v / 10000}억` : `${fmt(v)}만`}
            </button>
          ))}
        </div>

        <div className={s.grid}>
          <Field label="배당 종류" hint="국내 상장법인 배당만 Gross-up·배당세액공제 대상입니다">
            <div className={s.segment}>
              <button
                type="button"
                className={`${s.segmentBtn} ${!domestic ? s.segmentBtnOn : ''}`}
                onClick={() => setDomestic(false)}
              >
                해외 주식·ETF
              </button>
              <button
                type="button"
                className={`${s.segmentBtn} ${domestic ? s.segmentBtnOn : ''}`}
                onClick={() => setDomestic(true)}
              >
                국내 주식
              </button>
            </div>
          </Field>
          <Field label="연간 이자소득" hint="예금·채권 이자. 2천만원 한도를 이자부터 채웁니다">
            <AmountInput value={interest} onChange={setInterest} unit="원" step={1_000_000} />
          </Field>
        </div>

        <div className={s.grid}>
          <Field label="그 밖의 종합소득금액" hint="근로소득금액·사업소득금액 등. 없으면 0">
            <AmountInput value={otherIncome} onChange={setOtherIncome} unit="원" step={1_000_000} />
          </Field>
          <Field label="종합소득공제" hint="기본값은 본인 기본공제 150만원(소득세법 제50조)">
            <AmountInput value={deduction} onChange={setDeduction} unit="원" step={500_000} />
          </Field>
        </div>
      </InputCard>

      <Breakdown
        headlineLabel={r.comprehensive ? '총 세금 (종합과세)' : '총 세금 (분리과세로 종결)'}
        headlineValue={r.totalTax}
        headlineUnit="원"
        headlineSub={`세후 ${fmt(r.netDividend)}원 · 실효세율 ${(r.effectiveRate * 100).toFixed(2)}%`}
        rows={toRows(r.steps)}
        footer={<span>최종 확인 {r.verifiedAt} · 소득세법 제14조·제17조·제56조·제62조·제129조</span>}
      />

      {/* 이 계산기가 보지 않는 것 — 추정하면 거짓말이 되는 값들 */}
      <div className={s.assumptions}>
        <strong>이 계산에 넣지 않은 것</strong>
        <ul>
          {!domestic && (
            <li>
              <strong>해외 현지 원천징수세</strong> — 미국 주식은 배당 지급 시 현지에서 15%가 먼저
              떼입니다. 국내 세율(14%)보다 높아 국내에서 추가로 떼지 않으며, 종합과세 대상이 되면
              외국납부세액공제(소득세법 제57조)로 정산됩니다. 나라·조세조약마다 달라 여기서는
              계산하지 않습니다.
            </li>
          )}
          <li>
            <strong>개인별 세액공제</strong> — 의료비·기부금·연금계좌 등은 사람마다 달라 반영하지
            않았습니다. 실제 세금은 이보다 줄어들 수 있습니다.
          </li>
          <li>
            <strong>ISA·연금계좌</strong> — 계좌 안에서 받은 배당은 과세 방식이 완전히 다릅니다.
            일반 계좌 기준입니다.
          </li>
        </ul>
      </div>
    </>
  );
}

/* ─────────────── 역산: 세후 목표에서 필요 배당 구하기 ─────────────── */
export function DividendReverseCalc({ year }: { year: string }) {
  const [monthlyNet, setMonthlyNet] = useState(3_000_000);
  const [domestic, setDomestic] = useState(false);
  const [yieldPercent, setYieldPercent] = useState(4);

  const targetNet = monthlyNet * 12;
  const gross = useMemo(
    () => reverseDividend(targetNet, { year, interest: 0, domestic, otherIncome: 0, deduction: 1_500_000 }),
    [targetNet, year, domestic],
  );
  const check = useMemo(
    () => calcDividendTax({ year, dividend: gross, interest: 0, domestic, otherIncome: 0, deduction: 1_500_000 }),
    [gross, year, domestic],
  );
  // 배당수익률로 역산한 필요 자산. 수익률은 사용자가 넣는다 — 우리가 정할 값이 아니다.
  const asset = yieldPercent > 0 ? Math.round((gross / (yieldPercent / 100)) / 만) * 만 : 0;

  return (
    <>
      <InputCard>
        <Field label="원하는 세후 월 배당" hint="이 금액을 손에 쥐려면 세전 배당이 얼마여야 하는지 구합니다">
          <AmountInput value={monthlyNet} onChange={setMonthlyNet} unit="원" step={500_000} />
        </Field>
        <div className={s.quick}>
          {[1_000_000, 2_000_000, 3_000_000, 5_000_000].map(v => (
            <button
              key={v}
              type="button"
              className={`${s.chip} ${monthlyNet === v ? s.chipOn : ''}`}
              onClick={() => setMonthlyNet(v)}
            >
              월 {fmt(v / 만)}만
            </button>
          ))}
        </div>
        <div className={s.grid}>
          <Field label="배당 종류">
            <div className={s.segment}>
              <button
                type="button"
                className={`${s.segmentBtn} ${!domestic ? s.segmentBtnOn : ''}`}
                onClick={() => setDomestic(false)}
              >
                해외 주식·ETF
              </button>
              <button
                type="button"
                className={`${s.segmentBtn} ${domestic ? s.segmentBtnOn : ''}`}
                onClick={() => setDomestic(true)}
              >
                국내 주식
              </button>
            </div>
          </Field>
          <Field label="배당수익률" hint="필요 자산 규모를 보기 위한 값. 종목마다 다르므로 직접 넣습니다">
            <div className={s.row}>
              <input
                type="number"
                step={0.1}
                min={0}
                max={30}
                className={`${s.input} num`}
                value={yieldPercent}
                onChange={e => setYieldPercent(Math.max(0, Number(e.target.value)))}
              />
              <span className={s.unit}>%</span>
            </div>
          </Field>
        </div>
      </InputCard>

      <Breakdown
        headlineLabel="필요한 세전 연간 배당"
        headlineValue={gross}
        headlineUnit="원"
        headlineSub={
          asset > 0
            ? `배당수익률 ${yieldPercent}% 기준 필요 자산 약 ${fmt(Math.round(asset / 만))}만원`
            : undefined
        }
        rows={[
          { label: '목표 세후 배당', value: `연 ${fmt(targetNet)}원`, basis: `월 ${fmt(monthlyNet)}원 × 12개월` },
          { label: '필요한 세전 배당', value: `${fmt(gross)}원`, basis: '누진세라 역함수가 없어 이분탐색으로 찾은 값(만원 단위 올림)' },
          { label: '이때 내는 세금', value: check.totalTax, basis: `실효세율 ${(check.effectiveRate * 100).toFixed(2)}%`, tone: 'minus' },
          { label: '실제 세후 수령', value: check.netDividend, basis: '목표액 이상이 되는 최소 금액', tone: 'total' },
          ...(asset > 0
            ? [{
                label: `필요 자산 (수익률 ${yieldPercent}%)`,
                value: asset,
                basis: `세전 배당 ${fmt(gross)}원 ÷ ${yieldPercent}% — 수익률은 종목마다 다르므로 참고용`,
                tone: 'info' as const,
              }]
            : []),
        ]}
        footer={<span>최종 확인 {check.verifiedAt} · 세금은 위 계산기와 같은 방식으로 구합니다</span>}
      />
    </>
  );
}
