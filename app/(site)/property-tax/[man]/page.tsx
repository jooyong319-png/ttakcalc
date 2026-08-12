import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breakdown } from '@/components/Breakdown';
import {
  AnswerPage, AnswerSection, AnswerNote, Assumptions, AnswerTable, AnswerNav,
} from '@/components/AnswerPage';
import { getRates } from '@/lib/rates';
import { calcPropertyTax } from '@/lib/calc/localTax';
import { won, manLabel, manToWon, pct } from '@/lib/format';
import {
  PUBLIC_PRICE, popularPublicPrice, PROPERTY_ASSUMPTION, PROPERTY_CASES, DEFAULT_YEAR,
} from '@/lib/localTaxPages';
import s from './propertyTax.module.css';

export function generateStaticParams() {
  return PUBLIC_PRICE.all().map(m => ({ man: String(m) }));
}
export const dynamicParams = false;

export function generateMetadata({ params }: { params: { man: string } }): Metadata {
  const man = PUBLIC_PRICE.parse(params.man);
  if (man === null) return {};
  const r = calcPropertyTax({ year: DEFAULT_YEAR, publicPrice: manToWon(man), ...PROPERTY_ASSUMPTION });
  const label = manLabel(man);
  return {
    title: `공시가격 ${label} 아파트 재산세 — 연 ${won(r.total)}원`,
    description:
      `${DEFAULT_YEAR}년 기준 공시가격 ${label} 주택의 재산세는 도시지역분·지방교육세를 포함해 ` +
      `연 ${won(r.total)}원입니다(1세대 1주택 기준). 7월·9월에 ${won(r.half)}원씩 나눠 냅니다.`,
    alternates: { canonical: `https://ttakcalc.com/property-tax/${man}` },
  };
}

