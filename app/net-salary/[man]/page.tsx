import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breakdown } from '@/components/Breakdown';
import {
  AnswerPage, AnswerSection, AnswerNote, Assumptions, AnswerTable, AnswerNav,
} from '@/components/AnswerPage';
import { getRates } from '@/lib/rates';
import { calcReverseSalary } from '@/lib/calc/compare';
import { won, manLabel, manToWon } from '@/lib/format';
import { NET, DEFAULT_YEAR } from '@/lib/salaryPages';
import s from './netSalary.module.css';

export function generateStaticParams() {
  return NET.all().map(m => ({ man: String(m) }));
}
export const dynamicParams = false;

/** 이 페이지들의 고정 가정 — 화면에 그대로 표시한다 */
const ASSUMPTION = { dependents: 1, childrenUnder20: 0 } as const;

const nonTaxableFor = (year: string) => getRates(year).nonTaxable.mealAllowanceMonthlyMax;

const reverse = (man: number, year: string) =>
  calcReverseSalary({
    year, targetNet: manToWon(man),
    dependents: ASSUMPTION.dependents,
    childrenUnder20: ASSUMPTION.childrenUnder20,
    monthlyNonTaxable: nonTaxableFor(year),
  });

export function generateMetadata({ params }: { params: { man: string } }): Metadata {
  const man = NET.parse(params.man);
  if (man === null) return {};
  const r = reverse(man, DEFAULT_YEAR);
  const label = manLabel(man);
  return {
    title: `월 실수령액 ${label}이면 연봉 얼마 — ${won(r.annualSalary)}원`,
    description:
      `${DEFAULT_YEAR}년 기준 매달 ${label}을 손에 쥐려면 세전 연봉이 ${won(r.annualSalary)}원 ` +
      `정도여야 합니다. 4대보험과 세금을 거꾸로 되짚은 근거까지 보여드립니다.`,
    alternates: { canonical: `https://ttakcalc.com/net-salary/${man}` },
  };
}

