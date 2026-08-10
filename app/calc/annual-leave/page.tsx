import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { AnnualLeaveCalc } from '@/components/ExtraCalculators';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: `${latestYear()}년 연차수당 계산기`,
  description:
    '근속연수별 연차 발생일수와 미사용 연차수당을 계산합니다. 3년째부터 2년마다 1일씩 늘어나는 가산휴가까지 반영합니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/annual-leave' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);
  const a = r.annualLeave;
  return (
    <CalcPage
      category="급여·세금"
      tone="c1"
      year={year}
      title="연차수당 계산기"
      lead={
        <>
          근속연수에 따라 연차가 <strong>몇 일 생기고</strong>, 안 쓰면 <strong>얼마를 받는지</strong> 계산합니다.
          {' '}<a href="/annual-leave/5">5년차</a>·<a href="/annual-leave/10">10년차</a>는 바로 볼 수 있습니다.
        </>
      }
      verifiedAt={r.verifiedAt}
      faqs={[
        { q: '연차는 몇 일 생기나요?',
          a: '1년 이상 일하고 그 해 80% 이상 출근했으면 15일입니다. 3년째부터는 최초 1년을 초과하는 계속근로 매 2년마다 1일씩 늘어나고, 최대 25일입니다. 1년 미만이면 1개월 개근할 때마다 1일씩 최대 11일입니다.' },
        { q: '왜 3년차에 16일인가요?',
          a: '가산은 "최초 1년을 초과하는 계속근로 매 2년"에 대해 붙습니다. 3년차면 초과 근로가 2년이라 1일, 5년차면 4년이라 2일입니다. 그래서 3년 16일, 5년 17일, 7년 18일 식으로 2년마다 하루씩 늘어납니다.' },
        { q: '미사용 연차수당은 어떻게 계산하나요?',
          a: '1일 통상임금 × 미사용 일수입니다. 1일 통상임금은 월 통상임금 ÷ 209시간 × 8시간으로 구합니다. 통상임금에는 기본급과 고정수당이 들어가고, 실적에 따라 달라지는 성과급은 보통 빠집니다.' },
        { q: '회사가 회계연도 기준으로 준다는데요?',
          a: '입사일 기준이 원칙이지만, 관리 편의를 위해 회계연도(보통 1월 1일) 기준으로 일괄 부여하는 회사가 많습니다. 이 경우에도 퇴직 시점에는 입사일 기준으로 계산해 부족분을 정산해야 합니다.' },
        { q: '연차수당이 퇴직금에도 영향을 주나요?',
          a: '네. 퇴직 전 3개월 안에 지급된 연차수당은 평균임금에 포함돼 퇴직금이 늘어납니다. 퇴직금 계산기에서 연차수당 항목에 넣어보세요.' },
      ]}
      basisItems={[
        `1년 이상 80% 이상 출근 시 ${a.baseDays}일 — ${a.source} 제1항`,
        `1년 미만은 1개월 개근당 1일(최대 ${a.under1YearMaxDays}일) — 같은 조 제2항`,
        `3년 이상부터 매 2년 1일 가산, ${a.maxDays}일 한도 — 같은 조 제4항`,
        `1일 통상임금 = 월 통상임금 ÷ ${a.monthlyStandardHours}시간 × ${a.dailyStandardHours}시간`,
      ]}
    >
      <AnnualLeaveCalc year={year} />
    </CalcPage>
  );
}
