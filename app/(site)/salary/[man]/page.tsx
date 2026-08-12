import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breakdown } from '@/components/Breakdown';
import {
  AnswerPage, AnswerSection, AnswerNote, Assumptions, AnswerTable, AnswerNav,
} from '@/components/AnswerPage';
import { getRates } from '@/lib/rates';
import { won, manLabel, manToWon } from '@/lib/format';
import {
  popularMan, resultFor, byYear, ASSUMPTION, nonTaxableFor, DEFAULT_YEAR,
  FAMILY_SIZES, hasFamilyPage, allSalaryValues, parseSalaryMan, salaryNeighbors,
} from '@/lib/salaryPages';
import { salaryInsights } from '@/lib/insights';
import s from './salaryPage.module.css';

export function generateStaticParams() {
  return allSalaryValues().map(m => ({ man: String(m) }));
}
// 범위 밖(/salary/1234)은 얇은 페이지를 만들지 않고 확실히 404 — soft-404 방지
export const dynamicParams = false;

export function generateMetadata({ params }: { params: { man: string } }): Metadata {
  const man = parseSalaryMan(params.man);
  if (man === null) return {};
  const r = resultFor(man, DEFAULT_YEAR);
  const label = manLabel(man);
  return {
    title: `연봉 ${label} 실수령액 — 월 ${won(r.monthlyNet)}원`,
    description:
      `${DEFAULT_YEAR}년 기준 연봉 ${label}의 월 실수령액은 ${won(r.monthlyNet)}원입니다. ` +
      `4대보험과 세금으로 매달 ${won(r.totalDeduction)}원이 빠지며, 항목별 공제 내역을 근거와 함께 보여드립니다.`,
    alternates: { canonical: `https://ttakcalc.com/salary/${man}` },
  };
}

