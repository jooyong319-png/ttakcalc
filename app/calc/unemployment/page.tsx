import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { UnemploymentCalc } from '@/components/LaborCalculators';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: '실업급여 계산기',
  description: '퇴직 전 평균임금·고용보험 가입기간·연령으로 구직급여 일액과 소정급여일수, 총 예상 수령액을 계산합니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/unemployment' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);
  const u = r.unemployment;
  const lower = Math.round(r.minimumWage.hourly * u.lowerBoundRateOfMinimumWage * u.dailyWorkHours);
  return (
    <CalcPage
      docNo="03"
      year={year}
      title="실업급여 계산기"
      lead={<>구직급여 <strong>1일 지급액과 받을 수 있는 일수</strong>를 계산합니다. 상·하한이 걸리면 그 사실도 표시해요.</>}
      verifiedAt={r.verifiedAt}
      faqs={[
        { q: '실업급여는 얼마나 받나요?',
          a: `1일 구직급여는 퇴직 전 평균임금의 ${u.wageReplacementRate * 100}%입니다. 다만 상한 ${u.dailyMax.toLocaleString()}원, 하한 ${lower.toLocaleString()}원(최저시급의 80% × 8시간)이 있어 고소득자도 상한을 넘지 못합니다.` },
        { q: '며칠 동안 받나요?',
          a: '고용보험 가입기간과 연령에 따라 120일~270일입니다. 가입기간이 길수록, 50세 이상이거나 장애인이면 더 깁니다. 계산기에서 두 조건을 선택하면 소정급여일수가 나옵니다.' },
        { q: '누구나 받을 수 있나요?',
          a: '아닙니다. 이직일 이전 18개월간 피보험 단위기간이 180일 이상이어야 하고, 자발적 퇴사·중대한 귀책사유로 인한 해고는 원칙적으로 수급 자격이 없습니다. 실제 수급 자격은 고용센터가 판단합니다.' },
        { q: '이 금액을 그대로 받나요?',
          a: '이 계산기는 상한·하한을 반영한 추정치입니다. 실제로는 실업 인정일마다 지급되고, 조기재취업수당 등 다른 제도가 적용될 수 있습니다.' },
        { q: '자주 받으면 불이익이 있나요?',
          a: '2026년부터 반복수급자 제재가 강화됐습니다. 5년 동안 3회 이상 구직급여를 받으면 지급액이 감액되고, 기존 7일이던 대기기간도 최대 2~4주까지 늘어납니다. 이 계산기는 반복수급 감액을 반영하지 않은 금액이므로, 해당된다면 실제 수령액은 더 적을 수 있습니다.' },
        { q: '수급기간에 제한이 있나요?',
          a: '이직일 다음 날부터 12개월 이내에만 받을 수 있습니다. 소정급여일수가 남아 있어도 12개월이 지나면 잔여 급여는 소멸하므로, 퇴직 후 바로 신청하는 것이 좋습니다.' },
      ]}
      basisItems={[
        `구직급여일액 = 평균임금 × ${u.wageReplacementRate * 100}%, 상한 ${u.dailyMax.toLocaleString()}원 — ${u.source}`,
        `하한 = 최저시급 ${r.minimumWage.hourly.toLocaleString()}원 × ${u.lowerBoundRateOfMinimumWage * 100}% × ${u.dailyWorkHours}시간 = ${lower.toLocaleString()}원`,
        '소정급여일수 120~270일 (가입기간·연령별)',
      ]}
    >
      <UnemploymentCalc year={year} />
    </CalcPage>
  );
}
