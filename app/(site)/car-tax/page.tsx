import type { Metadata } from 'next';
import { RouteIndex } from '@/components/RouteIndex';
import { getRates } from '@/lib/rates';
import { won } from '@/lib/format';
import { CC, CAR_ASSUMPTION, DEFAULT_YEAR } from '@/lib/localTaxPages';
import { calcCarTax } from '@/lib/calc/localTax';

/** 페이지 설명. 검색 결과 스니펫과 구조화 데이터가 같은 문장을 쓰도록 한곳에 둔다. */
const DESCRIPTION =
  '800cc부터 3,000cc까지 100cc 단위 자동차세를 한 표에 정리했습니다. 비영업용·차령 3년 기준이며 연납 할인액도 함께 봅니다.';

export const metadata: Metadata = {
  title: '배기량별 자동차세 표',
  description: DESCRIPTION,
  alternates: { canonical: 'https://ttakcalc.com/car-tax' },
};

// 상세 페이지로 가는 크롤링 경로이자, 그 자체로 "배기량별 표" 검색을 받는 페이지.
// 이게 없으면 상세 페이지들이 사이트맵과 앞뒤 링크로만 닿아 크롤 순위가 밀린다.
export default function Page() {
  const year = DEFAULT_YEAR;
  const rates = getRates(year);
  const rows = CC.all().map(cc => {
    const r = calcCarTax({ year, cc, ...CAR_ASSUMPTION });
    return {
      href: `/car-tax/${cc}`, label: `${cc.toLocaleString('ko-KR')}cc`,
      cells: [`${won(r.total)}원`, `${won(r.prepayments[0].payable)}원`],
    };
  });

  return (
    <RouteIndex
      tone="c3"
      category="금융·자동차"
      categoryHref="/c/finance"
      meta={`${rates.label} 기준`}
      title="배기량별 자동차세 표"
      firstColumn="배기량"
      lead={
        <>
          배기량 {CC.min.toLocaleString('ko-KR')}cc부터 {CC.max.toLocaleString('ko-KR')}cc까지
          100cc 단위 자동차세입니다. 지방교육세를 포함하며, 비영업용 승용차·차령 3년 기준입니다.
        </>
      }
      description={DESCRIPTION}
      caption={`${rates.label} 기준 · 최종 확인 ${rates.verifiedAt}`}
      columns={[{ label: '연간 자동차세', numeric: true, minus: true }, { label: '1월 연납 시', numeric: true }]}
      rows={rows}
      outro={
        <>
          조건이 다르면 금액도 달라집니다. 직접 넣어 계산하려면{' '}
          <a href="/calc/car-tax">계산기</a>를 쓰세요. 요율이 언제 어떻게 바뀌었는지는{' '}
          <a href="/changes">제도 변화</a>에 있습니다.
        </>
      }
    />
  );
}
