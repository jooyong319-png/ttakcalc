import type { Metadata } from 'next';
import { RouteIndex } from '@/components/RouteIndex';
import { getRates } from '@/lib/rates';
import { manLabel, manToWon, won } from '@/lib/format';
import { INHERIT, DEFAULT_YEAR } from '@/lib/salaryPages';
import { calcInheritanceTax } from '@/lib/calc/inheritance';

export const metadata: Metadata = {
  title: '상속재산별 상속세 표',
  description:
    '상속재산 1억원부터 30억원까지 1억원 단위 상속세를 한 표에 정리했습니다. 배우자와 자녀 2명이 상속받는 경우 기준입니다.',
  alternates: { canonical: 'https://ttakcalc.com/inheritance-tax' },
};

// 상세 페이지로 가는 크롤링 경로이자, 그 자체로 "상속재산별 표" 검색을 받는 페이지.
// 이게 없으면 상세 페이지들이 사이트맵과 앞뒤 링크로만 닿아 크롤 순위가 밀린다.
export default function Page() {
  const year = DEFAULT_YEAR;
  const rates = getRates(year);
  const rows = INHERIT.all().map(m => {
    const r = calcInheritanceTax({
      year, estate: manToWon(m), debt: 0,
      hasSpouse: true, spouseTakes: null, children: 2,
      minorYears: 0, elderly: 0, netFinancial: 0,
    });
    return {
      href: `/inheritance-tax/${m}`, label: manLabel(m),
      cells: [`${won(r.totalDeduction)}원`, `${won(r.finalTax)}원`],
    };
  });

  return (
    <RouteIndex
      tone="c1"
      category="급여·세금"
      categoryHref="/c/tax"
      meta={`${rates.label} 기준`}
      title="상속재산별 상속세 표"
      firstColumn="상속재산"
      lead={
        <>
          상속재산 {manLabel(INHERIT.min)}부터 {manLabel(INHERIT.max)}까지 1억원 단위 상속세입니다.
          배우자와 자녀 2명이 법정상속분대로 상속받고 기한 내 신고한 경우 기준입니다.
        </>
      }
      caption={`${rates.label} 기준 · 최종 확인 ${rates.verifiedAt}`}
      columns={[{ label: '공제 합계', numeric: true }, { label: '상속세', numeric: true, minus: true }]}
      rows={rows}
      outro={
        <>
          조건이 다르면 금액도 달라집니다. 직접 넣어 계산하려면{' '}
          <a href="/calc/inheritance-tax">계산기</a>를 쓰세요. 요율이 언제 어떻게 바뀌었는지는{' '}
          <a href="/changes">제도 변화</a>에 있습니다.
        </>
      }
    />
  );
}
