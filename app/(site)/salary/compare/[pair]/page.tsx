import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  AnswerPage, AnswerSection, AnswerNote, Assumptions, AnswerTable,
} from '@/components/AnswerPage';
import { getRates } from '@/lib/rates';
import { won, manLabel, manToWon } from '@/lib/format';
import {
  salaryComparePairs, parseComparePair, resultFor, nonTaxableFor, ASSUMPTION, DEFAULT_YEAR,
} from '@/lib/salaryPages';
import { breadcrumbLd, ldJson } from '@/lib/jsonLd';
import s from './compare.module.css';

/**
 * "연봉 4000 vs 4500 실수령 차이" 검색을 받는 페이지.
 *
 * 값 하나짜리 페이지가 이미 있는데 쌍을 따로 만드는 이유는, 이 페이지가 **다른 질문에
 * 답하기 때문**이다. 개별 페이지는 "얼마 받나"에 답하고, 여기는 "올리면 얼마나 더
 * 남나"에 답한다. 두 페이지를 오가며 뺄셈하게 만드는 대신 한 화면에서 끝낸다.
 *
 * 연봉 협상에서 실제로 궁금한 건 세전 인상액이 아니라 **그중 얼마가 손에 남는가**다.
 * 그 비율은 구간마다 다르고(높은 구간일수록 덜 남는다), 그게 이 페이지의 존재 이유다.
 */
export function generateStaticParams() {
  return salaryComparePairs().map(({ from, to }) => ({ pair: `${from}-${to}` }));
}
export const dynamicParams = false;

function view(param: string) {
  const pair = parseComparePair(param);
  if (!pair) return null;
  const year = DEFAULT_YEAR;
  const lo = resultFor(pair.from, year);
  const hi = resultFor(pair.to, year);
  return {
    ...pair, year, lo, hi,
    grossGap: manToWon(pair.to) - manToWon(pair.from),
    netGapAnnual: hi.annualNet - lo.annualNet,
    netGapMonthly: hi.monthlyNet - lo.monthlyNet,
  };
}

export function generateMetadata({ params }: { params: { pair: string } }): Metadata {
  const v = view(params.pair);
  if (!v) return {};
  return {
    title: `연봉 ${manLabel(v.from)} vs ${manLabel(v.to)} — 실수령 차이 월 ${won(v.netGapMonthly)}원`,
    description:
      `연봉을 ${manLabel(v.from)}에서 ${manLabel(v.to)}으로 올리면 월 실수령액은 `
      + `${won(v.lo.monthlyNet)}원에서 ${won(v.hi.monthlyNet)}원으로 ${won(v.netGapMonthly)}원 늘어납니다. `
      + `세전으로 ${won(v.grossGap / 10_000)}만원 올랐지만 실제로 손에 남는 건 연 ${won(v.netGapAnnual)}원입니다.`,
    alternates: { canonical: `https://ttakcalc.com/salary/compare/${v.from}-${v.to}` },
  };
}

