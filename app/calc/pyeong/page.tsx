import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { AreaCalc } from '@/components/BasicCalculators';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: '평 ↔ ㎡ 변환',
  description:
    '전용면적 84㎡가 몇 평인지 바로 변환합니다. 85㎡를 넘으면 취득세에 농어촌특별세가 붙는다는 점까지 함께 알려드립니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/pyeong' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);
  return (
    <CalcPage
      category="계산·단위"
      tone="c4"
      year={year}
      title="평 ↔ ㎡ 변환"
      lead={<>부동산 공부에는 ㎡만 적히는데 사람은 평으로 말합니다. <strong>85㎡가 세금의 경계</strong>라는 점도 함께 봅니다.</>}
      verifiedAt={r.verifiedAt}
      faqs={[
        { q: '1평은 정확히 몇 ㎡인가요?',
          a: '400/121 ㎡, 약 3.3058㎡입니다. 6자×6자에서 온 관습 단위라 딱 떨어지지 않습니다. 평은 법정 계량단위가 아니어서 등기부·건축물대장에는 ㎡만 적힙니다.' },
        { q: '왜 85㎡가 중요한가요?',
          a: '국민주택 규모 기준이라 취득세에 농어촌특별세(0.2%)가 붙느냐 마느냐가 여기서 갈립니다. 84㎡ 아파트가 많은 이유가 이것입니다. 다주택 중과 시에는 농특세도 0.6~1.0%로 함께 무거워집니다.' },
        { q: '분양면적과 전용면적이 다른데요?',
          a: '전용면적은 우리 집 내부, 공급면적은 전용 + 주거공용(계단·복도), 계약면적은 거기에 기타공용까지 더한 것입니다. 세금은 전용면적 기준이고, "34평"처럼 부르는 건 보통 공급면적입니다.' },
      ]}
      basisItems={[
        `1평 = 400/121 ㎡ ≈ 3.3058㎡ — ${r.basic.pyeong.source}`,
        '국민주택 규모 85㎡ — 지방세법 제11조 관련(농어촌특별세 부과 기준)',
      ]}
    >
      <AreaCalc year={year} />
    </CalcPage>
  );
}
