import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { CompoundCalc } from '@/components/BasicCalculators';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: '예·적금 이자 계산기',
  description:
    '단리·월복리 만기 수령액을 이자소득세 15.4%까지 반영해 계산합니다. 세전 이자율과 실제 손에 쥐는 금액의 차이를 보여드립니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/compound' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);
  const t = r.basic.interestIncomeTax;
  return (
    <CalcPage
      category="계산·단위"
      tone="c4"
      year={year}
      title="예·적금 이자 계산기"
      lead={<>광고에 적힌 이자율은 세전입니다. <strong>이자소득세 15.4%</strong>를 떼고 실제로 얼마가 남는지 계산합니다.</>}
      verifiedAt={r.verifiedAt}
      faqs={[
        { q: '이자소득세 15.4%는 어떻게 나오나요?',
          a: '소득세 14%(소득세법 제129조)에 지방소득세가 소득세의 10%로 붙어 1.4%가 더해집니다. 합쳐서 15.4%입니다.' },
        { q: '단리와 월복리 차이가 큰가요?',
          a: '기간이 짧으면 거의 같습니다. 1년 예금 연 3.5%면 차이가 원금의 0.06% 수준입니다. 기간이 길어질수록 벌어집니다.' },
        { q: '적금도 이 계산이 맞나요?',
          a: '아닙니다. 이 계산기는 목돈을 한 번에 넣는 예금 기준입니다. 적금은 매달 넣는 돈마다 예치 기간이 달라 실제 수령액이 단순 계산보다 적습니다.' },
        { q: '금융소득 종합과세는 뭔가요?',
          a: '이자·배당 소득 합계가 연 2,000만원을 넘으면 원천징수로 끝나지 않고 다른 소득과 합쳐 종합과세됩니다. 그 경우 세율이 15.4%보다 높아질 수 있습니다.' },
      ]}
      basisItems={[
        `이자소득 원천징수 ${t.incomeTaxRate * 100}% + 지방소득세 ${t.incomeTaxRate * t.localTaxRateOfIncomeTax * 100}% = 15.4% — ${t.source}`,
        '월복리: P × ((1 + 연이율÷12)^개월수 − 1)',
        '단리: P × 연이율 × 개월수÷12',
      ]}
    >
      <CompoundCalc year={year} />
    </CalcPage>
  );
}
