import type { Metadata } from 'next';
import { RouteIndex } from '@/components/RouteIndex';
import { getRates } from '@/lib/rates';
import { manLabel, manToWon, won } from '@/lib/format';
import { NET, ASSUMPTION, DEFAULT_YEAR } from '@/lib/salaryPages';
import { calcReverseSalary } from '@/lib/calc/compare';

export const metadata: Metadata = {
  title: '월 실수령액별 필요 연봉 표',
  description:
    '월 실수령 150만원부터 700만원까지 10만원 단위로, 그 금액을 손에 쥐려면 연봉이 얼마여야 하는지 정리했습니다.',
  alternates: { canonical: 'https://ttakcalc.com/net-salary' },
};

// 상세 페이지로 가는 크롤링 경로이자, 그 자체로 "월 실수령액별 표" 검색을 받는 페이지.
// 이게 없으면 상세 페이지들이 사이트맵과 앞뒤 링크로만 닿아 크롤 순위가 밀린다.
export default function Page() {
  const year = DEFAULT_YEAR;
  const rates = getRates(year);
  const rows = NET.all().map(m => {
    const r = calcReverseSalary({
      year, targetNet: manToWon(m),
      dependents: ASSUMPTION.dependents,
      childrenUnder20: ASSUMPTION.childrenUnder20,
      monthlyNonTaxable: rates.nonTaxable.mealAllowanceMonthlyMax,
    });
    return {
      href: `/net-salary/${m}`, label: `월 ${manLabel(m)}`,
      cells: [`${won(r.annualSalary)}원`, `${won(r.actual.monthlyGross)}원`],
    };
  });

  return (
    <RouteIndex
      tone="c1"
      category="급여·세금"
      categoryHref="/c/tax"
      meta={`${rates.label} 기준`}
      title="월 실수령액별 필요 연봉 표"
      firstColumn="월 실수령액"
      lead={
        <>
          월 실수령 {manLabel(NET.min)}부터 {manLabel(NET.max)}까지, 그 금액을 손에 쥐려면 연봉이
          얼마여야 하는지 정리했습니다. 부양가족 본인 1인 기준이며, 금액을 누르면 근거를 볼 수 있습니다.
        </>
      }
      caption={`${rates.label} 기준 · 최종 확인 ${rates.verifiedAt}`}
      columns={[{ label: '필요한 연봉', numeric: true }, { label: '월 급여(세전)', numeric: true }]}
      rows={rows}
      outro={
        <>
          조건이 다르면 금액도 달라집니다. 직접 넣어 계산하려면{' '}
          <a href="/calc/reverse-salary">계산기</a>를 쓰세요. 요율이 언제 어떻게 바뀌었는지는{' '}
          <a href="/changes">제도 변화</a>에 있습니다.
        </>
      }
    />
  );
}
