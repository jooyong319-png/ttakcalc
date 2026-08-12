import type { Metadata } from 'next';
import { RouteIndex } from '@/components/RouteIndex';
import { getRates } from '@/lib/rates';
import { manLabel, manToWon, won, pct } from '@/lib/format';
import { DIVIDEND, DEFAULT_YEAR } from '@/lib/salaryPages';
import { calcDividendTax } from '@/lib/calc/dividend';

export const metadata: Metadata = {
  title: '배당금별 배당소득세 표',
  description:
    '연간 배당 500만원부터 2억원까지 500만원 단위 세금을 한 표에 정리했습니다. 금융소득 2천만원을 넘으면 어떻게 달라지는지 한눈에 보입니다.',
  alternates: { canonical: 'https://ttakcalc.com/dividend-tax' },
};

// 상세 페이지로 가는 크롤링 경로이자, 그 자체로 "연간 배당금별 표" 검색을 받는 페이지.
// 이게 없으면 상세 페이지들이 사이트맵과 앞뒤 링크로만 닿아 크롤 순위가 밀린다.
export default function Page() {
  const year = DEFAULT_YEAR;
  const rates = getRates(year);
  const rows = DIVIDEND.all().map(m => {
    const r = calcDividendTax({
      year, dividend: manToWon(m), interest: 0, domestic: false,
      otherIncome: 0, deduction: 1_500_000,
    });
    return {
      href: `/dividend-tax/${m}`, label: manLabel(m),
      cells: [`${won(r.totalTax)}원`, `${won(r.netDividend)}원`, pct(r.effectiveRate, 2)],
    };
  });

  return (
    <RouteIndex
      tone="c3"
      category="금융·자동차"
      categoryHref="/c/finance"
      meta={`${rates.label} 기준`}
      title="배당금별 배당소득세 표"
      firstColumn="연간 배당금"
      lead={
        <>
          연간 배당 {manLabel(DIVIDEND.min)}부터 {manLabel(DIVIDEND.max)}까지 500만원 단위 세금입니다.
          해외 주식·ETF, 다른 소득 없음 기준입니다. 2천만원을 넘어도 실효세율이 한동안 15.4%에 머무는 게 보입니다.
        </>
      }
      caption={`${rates.label} 기준 · 최종 확인 ${rates.verifiedAt}`}
      columns={[{ label: '세금', numeric: true, minus: true }, { label: '세후 수령', numeric: true }, { label: '실효세율', numeric: true }]}
      rows={rows}
      outro={
        <>
          조건이 다르면 금액도 달라집니다. 직접 넣어 계산하려면{' '}
          <a href="/calc/dividend-tax">계산기</a>를 쓰세요. 요율이 언제 어떻게 바뀌었는지는{' '}
          <a href="/changes">제도 변화</a>에 있습니다.
        </>
      }
    />
  );
}
