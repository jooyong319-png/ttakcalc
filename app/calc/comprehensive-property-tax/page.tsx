import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { ComprehensivePropertyCalc } from '@/components/ExtraCalculators';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: '종합부동산세 계산기',
  description:
    '보유 주택 공시가격 합계로 종합부동산세를 계산합니다. 1세대 1주택 12억 공제와 구간별 누진세율을 반영합니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/comprehensive-property-tax' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);
  const c = r.comprehensivePropertyTax;
  return (
    <CalcPage
      category="부동산"
      tone="c2"
      year={year}
      title="종합부동산세 계산기"
      lead={
        <>
          공시가격 합계가 <strong>1세대 1주택 12억 / 그 밖 9억</strong>을 넘으면 12월에 냅니다.
          매년 7·9월에 내는 <a href="/calc/property-tax">재산세</a>와는 별개입니다.
        </>
      }
      verifiedAt={r.verifiedAt}
      faqs={[
        { q: '얼마부터 내나요?',
          a: '보유한 주택의 공시가격 합계 기준으로 1세대 1주택은 12억원, 그 밖의 경우는 9억원을 넘어야 대상이 됩니다. 넘는 금액에 공정시장가액비율 60%를 곱한 것이 과세표준입니다.' },
        { q: '재산세를 냈는데 또 내나요?',
          a: '겹치는 부분은 공제됩니다. 다만 그 계산에는 개인별 보유 이력이 필요해 이 계산기는 반영하지 않았습니다. 실제 고지액은 여기서 나온 금액보다 낮습니다.' },
        { q: '언제 부과되나요?',
          a: '매년 6월 1일 기준 보유자에게 12월에 부과됩니다. 6월 1일 이전에 팔면 그해 종부세는 내지 않습니다.' },
        { q: '3주택 이상이면 얼마나 늘어나나요?',
          a: '과세표준 12억원까지는 세율이 같지만 그 위 구간부터 크게 올라갑니다. 25억 이하 구간에서 1.3% → 2.0%, 50억 이하는 1.5% → 3.0%로 뜁니다.' },
        { q: '부부 공동명의면 유리한가요?',
          a: '각자 지분만큼 나눠 계산하므로 공제를 두 번 받는 효과가 있습니다. 다만 1세대 1주택 특례(12억 공제·고령자·장기보유 세액공제)와 비교해 유불리가 갈려 선택할 수 있습니다.' },
      ]}
      basisItems={[
        `1세대 1주택 공제 ${c.deductionOneHouse.toLocaleString()}원 / 그 밖 ${c.deductionOther.toLocaleString()}원`,
        `공정시장가액비율 ${(c.fairMarketRatio * 100).toFixed(0)}%`,
        '주택분 세율 0.5~2.7%(2주택 이하) / 0.5~5.0%(3주택 이상) 구간별 누진',
        `농어촌특별세 종부세의 ${c.ruralTaxRate * 100}%`,
        c.source,
      ]}
    >
      <ComprehensivePropertyCalc year={year} />
    </CalcPage>
  );
}
