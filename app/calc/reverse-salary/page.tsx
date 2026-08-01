import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { ReverseSalaryCalc } from '@/components/CompareCalculators';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: '실수령액으로 연봉 역산하기',
  description:
    '월 실수령액 300만원을 받으려면 연봉이 얼마여야 하는지 역산합니다. 4대보험·세금을 거꾸로 되짚어 필요한 세전 연봉을 알려드립니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/reverse-salary' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);
  return (
    <CalcPage
      category="급여·노동"
      tone="c1"
      year={year}
      title="실수령액 → 연봉 역산"
      lead={
        <>
          &ldquo;월 300만원 받으려면 연봉 얼마?&rdquo; — <strong>거꾸로</strong> 계산합니다.
          {' '}<a href="/net-salary/300">월 300만원</a>·<a href="/net-salary/400">월 400만원</a> 같은
          대표 금액은 바로 볼 수 있습니다.
        </>
      }
      verifiedAt={r.verifiedAt}
      faqs={[
        { q: '왜 딱 떨어지지 않나요?',
          a: '연봉을 만원 단위로 올림하기 때문입니다. 실제 연봉 협상이 만원 단위로 이뤄지고, 원 단위까지 주면 정밀해 보이지만 쓸 데가 없습니다. 목표에 모자라지 않는 쪽으로 올림합니다.' },
        { q: '어떻게 거꾸로 계산하나요?',
          a: '소득세가 누진세라 닫힌 역함수가 없습니다. 대신 실수령액이 연봉에 대해 항상 증가한다는 성질을 이용해 이분 탐색으로 좁혀 나갑니다. 정방향 계산기와 똑같은 함수를 쓰므로 결과가 어긋나지 않습니다.' },
        { q: '이직할 때 어떻게 쓰나요?',
          a: '지금 실수령액을 넣으면 현재 연봉 수준이 나옵니다. 거기서 원하는 인상폭을 더한 실수령액을 넣으면 요구할 연봉이 나옵니다. 비과세액(식대)을 어떻게 잡느냐에 따라 꽤 달라지니 함께 맞춰 보세요.' },
      ]}
      basisItems={[
        '정방향 계산기(연봉 실수령액)와 동일한 계산 함수를 이분 탐색으로 뒤집는다',
        `4대보험·소득세 기준 — ${r.incomeTax.source}`,
        '연봉은 만원 단위 올림(목표에 모자라지 않는 쪽)',
      ]}
    >
      <ReverseSalaryCalc year={year} />
    </CalcPage>
  );
}
