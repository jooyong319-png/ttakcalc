'use client';
import { useState, useMemo } from 'react';
import { calcInheritanceTax } from '@/lib/calc/inheritance';
import { Breakdown, InputCard, Field, calcStyles as s } from './Breakdown';
import { AmountInput } from './AmountInput';

const 억 = 100_000_000;
const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');

export function InheritanceCalc({ year }: { year: string }) {
  const [estate, setEstate] = useState(10 * 억);
  const [debt, setDebt] = useState(0);
  const [hasSpouse, setHasSpouse] = useState(true);
  const [spouseAuto, setSpouseAuto] = useState(true);
  const [spouseTakes, setSpouseTakes] = useState(0);
  const [children, setChildren] = useState(2);
  const [minorYears, setMinorYears] = useState(0);
  const [elderly, setElderly] = useState(0);
  const [netFinancial, setNetFinancial] = useState(0);

  const r = useMemo(
    () => calcInheritanceTax({
      year, estate, debt, hasSpouse,
      spouseTakes: hasSpouse && !spouseAuto ? spouseTakes : null,
      children, minorYears, elderly, netFinancial,
    }),
    [year, estate, debt, hasSpouse, spouseAuto, spouseTakes, children, minorYears, elderly, netFinancial],
  );

  return (
    <>
      <InputCard>
        <Field label="상속재산" hint="부동산·예금·주식 등 상속개시일 현재 재산 총액">
          <AmountInput value={estate} onChange={setEstate} unit="원" step={억} />
        </Field>
        <div className={s.quick}>
          {[5, 10, 15, 20, 30, 50].map(v => (
            <button
              key={v} type="button"
              className={`${s.chip} ${estate === v * 억 ? s.chipOn : ''}`}
              onClick={() => setEstate(v * 억)}
            >
              {v}억
            </button>
          ))}
        </div>

        <div className={s.grid}>
          <Field label="채무·장례비" hint="피상속인의 채무·공과금·장례비. 과세가액에서 뺍니다">
            <AmountInput value={debt} onChange={setDebt} unit="원" step={10_000_000} />
          </Field>
          <Field label="순금융재산" hint="예금·주식 등에서 금융채무를 뺀 금액. 20%를 추가 공제(2억 한도)">
            <AmountInput value={netFinancial} onChange={setNetFinancial} unit="원" step={10_000_000} />
          </Field>
        </div>

        <div className={s.grid}>
          <Field label="배우자" hint="배우자가 있으면 최소 5억이 공제됩니다">
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
          <Field label="자녀 수" hint="1명당 5천만원 공제. 배우자 법정상속분 계산에도 씁니다">
            <div className={s.row}>
              <input
                type="number" step={1} min={0} max={20}
                className={`${s.input} num`} value={children}
                onChange={e => setChildren(Math.max(0, Number(e.target.value)))}
              />
              <span className={s.unit}>명</span>
            </div>
          </Field>
        </div>

        {hasSpouse && (
          <Field
            label="배우자가 실제 상속받는 금액"
            hint="분할 협의에 따라 달라집니다. 모르면 법정상속분대로 두세요"
          >
            <div className={s.segment} style={{ marginBottom: '0.6rem' }}>
              <button
                type="button"
                className={`${s.segmentBtn} ${spouseAuto ? s.segmentBtnOn : ''}`}
                onClick={() => setSpouseAuto(true)}
              >
                법정상속분대로
              </button>
              <button
                type="button"
                className={`${s.segmentBtn} ${!spouseAuto ? s.segmentBtnOn : ''}`}
                onClick={() => setSpouseAuto(false)}
              >
                직접 입력
              </button>
            </div>
            {!spouseAuto && (
              <AmountInput value={spouseTakes} onChange={setSpouseTakes} unit="원" step={억} />
            )}
          </Field>
        )}

        <div className={s.grid}>
          <Field label="미성년 자녀의 남은 연수 합계" hint="예: 12세·15세면 (19−12)+(19−15)=11. 연 1천만원 공제">
            <div className={s.row}>
              <input
                type="number" step={1} min={0} max={200}
                className={`${s.input} num`} value={minorYears}
                onChange={e => setMinorYears(Math.max(0, Number(e.target.value)))}
              />
              <span className={s.unit}>년</span>
            </div>
          </Field>
          <Field label="65세 이상 동거가족" hint="배우자 제외. 1명당 5천만원 공제">
            <div className={s.row}>
              <input
                type="number" step={1} min={0} max={20}
                className={`${s.input} num`} value={elderly}
                onChange={e => setElderly(Math.max(0, Number(e.target.value)))}
              />
              <span className={s.unit}>명</span>
            </div>
          </Field>
        </div>
      </InputCard>

      <Breakdown
        headlineLabel="납부할 상속세"
        headlineValue={r.finalTax}
        headlineSub={
          r.finalTax === 0
            ? `공제 ${fmt(r.totalDeduction)}원 범위 안이라 세금이 없습니다`
            : `상속재산 대비 ${(r.effectiveRate * 100).toFixed(2)}% · 공제 합계 ${fmt(r.totalDeduction)}원`
        }
        rows={r.steps.map(st => ({ label: st.label, value: st.value, basis: st.basis, tone: st.tone }))}
        footer={<span>최종 확인 {r.verifiedAt} · 상속세 및 증여세법 제18~22조·제26조·제69조, 민법 제1009조</span>}
      />

      <div className={s.assumptions}>
        <strong>이 계산에 넣지 않은 것</strong>
        <ul>
          <li>
            <strong>사전증여 합산</strong> — 상속개시일 전 10년(상속인 외의 자는 5년) 이내에 증여한
            재산은 상속재산에 더해집니다. 언제 얼마를 증여했는지는 알 수 없어 반영하지 않았습니다.
            해당되면 실제 세금이 이보다 큽니다.
          </li>
          <li>
            <strong>장애인공제·동거주택 상속공제</strong> — 장애인공제는 기대여명 통계가, 동거주택
            공제는 10년 동거·무주택 요건 확인이 필요해 계산하지 않았습니다.
          </li>
          <li>
            <strong>가업·영농 상속공제</strong> — 요건이 까다롭고 금액이 커 별도 검토가 필요합니다.
          </li>
          <li>
            <strong>세대생략 할증</strong> — 손자녀가 상속받으면 산출세액의 30%(미성년자가 20억
            초과를 받으면 40%)가 가산됩니다.
          </li>
        </ul>
      </div>
    </>
  );
}
