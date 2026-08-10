'use client';
import { useState, useMemo } from 'react';
import { calcLeavePeriod } from '@/lib/calc/leavePeriod';
import { Breakdown, InputCard, Field, calcStyles as s } from './Breakdown';

/** 오늘 날짜를 YYYY-MM-DD로. 클라이언트에서 구해야 빌드 시각에 굳지 않는다. */
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function LeavePeriodCalc({ year }: { year: string }) {
  const [birth, setBirth] = useState('2024-03-01');
  const [usedMonths, setUsed] = useState(0);
  const [usedSplits, setSplits] = useState(0);
  const [eligibleForExtra, setExtra] = useState(false);
  // 렌더마다 바뀌지 않도록 한 번만 잡는다(하이드레이션 불일치 방지)
  const [today] = useState(todayISO);

  const r = useMemo(() => {
    try {
      return calcLeavePeriod({ year, birth, today, usedMonths, usedSplits, eligibleForExtra });
    } catch {
      return null;
    }
  }, [year, birth, today, usedMonths, usedSplits, eligibleForExtra]);

  return (
    <>
      <InputCard>
        <Field label="자녀 생년월일" hint="만 8세 이하 또는 초등학교 2학년 이하까지 쓸 수 있습니다">
          <input
            type="date"
            className={`${s.input} num`}
            value={birth}
            max="2030-12-31"
            onChange={e => setBirth(e.target.value)}
          />
        </Field>

        <Field
          label="6개월 추가 요건에 해당하나요?"
          hint="같은 자녀로 부모가 모두 각각 3개월 이상 사용했거나, 한부모·장애아동의 부모"
        >
          <div className={s.segment}>
            <button
              type="button"
              className={`${s.segmentBtn} ${!eligibleForExtra ? s.segmentBtnOn : ''}`}
              onClick={() => setExtra(false)}
            >
              아니오 (최대 1년)
            </button>
            <button
              type="button"
              className={`${s.segmentBtn} ${eligibleForExtra ? s.segmentBtnOn : ''}`}
              onClick={() => setExtra(true)}
            >
              예 (최대 1년 6개월)
            </button>
          </div>
        </Field>

        <div className={s.grid}>
          <Field label="이미 사용한 기간" hint="이 자녀로 쓴 육아휴직 개월 수">
            <div className={s.row}>
              <input
                type="number" step={1} min={0} max={18}
                className={`${s.input} num`} value={usedMonths}
                onChange={e => setUsed(Math.max(0, Number(e.target.value)))}
              />
              <span className={s.unit}>개월</span>
            </div>
          </Field>
          <Field label="이미 나눠 쓴 횟수" hint="처음 쓰는 거라면 0. 분할은 3회까지입니다">
            <div className={s.row}>
              <input
                type="number" step={1} min={0} max={3}
                className={`${s.input} num`} value={usedSplits}
                onChange={e => setSplits(Math.max(0, Number(e.target.value)))}
              />
              <span className={s.unit}>회</span>
            </div>
          </Field>
        </div>
      </InputCard>

      {r === null ? (
        <p className={s.assumptions}>생년월일을 올바르게 넣어주세요.</p>
      ) : (
        <Breakdown
          headlineLabel={r.eligible ? '앞으로 쓸 수 있는 기간' : '신청 기한이 지났습니다'}
          headlineValue={r.eligible ? `${r.remainMonths}개월` : '0개월'}
          headlineUnit=""
          headlineSub={
            r.eligible
              ? `분할 ${r.splitsLeft}회 남음 · 기한 ${r.deadline.getFullYear()}년 ${r.deadline.getMonth() + 1}월 ${r.deadline.getDate()}일`
              : '자녀가 만 8세와 초등학교 2학년을 모두 지났습니다'
          }
          rows={r.steps.map(st => ({ label: st.label, value: st.value, basis: st.basis, tone: st.tone }))}
          caption="기간이 어떻게 나오는지"
          footer={
            <span>
              최종 확인 {r.verifiedAt} · 남녀고용평등과 일·가정 양립 지원에 관한 법률
              제19조·제19조의4
            </span>
          }
        />
      )}

      <div className={s.assumptions}>
        <strong>알아두실 것</strong>
        <ul>
          <li>
            <strong>&ldquo;만 8세 이하 또는 초등학교 2학년 이하&rdquo;는 둘 중 늦은 쪽까지입니다.</strong>{' '}
            조문이 &ldquo;또는&rdquo;이기 때문입니다. 3~12월생은 대체로 만 8세 기준이,
            1~2월생은 학년 기준이 늦습니다. 위 계산에 둘 다 표시했습니다.
          </li>
          <li>
            <strong>6개월 추가는 부모가 <em>모두</em> 써야 열립니다.</strong> 같은 자녀를 대상으로
            부모가 각각 3개월 이상 사용해야 하며, 그때 부와 모 각각 6개월씩 늘어납니다
            (제19조 ② 1호). 한부모·장애아동의 부모는 조건 없이 해당합니다.
          </li>
          <li>
            <strong>임신 중 쓴 육아휴직은 분할 횟수에 넣지 않습니다</strong>(제19조의4 ①).
            모성보호 목적으로 쓴 것은 따로 봅니다.
          </li>
          <li>
            <strong>육아휴직 기간은 근속기간에 들어갑니다</strong>(제19조 ④). 퇴직금·연차 계산에서
            빠지지 않습니다.
          </li>
        </ul>
      </div>
    </>
  );
}
