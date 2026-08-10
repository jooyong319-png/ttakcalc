import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { FreelancerCalc } from '@/components/LaborCalculators';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: `${latestYear()}년 프리랜서 3.3% 계산기`,
  description: '계약금액에서 3.3%를 뗀 실수령액을, 반대로 원하는 실수령액에서 필요한 계약금액도 역산해 드립니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/freelancer' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);
  const f = r.freelancer;
  return (
    <CalcPage
      category="급여·노동"
      tone="c1"
      year={year}
      title="프리랜서 3.3% 계산기"
      lead={<>계약금액에서 원천징수 3.3%를 뗀 실수령액을 계산합니다. <strong>실수령액에서 계약금액 역산</strong>도 됩니다.</>}
      verifiedAt={r.verifiedAt}
      faqs={[
        { q: '3.3%는 무슨 세금인가요?',
          a: `사업소득 원천징수입니다. 소득세 ${f.incomeTaxRate * 100}%와 그 소득세의 10%인 지방소득세 ${f.localTaxRate * 100}%를 합해 3.3%가 됩니다. 일을 준 쪽이 미리 떼서 국가에 납부합니다.` },
        { q: '떼인 3.3%는 돌려받을 수 있나요?',
          a: '5월 종합소득세 신고로 정산됩니다. 실제 산출세액이 원천징수액보다 적으면 환급받고, 많으면 추가 납부합니다. 경비가 많은 프리랜서는 환급받는 경우가 흔합니다.' },
        { q: '4대보험은 안 떼나요?',
          a: '프리랜서(사업소득자)는 근로자가 아니라 4대보험을 원천징수하지 않습니다. 대신 지역가입자로 건강보험·국민연금을 직접 납부해야 하므로, 실질 부담은 3.3%보다 큽니다.' },
        { q: '실수령액 기준으로 계약하려면?',
          a: '계산 방식을 "실수령 → 계약금액"으로 바꾸면 됩니다. 원하는 실수령액 ÷ 0.967로 계약금액을 역산합니다.' },
      ]}
      basisItems={[
        `소득세 ${f.incomeTaxRate * 100}% + 지방소득세(소득세의 10%) = 3.3% — ${f.source}`,
      ]}
    >
      <FreelancerCalc year={year} />
    </CalcPage>
  );
}