export default function NetSalaryPage({ params }: { params: { man: string } }) {
  const man = NET.parse(params.man);
  if (man === null) notFound();

  const year = DEFAULT_YEAR;
  const rates = getRates(year);
  const r = reverse(man, year);
  const label = manLabel(man);
  const { prev, next } = NET.neighbors(man);
  const nonTaxable = nonTaxableFor(year);

  // 부양가족이 늘면 같은 실수령액에 필요한 연봉이 줄어든다 — 이 표가 페이지의 존재 이유
  const byDependents = [1, 2, 3, 4].map(d => ({
    dependents: d,
    r: calcReverseSalary({
      year, targetNet: manToWon(man), dependents: d,
      childrenUnder20: 0, monthlyNonTaxable: nonTaxable,
    }),
  }));

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `월 실수령액 ${label}을 받으려면 연봉이 얼마여야 하나요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            `${rates.label} 기준 부양가족 본인 1명이라면 세전 연봉 ${won(r.annualSalary)}원이 필요합니다. ` +
            `월 급여로는 ${won(r.actual.monthlyGross)}원이고, 4대보험과 세금으로 ` +
            `${won(r.actual.totalDeduction)}원(공제율 ${(r.actual.deductionRate * 100).toFixed(1)}%)이 빠집니다.`,
        },
      },
      {
        '@type': 'Question',
        name: `부양가족이 많으면 필요한 연봉이 줄어드나요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            `네. 부양가족 1명 기준 ${won(byDependents[0].r.annualSalary)}원이 필요하지만, ` +
            `4명이면 ${won(byDependents[3].r.annualSalary)}원으로 ` +
            `${won(byDependents[0].r.annualSalary - byDependents[3].r.annualSalary)}원 낮아집니다. ` +
            `인적공제로 소득세가 줄기 때문입니다.`,
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
        category="연봉 역산"
        categoryHref="/calc/reverse-salary"
        meta={`${rates.label} 기준`}
        title={`월 실수령액 ${label}이면 연봉 얼마?`}
        lead={
          <>
            세전 연봉 <strong>{won(r.annualSalary)}원</strong>이 필요합니다.
            월 급여 {won(r.actual.monthlyGross)}원에서 4대보험과 세금 {won(r.actual.totalDeduction)}원
            (공제율 {(r.actual.deductionRate * 100).toFixed(1)}%)이 빠져 {won(r.actual.monthlyNet)}원이 남습니다.
          </>
        }
      >
        <Breakdown
          headlineLabel="필요한 세전 연봉"
          headlineValue={r.annualSalary}
          headlineSub={`월 ${won(r.actual.monthlyGross)}원 · 실수령 ${won(r.actual.monthlyNet)}원`}
          rows={r.steps.map(st => ({ label: st.label, value: st.value, basis: st.basis, tone: st.tone }))}
          footer={
            <>
              <span>{rates.label} 기준 · 최종 확인 {r.verifiedAt}</span>
              <a href="/calc/reverse-salary">내 조건으로 역산 →</a>
            </>
          }
        />

        <AnswerSection title="계산 조건">
          <Assumptions items={[
            <>부양가족 <strong>{ASSUMPTION.dependents}명</strong> (본인만)</>,
            <>8세 이상 자녀 <strong>{ASSUMPTION.childrenUnder20}명</strong></>,
            <>월 비과세액 <strong>{won(nonTaxable)}원</strong> (식대 한도)</>,
          ]} />
          <AnswerNote>
            연봉은 협상 단위에 맞춰 <strong>만원 단위로 올림</strong>합니다. 그래서 실제 실수령액이
            목표보다 조금 많을 수 있습니다.
          </AnswerNote>
        </AnswerSection>

        {/* 같은 실수령액이라도 부양가족 수에 따라 필요한 연봉이 달라진다 */}
        <AnswerSection title="부양가족에 따라 필요한 연봉이 달라진다">
          <AnswerTable>
            <thead>
              <tr>
                <th scope="col">부양가족</th>
                <th scope="col">필요 연봉</th>
                <th scope="col">월 급여</th>
                <th scope="col">1명 기준 대비</th>
              </tr>
            </thead>
            <tbody>
              {byDependents.map(d => {
                const diff = d.r.annualSalary - byDependents[0].r.annualSalary;
                return (
                  <tr key={d.dependents} className={d.dependents === ASSUMPTION.dependents ? s.current : undefined}>
                    <th scope="row">
                      {d.dependents}명
                      {d.dependents === ASSUMPTION.dependents && <span className={s.badge}>기준</span>}
                    </th>
                    <td className="num">{won(d.r.annualSalary)}원</td>
                    <td className="num">{won(d.r.actual.monthlyGross)}원</td>
                    <td className={`num ${diff < 0 ? s.down : ''}`}>
                      {diff === 0 ? '—' : `${diff > 0 ? '+' : '−'}${won(Math.abs(diff))}원`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </AnswerTable>
          <AnswerNote>
            부양가족 1명당 인적공제 150만원이 붙어 소득세가 줄기 때문에, 같은 실수령액을 받는 데
            필요한 연봉이 낮아집니다.
          </AnswerNote>
        </AnswerSection>

        <AnswerSection title="반대로 계산하려면">
          <AnswerNote>
            연봉을 알고 실수령액이 궁금하면{' '}
            <a href={`/salary/${Math.round(r.annualSalary / 10_000 / 100) * 100}`}>연봉별 실수령액</a>
            {' '}쪽을 보세요. 두 페이지는 같은 계산 함수를 씁니다.
          </AnswerNote>
        </AnswerSection>

        <AnswerNav
          base="/net-salary"
          prev={prev} next={next}
          chips={NET.all().filter(m => m % 50 === 0)} current={man}
          allHref="/calc/reverse-salary"
          allLabel="연봉 역산 계산기"
          label="다른 실수령액으로 보기"
        />
      </AnswerPage>
    </>
  );
}
