import type { Metadata } from 'next';
import { RouteIndex } from '@/components/RouteIndex';
import { getRates } from '@/lib/rates';
import { manLabel, manToWon, won } from '@/lib/format';
import { PUBLIC_PRICE, PROPERTY_ASSUMPTION, DEFAULT_YEAR } from '@/lib/localTaxPages';
import { calcPropertyTax } from '@/lib/calc/localTax';

/** 페이지 설명. 검색 결과 스니펫과 구조화 데이터가 같은 문장을 쓰도록 한곳에 둔다. */
const DESCRIPTION =
  '공시가격 1억원부터 15억원까지 5,000만원 단위 주택 재산세를 한 표에 정리했습니다. 1세대 1주택 특례세율 기준입니다.';

export const metadata: Metadata = {
  title: '공시가격별 재산세 표',
  description: DESCRIPTION,
  alternates: { canonical: 'https://ttakcalc.com/property-tax' },
};

// 상세 페이지로 가는 크롤링 경로이자, 그 자체로 "공시가격별 표" 검색을 받는 페이지.
// 이게 없으면 상세 페이지들이 사이트맵과 앞뒤 링크로만 닿아 크롤 순위가 밀린다.
export default function Page() {
  const year = DEFAULT_YEAR;
  const rates = getRates(year);
  const rows = PUBLIC_PRICE.all().map(m => {
    const r = calcPropertyTax({ year, publicPrice: manToWon(m), ...PROPERTY_ASSUMPTION });
    return {
      href: `/property-tax/${m}`, label: manLabel(m),
      cells: [`${won(r.total)}원`, `${won(r.half)}원`],
    };
  });

  return (
    <RouteIndex
      tone="c2"
      category="부동산"
      categoryHref="/c/property"
      meta={`${rates.label} 기준`}
      title="공시가격별 재산세 표"
      firstColumn="공시가격"
      lead={
        <>
          공시가격 {manLabel(PUBLIC_PRICE.min)}부터 {manLabel(PUBLIC_PRICE.max)}까지 5,000만원 단위
          재산세입니다. 도시지역분·지방교육세를 포함하며, 1세대 1주택 특례세율 기준입니다.
        </>
      }
      description={DESCRIPTION}
      caption={`${rates.label} 기준 · 최종 확인 ${rates.verifiedAt}`}
      columns={[{ label: '연간 재산세', numeric: true, minus: true }, { label: '7·9월 각각', numeric: true }]}
      rows={rows}
      outro={
        <>
          조건이 다르면 금액도 달라집니다. 직접 넣어 계산하려면{' '}
          <a href="/calc/property-tax">계산기</a>를 쓰세요. 요율이 언제 어떻게 바뀌었는지는{' '}
          <a href="/changes">제도 변화</a>에 있습니다.
        </>
      }
    />
  );
}