export default function PropertyTaxPage({ params }: { params: { man: string } }) {
  const man = PUBLIC_PRICE.parse(params.man);
  if (man === null) notFound();

  const year = DEFAULT_YEAR;
  const rates = getRates(year);
  const price = manToWon(man);
  const label = manLabel(man);
  const base = calcPropertyTax({ year, publicPrice: price, ...PROPERTY_ASSUMPTION });
  const cases = PROPERTY_CASES.map(c => ({
    ...c,
    r: calcPropertyTax({ year, publicPrice: price, oneHouse: c.oneHouse, urbanArea: true }),
  }));
  const { prev, next } = PUBLIC_PRICE.neighbors(man);
  const p = rates.propertyTax;

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `공시가격 ${label} 주택의 재산세는 얼마인가요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            `${rates.label} 기준 1세대 1주택이라면 재산세 ${won(base.propertyTax)}원, 도시지역분 ` +
            `${won(base.urbanAreaTax)}원, 지방교육세 ${won(base.localEduTax)}원으로 연 ${won(base.total)}원입니다. ` +
            `과세표준은 공시가격에 공정시장가액비율 ${pct(base.fairMarketRatio, 0)}를 곱한 ${won(base.taxBase)}원입니다.`,
        },
      },
      {
        '@type': 'Question',
        name: `1세대 1주택이 아니면 얼마나 늘어나나요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            `그 밖의 주택은 연 ${won(cases[1].r.total)}원으로 ${won(cases[1].r.total - base.total)}원 더 냅니다. ` +
            `공정시장가액비율이 ${pct(cases[1].r.fairMarketRatio, 0)}로 높아지고, ` +
            `특례세율(0.05~0.35%) 대신 표준세율(0.1~0.4%)이 적용되기 때문입니다.`,
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, '\\u003c') }} />

      <AnswerPage
        tone="c2"
        category="재산세"
        categoryHref="/calc/property-tax"
        meta={`${rates.label} 기준`}
        title={`공시가격 ${label} 재산세`}
        lead={
          <>
            1세대 1주택 기준으로 도시지역분·지방교육세까지 합쳐 연 <strong>{won(base.total)}원</strong>입니다.
            7월과 9월에 {won(base.half)}원씩 나눠 냅니다.
            {!base.specialRateApplied && ' 공시가격 9억을 넘어 1세대 1주택 특례세율은 적용되지 않습니다.'}
          </>
        }
      >
        <Breakdown
          headlineLabel="연간 재산세 (도시지역분·지방교육세 포함)"
          headlineValue={base.total}
          headlineSub={`7월·9월에 ${won(base.half)}원씩`}
          rows={[
            ...base.steps.slice(0, -1).map(st => ({ label: st.label, value: st.value, basis: st.basis, tone: st.tone })),
            { label: '연간 총액', value: base.total, tone: 'result' as const },
          ]}
          footer={
            <>
              <span>{rates.label} 기준 · 최종 확인 {base.verifiedAt}</span>
              <a href="/calc/property-tax">조건 바꿔 계산 →</a>
            </>
          }
        />

        <AnswerSection title="계산 조건">
          <Assumptions items={[
            <>1세대 1주택</>,
            <>도시지역분 <strong>부과</strong></>,
            <>공정시장가액비율 <strong>{pct(base.fairMarketRatio, 0)}</strong></>,
          ]} />
          <AnswerNote>
            공시가격은 <strong>부동산공시가격 알리미</strong>에서 확인할 수 있습니다.
            매년 6월 1일 소유자에게 부과되므로, 그 전에 팔면 그해 재산세는 내지 않습니다.
          </AnswerNote>
        </AnswerSection>

        <AnswerSection title="1세대 1주택 여부에 따른 차이">
          <AnswerTable label="1세대 1주택 여부에 따른 차이">
            <thead>
              <tr>
                <th scope="col">조건</th>
                <th scope="col">공정시장가액비율</th>
                <th scope="col">과세표준</th>
                <th scope="col">연간 총액</th>
              </tr>
            </thead>
            <tbody>
              {cases.map(c => (
                <tr key={c.key} className={c.oneHouse ? s.current : undefined}>
                  <th scope="row">
                    {c.label}
                    {c.oneHouse && <span className={s.badge}>기준</span>}
                  </th>
                  <td className="num">{pct(c.r.fairMarketRatio, 0)}</td>
                  <td className="num">{won(c.r.taxBase)}원</td>
                  <td className="num">{won(c.r.total)}원</td>
                </tr>
              ))}
            </tbody>
          </AnswerTable>
          <AnswerNote>
            1세대 1주택은 <strong>두 군데서</strong> 유리합니다. 공정시장가액비율이 60% 대신
            43~45%로 낮고, 공시가격 9억원 이하면 특례세율(0.05~0.35%)까지 적용됩니다.
            9억을 넘으면 비율만 45%로 남고 세율은 표준세율로 돌아갑니다.
          </AnswerNote>
        </AnswerSection>

        <AnswerSection title="과세표준 구간">
          <AnswerNote>
            재산세는 <strong>공시가격이 아니라 과세표준</strong>을 기준으로 구간이 나뉩니다.
            6천만원·1억5천만원·3억원이 경계이고, 이 주택의 과세표준은 {won(base.taxBase)}원입니다.
            {prev !== null && <> <a href={`/property-tax/${prev}`}>{manLabel(prev)}</a>와 비교해 보세요.</>}
          </AnswerNote>
          <AnswerNote>
            공시가격 합계가 1세대 1주택 12억 / 그 밖 9억을 넘으면 12월에{' '}
            <strong>종합부동산세</strong>가 따로 부과됩니다. 이 페이지는 재산세만 다룹니다.
          </AnswerNote>
        </AnswerSection>

        <AnswerNav
          base="/property-tax"
          prev={prev} next={next}
          chips={popularPublicPrice()} current={man}
          allHref="/calc/property-tax"
          allLabel="재산세 계산기"
          label="다른 공시가격으로 보기"
        />
      </AnswerPage>
    </>
  );
}
