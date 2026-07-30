import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { SalaryCalculator } from '@/components/SalaryCalculator';
import { availableYears, latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: '연봉 실수령액 계산기',
  description:
    '연봉을 넣으면 4대보험·소득세를 각각 얼마씩 떼는지 근거까지 보여드립니다. 연도별 요율을 그대로 보관해 과거 기준으로도 계산할 수 있어요.',
  alternates: { canonical: 'https://ttakcalc.com/calc/salary' },
};

export default function SalaryPage() {
  const years = availableYears();
  const year = latestYear();
  const rates = getRates(year);

  // 계산기 페이지의 FAQ는 화면에 실제로 렌더되는 것과 1:1로 일치시켜야 리치 결과 자격이 유지된다.
  const faqs = [
    {
      q: '실수령액이 왜 생각보다 적나요?',
      a: `연봉에서 국민연금(${(rates.insurance.nationalPension.employeeRate * 100).toFixed(3)}%), 건강보험(${(rates.insurance.healthInsurance.employeeRate * 100).toFixed(3)}%), 장기요양보험(건강보험료의 ${(rates.insurance.longTermCare.rateOfHealthInsurance * 100).toFixed(2)}%), 고용보험(${(rates.insurance.employmentInsurance.employeeRate * 100).toFixed(1)}%)과 소득세·지방소득세가 빠집니다. 연봉이 오를수록 소득세율 구간이 올라가 공제 비율도 함께 커집니다.`,
    },
    {
      q: '회사에서 받은 실제 급여명세서와 금액이 조금 달라요.',
      a: '매월 원천징수하는 소득세는 국세청 근로소득 간이세액표를 따르는데, 이 계산기는 연말정산과 같은 방식(근로소득공제 → 과세표준 → 세액공제)으로 연간 세액을 구해 12로 나눈 추정치입니다. 몇 천 원 차이가 날 수 있고 그 차액은 연말정산으로 정산됩니다. 회사가 상여를 나눠 지급하거나 비과세 항목이 다르면 차이가 더 날 수 있습니다.',
    },
    {
      q: '비과세액은 무엇을 넣나요?',
      a: `식대처럼 세금을 매기지 않는 급여 항목의 월 합계입니다. 식대 비과세 한도는 월 ${rates.nonTaxable.mealAllowanceMonthlyMax.toLocaleString()}원이며, 이 금액은 4대보험과 소득세 계산에서 모두 빠집니다. 급여명세서의 '비과세' 항목을 확인해 넣으면 가장 정확합니다.`,
    },
    {
      q: '국민연금은 연봉이 높아도 왜 그대로인가요?',
      a: `국민연금은 기준소득월액에 상한(월 ${rates.insurance.nationalPension.monthlyIncomeMax.toLocaleString()}원)과 하한(월 ${rates.insurance.nationalPension.monthlyIncomeMin.toLocaleString()}원)이 있습니다. 상한을 넘는 급여는 더 내지 않기 때문에 고연봉일수록 보험료가 고정됩니다.`,
    },
  ];


  return (
    <CalcPage
      docNo="01"
      year={year}
      title={`${year}년 연봉 실수령액 계산기`}
      lead={<>세전 연봉에서 4대보험과 세금을 각각 얼마씩 떼는지, <strong>근거까지 함께</strong> 보여드립니다.</>}
      verifiedAt={rates.verifiedAt}
      faqs={faqs}
      basisItems={[
        `국민연금 ${(rates.insurance.nationalPension.employeeRate * 100).toFixed(3)}% — ${rates.insurance.nationalPension.source}`,
        `건강보험 ${(rates.insurance.healthInsurance.employeeRate * 100).toFixed(3)}% — ${rates.insurance.healthInsurance.source}`,
        `장기요양보험 건강보험료의 ${(rates.insurance.longTermCare.rateOfHealthInsurance * 100).toFixed(2)}% — ${rates.insurance.longTermCare.source}`,
        `고용보험 ${(rates.insurance.employmentInsurance.employeeRate * 100).toFixed(1)}% — ${rates.insurance.employmentInsurance.source}`,
        `소득세 기본세율 + 표준세액공제 13만원 — ${rates.incomeTax.source}`,
        `식대 비과세 한도 월 ${rates.nonTaxable.mealAllowanceMonthlyMax.toLocaleString()}원 — ${rates.nonTaxable.source}`,
      ]}
    >
      <SalaryCalculator years={years} defaultYear={year} />
    </CalcPage>
  );
}
