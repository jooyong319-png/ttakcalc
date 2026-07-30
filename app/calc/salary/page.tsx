import type { Metadata } from 'next';
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

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, '\\u003c') }}
      />
      <div className="container" style={{ padding: '1.6rem 1.1rem 0' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 900 }}>
          {year}년 연봉 실수령액 계산기
        </h1>
        <p style={{ color: 'var(--text-soft)', margin: '0.5rem 0 1.3rem' }}>
          세전 연봉에서 4대보험과 세금을 각각 얼마씩 떼는지, <strong>근거까지 함께</strong> 보여드립니다.
        </p>

        <SalaryCalculator years={years} defaultYear={year} />

        <section style={{ marginTop: '2.2rem' }}>
          <h2 style={{ fontSize: '1.15rem', marginBottom: '0.9rem' }}>자주 묻는 질문</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {faqs.map(f => (
              <details key={f.q} style={{
                background: 'var(--bg-elev)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '0.8rem 1rem',
              }}>
                <summary style={{ fontWeight: 700, cursor: 'pointer' }}>{f.q}</summary>
                <p style={{ color: 'var(--text-soft)', margin: '0.6rem 0 0', fontSize: '0.92rem' }}>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.15rem', marginBottom: '0.7rem' }}>계산에 적용된 기준</h2>
          <ul style={{ color: 'var(--text-soft)', fontSize: '0.9rem', paddingLeft: '1.1rem', margin: 0 }}>
            <li>국민연금 {(rates.insurance.nationalPension.employeeRate * 100).toFixed(3)}% — {rates.insurance.nationalPension.source}</li>
            <li>건강보험 {(rates.insurance.healthInsurance.employeeRate * 100).toFixed(3)}% — {rates.insurance.healthInsurance.source}</li>
            <li>장기요양보험 건강보험료의 {(rates.insurance.longTermCare.rateOfHealthInsurance * 100).toFixed(2)}% — {rates.insurance.longTermCare.source}</li>
            <li>고용보험 {(rates.insurance.employmentInsurance.employeeRate * 100).toFixed(1)}% — {rates.insurance.employmentInsurance.source}</li>
            <li>소득세 기본세율 — {rates.incomeTax.source}</li>
          </ul>
          <p style={{ color: 'var(--text-faint)', fontSize: '0.83rem', marginTop: '0.7rem' }}>
            최종 확인일 {rates.verifiedAt}. 제도가 바뀌면 이 페이지의 기준도 함께 갱신하고,
            무엇이 바뀌었는지 <a href="/changes" style={{ color: 'var(--accent)', fontWeight: 600 }}>제도 변화</a>에 기록합니다.
          </p>
        </section>
      </div>
    </>
  );
}
