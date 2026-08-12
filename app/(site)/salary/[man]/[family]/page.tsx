import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breakdown } from '@/components/Breakdown';
import {
  AnswerPage, AnswerSection, AnswerNote, Assumptions, AnswerTable,
} from '@/components/AnswerPage';
import { getRates } from '@/lib/rates';
import { won, manLabel, manToWon } from '@/lib/format';
import {
  SALARY, familyPairs, parseFamily, resultFor, resultForFamily,
  nonTaxableFor, FAMILY_SIZES, DEFAULT_YEAR,
} from '@/lib/salaryPages';
import { breadcrumbLd, ldJson } from '@/lib/jsonLd';
import s from './family.module.css';

/**
 * "연봉 4000만원 부양가족 3명 실수령액" 검색을 받는 페이지.
 *
 * 값 하나짜리 페이지는 "본인 1인"으로 계산하는데, 실제로 그 조건인 사람은 많지 않다.
 * 부양가족이 늘면 인적공제(1인당 150만원)만큼 과세표준이 내려가 **실수령액이 실제로
 * 달라진다.** 답이 다르므로 페이지를 나눌 근거가 있다.
 *
 * 다만 이 축은 검색 수요가 얕아서 라운드 넘버 연봉에만 붙였다. 전 구간에 펼치면
 * 324장이 되는데 그 대부분은 아무도 찾지 않는 페이지가 된다.
 */
export function generateStaticParams() {
  return familyPairs().map(({ man, family }) => ({
    man: String(man),
    family: `family-${family}`,
  }));
}
export const dynamicParams = false;

function view(manParam: string, familyParam: string) {
  const man = SALARY.parse(manParam);
  const family = parseFamily(familyParam);
  if (man === null || family === null) return null;
  const year = DEFAULT_YEAR;
  return {
    man, family, year,
    base: resultFor(man, year),            // 본인 1인 — 기본 페이지와 같은 조건
    r: resultForFamily(man, family, year),
  };
}

export function generateMetadata(
  { params }: { params: { man: string; family: string } },
): Metadata {
  const v = view(params.man, params.family);
  if (!v) return {};
  const gap = v.r.monthlyNet - v.base.monthlyNet;
  return {
    title: `연봉 ${manLabel(v.man)} 부양가족 ${v.family}명 실수령액 — 월 ${won(v.r.monthlyNet)}원`,
    description:
      `${v.year}년 기준 연봉 ${manLabel(v.man)}에 부양가족이 ${v.family}명이면 월 실수령액은 `
      + `${won(v.r.monthlyNet)}원입니다. 본인 1인일 때보다 월 ${won(gap)}원 많으며, `
      + `인적공제가 실수령액을 얼마나 바꾸는지 항목별로 보여드립니다.`,
    alternates: {
      canonical: `https://ttakcalc.com/salary/${v.man}/family-${v.family}`,
    },
  };
}

