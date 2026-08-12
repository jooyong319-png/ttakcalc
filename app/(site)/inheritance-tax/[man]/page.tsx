import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breakdown } from '@/components/Breakdown';
import {
  AnswerPage, AnswerSection, AnswerNote, Assumptions, AnswerTable, AnswerNav,
} from '@/components/AnswerPage';
import { getRates } from '@/lib/rates';
import { calcInheritanceTax } from '@/lib/calc/inheritance';
import { won, manLabel, manToWon, pct } from '@/lib/format';
import { INHERIT, DEFAULT_YEAR } from '@/lib/salaryPages';

export function generateStaticParams() {
  return INHERIT.all().map(m => ({ man: String(m) }));
}
export const dynamicParams = false;

/** 기준 사례 — 배우자 + 자녀 2명. 가장 흔한 구성이다. */
const BASE_FAMILY = { hasSpouse: true, children: 2 };

/** 이 페이지의 존재 이유 — 같은 재산인데 가족 구성으로 세금이 갈린다 */
const FAMILIES = [
  { label: '배우자 + 자녀 2명', hasSpouse: true, children: 2 },
  { label: '배우자 + 자녀 1명', hasSpouse: true, children: 1 },
  { label: '자녀 2명 (배우자 없음)', hasSpouse: false, children: 2 },
  { label: '자녀 1명 (배우자 없음)', hasSpouse: false, children: 1 },
  { label: '배우자 단독 (자녀 없음)', hasSpouse: true, children: 0 },
];

const calc = (man: number, hasSpouse: boolean, children: number) =>
  calcInheritanceTax({
    year: DEFAULT_YEAR,
    estate: manToWon(man),
    debt: 0,
    hasSpouse,
    spouseTakes: null,
    children,
    minorYears: 0,
    elderly: 0,
    netFinancial: 0,
  });

export function generateMetadata({ params }: { params: { man: string } }): Metadata {
  const man = INHERIT.parse(params.man);
  if (man === null) return {};
  const r = calc(man, BASE_FAMILY.hasSpouse, BASE_FAMILY.children);
  const label = manLabel(man);
  return {
    title: r.finalTax === 0
      ? `상속재산 ${label} 상속세 — 공제 범위라 0원`
      : `상속재산 ${label} 상속세 — ${won(r.finalTax)}원`,
    description:
      `상속재산 ${label}이면 배우자와 자녀 2명 기준 상속세는 ${won(r.finalTax)}원입니다. `
      + '가족 구성에 따라 얼마나 달라지는지, 어떤 공제가 적용되는지 근거 조문과 함께 보여드립니다.',
    alternates: { canonical: `https://ttakcalc.com/inheritance-tax/${man}` },
  };
}

