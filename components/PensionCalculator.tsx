'use client';
import { useState, useMemo } from 'react';
import { calcPension } from '@/lib/calc/pension';
import { Breakdown, InputCard, Field, calcStyles as s } from './Breakdown';
import { AmountInput } from './AmountInput';

const 만 = 10_000;
const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');

const TIMINGS = [
  { v: -5, label: '5년 일찍' },
  { v: -3, label: '3년 일찍' },
  { v: 0, label: '정상' },
  { v: 3, label: '3년 미룸' },
  { v: 5, label: '5년 미룸' },
];

export function PensionCalc({ year }: { year: string }) {
  const [years, setYears] = useState(25);
  const [monthlyIncome, setIncome] = useState(3_000_000);
  const [timing, setTiming] = useState(0);
  const [hasSpouse, setHasSpouse] = useState(false);
  const [dependents, setDependents] = useState(0);

  const input = { year, years, monthlyIncome, timing, hasSpouse, dependents };
  const r = useMemo(() => calcPension(input), [year, years, monthlyIncome, timing, hasSpouse, dependents]);
  const compare = useMemo(
    () => TIMINGS.map(t => ({ ...t, r: calcPension({ ...input, timing: t.v }) })),
    [year, years, monthlyIncome, hasSpouse, dependents],
  );

  return (
    <>
      <InputCard>
        <div className={s.grid}>
          <Field label="총 가입기간" hint="10년(120개월) 이상이어야 노령연금을 받습니다">
            <div className={s.row}>
              <input
                type="number" step={1} min={0} max={50}
                className={`${s.input} num`} value={years}
                onChange={e => setYears(Math.max(0, Number(e.target.value)))}
              />
              <span className={s.unit}>년</span>
            </div>
          </Field>
          <Field label="평균 기준소득월액" hint="가입기간 전체의 평균 소득. 현재가치 기준으로 넣으세요">
            <AmountInput value={monthlyIncome} onChange={setIncome} unit="원" step={100_000} />
          </Field>
        </div>
        <div className={s.quick}>
          {[200, 300, 400, 500, 659].map(v => (
            <button
              key={v} type="button"
              className={`${s.chip} ${monthlyIncome === v * 만 ? s.chipOn : ''}`}
              onClick={() => setIncome(v * 만)}
            >
              {v === 659 ? '659만(상한)' : `${v}만`}
            </button>
          ))}
        </div>

        <Field label="수령 시점" hint="지급개시연령을 기준으로 앞당기거나 미룹니다">
          <div className={s.segment}>
            {TIMINGS.map(t => (
              <button
                key={t.v} type="button"
                className={`${s.segmentBtn} ${timing === t.v ? s.segmentBtnOn : ''}`}
                onClick={() => setTiming(t.v)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Field>

        <div className={s.grid}>
          <Field label="배우자 부양" hint="연 306,630원이 더해집니다">
            <div className={s.segment}>
              <button
                type="button"
                className={`${s.segmentBtn} ${hasSpouse ? s.segmentBtnOn : ''}`}
                onClick={() => setHasSpouse(true)}
              >
                있음
              </button>
              <button
                type="button"
                className={`${s.segmentBtn} ${!hasSpouse ? s.segmentBtnOn : ''}`}
                onClick={() => setHasSpouse(false)}
              >
                없음
              </button>
            </div>
          </Field>
          <Field label="부양 자녀·부모" hint="1명당 연 204,360원">
            <div className={s.row}>
              <input
                type="number" step={1} min={0} max={10}
                className={`${s.input} num`} value={dependents}
                onChange={e => setDependents(Math.max(0, Number(e.target.value)))}
              />
              <span className={s.unit}>명</span>
            </div>
          </Field>
        </div>
      </InputCard>

      <Breakdown
        headlineLabel={r.eligible ? '월 예상 수령액' : '노령연금 수급권 없음'}
        headlineValue={r.monthly}
        headlineSub={
          r.eligible
            ? `연 ${fmt(r.annual)}원 · 소득 대비 ${(r.replacementRate * 100).toFixed(1)}%`
            : '가입기간 10년을 채워야 받습니다'
        }
        rows={r.steps.map(st => ({ label: st.label, value: st.value, basis: st.basis, tone: st.tone }))}
        footer={<span>최종 확인 {r.verifiedAt} · 국민연금법 제51조·제62조·제63조</span>}
      />

      {r.eligible && (
        <Breakdown
          headlineLabel="언제 받는 게 나은가"
          headlineValue={`${compare.find(c => c.v === timing)?.label ?? '정상'} 선택 중`}
          headlineUnit=""
          caption="수령 시점별 월 수령액 — 평생 이 금액으로 고정됩니다"
          rows={compare.map(c => ({
            label: c.label,
            value: c.r.monthly,
            basis:
              c.v === 0
                ? '기준'
                : `${c.v < 0 ? '감액' : '가산'} ${((c.r.timingRate - 1) * 100).toFixed(1)}% · 정상 대비 ${c.r.monthly >= r.monthly ? '+' : ''}${fmt(c.r.monthly - compare[2].r.monthly)}원`,
            tone: c.v === timing ? ('result' as const) : undefined,
          }))}
          footer={
            <span>
              조기수령은 일찍 받는 대신 <strong>평생 줄어든 금액</strong>으로 받습니다. 연기수령은
              그 반대입니다. 손익분기는 대체로 수령 시작 후 10~12년쯤이지만, 건강·다른 소득·유족연금까지
              함께 봐야 합니다.
            </span>
          }
        />
      )}

      <div className={s.assumptions}>
        <strong>이 계산의 한계 — 실제 금액과 다를 수 있습니다</strong>
        <ul>
          <li>
            <strong>재평가를 반영하지 않았습니다.</strong> 실제 B값은 과거 소득을 연도별 재평가율로
            현재가치로 환산해 평균낸 값입니다. 여기서는 넣으신 금액을 그대로 씁니다. 정확한 금액은{' '}
            <a href="https://www.nps.or.kr" target="_blank" rel="noopener noreferrer">
              국민연금공단 내 연금 알아보기
            </a>
            에서 실제 가입 이력으로 확인하세요.
          </li>
          <li>
            <strong>A값은 매년 바뀝니다.</strong> 실제로는 수급 시점의 A값이 적용되므로, 이 결과는
            오늘 기준 금액입니다. 연금액은 물가에 연동돼 조정되기도 합니다(제51조 ②).
          </li>
          <li>
            <strong>크레딧과 감액은 빼놓았습니다.</strong> 출산·군복무·실업 크레딧으로 가입기간이
            늘어날 수 있고, 반대로 수급 중 소득이 많으면 감액됩니다(제63조의2).
          </li>
        </ul>
      </div>
    </>
  );
}