export default function SalaryFamilyPage(
  { params }: { params: { man: string; family: string } },
) {
  const v = view(params.man, params.family);
  if (!v) notFound();

  const { man, family, year, base, r } = v;
  const rates = getRates(year);
  const nonTaxable = nonTaxableFor(year);
  const label = manLabel(man);
  const monthlyGap = r.monthlyNet - base.monthlyNet;
  const annualGap = r.annualNet - base.annualNet;

  // 부양가족 수를 바꿔가며 비교. 이 페이지가 답하는 질문 그 자체다.
  const byFamily = [1, ...FAMILY_SIZES].map(n => ({
    n,
    r: n === 1 ? base : resultForFamily(man, n, year),
  }));

  const rows = [
    { label: '월 급여 (세전)', value: r.monthlyGross, basis: `연봉 ${won(manToWon(man))}원 ÷ 12` },
    {
      label: '비과세 제외', value: r.monthlyNonTaxable,
      basis: `과세 대상 급여 ${won(r.monthlyTaxable)}원`, tone: 'info' as const,
    },
    ...r.deductions.map(d => ({
      label: d.name, value: d.amount, basis: d.basis, tone: 'minus' as const,
    })),
    { label: '공제 합계', value: r.totalDeduction, tone: 'total' as const },
    { label: '월 실수령액', value: r.monthlyNet, tone: 'result' as const },
  ];

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `연봉 ${label}에 부양가족이 ${family}명이면 실수령액이 얼마인가요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            `${rates.label} 기준 월 ${won(r.monthlyNet)}원입니다. 본인 1인으로 계산했을 때`
            + `(${won(base.monthlyNet)}원)보다 월 ${won(monthlyGap)}원, 연 ${won(annualGap)}원 많습니다.`,
        },
      },
      {
        '@type': 'Question',
        name: '부양가족이 늘면 실수령액이 왜 늘어나나요?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            '부양가족 1명당 인적공제 150만원이 과세표준에서 빠지기 때문입니다. 소득세만 줄고 '
            + '4대보험료는 그대로라, 늘어나는 금액은 적용 세율에 따라 달라집니다. '
            + '부양가족으로 넣으려면 소득·나이 요건을 충족해야 합니다.',
        },
      },
    ],
  };

  const crumbLd = breadcrumbLd([
    { name: '연봉 실수령액', href: '/calc/salary' },
    { name: `연봉 ${label} 실수령액`, href: `/salary/${man}` },
    { name: `부양가족 ${family}명` },
  ]);

  return (
    <>
      {[faqLd, crumbLd].map((ld, i) => (
        <script key={i} type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      ))}

      <AnswerPage
        tone="c1"
        category={`연봉 ${label} 실수령액`}
        categoryHref={`/salary/${man}`}
        meta={`${rates.label} 기준`}
        title={`연봉 ${label} 부양가족 ${family}명 실수령액`}
        lead={
          <>
            월 실수령액은 <strong>{won(r.monthlyNet)}원</strong>입니다.
            본인 1인으로 계산할 때({won(base.monthlyNet)}원)보다 월 {won(monthlyGap)}원,
            연 {won(annualGap)}원 많습니다.
          </>
        }
      >
        <Breakdown
          headlineLabel="월 실수령액"
          headlineValue={r.monthlyNet}
          headlineSub={`연 ${won(r.annualNet)}원 · 공제율 ${(r.deductionRate * 100).toFixed(1)}%`}
          rows={rows}
          footer={
            <>
              <span>{rates.label} 기준 · 최종 확인 {r.verifiedAt}</span>
              <a href="/calc/salary">내 조건으로 다시 계산 →</a>
            </>
          }
        />

        {/* 이 페이지가 따로 존재하는 이유 — 부양가족 수가 결과를 얼마나 바꾸는지 */}
        <AnswerSection title="부양가족이 실수령액을 얼마나 바꾸나">
          <AnswerTable label="부양가족 수별 실수령액">
            <thead>
              <tr>
                <th scope="col">부양가족</th>
                <th scope="col">월 실수령액</th>
                <th scope="col">본인 1인 대비</th>
                <th scope="col">공제율</th>
              </tr>
            </thead>
            <tbody>
              {byFamily.map(f => (
                <tr key={f.n} className={f.n === family ? s.current : undefined}>
                  <th scope="row">
                    {f.n === family || f.n === 1
                      ? `${f.n}명`
                      : <a href={`/salary/${man}/family-${f.n}`}>{f.n}명</a>}
                    {f.n === 1 && <span className={s.note}>기본</span>}
                    {f.n === family && <span className={s.badge}>이 페이지</span>}
                  </th>
                  <td className="num">{won(f.r.monthlyNet)}원</td>
                  <td className={`num ${f.n === 1 ? s.same : s.plus}`}>
                    {f.n === 1 ? '—' : `+${won(f.r.monthlyNet - base.monthlyNet)}원`}
                  </td>
                  <td className="num">{(f.r.deductionRate * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </AnswerTable>
          <AnswerNote>
            부양가족 1명당 인적공제 <strong>150만원</strong>이 과세표준에서 빠집니다
            (소득세법 제50조). <strong>소득세만 줄고 4대보험료는 그대로</strong>라, 늘어나는
            금액은 적용 세율에 따라 달라집니다 — 세율이 높은 구간일수록 공제 효과가 큽니다.
          </AnswerNote>
        </AnswerSection>

        <AnswerSection title="계산 조건">
          <Assumptions items={[
            <>부양가족 <strong>{family}명</strong> (본인 포함)</>,
            <>20세 이하 자녀 <strong>0명</strong></>,
            <>월 비과세액 <strong>{won(nonTaxable)}원</strong> (식대 비과세 한도)</>,
          ]} />
          <AnswerNote>
            <strong>자녀 수는 가정하지 않았습니다.</strong> 부양가족 {family}명이 배우자와
            자녀일 수도, 부모님일 수도 있는데 자녀세액공제 여부가 달라집니다. 알 수 없는 값을
            그럴듯하게 넣기보다 0으로 두었으니, 자녀가 있다면{' '}
            <a href="/calc/salary">계산기</a>에서 직접 넣으시면 이보다 더 늘어납니다.
          </AnswerNote>
          <AnswerNote>
            부양가족으로 인정받으려면 나이·소득 요건을 충족해야 합니다. 연간 소득금액
            100만원 이하(근로소득만 있으면 총급여 500만원 이하)여야 하고, 직계존속은 만 60세
            이상, 직계비속은 만 20세 이하가 기본입니다(장애인은 나이 제한 없음).
          </AnswerNote>
        </AnswerSection>

        <nav className={s.links} aria-label="다른 조건으로 보기">
          <a href={`/salary/${man}`}>연봉 {label} 기본(본인 1인)</a>
          {FAMILY_SIZES.filter(n => n !== family).map(n => (
            <a key={n} href={`/salary/${man}/family-${n}`}>부양가족 {n}명</a>
          ))}
          <a href="/calc/salary">직접 계산하기</a>
        </nav>
      </AnswerPage>
    </>
  );
}
