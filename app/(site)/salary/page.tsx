import type { Metadata } from 'next';
import { getRates } from '@/lib/rates';
import { manLabel, won } from '@/lib/format';
import {
  SALARY, resultFor, DEFAULT_YEAR, salaryComparePairs, allSalaryValues,
} from '@/lib/salaryPages';
import { breadcrumbLd, datasetLd, latestVerifiedAt, ldJson } from '@/lib/jsonLd';
import s from './salaryIndex.module.css';

/** 페이지 설명. 검색 결과 스니펫과 구조화 데이터가 같은 문장을 쓰도록 한곳에 둔다. */
const DESCRIPTION =
  '연봉 2,000만원부터 1억원까지 100만원 단위 월 실수령액을 한 표에 정리했습니다. '
  + '4대보험·세금 공제 내역과 근거까지 확인하세요.';

export const metadata: Metadata = {
  title: '연봉별 실수령액 표',
  description: DESCRIPTION,
  alternates: { canonical: 'https://ttakcalc.com/salary' },
};

// 81개 상세 페이지로 가는 크롤링 경로이자, 그 자체로 "연봉 실수령액 표" 검색을 받는 페이지.
export default function SalaryIndexPage() {
  const year = DEFAULT_YEAR;
  const rates = getRates(year);
  const rows = allSalaryValues().map(m => ({ man: m, r: resultFor(m, year) }));

  // 이 페이지는 RouteIndex보다 먼저 만든 자체 구현이라 구조화 데이터를 직접 붙인다.
  // 실제로 데이터셋(연봉 구간별 계산표)이라 그렇게 말해 준다.
  const dateModified = latestVerifiedAt();
  const lds = [
    breadcrumbLd([{ name: '연봉 실수령액', href: '/calc/salary' }, { name: '연봉별 실수령액 표' }]),
    datasetLd({
      name: '연봉별 실수령액 표',
      description: DESCRIPTION,
      dateModified,
      rowCount: rows.length,
    }),
  ];

  return (
    <div className={`container-narrow ${s.c1}`}>
      {lds.map((ld, i) => (
        <script key={i} type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      ))}
      <header className={s.head}>
        <p className={s.eyebrow}>
          <a href="/calc/salary" className={s.category}>연봉 실수령액</a>
          <span aria-hidden="true"> · </span>{rates.label} 기준
        </p>
        <h1 className={s.title}>연봉별 실수령액 표</h1>
        <p className={s.lead}>
          연봉 {manLabel(SALARY.min)}부터 {manLabel(SALARY.max)}까지 100만원 단위 월 실수령액입니다.
          부양가족 본인 1인, 월 비과세액 {won(rates.nonTaxable.mealAllowanceMonthlyMax)}원(식대 한도) 기준이며,
          연봉을 누르면 공제 내역과 근거를 볼 수 있습니다.
        </p>
      </header>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <caption className={s.caption}>{rates.label} 기준 · 최종 확인 {rates.verifiedAt}</caption>
          <thead>
            <tr>
              <th scope="col">연봉</th>
              <th scope="col">월 실수령액</th>
              <th scope="col">월 공제액</th>
              <th scope="col">공제율</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ man, r }) => (
              <tr key={man}>
                <th scope="row">
                  <a href={`/salary/${man}`} className={s.link}>{manLabel(man)}</a>
                </th>
                <td className="num">{won(r.monthlyNet)}원</td>
                <td className={`num ${s.minus}`}>{won(r.totalDeduction)}원</td>
                <td className="num">{(r.deductionRate * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 비교 페이지로 가는 크롤 경로. 사이트맵만으로는 잘 안 긁힌다. */}
      <section className={s.compare}>
        <h2 className={s.compareTitle}>연봉을 올리면 실수령액은 얼마나 늘까</h2>
        <p className={s.compareLead}>
          세전으로 오른 금액이 그대로 통장에 들어오지는 않습니다. 두 연봉을 나란히 놓고
          <strong> 오른 만큼 얼마가 남는지</strong> 보여드립니다.
        </p>
        <ul className={s.compareList}>
          {salaryComparePairs().map(({ from, to }) => (
            <li key={`${from}-${to}`}>
              <a href={`/salary/compare/${from}-${to}`}>
                {manLabel(from)} → {manLabel(to)}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <p className={s.outro}>
        조건이 다르면 금액도 달라집니다. 부양가족·자녀 수, 비과세액을 직접 넣으려면{' '}
        <a href="/calc/salary">연봉 실수령액 계산기</a>를 쓰세요.
        요율이 언제 어떻게 바뀌었는지는 <a href="/changes">제도 변화</a>에 있습니다.
      </p>
    </div>
  );
}