export default function InheritanceTaxPage({ params }: { params: { man: string } }) {
  const man = INHERIT.parse(params.man);
  if (man === null) notFound();

  const rates = getRates(DEFAULT_YEAR);
  const h = rates.inheritanceTax!;
  const label = manLabel(man);
  const base = calc(man, BASE_FAMILY.hasSpouse, BASE_FAMILY.children);
  const { prev, next } = INHERIT.neighbors(man);
  const cases = FAMILIES.map(f => ({ ...f, r: calc(man, f.hasSpouse, f.children) }));
  const cheapest = cases.reduce((a, b) => (b.r.finalTax < a.r.finalTax ? b : a));
  const dearest = cases.reduce((a, b) => (b.r.finalTax > a.r.finalTax ? b : a));

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `상속재산 ${label}이면 상속세가 얼마인가요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: base.finalTax === 0
            ? `배우자와 자녀 2명이 상속받는다면 공제 ${won(base.totalDeduction)}원 범위 안이라 상속세가 없습니다.`
            : `배우자와 자녀 2명 기준 ${won(base.finalTax)}원입니다. `
              + `공제 ${won(base.totalDeduction)}원을 뺀 ${won(base.taxBase)}원이 과세표준이고, `
              + `기한 내 신고하면 산출세액의 3%를 공제받습니다.`,
        },
      },
      {
        '@type': 'Question',
        name: `상속재산 ${label}에서 배우자가 없으면 세금이 얼마나 늘어나나요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: (() => {
            const withSpouse = cases[0].r.finalTax;
            const without = cases[2].r.finalTax;
            return without === withSpouse
              ? '두 경우 모두 공제 범위 안이라 상속세가 없습니다.'
              : `배우자와 자녀 2명이면 ${won(withSpouse)}원, 자녀 2명만이면 ${won(without)}원으로 `
                + `${won(without - withSpouse)}원 차이가 납니다. 배우자 상속공제가 최소 5억원이기 때문입니다.`;
          })(),
        },
      },
    ],
  };

  return (
    <AnswerPage
      tone="c1"
      category="급여·세금"
      categoryHref="/c/tax"
      meta={`${rates.label} 기준`}
      title={
        base.finalTax === 0
          ? `상속재산 ${label}, 상속세는 0원`
          : `상속재산 ${label} 상속세는 ${won(base.finalTax)}원`
      }
      lead={
        <>
          배우자와 자녀 2명이 상속받는 경우입니다. 공제 <strong>{won(base.totalDeduction)}원</strong>을
          빼고 계산합니다
          {base.finalTax > 0 && <> — 상속재산 대비 {pct(base.effectiveRate, 2)}</>}.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <Assumptions
        items={[
          `${rates.label} 기준`,
          '배우자 + 자녀 2명',
          '배우자는 법정상속분대로 상속',
          '채무·장례비 없음',
          '사전증여 없음',
          '기한 내 신고',
        ]}
      />

      <AnswerSection title="세금이 어떻게 나오는지">
        <Breakdown
          headlineLabel="납부할 상속세"
          headlineValue={base.finalTax}
          headlineSub={
            base.finalTax === 0
              ? '공제 범위 안이라 세금이 없습니다'
              : `공제 합계 ${won(base.totalDeduction)}원 · 실효세율 ${pct(base.effectiveRate, 2)}`
          }
          rows={base.steps.map(st => ({ label: st.label, value: st.value, basis: st.basis, tone: st.tone }))}
          footer={<span>최종 확인 {base.verifiedAt} · 상속세 및 증여세법 제18~22조·제26조·제69조</span>}
        />
      </AnswerSection>

      <AnswerSection title="가족 구성에 따라 이만큼 갈립니다">
        <p>
          상속세는 세율보다 <strong>공제를 어떻게 짜느냐</strong>로 갈립니다. 같은{' '}
          {label}인데도 누가 상속받느냐에 따라 세금이 달라집니다.
        </p>
        <AnswerTable label="가족 구성에 따라 이만큼 갈립니다">
          <thead>
            <tr>
              <th scope="col">가족 구성</th>
              <th scope="col">적용된 공제</th>
              <th scope="col">공제 합계</th>
              <th scope="col">상속세</th>
            </tr>
          </thead>
          <tbody>
            {cases.map(c => (
              <tr key={c.label}>
                <th scope="row">{c.label}</th>
                <td>
                  {c.r.usedLumpSum ? '일괄공제' : '기초+인적공제'}
                  {c.hasSpouse && ' + 배우자공제'}
                </td>
                <td className="num">{won(c.r.totalDeduction)}원</td>
                <td className="num">{won(c.r.finalTax)}원</td>
              </tr>
            ))}
          </tbody>
        </AnswerTable>
        <AnswerNote>
          {dearest.r.finalTax > cheapest.r.finalTax ? (
            <>
              가장 적게 내는 <strong>{cheapest.label}</strong>과 가장 많이 내는{' '}
              <strong>{dearest.label}</strong>의 차이가{' '}
              <strong>{won(dearest.r.finalTax - cheapest.r.finalTax)}원</strong>입니다.{' '}
            </>
          ) : (
            <>이 금액대에서는 어느 구성이든 공제 범위 안이라 상속세가 없습니다. </>
          )}
          특히 <strong>배우자 단독 상속은 일괄공제를 쓸 수 없습니다</strong>(상증세법 제21조 ②) —
          자녀와 함께 상속받는 편이 공제가 큽니다.
        </AnswerNote>
      </AnswerSection>

      <AnswerSection title="어떤 공제가 있나">
        <AnswerTable label="어떤 공제가 있나">
          <thead>
            <tr>
              <th scope="col">공제</th>
              <th scope="col">금액</th>
              <th scope="col">근거</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">일괄공제</th>
              <td className="num">{won(h.lumpSumDeduction)}원</td>
              <td>기초공제 {won(h.basicDeduction)}원 + 인적공제와 비교해 큰 쪽 (제21조)</td>
            </tr>
            <tr>
              <th scope="row">배우자 상속공제</th>
              <td className="num">{won(h.spouseMin)}~{won(h.spouseMax)}원</td>
              <td>실제 상속액 한도, 법정상속분과 30억 중 작은 값까지 (제19조)</td>
            </tr>
            <tr>
              <th scope="row">자녀공제</th>
              <td className="num">1명당 {won(h.childDeduction)}원</td>
              <td>미성년자는 19세까지 연 {won(h.minorPerYear)}원 추가 (제20조)</td>
            </tr>
            <tr>
              <th scope="row">금융재산 상속공제</th>
              <td className="num">최대 {won(h.financial.cap)}원</td>
              <td>순금융재산의 {h.financial.rate * 100}% (제22조)</td>
            </tr>
          </tbody>
        </AnswerTable>
      </AnswerSection>

      <AnswerNav
        base="/inheritance-tax"
        prev={prev}
        next={next}
        current={man}
        chips={INHERIT.all().filter(m => m % 50_000 === 0)}
        allHref="/calc/inheritance-tax"
        allLabel="가족 구성·금융재산까지 넣어 계산하기"
      />

      <AnswerNote>
        <strong>사전증여가 있으면 세금이 늘어납니다.</strong> 상속개시일 전 10년(상속인이 아닌
        사람은 5년) 이내에 증여한 재산은 상속재산에 다시 더해집니다. 이 표는 사전증여가 없다고
        보고 계산한 것입니다. <a href="/calc/gift-tax">증여세 계산기</a>에서 증여 시점의 세금도
        함께 확인해 보세요.
      </AnswerNote>
    </AnswerPage>
  );
}
