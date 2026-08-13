import type { Metadata } from 'next';
import { RouteIndex } from '@/components/RouteIndex';
import { getRates } from '@/lib/rates';
import { won } from '@/lib/format';
import { LEAVE_YEARS, DEFAULT_YEAR } from '@/lib/salaryPages';
import { calcAnnualLeave } from '@/lib/calc/extra';

/** 페이지 설명. 검색 결과 스니펫과 구조화 데이터가 같은 문장을 쓰도록 한곳에 둔다. */
const DESCRIPTION =
  '근속 1년부터 30년까지 발생하는 연차 유급휴가 일수를 한 표에 정리했습니다. 미사용 연차수당도 함께 봅니다.';

export const metadata: Metadata = {
  title: '근속연수별 연차 일수 표',
  description: DESCRIPTION,
  alternates: { canonical: 'https://ttakcalc.com/annual-leave' },
};

// 상세 페이지로 가는 크롤링 경로이자, 그 자체로 "근속연수별 표" 검색을 받는 페이지.
// 이게 없으면 상세 페이지들이 사이트맵과 앞뒤 링크로만 닿아 크롤 순위가 밀린다.
export default function Page() {
  const year = DEFAULT_YEAR;
  const rates = getRates(year);
  const WAGE = 3_000_000;
  const rows = LEAVE_YEARS.all().map(y => {
    const r = calcAnnualLeave(y, WAGE, 0, year);
    return {
      href: `/annual-leave/${y}`, label: `${y}년차`,
      cells: [`${r.days}일`, `${won(r.dailyWage)}원`, `${won(r.unusedPay)}원`],
    };
  });

  return (
    <RouteIndex
      tone="c1"
      category="급여·세금"
      categoryHref="/c/tax"
      meta={`${rates.label} 기준`}
      title="근속연수별 연차 일수 표"
      firstColumn="근속연수"
      lead={
        <>
          근속 {LEAVE_YEARS.min}년부터 {LEAVE_YEARS.max}년까지 발생하는 연차 일수입니다.
          수당은 월 통상임금 300만원 기준으로 계산한 예시이며, 근속연수를 누르면 근거를 볼 수 있습니다.
        </>
      }
      description={DESCRIPTION}
      caption={`${rates.label} 기준 · 최종 확인 ${rates.verifiedAt}`}
      columns={[{ label: '연차 일수', numeric: true }, { label: '1일 통상임금', numeric: true }, { label: '전부 미사용 시 수당', numeric: true }]}
      rows={rows}
      outro={
        <>
          조건이 다르면 금액도 달라집니다. 직접 넣어 계산하려면{' '}
          <a href="/calc/annual-leave">계산기</a>를 쓰세요. 요율이 언제 어떻게 바뀌었는지는{' '}
          <a href="/changes">제도 변화</a>에 있습니다.
        </>
      }
    />
  );
}
