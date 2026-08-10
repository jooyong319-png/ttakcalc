import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { EmployerCostCalc } from '@/components/CompareCalculators';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: `${latestYear()}년 4대보험 사업주 부담 계산기`,
  description:
    '직원 1명을 고용하면 회사가 실제로 얼마를 쓰는지 계산합니다. 국민연금·건강보험·고용보험·산재보험 사업주 부담분을 항목별로 보여드립니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/employer-cost' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);
  const e = r.employer;
  return (
    <CalcPage
      category="급여·노동"
      tone="c1"
      year={year}
      title={`${year}년 4대보험 사업주 부담 계산기`}
      lead={<>직원 1명을 쓰면 <strong>회사가 실제로 얼마를 쓰는지</strong> — 급여에 더해지는 보험료를 항목별로 보여드립니다.</>}
      verifiedAt={r.verifiedAt}
      faqs={[
        { q: '사업주 부담이 근로자 부담과 같나요?',
          a: '국민연금·건강보험·장기요양보험은 노사가 절반씩이라 요율이 같습니다. 고용보험은 실업급여분만 절반씩이고, 고용안정·직업능력개발사업분은 사업주가 전액 냅니다. 산재보험은 전액 사업주 부담입니다.' },
        { q: '산재보험료율은 왜 직접 넣어야 하나요?',
          a: '업종별로 매년 고시되며 편차가 큽니다(사무직과 건설업이 크게 다릅니다). 이 사이트가 임의로 정하면 틀린 숫자가 되므로 근로복지공단에서 본인 사업 종류의 요율을 확인해 넣도록 했습니다.' },
        { q: '고용안정·직업능력개발사업 요율은 어떻게 정해지나요?',
          a: '상시근로자 수에 따라 150인 미만 0.25%, 150인 이상 우선지원대상기업 0.45%, 150인 이상 1,000인 미만 0.65%, 1,000인 이상·국가·지자체 0.85%입니다.' },
        { q: '이게 전부인가요?',
          a: '아닙니다. 퇴직급여 충당(연 급여의 약 1/12), 연차수당, 4대보험 외 복리후생은 별도입니다. 이 계산기는 법정 보험료만 다룹니다.' },
      ]}
      basisItems={[
        `국민연금·건강보험·장기요양 사업주 요율은 근로자와 동일 — ${r.insurance.nationalPension.source}`,
        `고용보험 실업급여 노사 각 ${(r.insurance.employmentInsurance.employeeRate * 100).toFixed(1)}% — ${r.insurance.employmentInsurance.source}`,
        `고용안정·직업능력개발 0.25~0.85%(사업주 전액) — ${e.employmentStabilitySource}`,
        `산재보험 — ${e.industrialAccidentNote}`,
      ]}
    >
      <EmployerCostCalc year={year} />
    </CalcPage>
  );
}
