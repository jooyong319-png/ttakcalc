import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { PropertyTaxCalc } from '@/components/TaxCalculators';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: '재산세 계산기',
  description:
    '주택 공시가격으로 재산세·도시지역분·지방교육세를 계산합니다. 1세대 1주택 공정시장가액비율과 특례세율도 반영합니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/property-tax' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);
  const p = r.propertyTax;

  return (
    <CalcPage
      category="부동산"
      tone="c2"
      year={year}
      title={`${year}년 재산세 계산기`}
      lead={
        <>
          공시가격으로 <strong>재산세·도시지역분·지방교육세</strong>를 한 번에 계산합니다.
          {' '}<a href="/property-tax/40000">4억</a>·<a href="/property-tax/60000">6억</a> 같은 대표
          공시가격은 바로 볼 수 있습니다.
        </>
      }
      verifiedAt={r.verifiedAt}
      faqs={[
        { q: '재산세 과세표준은 어떻게 정해지나요?',
          a: '공시가격에 공정시장가액비율을 곱합니다. 주택은 60%가 기본이고, 1세대 1주택은 공시가격 3억 이하 43%, 3~6억 44%, 6억 초과 45%로 더 낮습니다.' },
        { q: '1세대 1주택이면 세율도 낮나요?',
          a: '공시가격 9억원 이하인 1세대 1주택만 특례세율(0.05~0.35%)을 적용합니다. 9억을 넘으면 공정시장가액비율은 45%로 낮게 적용되지만 세율은 표준세율(0.1~0.4%)로 돌아갑니다.' },
        { q: '언제 내나요?',
          a: '매년 6월 1일 소유자에게 부과하고, 7월과 9월에 절반씩 나눠 냅니다. 6월 1일 이전에 팔면 그해 재산세는 내지 않습니다.' },
        { q: '도시지역분은 뭔가요?',
          a: '도시계획사업 재원으로 쓰는 세금으로, 과세표준의 0.14%가 붙습니다. 대부분의 시·구 지역이 대상이며 조례로 0.23%까지 정할 수 있습니다.' },
        { q: '종합부동산세는 포함되나요?',
          a: '아닙니다. 종부세는 공시가격 합계가 일정 기준(1세대 1주택 12억, 그 외 9억)을 넘을 때 12월에 따로 부과됩니다. 이 계산기는 재산세만 다룹니다.' },
      ]}
      basisItems={[
        `공정시장가액비율 — ${p.fairMarketRatio.note}`,
        '주택 표준세율 0.1~0.4% — 지방세법 제111조 제1항 제3호',
        `1세대 1주택 특례세율 0.05~0.35% — ${p.oneHouseNote}`,
        `도시지역분 — ${p.urbanAreaNote}`,
        `지방교육세 재산세의 ${p.localEduRateOfPropertyTax * 100}% — 지방세법 제151조`,
      ]}
    >
      <PropertyTaxCalc year={year} />
    </CalcPage>
  );
}
