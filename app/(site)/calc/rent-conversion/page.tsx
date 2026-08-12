import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { RentConversionCalc } from '@/components/ExtraCalculators';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: `${latestYear()}년 전월세 전환율 계산기`,
  description:
    '보증금을 월세로 돌릴 때의 법정 상한 월세를 계산합니다. 한국은행 기준금리에 연동된 전환율을 반영합니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/rent-conversion' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);
  const c = r.rentConversion;
  return (
    <CalcPage
      category="부동산"
      tone="c2"
      year={year}
      title="전월세 전환율 계산기"
      lead={
        <>
          보증금을 월세로 돌릴 때 <strong>법으로 정해진 상한</strong>이 있습니다.
          지금은 기준금리 {(c.bokBaseRate * 100).toFixed(2)}% + 2% ={' '}
          <strong>{((c.bokBaseRate + c.baseRateSpread) * 100).toFixed(2)}%</strong>입니다.
        </>
      }
      verifiedAt={r.verifiedAt}
      faqs={[
        { q: '전환율 상한이 어떻게 정해지나요?',
          a: '주택임대차보호법 제7조의2에 따라 ①연 10% ②한국은행 기준금리 + 2% 중 낮은 쪽입니다. 기준금리가 낮은 지금은 ②가 적용됩니다. 기준금리가 오르면 상한도 함께 오릅니다.' },
        { q: '신규 계약에도 적용되나요?',
          a: '조문은 "보증금의 전부 또는 일부를 월 단위 차임으로 전환하는 경우"를 규율합니다. 기존 계약의 전환·갱신에 적용되며, 처음부터 월세로 맺는 신규 계약에는 강제력이 없다는 것이 일반적인 해석입니다.' },
        { q: '집주인이 상한보다 높게 요구하면요?',
          a: '초과분은 무효라서 돌려받을 수 있습니다. 다툼이 생기면 대한법률구조공단의 주택임대차분쟁조정위원회에 조정을 신청할 수 있습니다.' },
        { q: '반대로 월세를 보증금으로 바꾸려면요?',
          a: '그 방향(월세 → 보증금)에는 법정 상한이 없습니다. 당사자 협의로 정하며, 보통 전환율을 그대로 역산해 기준으로 삼습니다.' },
      ]}
      basisItems={[
        `상한 ① 연 ${(c.ceilingRate * 100).toFixed(0)}% — 주택임대차보호법 시행령 제9조 제1항`,
        `상한 ② 한국은행 기준금리 + ${(c.baseRateSpread * 100).toFixed(0)}% — 같은 조 제2항`,
        `한국은행 기준금리 ${(c.bokBaseRate * 100).toFixed(2)}% (${c.bokBaseRateAsOf} 변경)`,
        c.source,
      ]}
    >
      <RentConversionCalc year={year} />
    </CalcPage>
  );
}
