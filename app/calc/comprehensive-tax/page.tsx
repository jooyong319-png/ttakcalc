import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { ComprehensiveTaxCalc } from '@/components/TaxCalculators';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: '종합소득세 계산기',
  description:
    '프리랜서·사업자의 5월 종합소득세를 계산합니다. 3.3%로 뗀 기납부세액과 비교해 환급인지 추가 납부인지 보여드립니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/comprehensive-tax' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);

  return (
    <CalcPage
      category="급여·노동"
      tone="c1"
      year={year}
      title={`${year}년 종합소득세 계산기`}
      lead={
        <>
          <a href="/calc/freelancer">3.3%로 뗀 세금</a>이 5월에 어떻게 정산되는지 —{' '}
          <strong>환급인지 추가 납부인지</strong>를 근거와 함께 보여드립니다.
        </>
      }
      verifiedAt={r.verifiedAt}
      faqs={[
        { q: '3.3%를 뗐는데 왜 5월에 또 신고하나요?',
          a: '3.3%는 미리 떼어 둔 것(원천징수)일 뿐 확정된 세금이 아닙니다. 5월에 1년치 소득과 경비·공제를 모두 반영해 실제 세금을 확정하고, 미리 낸 것과의 차액을 돌려받거나 더 냅니다.' },
        { q: '필요경비율은 어디서 확인하나요?',
          a: '업종코드마다 다르고 매년 국세청이 고시합니다. 홈택스 → 조회/발급 → 기준·단순 경비율에서 본인 업종코드로 확인하세요. 이 사이트는 업종별 경비율을 추정하지 않고 직접 넣도록 했습니다.' },
        { q: '단순경비율과 기준경비율은 뭐가 다른가요?',
          a: '수입금액이 일정 기준 미만이면 단순경비율(수입 × 경비율)을 쓸 수 있어 증빙 없이 경비를 인정받습니다. 기준을 넘으면 기준경비율이 적용돼 주요 경비는 증빙이 필요합니다. 실제 경비가 더 크면 장부를 써서 실제 경비로 신고하는 게 유리합니다.' },
        { q: '왜 환급이 나오나요?',
          a: '3.3%는 경비와 공제를 전혀 반영하지 않은 금액이라, 경비율이 높거나 소득이 적으면 실제 세금보다 많이 뗀 셈이 됩니다. 그 차액이 환급됩니다.' },
        { q: '지방소득세는요?',
          a: '소득세의 10%가 지방소득세로 따로 부과됩니다. 원천징수 때 뗀 0.3%가 여기에 해당하며, 소득세와 별도로 정산됩니다.' },
      ]}
      basisItems={[
        `종합소득 기본세율 6~45% — ${r.incomeTax.source}`,
        '기본공제 1명당 150만원 — 소득세법 제50조',
        '표준세액공제 7만원(사업소득자) — 소득세법 제59조의4 제9항',
        `지방소득세 소득세의 ${r.incomeTax.localTaxRateOfIncomeTax * 100}% — 지방세법 제92조`,
        '필요경비율은 국세청 업종별 고시 — 이 사이트가 추정하지 않고 입력받는다',
      ]}
    >
      <ComprehensiveTaxCalc year={year} />
    </CalcPage>
  );
}
