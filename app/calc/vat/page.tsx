import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { VatCalc } from '@/components/BasicCalculators';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: `${latestYear()}년 부가가치세 계산기`,
  description:
    '공급가액에서 부가세를, 합계금액에서 공급가액을 되짚어 계산합니다. 합계에서 10%를 빼면 왜 틀리는지도 알려드립니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/vat' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);
  return (
    <CalcPage
      category="계산·단위"
      tone="c4"
      year={year}
      title="부가가치세 계산기"
      lead={<>공급가액 ↔ 합계금액을 양방향으로 계산합니다. <strong>합계에서 10%를 빼면 틀립니다.</strong></>}
      verifiedAt={r.verifiedAt}
      faqs={[
        { q: '110만원에서 부가세를 빼면 99만원 아닌가요?',
          a: '아닙니다. 100만원입니다. 부가세는 공급가액의 10%라 합계금액은 공급가액의 1.1배입니다. 되짚을 때는 1.1로 나눠야 합니다. 10%를 빼면 1만원이 어긋납니다.' },
        { q: '간이과세자도 10%인가요?',
          a: '간이과세자는 업종별 부가가치율을 곱해 세액이 훨씬 적고, 세금계산서 발급도 제한됩니다. 이 계산기는 일반과세자 기준입니다.' },
        { q: '어디에 쓰나요?',
          a: '견적서·세금계산서를 주고받을 때, 중개수수료에 부가세가 붙는지 확인할 때 씁니다. 프리랜서 3.3% 원천징수와는 완전히 다른 세금입니다.' },
      ]}
      basisItems={[`부가가치세 ${r.basic.vat.rate * 100}% — ${r.basic.vat.source}`]}
    >
      <VatCalc year={year} />
    </CalcPage>
  );
}
