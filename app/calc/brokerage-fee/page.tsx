import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { BrokerageCalc } from '@/components/PropertyCalculators';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: `${latestYear()}년 부동산 중개수수료 계산기`,
  description: '매매·임대차 거래금액별 중개보수 상한을 요율과 한도액까지 근거와 함께 계산합니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/brokerage-fee' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);
  const b = r.brokerageFee;
  return (
    <CalcPage
      category="부동산"
      tone="c2"
      year={year}
      title="부동산 중개수수료 계산기"
      lead={
        <>
          거래금액에 따른 <strong>중개보수 상한</strong>을 계산합니다. 실제 보수는 이 범위 안에서 협의로 정합니다.
          {' '}<a href="/brokerage-fee/50000">5억</a>·<a href="/brokerage-fee/100000">10억</a> 같은
          대표 금액은 바로 볼 수 있습니다.
        </>
      }
      verifiedAt={r.verifiedAt}
      faqs={[
        { q: '중개수수료는 정해진 금액인가요?',
          a: '아닙니다. 법에서 정한 것은 상한요율이고, 실제 보수는 그 한도 안에서 중개사와 협의해 정합니다. 계산 결과는 "최대 이만큼까지"라는 뜻입니다.' },
        { q: '월세는 거래금액을 어떻게 계산하나요?',
          a: '보증금 + (월세 × 100)으로 환산합니다. 다만 이 금액이 5천만원 미만이면 보증금 + (월세 × 70)으로 다시 계산합니다.' },
        { q: '부가가치세를 따로 내나요?',
          a: '중개사가 일반과세자면 중개보수의 10%가 부가세로 추가됩니다. 간이과세자면 다를 수 있으니 계약 전에 확인하세요.' },
        { q: '한도액은 무엇인가요?',
          a: '거래금액이 작은 구간(매매 5천만 미만, 임대차 1억 미만 등)에는 요율로 계산한 금액과 별도로 상한 금액이 정해져 있습니다. 둘 중 적은 금액이 상한입니다.' },
      ]}
      basisItems={[
        `주택 매매·임대차 상한요율표 — ${b.source}`,
        `부가가치세 ${b.vatRate * 100}% (일반과세 중개사)`,
        '지자체 조례로 요율이 다를 수 있음',
      ]}
    >
      <BrokerageCalc year={year} />
    </CalcPage>
  );
}
