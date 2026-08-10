import type { Metadata } from 'next';
import { RouteIndex } from '@/components/RouteIndex';
import { getRates } from '@/lib/rates';
import { manLabel, manToWon, won } from '@/lib/format';
import { PRICE, DEFAULT_YEAR } from '@/lib/propertyPages';
import { calcBrokerage } from '@/lib/calc/property';

export const metadata: Metadata = {
  title: '거래 금액별 중개수수료 표',
  description:
    '1억원부터 20억원까지 5,000만원 단위 부동산 중개보수 상한을 한 표에 정리했습니다. 매매·임대차를 함께 봅니다.',
  alternates: { canonical: 'https://ttakcalc.com/brokerage-fee' },
};

// 상세 페이지로 가는 크롤링 경로이자, 그 자체로 "거래 금액별 표" 검색을 받는 페이지.
// 이게 없으면 상세 페이지들이 사이트맵과 앞뒤 링크로만 닿아 크롤 순위가 밀린다.
export default function Page() {
  const year = DEFAULT_YEAR;
  const rates = getRates(year);
  const rows = PRICE.all().map(m => {
    const sale = calcBrokerage(manToWon(m), year, 'sale', true);
    const lease = calcBrokerage(manToWon(m), year, 'lease', true);
    return {
      href: `/brokerage-fee/${m}`, label: manLabel(m),
      cells: [`${won(sale.total)}원`, `${won(lease.total)}원`],
    };
  });

  return (
    <RouteIndex
      tone="c2"
      category="부동산"
      categoryHref="/c/property"
      meta={`${rates.label} 기준`}
      title="거래 금액별 중개수수료 표"
      firstColumn="거래 금액"
      lead={
        <>
          거래 금액 {manLabel(PRICE.min)}부터 {manLabel(PRICE.max)}까지 5,000만원 단위 중개보수
          <strong>상한</strong>입니다. 실제 보수는 이 범위 안에서 협의로 정합니다.
        </>
      }
      caption={`${rates.label} 기준 · 최종 확인 ${rates.verifiedAt}`}
      columns={[{ label: '매매 (VAT 포함)', numeric: true, minus: true }, { label: '임대차 (VAT 포함)', numeric: true, minus: true }]}
      rows={rows}
      outro={
        <>
          조건이 다르면 금액도 달라집니다. 직접 넣어 계산하려면{' '}
          <a href="/calc/brokerage-fee">계산기</a>를 쓰세요. 요율이 언제 어떻게 바뀌었는지는{' '}
          <a href="/changes">제도 변화</a>에 있습니다.
        </>
      }
    />
  );
}