export default function SalaryComparePage({ params }: { params: { pair: string } }) {
  const v = view(params.pair);
  if (!v) notFound();

  const { from, to, year, lo, hi } = v;
  const rates = getRates(year);
  const nonTaxable = nonTaxableFor(year);
  const keepRate = v.grossGap > 0 ? v.netGapAnnual / v.grossGap : 0;
  const keepPct = (keepRate * 100).toFixed(1);
  const lostAnnual = v.grossGap - v.netGapAnnual;

  // 공제 항목별로 얼마씩 더 빠지는가. 어디서 깎이는지가 이 페이지의 알맹이다.
  const deltas = hi.deductions.map((d, i) => ({
    name: d.name,
    from: lo.deductions[i]?.amount ?? 0,
    to: d.amount,
    diff: d.amount - (lo.deductions[i]?.amount ?? 0),
  }));

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `연봉을 ${manLabel(from)}에서 ${manLabel(to)}으로 올리면 실수령액이 얼마나 늘어나나요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            `월 ${won(lo.monthlyNet)}원에서 ${won(hi.monthlyNet)}원으로 ${won(v.netGapMonthly)}원 늘어납니다. `
            + `세전으로는 연 ${won(v.grossGap)}원이 올랐지만 4대보험과 세금이 함께 늘어 `
            + `실제로 손에 남는 건 연 ${won(v.netGapAnnual)}원, 오른 금액의 ${keepPct}%입니다.`,
        },
      },
      {
        '@type': 'Question',
        name: `연봉 인상분 중 세금으로 얼마나 나가나요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            `오른 연 ${won(v.grossGap)}원 가운데 ${won(lostAnnual)}원이 4대보험과 세금으로 나갑니다. `
            + `연봉이 높을수록 이 비율이 커지는데, 높은 세율 구간이 적용되는 금액이 늘기 때문입니다.`,
        },
      },
    ],
  };

  const crumbLd = breadcrumbLd([
    { name: '연봉 실수령액', href: '/calc/salary' },
    { name: `연봉 ${manLabel(from)} vs ${manLabel(to)}` },
  ]);

  return (
    <>
      {[faqLd, crumbLd].map((ld, i) => (
        <script key={i} type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      ))}

      <AnswerPage
        tone="c1"
        category="연봉 실수령액"
        categoryHref="/calc/salary"
        meta={`${rates.label} 기준`}
        title={`연봉 ${manLabel(from)} vs ${manLabel(to)} 실수령액 차이`}
        lead={
          <>
            월 실수령액이 <strong>{won(v.netGapMonthly)}원</strong> 늘어납니다.
            세전으로는 연 {won(v.grossGap)}원이 올랐는데 실제로 손에 남는 건{' '}
            연 {won(v.netGapAnnual)}원 — <strong>오른 금액의 {keepPct}%</strong>입니다.
          </>
        }
      >
        {/* 이 페이지의 알맹이. 개별 페이지 두 장으로는 알 수 없는 숫자다. */}
        <section className={s.headline} aria-label="실수령 차이">
          <div className={s.side}>
            <span className={s.sideLabel}>연봉 {manLabel(from)}</span>
            <strong className={`${s.sideNum} num`}>{won(lo.monthlyNet)}<em>원</em></strong>
            <span className={s.sideSub}>공제율 {(lo.deductionRate * 100).toFixed(1)}%</span>
          </div>
          <div className={s.arrow} aria-hidden="true">→</div>
          <div className={s.side}>
            <span className={s.sideLabel}>연봉 {manLabel(to)}</span>
            <strong className={`${s.sideNum} num`}>{won(hi.monthlyNet)}<em>원</em></strong>
            <span className={s.sideSub}>공제율 {(hi.deductionRate * 100).toFixed(1)}%</span>
          </div>
          <div className={s.gap}>
            <span className={s.gapLabel}>월 차이</span>
            <strong className={`${s.gapNum} num`}>+{won(v.netGapMonthly)}<em>원</em></strong>
            <span className={s.gapSub}>연 +{won(v.netGapAnnual)}원</span>
          </div>
        </section>

        <AnswerSection title="오른 만큼 다 받지는 못합니다">
          <ul className={s.points}>
            <li>
              세전 인상액 <strong>연 {won(v.grossGap)}원</strong> 가운데{' '}
              <strong>{won(lostAnnual)}원</strong>이 4대보험과 세금으로 더 나갑니다.
              손에 남는 것은 <strong>연 {won(v.netGapAnnual)}원({keepPct}%)</strong>입니다.
            </li>
            <li>
              공제율이 {(lo.deductionRate * 100).toFixed(1)}%에서{' '}
              {(hi.deductionRate * 100).toFixed(1)}%로 올라갑니다. 연봉이 오르면 높은 세율 구간이
              적용되는 금액이 늘기 때문에, 인상폭이 같아도 위쪽 구간일수록 남는 비율이 줄어듭니다.
            </li>
            <li>
              월급으로 보면 {won(lo.monthlyGross)}원에서 {won(hi.monthlyGross)}원으로{' '}
              {won(hi.monthlyGross - lo.monthlyGross)}원 오르지만, 통장에 찍히는 금액은{' '}
              {won(v.netGapMonthly)}원만 늘어납니다.
            </li>
          </ul>
        </AnswerSection>

        <AnswerSection title="어디서 더 빠지나 — 항목별 증가액">
          <AnswerTable label="어디서 더 빠지나 — 항목별 증가액">
            <thead>
              <tr>
                <th scope="col">공제 항목</th>
                <th scope="col">연봉 {manLabel(from)}</th>
                <th scope="col">연봉 {manLabel(to)}</th>
                <th scope="col">증가</th>
              </tr>
            </thead>
            <tbody>
              {deltas.map(d => (
                <tr key={d.name}>
                  <th scope="row">{d.name}</th>
                  <td className="num">{won(d.from)}원</td>
                  <td className="num">{won(d.to)}원</td>
                  <td className={`num ${d.diff > 0 ? s.more : s.same}`}>
                    {d.diff > 0 ? `+${won(d.diff)}원` : '변화 없음'}
                  </td>
                </tr>
              ))}
              <tr className={s.totalRow}>
                <th scope="row">공제 합계</th>
                <td className="num">{won(lo.totalDeduction)}원</td>
                <td className="num">{won(hi.totalDeduction)}원</td>
                <td className={`num ${s.more}`}>
                  +{won(hi.totalDeduction - lo.totalDeduction)}원
                </td>
              </tr>
            </tbody>
          </AnswerTable>
          {deltas.some(d => d.diff === 0) && (
            <AnswerNote>
              증가액이 0인 항목은 상한에 걸린 것입니다. 국민연금은 기준소득월액 상한
              ({won(rates.insurance.nationalPension.monthlyIncomeMax)}원)을 넘으면 보험료가 고정돼,
              연봉이 더 올라도 이 항목은 늘지 않습니다.
            </AnswerNote>
          )}
        </AnswerSection>

        <AnswerSection title="계산 조건">
          <Assumptions items={[
            <>부양가족 <strong>{ASSUMPTION.dependents}명</strong> (본인만)</>,
            <>20세 이하 자녀 <strong>{ASSUMPTION.childrenUnder20}명</strong></>,
            <>월 비과세액 <strong>{won(nonTaxable)}원</strong> (식대 비과세 한도)</>,
          ]} />
          <AnswerNote>
            두 연봉에 같은 조건을 적용했습니다. 부양가족이나 비과세 항목이 다르면 차이도
            달라집니다. <a href="/calc/salary">계산기</a>에서 직접 바꿔보세요.
          </AnswerNote>
        </AnswerSection>

        <nav className={s.links} aria-label="각 연봉 자세히 보기">
          <a href={`/salary/${from}`}>연봉 {manLabel(from)} 자세히</a>
          <a href={`/salary/${to}`}>연봉 {manLabel(to)} 자세히</a>
          <a href="/salary">연봉별 실수령액 표</a>
        </nav>
      </AnswerPage>
    </>
  );
}