export default function SalaryAmountPage({ params }: { params: { man: string } }) {
  const man = parseSalaryMan(params.man);
  if (man === null) notFound();

  const year = DEFAULT_YEAR;
  const rates = getRates(year);
  const r = resultFor(man, year);
  const label = manLabel(man);
  const years = byYear(man);
  const { prev, next } = salaryNeighbors(man);
  const nonTaxable = nonTaxableFor(year);
  const rate1 = (r.deductionRate * 100).toFixed(1);
  const insights = salaryInsights(man, year);

  const rows = [
    { label: '월 급여 (세전)', value: r.monthlyGross, basis: `연봉 ${won(manToWon(man))}원 ÷ 12` },
    { label: '비과세 제외', value: r.monthlyNonTaxable, basis: `과세 대상 급여 ${won(r.monthlyTaxable)}원`, tone: 'info' as const },
    ...r.deductions.map(d => ({ label: d.name, value: d.amount, basis: d.basis, tone: 'minus' as const })),
    { label: '공제 합계', value: r.totalDeduction, tone: 'total' as const },
    { label: '월 실수령액', value: r.monthlyNet, tone: 'result' as const },
  ];

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `연봉 ${label}이면 월 실수령액이 얼마인가요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            `${rates.label} 기준 월 ${won(r.monthlyNet)}원입니다. 세전 월급 ${won(r.monthlyGross)}원에서 ` +
            `4대보험과 세금 ${won(r.totalDeduction)}원이 공제된 금액이며, 월 비과세액은 식대 한도 ` +
            `${won(nonTaxable)}원, 부양가족은 본인 1인으로 계산했습니다.`,
        },
      },
      {
        '@type': 'Question',
        name: `연봉 ${label}의 공제율은 얼마인가요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            `세전 대비 ${rate1}%가 공제됩니다. 부양가족 수와 비과세액, 연말정산 시 개인별 공제 항목에 ` +
            `따라 실제 금액은 달라질 수 있습니다.`,
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, '\\u003c') }} />

      <AnswerPage
        tone="c1"
        category="연봉 실수령액"
        categoryHref="/calc/salary"
        meta={`${rates.label} 기준`}
        title={`연봉 ${label} 실수령액`}
        lead={
          <>
            월 실수령액은 <strong>{won(r.monthlyNet)}원</strong>입니다.
            세전 월급 {won(r.monthlyGross)}원에서 4대보험과 세금 {won(r.totalDeduction)}원
            (공제율 {rate1}%)이 빠진 금액입니다.
          </>
        }
      >
        <Breakdown
          headlineLabel="월 실수령액"
          headlineValue={r.monthlyNet}
          headlineSub={`연 ${won(r.annualNet)}원 · 공제율 ${rate1}%`}
          rows={rows}
          footer={
            <>
              <span>{rates.label} 기준 · 최종 확인 {r.verifiedAt}</span>
              <a href="/calc/salary">내 조건으로 다시 계산 →</a>
            </>
          }
        />

        {/* 이 연봉에서만 성립하는 사실. 값만 바뀌는 페이지가 되지 않으려면 이게 있어야 한다. */}
        {insights.length > 0 && (
          <AnswerSection title={`연봉 ${label}이라서 달라지는 것`}>
            <ul className={s.insights}>
              {insights.map(i => (
                <li key={i.text} className={i.notable ? s.notable : undefined}>{i.text}</li>
              ))}
            </ul>
          </AnswerSection>
        )}

        <AnswerSection title="계산 조건">
          <Assumptions items={[
            <>부양가족 <strong>{ASSUMPTION.dependents}명</strong> (본인만)</>,
            <>20세 이하 자녀 <strong>{ASSUMPTION.childrenUnder20}명</strong></>,
            <>월 비과세액 <strong>{won(nonTaxable)}원</strong> (식대 비과세 한도)</>,
          ]} />
          <AnswerNote>
            조건이 다르면 금액도 달라집니다. 부양가족이 늘면 소득세가 줄고, 비과세 항목이 많으면
            4대보험료까지 함께 줄어듭니다. <a href="/calc/salary">계산기</a>에서 직접 바꿔보세요.
          </AnswerNote>
          {/* 부양가족 조합 페이지로 가는 유일한 크롤 경로 — 사이트맵만으로는 잘 안 긁힌다 */}
          {hasFamilyPage(man) && (
            <p className={s.familyLinks}>
              부양가족이 있다면:{' '}
              {FAMILY_SIZES.map((n, i) => (
                <span key={n}>
                  {i > 0 && ' · '}
                  <a href={`/salary/${man}/family-${n}`}>{n}명일 때</a>
                </span>
              ))}
            </p>
          )}
        </AnswerSection>

        {/* 이 표가 이 페이지의 존재 이유 — 연도별 요율을 보관하는 사이트만 만들 수 있다 */}
        <AnswerSection title="연도별 실수령액 — 같은 연봉, 다른 결과">
          <AnswerTable label="연도별 실수령액 — 같은 연봉, 다른 결과">
            <thead>
              <tr>
                <th scope="col">기준 연도</th>
                <th scope="col">월 실수령액</th>
                <th scope="col">전년 대비</th>
              </tr>
            </thead>
            <tbody>
              {years.map(y => (
                <tr key={y.year} className={y.year === year ? s.current : undefined}>
                  <th scope="row">
                    {y.label}
                    {y.year === year && <span className={s.badge}>현재</span>}
                  </th>
                  <td className="num">{won(y.monthlyNet)}원</td>
                  {/* 0을 "−0원"으로 찍지 않는다 — 요율이 안 바뀐 해는 실제로 변동이 없다 */}
                  <td className={`num ${!y.delta ? s.same : y.delta < 0 ? s.down : s.up}`}>
                    {y.delta === null
                      ? '—'
                      : y.delta === 0
                        ? '변동 없음'
                        : `${y.delta > 0 ? '+' : '−'}${won(Math.abs(y.delta))}원`}
                  </td>
                </tr>
              ))}
            </tbody>
          </AnswerTable>
          <AnswerNote>
            연봉이 그대로여도 4대보험 요율과 비과세 한도가 바뀌면 실수령액이 달라집니다.
            반대로 그 해에 바뀐 항목이 이 연봉 구간에 걸리지 않으면(예: 국민연금 기준소득월액 상한)
            금액이 그대로일 수도 있습니다. 무엇이 바뀌었는지는 <a href="/changes">제도 변화</a>에
            기록해 두었습니다.
          </AnswerNote>
        </AnswerSection>

        <AnswerNav
          base="/salary"
          prev={prev} next={next}
          chips={popularMan()} current={man}
          allHref="/salary"
          allLabel="연봉별 실수령액 표"
          label="다른 연봉으로 보기"
        />
      </AnswerPage>
    </>
  );
}
