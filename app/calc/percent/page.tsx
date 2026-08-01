import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { PercentCalc } from '@/components/BasicCalculators';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: '퍼센트 계산기',
  description:
    'A의 B%, 증감률, 비율을 계산식과 함께 계산합니다. 연봉 인상률처럼 자주 쓰는 퍼센트 계산을 한 화면에서.',
  alternates: { canonical: 'https://ttakcalc.com/calc/percent' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);
  return (
    <CalcPage
      category="계산·단위"
      tone="c4"
      year={year}
      title="퍼센트 계산기"
      lead={<>A의 B%, 증감률, 비율 — <strong>어떤 식으로 나온 숫자인지</strong>까지 보여드립니다.</>}
      verifiedAt={r.verifiedAt}
      faqs={[
        { q: '증감률과 퍼센트포인트가 어떻게 다른가요?',
          a: '이자율이 3%에서 4%로 오르면 1%포인트 오른 것이고, 증감률로는 33.3% 오른 것입니다. 뉴스에서 자주 섞여 쓰여 혼동됩니다.' },
        { q: '연봉 인상률은 어떻게 보나요?',
          a: '"A → B 증감률"에 인상 전후 연봉을 넣으면 됩니다. 다만 세전 인상률과 실수령액 인상률은 다릅니다 — 누진세라 인상분에 더 높은 세율이 붙습니다. 실제 차이는 연봉 실수령액 계산기에서 확인하세요.' },
        { q: '기준값이 0이면요?',
          a: '증감률을 정의할 수 없습니다. 0에서 얼마가 되든 "몇 배 늘었다"를 말할 수 없기 때문입니다. 이 계산기는 그때 무한대 대신 "계산 불가"를 표시합니다.' },
      ]}
      basisItems={[
        'A의 B% = A × B ÷ 100',
        '증감률 = (이후 − 이전) ÷ 이전 × 100',
        '비율 = 부분 ÷ 전체 × 100',
      ]}
    >
      <PercentCalc />
    </CalcPage>
  );
}
