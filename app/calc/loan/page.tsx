import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { LoanCalc } from '@/components/PropertyCalculators';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: `${latestYear()}년 대출 이자 계산기`,
  description: '원리금균등·원금균등·만기일시 상환 방식별 월 상환액과 총 이자를 계산식과 함께 비교합니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/loan' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);
  return (
    <CalcPage
      category="금융·자동차"
      tone="c3"
      year={year}
      title="대출 이자 계산기"
      lead={<>상환 방식에 따라 <strong>월 상환액과 총 이자가 얼마나 달라지는지</strong> 비교해 보세요.</>}
      verifiedAt={r.verifiedAt}
      faqs={[
        { q: '원리금균등과 원금균등, 뭐가 유리한가요?',
          a: '총 이자는 원금균등이 적습니다. 원금을 처음부터 많이 갚기 때문입니다. 대신 초기 상환 부담이 큽니다. 원리금균등은 매달 같은 금액이라 자금 계획을 세우기 쉽습니다.' },
        { q: '만기일시상환은 언제 쓰나요?',
          a: '매달 이자만 내고 만기에 원금을 한 번에 갚는 방식입니다. 월 부담이 가장 적지만 원금이 줄지 않아 총 이자가 가장 많습니다. 전세자금대출이나 단기 자금에 주로 쓰입니다.' },
        { q: '실제 은행 금액과 다를 수 있나요?',
          a: '네. 이 계산기는 고정금리·매월 동일 조건을 가정합니다. 변동금리, 거치기간, 중도상환수수료, 인지세, 근저당 설정비 등은 반영하지 않습니다.' },
        { q: '원리금균등 계산식이 어떻게 되나요?',
          a: '매월 상환액 = P × i × (1+i)ⁿ ÷ ((1+i)ⁿ − 1) 입니다. P는 원금, i는 월이자율(연이자율÷12), n은 총 개월 수입니다.' },
      ]}
      basisItems={[
        '원리금균등: A = P·i·(1+i)ⁿ ÷ ((1+i)ⁿ−1)',
        '원금균등: 매월 원금 = P÷n, 이자 = 잔액×i',
        '만기일시: 매월 이자만 납부, 만기에 원금 전액',
      ]}
    >
      <LoanCalc year={year} />
    </CalcPage>
  );
}
