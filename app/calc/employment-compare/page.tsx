import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { EmploymentCompareCalc } from '@/components/CompareCalculators';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: `${latestYear()}년 정규직 vs 프리랜서 3.3% 비교`,
  description:
    '같은 계약금액일 때 정규직과 프리랜서 중 손에 쥐는 돈이 얼마나 다른지 비교합니다. 4대보험·퇴직금·연차까지 함께 따져봅니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/employment-compare' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);
  return (
    <CalcPage
      category="급여·노동"
      tone="c1"
      year={year}
      title="정규직 vs 프리랜서 3.3%"
      lead={<>같은 금액을 받아도 <strong>손에 쥐는 돈이 다릅니다.</strong> 다만 숫자에 안 나오는 것까지 같이 봐야 판단이 됩니다.</>}
      verifiedAt={r.verifiedAt}
      faqs={[
        { q: '프리랜서가 더 많이 받는데 왜 정규직을 하나요?',
          a: '3.3%는 4대보험이 빠진 금액이라 당장은 많아 보입니다. 하지만 국민연금·건강보험을 지역가입자로 전액 본인이 내야 하고, 퇴직금·연차·실업급여가 없습니다. 그 값을 더하면 대체로 뒤집힙니다.' },
        { q: '3.3%가 최종 세금인가요?',
          a: '아닙니다. 미리 떼어 둔 것일 뿐이라 5월에 종합소득세로 정산합니다. 경비가 많으면 돌려받고, 적으면 더 냅니다.' },
        { q: '어느 쪽이 유리한지 한 줄로 알려주세요.',
          a: '한 줄로 답할 수 없는 질문입니다. 소득이 높고 경비를 많이 인정받을 수 있으면 프리랜서가, 안정적인 소득과 복지가 필요하면 정규직이 유리합니다. 이 계산기는 "당장의 실수령액 차이"만 정확히 알려드립니다.' },
      ]}
      basisItems={[
        `정규직 — 4대보험 + 근로소득세(간이세액표 방식), ${r.incomeTax.source}`,
        `프리랜서 — 원천징수 3.3%, ${r.freelancer.source}`,
        '비과세(식대)는 정규직에만 적용된다',
      ]}
    >
      <EmploymentCompareCalc year={year} />
    </CalcPage>
  );
}
