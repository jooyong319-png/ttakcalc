'use client';
import { useState, useMemo } from 'react';
import { calcCarCost } from '@/lib/calc/carCost';
import { Breakdown, InputCard, Field, calcStyles as s } from './Breakdown';
import { AmountInput } from './AmountInput';

const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');

export function CarCostCalc({ year }: { year: string }) {
  const [cc, setCc] = useState(1998);
  const [ageYears, setAgeYears] = useState(3);
  const [km, setKm] = useState(15_000);
  const [fuelEfficiency, setEff] = useState(11);
  const [fuelPrice, setFuelPrice] = useState(1_700);
  const [insurance, setInsurance] = useState(900_000);
  const [maintenance, setMaintenance] = useState(500_000);
  const [parkingMonthly, setParking] = useState(100_000);
  const [tollMonthly, setToll] = useState(30_000);

  const r = useMemo(
    () => calcCarCost({
      year, cc, ageYears, km, fuelEfficiency, fuelPrice,
      insurance, maintenance, parkingMonthly, tollMonthly,
    }),
    [year, cc, ageYears, km, fuelEfficiency, fuelPrice, insurance, maintenance, parkingMonthly, tollMonthly],
  );

  return (
    <>
      <InputCard>
        <div className={s.grid}>
          <Field label="배기량" hint="자동차세를 계산합니다 — 여기만 우리가 계산합니다">
            <AmountInput value={cc} onChange={setCc} unit="cc" step={100} />
          </Field>
          <Field label="차령" hint="3년째부터 매년 5%씩 경감, 12년 50% 한도">
            <div className={s.row}>
              <input
                type="number" step={1} min={0} max={30}
                className={`${s.input} num`} value={ageYears}
                onChange={e => setAgeYears(Math.max(0, Number(e.target.value)))}
              />
              <span className={s.unit}>년</span>
            </div>
          </Field>
        </div>

        <div className={s.grid}>
          <Field label="연간 주행거리" hint="계기판 연간 증가분. 모르면 1만 5천km 정도가 평균입니다">
            <AmountInput value={km} onChange={setKm} unit="km" step={1_000} />
          </Field>
          <Field label="연비" hint="계기판 평균 연비. 공인연비보다 실연비가 낮습니다">
            <div className={s.row}>
              <input
                type="number" step={0.1} min={0} max={100}
                className={`${s.input} num`} value={fuelEfficiency}
                onChange={e => setEff(Math.max(0, Number(e.target.value)))}
              />
              <span className={s.unit}>km/L</span>
            </div>
          </Field>
        </div>

        <Field label="연료 단가" hint="주유소마다 다르고 매일 바뀌어 사이트가 정하지 않습니다">
          <AmountInput value={fuelPrice} onChange={setFuelPrice} unit="원/L" step={50} />
        </Field>

        <div className={s.grid}>
          <Field label="연간 보험료" hint="갱신 안내서에 적힌 금액. 보험료는 계산하지 않고 넣으신 값을 씁니다">
            <AmountInput value={insurance} onChange={setInsurance} unit="원" step={100_000} />
          </Field>
          <Field label="연간 정비·소모품" hint="엔진오일·타이어·브레이크·정기점검 1년치">
            <AmountInput value={maintenance} onChange={setMaintenance} unit="원" step={100_000} />
          </Field>
        </div>

        <div className={s.grid}>
          <Field label="월 주차비" hint="아파트 주차비·월주차 등. 없으면 0">
            <AmountInput value={parkingMonthly} onChange={setParking} unit="원" step={10_000} />
          </Field>
          <Field label="월 통행료·기타" hint="하이패스·세차·기타. 없으면 0">
            <AmountInput value={tollMonthly} onChange={setToll} unit="원" step={10_000} />
          </Field>
        </div>
      </InputCard>

      <Breakdown
        headlineLabel="월 평균 유지비"
        headlineValue={r.monthlyTotal}
        headlineSub={
          r.perKm > 0
            ? `연 ${fmt(r.annualTotal)}원 · 1km당 ${fmt(r.perKm)}원`
            : `연 ${fmt(r.annualTotal)}원`
        }
        rows={r.steps.map(st => ({ label: st.label, value: st.value, basis: st.basis, tone: st.tone }))}
        caption="항목별 연간 비용 — 무엇이 얼마인지"
        footer={<span>자동차세 최종 확인 {r.verifiedAt} · 지방세법 제127조·제128조·제151조</span>}
      />

      <div className={s.assumptions}>
        <strong>이 계산기가 하는 일과 하지 않는 일</strong>
        <ul>
          <li>
            <strong>계산해 드리는 건 자동차세 하나입니다.</strong> 지방세법 조문대로 배기량·차령을
            적용해 지방교육세까지 더합니다. 나머지 항목은 넣으신 값을 더할 뿐입니다.
          </li>
          <li>
            <strong>자동차보험료는 계산하지 않습니다.</strong> 보험개발원 참조순보험요율도 보험사별
            요율도 공개되지 않고, 차량모델등급·할인할증등급·가입경력·특약이 얽힙니다. 대조할 원문이
            없는 값을 그럴듯하게 지어내지 않겠습니다. 실제 보험료는 손해보험협회{' '}
            <a href="https://www.inscompare.or.kr" target="_blank" rel="noopener noreferrer">
              보험다모아
            </a>
            에서 조건을 넣어 비교하실 수 있습니다.
          </li>
          <li>
            <strong>감가상각은 빠져 있습니다.</strong> 차값이 떨어지는 것도 실질적인 비용이지만
            모델·연식·주행거리·사고이력에 따라 달라 계산하지 않았습니다. 차를 팔 때까지의 총비용을
            보시려면 여기에 따로 더해야 합니다.
          </li>
        </ul>
      </div>
    </>
  );
}
