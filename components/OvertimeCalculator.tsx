'use client';
import { useState, useMemo } from 'react';
import { calcOvertimePay } from '@/lib/calc/overtime';
import { Breakdown, InputCard, Field, calcStyles as s } from './Breakdown';
import { AmountInput } from './AmountInput';

const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');

/** 시간 입력 — 0.5시간 단위 */
function Hours({ value, onChange, max = 200 }: { value: number; onChange: (n: number) => void; max?: number }) {
  return (
    <div className={s.row}>
      <input
        type="number" step={0.5} min={0} max={max}
        className={`${s.input} num`} value={value}
        onChange={e => onChange(Math.max(0, Number(e.target.value)))}
      />
      <span className={s.unit}>시간</span>
    </div>
  );
}

export function OvertimeCalc({ year }: { year: string }) {
  const [hourlyWage, setWage] = useState(12_000);
  const [overtimeHours, setOt] = useState(10);
  const [overtimeNightHours, setOtN] = useState(0);
  const [holidayHours, setHol] = useState(0);
  const [holidayNightHours, setHolN] = useState(0);
  const [employees, setEmployees] = useState(5);

  const r = useMemo(
    () => calcOvertimePay({ year, hourlyWage, overtimeHours, overtimeNightHours, holidayHours, holidayNightHours, employees }),
    [year, hourlyWage, overtimeHours, overtimeNightHours, holidayHours, holidayNightHours, employees],
  );

  return (
    <>
      <InputCard>
        <Field label="통상임금 시급" hint="월 통상임금 ÷ 209시간. 어떤 수당이 통상임금에 들어가는지는 판례 영역이라 직접 넣습니다">
          <AmountInput value={hourlyWage} onChange={setWage} unit="원" step={500} />
        </Field>

        <div className={s.grid}>
          <Field label="연장근로" hint="법정근로시간(주 40시간)을 넘긴 시간">
            <Hours value={overtimeHours} onChange={setOt} />
          </Field>
          <Field label="그중 야간에 한 시간" hint="밤 10시~새벽 6시. 가산이 겹쳐 2.0배가 됩니다">
            <Hours value={overtimeNightHours} onChange={setOtN} max={overtimeHours} />
          </Field>
        </div>

        <div className={s.grid}>
          <Field label="휴일근로" hint="8시간까지는 1.5배, 넘으면 2.0배">
            <Hours value={holidayHours} onChange={setHol} />
          </Field>
          <Field label="그중 야간에 한 시간" hint="8시간 초과분이 야간이면 2.5배로 가장 높습니다">
            <Hours value={holidayNightHours} onChange={setHolN} max={holidayHours} />
          </Field>
        </div>

        <Field label="상시 근로자 수" hint="4명 이하면 가산수당 지급 의무가 없습니다(근로기준법 제11조 ①)">
          <div className={s.row}>
            <input
              type="number" step={1} min={0} max={9999}
              className={`${s.input} num`} value={employees}
              onChange={e => setEmployees(Math.max(0, Number(e.target.value)))}
            />
            <span className={s.unit}>명</span>
          </div>
        </Field>
      </InputCard>

      <Breakdown
        headlineLabel={r.applies ? '받아야 할 수당' : '받아야 할 임금 (가산 없음)'}
        headlineValue={r.total}
        headlineSub={
          r.applies && r.extra > 0
            ? `${r.totalHours}시간 · 가산으로 ${fmt(r.extra)}원 더`
            : `${r.totalHours}시간분`
        }
        rows={r.steps.map(st => ({ label: st.label, value: st.value, basis: st.basis, tone: st.tone }))}
        footer={<span>최종 확인 {r.verifiedAt} · 근로기준법 제56조·제11조</span>}
      />

      {r.applies && r.lines.length > 0 && (
        <div className={s.assumptions}>
          <strong>가산은 겹칩니다 — 여기서 제일 많이 틀립니다</strong>
          <ul>
            <li>
              <strong>야간에 하는 연장근로 = 2.0배.</strong> 연장 50%와 야간 50%를 각각 더합니다.
              "야간이니까 1.5배"로만 세면 절반을 놓칩니다.
            </li>
            <li>
              <strong>휴일 8시간 초과분을 야간에 하면 2.5배.</strong> 휴일 초과 100% + 야간 50%로
              가장 높은 배율입니다.
            </li>
            <li>
              야간 시간은 가산율이 높은 <strong>8시간 초과분에 먼저 배분</strong>해 계산했습니다.
              실제로도 늦게까지 이어진 근로가 야간에 걸립니다.
            </li>
          </ul>
        </div>
      )}

      <div className={s.assumptions}>
        <strong>이 계산에 넣지 않은 것</strong>
        <ul>
          <li>
            <strong>통상임금의 범위</strong> — 어떤 수당이 통상임금에 들어가는지는 판례가 계속
            쌓이는 영역이라 사이트가 정하지 않고 시급을 직접 받습니다. 월급제라면 월 통상임금을
            209시간으로 나눈 값이 대략의 시급입니다.
          </li>
          <li>
            <strong>포괄임금제</strong> — 계약에 고정 연장수당이 포함돼 있다면 실제 근로시간분이
            그 금액을 넘는지 비교해야 합니다. 넘으면 차액을 더 받아야 합니다.
          </li>
          <li>
            <strong>보상휴가제</strong>(제57조) — 노사 합의로 수당 대신 휴가를 줄 수 있습니다.
          </li>
        </ul>
      </div>
    </>
  );
}
