import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breakdown } from '@/components/Breakdown';
import {
  AnswerPage, AnswerSection, AnswerNote, Assumptions, AnswerTable, AnswerNav,
} from '@/components/AnswerPage';
import { getRates } from '@/lib/rates';
import { calcAnnualLeave } from '@/lib/calc/extra';
import { won } from '@/lib/format';
import { LEAVE_YEARS as YEARS, DEFAULT_YEAR } from '@/lib/salaryPages';
import s from './annualLeave.module.css';

export function generateStaticParams() {
  return YEARS.all().map(y => ({ years: String(y) }));
}
export const dynamicParams = false;

/** 이 페이지들의 고정 가정 — 화면에 그대로 표시한다 */
const WAGE = 3_000_000;
const label = (y: number) => `${y}년차`;

export function generateMetadata({ params }: { params: { years: string } }): Metadata {
  const y = YEARS.parse(params.years);
  if (y === null) return {};
  const r = calcAnnualLeave(y, WAGE, 0, DEFAULT_YEAR);
  return {
    title: `${label(y)} 연차 며칠 — ${r.days}일`,
    description:
      `근속 ${y}년이면 연차가 ${r.days}일 발생합니다. 근로기준법 제60조에 따른 계산 근거와 `
      + `미사용 연차수당까지 함께 보여드립니다.`,
    alternates: { canonical: `https://ttakcalc.com/annual-leave/${y}` },
  };
}

export default function AnnualLeavePage({ params }: { params: { years: string } }) {
  const y = YEARS.parse(params.years);
  if (y === null) notFound();

  const year = DEFAULT_YEAR;
  const rates = getRates(year);
  const a = rates.annualLeave;
  // 미사용 일수는 사람마다 달라 0으로 두고, 전부 미사용일 때의 금액은 본문에서 따로 보여준다
  const r = calcAnnualLeave(y, WAGE, 0, year);
  const { prev, next } = YEARS.neighbors(y);

  // 근처 연차들을 표로 — 2년마다 하루씩 늘어나는 규칙이 눈에 보이게
  const around = YEARS.all()
    .filter(v => Math.abs(v - y) <= 3 || v % 5 === 0)
    .slice(0, 12)
    .map(v => ({ years: v, days: calcAnnualLeave(v, WAGE, 0, year).days }));

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `근속 ${y}년이면 연차가 며칠인가요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            `${r.days}일입니다. 기본 ${a.baseDays}일에 가산휴가 ${r.bonusDays}일이 더해진 것으로, `
            + `근로기준법 제60조에 따라 3년 이상 계속근로부터 최초 1년을 초과하는 계속근로 매 2년마다 `
            + `1일씩 늘어나며 ${a.maxDays}일이 한도입니다.`,
        },
      },
      {
        '@type': 'Question',
        name: `${label(y)}에 연차를 다 못 쓰면 얼마를 받나요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            `1일 통상임금 × 미사용 일수입니다. 월 통상임금 ${won(WAGE)}원 기준이면 1일 `
            + `${won(r.dailyWage)}원이라, ${r.days}일을 모두 못 썼다면 `
            + `${won(r.dailyWage * r.days)}원이 됩니다.`,
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
        category="연차수당"
        categoryHref="/calc/annual-leave"
        meta={`${rates.label} 기준`}
        title={`${label(y)} 연차는 며칠?`}
        lead={
          <>
            <strong>{r.days}일</strong>입니다. 기본 {a.baseDays}일
            {r.bonusDays > 0 && <> + 가산 {r.bonusDays}일</>}
            {r.cappedByMax && <> ({a.maxDays}일 한도)</>}.
            3년 이상 계속근로부터 <strong>2년마다 하루씩</strong> 늘어납니다.
          </>
        }
      >
        <Breakdown
          headlineLabel={`${label(y)} 연차 발생일수`}
          headlineValue={r.days}
          headlineUnit="일"
          headlineSub={`미사용 시 ${won(r.dailyWage * r.days)}원 (월 통상임금 ${won(WAGE)}원 기준)`}
          rows={r.steps.map(st => ({ label: st.label, value: st.value, basis: st.basis, tone: st.tone }))}
          footer={
            <>
              <span>{rates.label} 기준 · 근거 {r.source}</span>
              <a href="/calc/annual-leave">내 통상임금으로 계산 →</a>
            </>
          }
        />

        <AnswerSection title="계산 조건">
          <Assumptions items={[
            <>계속근로 <strong>{y}년</strong></>,
            <>월 통상임금 <strong>{won(WAGE)}원</strong> (수당 계산용 예시)</>,
            <>그 해 <strong>80% 이상 출근</strong></>,
          ]} />
          <AnswerNote>
            연차 <strong>일수</strong>는 통상임금과 무관합니다. 수당 금액만 통상임금에 따라 달라지므로,
            본인 금액으로 보려면 <a href="/calc/annual-leave">계산기</a>에서 넣으세요.
          </AnswerNote>
        </AnswerSection>

        <AnswerSection title="근속연수별 연차 — 2년마다 하루씩">
          <AnswerTable>
            <thead>
              <tr>
                <th scope="col">근속</th>
                <th scope="col">연차</th>
                <th scope="col">기본 대비</th>
              </tr>
            </thead>
            <tbody>
              {around.map(v => (
                <tr key={v.years} className={v.years === y ? s.current : undefined}>
                  <th scope="row">
                    {v.years}년
                    {v.years === y && <span className={s.badge}>기준</span>}
                  </th>
                  <td className="num">{v.days}일</td>
                  <td className="num">
                    {v.days > a.baseDays ? `+${v.days - a.baseDays}일` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </AnswerTable>
          <AnswerNote>
            가산은 &ldquo;최초 1년을 초과하는 계속근로 매 2년&rdquo;에 붙습니다. 3년차면 초과 근로가
            2년이라 1일, 5년차면 4년이라 2일입니다. {a.maxDays}일에서 멈춥니다.
          </AnswerNote>
        </AnswerSection>

        <AnswerSection title="1년 미만이면">
          <AnswerNote>
            1개월 개근할 때마다 1일씩, 최대 {a.under1YearMaxDays}일까지 생깁니다.
            이 연차는 입사 1년 안에 써야 하고, 1년이 지나 새로 받는 {a.baseDays}일과는 별개입니다.
          </AnswerNote>
        </AnswerSection>

        <AnswerNav
          base="/annual-leave"
          prev={prev} next={next}
          chips={[1, 3, 5, 10, 15, 20, 25]} current={y}
          format={label}
          allHref="/calc/annual-leave"
          allLabel="연차수당 계산기"
          label="다른 근속연수로 보기"
        />
      </AnswerPage>
    </>
  );
}
