import type { Metadata } from 'next';
import { RouteIndex } from '@/components/RouteIndex';
import { getRates } from '@/lib/rates';
import { manLabel, manToWon, won, pct } from '@/lib/format';
import { PRICE, ACQ_CASES, DEFAULT_YEAR } from '@/lib/propertyPages';
import { calcAcquisitionTax } from '@/lib/calc/property';

export const metadata: Metadata = {
  title: '주택 가격별 취득세 표',
  description:
    '1억원부터 20억원까지 5,000만원 단위 주택 취득세를 한 표에 정리했습니다. 1주택·전용 85㎡ 이하 기준입니다.',
  alternates: { canonical: 'https://ttakcalc.com/acquisition-tax' },
};

// 상세 페이지로 가는 크롤링 경로이자, 그 자체로 "주택 가격별 표" 검색을 받는 페이지.
// 이게 없으면 상세 페이지들이 사이트맵과 앞뒤 링크로만 닿아 크롤 순위가 밀린다.
export default function Page() {
  const year = DEFAULT_YEAR;
  const rates = getRates(year);
  const c = ACQ_CASES[0];
  const rows = PRICE.all().map(m => {
    const r = calcAcquisitionTax({
      year, price: manToWon(m),
      areaSqm: c.areaSqm, houseCount: c.houseCount, regulated: c.regulated,
    });
    return {
      href: `/acquisition-tax/${m}`, label: manLabel(m),
      cells: [`${won(r.total)}원`, pct(r.effectiveRate, 2)],
    };
  });

  return (
    <RouteIndex
      tone="c2"
      category="부동산"
      categoryHref="/c/property"
      meta={`${rates.label} 기준`}
      title="주택 가격별 취득세 표"
      firstColumn="주택 가격"
      lead={
        <>
          주택 가격 {manLabel(PRICE.min)}부터 {manLabel(PRICE.max)}까지 5,000만원 단위 취득세입니다.
          지방교육세·농어촌특별세를 포함한 금액이며, 1주택·전용 85㎡ 이하 기준입니다.
        </>
      }
      caption={`${rates.label} 기준 · 최종 확인 ${rates.verifiedAt}`}
      columns={[{ label: '취득세 합계', numeric: true, minus: true }, { label: '실효세율', numeric: true }]}
      rows={rows}
      outro={
        <>
          조건이 다르면 금액도 달라집니다. 직접 넣어 계산하려면{' '}
          <a href="/calc/acquisition-tax">계산기</a>를 쓰세요. 요율이 언제 어떻게 바뀌었는지는{' '}
          <a href="/changes">제도 변화</a>에 있습니다.
        </>
      }
    />
  );
}
