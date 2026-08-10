import type { Metadata } from 'next';
import { RouteIndex } from '@/components/RouteIndex';
import { getRates } from '@/lib/rates';
import { manLabel, manToWon, won } from '@/lib/format';
import { GIFT, DEFAULT_YEAR } from '@/lib/salaryPages';
import { calcGiftTax } from '@/lib/calc/extra';

export const metadata: Metadata = {
  title: '증여 금액별 증여세 표',
  description:
    '1,000만원부터 10억원까지 1,000만원 단위 증여세를 한 표에 정리했습니다. 부모가 성년 자녀에게 증여하는 경우 기준입니다.',
  alternates: { canonical: 'https://ttakcalc.com/gift-tax' },
};

// 상세 페이지로 가는 크롤링 경로이자, 그 자체로 "증여 금액별 표" 검색을 받는 페이지.
// 이게 없으면 상세 페이지들이 사이트맵과 앞뒤 링크로만 닿아 크롤 순위가 밀린다.
export default function Page() {
  const year = DEFAULT_YEAR;
  const rates = getRates(year);
  const rows = GIFT.all().map(m => {
    const r = calcGiftTax(manToWon(m), 'lineal-ascendant', 0, true, year);
    return {
      href: `/gift-tax/${m}`, label: manLabel(m),
      cells: [`${won(r.taxBase)}원`, `${won(r.finalTax)}원`],
    };
  });

  return (
    <RouteIndex
      tone="c1"
      category="급여·세금"
      categoryHref="/c/tax"
      meta={`${rates.label} 기준`}
      title="증여 금액별 증여세 표"
      firstColumn="증여 금액"
      lead={
        <>
          {manLabel(GIFT.min)}부터 {manLabel(GIFT.max)}까지 1,000만원 단위 증여세입니다.
          부모가 성년 자녀에게 증여하고 10년 내 첫 증여, 기한 내 신고한 경우 기준입니다.
        </>
      }
      caption={`${rates.label} 기준 · 최종 확인 ${rates.verifiedAt}`}
      columns={[{ label: '과세표준', numeric: true }, { label: '증여세', numeric: true, minus: true }]}
      rows={rows}
      outro={
        <>
          조건이 다르면 금액도 달라집니다. 직접 넣어 계산하려면{' '}
          <a href="/calc/gift-tax">계산기</a>를 쓰세요. 요율이 언제 어떻게 바뀌었는지는{' '}
          <a href="/changes">제도 변화</a>에 있습니다.
        </>
      }
    />
  );
}
