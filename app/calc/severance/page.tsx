import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { SeveranceCalc } from '@/components/LaborCalculators';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: '퇴직금 계산기',
  description: '입사일·퇴사일과 월급을 넣으면 1일 평균임금부터 예상 퇴직금까지 계산 근거를 함께 보여드립니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/severance' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);
  return (
    <CalcPage
      category="급여·노동"
      tone="c1"
      year={year}
      title="퇴직금 계산기"
      lead={<>재직 기간과 평균임금으로 예상 퇴직금을 계산합니다. <strong>1일 평균임금이 어떻게 나왔는지</strong>까지 보여드려요.</>}
      verifiedAt={r.verifiedAt}
      faqs={[
        { q: '퇴직금은 얼마 이상 일해야 받나요?',
          a: '계속근로기간이 1년 이상이고 4주 평균 주 15시간 이상 근무해야 법정 퇴직금 지급 대상입니다. 1년 미만이면 지급 의무가 없습니다.' },
        { q: '평균임금에는 무엇이 들어가나요?',
          a: '퇴직 전 3개월간 지급된 임금 총액이 기준입니다. 기본급과 고정수당은 물론, 연간 상여금과 연차수당도 3개월분(연간액 × 3/12)을 더해 계산합니다. 이 계산기도 그 방식을 씁니다.' },
        { q: '평균임금이 통상임금보다 적으면요?',
          a: '근로기준법상 평균임금이 통상임금보다 적으면 통상임금을 평균임금으로 봅니다. 이 계산기는 입력한 평균임금 기준으로만 계산하므로, 결근·휴직으로 임금이 줄어든 기간이 있다면 회사나 노무사에게 확인하세요.' },
        { q: '실제 지급액과 다를 수 있나요?',
          a: '네. 3개월 기간의 실제 일수(89~92일)를 91.25일로 환산한 근사치이고, 퇴직소득세가 별도로 공제됩니다. 회사의 퇴직연금(DC형) 가입 여부에 따라서도 달라집니다.' },
      ]}
      basisItems={[
        `퇴직금 = 1일 평균임금 × ${r.severance.daysPerYear}일 × (재직일수 ÷ 365) — ${r.severance.source}`,
        `지급 요건: 계속근로 ${r.severance.minimumMonths}개월 이상, 주 ${r.severance.weeklyHoursMin}시간 이상`,
      ]}
    >
      <SeveranceCalc year={year} />
    </CalcPage>
  );
}
