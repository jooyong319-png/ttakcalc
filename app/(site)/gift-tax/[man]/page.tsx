import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breakdown } from '@/components/Breakdown';
import {
  AnswerPage, AnswerSection, AnswerNote, Assumptions, AnswerTable, AnswerNav,
} from '@/components/AnswerPage';
import { getRates } from '@/lib/rates';
import { calcGiftTax } from '@/lib/calc/extra';
import { won, manLabel, manToWon, pct } from '@/lib/format';
import { GIFT, DEFAULT_YEAR } from '@/lib/salaryPages';
import s from './giftTax.module.css';

export function generateStaticParams() {
  return GIFT.all().map(m => ({ man: String(m) }));
}
export const dynamicParams = false;

/** 가장 흔한 경우 — 부모가 성년 자녀에게, 10년 내 첫 증여, 기한 내 신고 */
const RELATION = 'lineal-ascendant';

/** 관계별 비교표 — 같은 금액인데 누구에게 받느냐로 세금이 갈린다 */
const COMPARE = ['spouse', 'lineal-ascendant', 'lineal-ascendant-minor', 'other-relative', 'other'];

export function generateMetadata({ params }: { params: { man: string } }): Metadata {
  const man = GIFT.parse(params.man);
  if (man === null) return {};
  const r = calcGiftTax(manToWon(man), RELATION, 0, true, DEFAULT_YEAR);
  const label = manLabel(man);
  return {
    title: r.finalTax === 0
      ? `${label} 증여세 — 공제 범위라 0원`
      : `${label} 증여세 — ${won(r.finalTax)}원`,
    description:
      `부모님께 ${label}을 받으면 증여세는 ${won(r.finalTax)}원입니다(성년 자녀·10년 내 첫 증여·기한 내 신고 기준). `
      + `관계별 공제와 10년 합산 규정까지 근거와 함께 보여드립니다.`,
    alternates: { canonical: `https://ttakcalc.com/gift-tax/${man}` },
  };
}

export default function GiftTaxPage({ params }: { params: { man: string } }) {
  const man = GIFT.parse(params.man);
  if (man === null) notFound();

  const year = DEFAULT_YEAR;
  const rates = getRates(year);
  const g = rates.giftTax;
  const amount = manToWon(man);
  const label = manLabel(man);
  const base = calcGiftTax(amount, RELATION, 0, true, year);
  const { prev, next } = GIFT.neighbors(man);

  const cases = COMPARE.map(key => ({
    label: g.deductions.find(d => d.key === key)!.label,
    key,
    r: calcGiftTax(amount, key, 0, true, year),
  }));

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `부모님께 ${label}을 받으면 증여세가 얼마인가요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: base.finalTax === 0
            ? `증여재산공제 ${won(base.deduction)}원 범위 안이라 증여세가 없습니다. `
              + `다만 10년 안에 이미 공제를 받았다면 세금이 생길 수 있습니다.`
            : `${won(base.finalTax)}원입니다. 직계존속 공제 ${won(base.deduction)}원을 뺀 `
              + `${won(base.taxBase)}원이 과세표준이고, 기한 내 신고 시 산출세액의 3%를 공제받습니다.`,
        },
      },
      {
        '@type': 'Question',
        name: `누구에게 받느냐에 따라 세금이 달라지나요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            `크게 달라집니다. 같은 ${label}이라도 배우자는 ${won(cases[0].r.finalTax)}원, `
            + `부모(성년 자녀)는 ${won(cases[1].r.finalTax)}원, `
            + `타인에게 받으면 ${won(cases[4].r.finalTax)}원입니다. 공제 한도가 다르기 때문입니다.`,
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
        category="증여세"
        categoryHref="/calc/gift-tax"
        meta={`${rates.label} 기준`}
        title={`${label} 증여세`}
        lead={
          base.finalTax === 0 ? (
            <>
              부모님께 {label}을 받으면 <strong>증여세가 없습니다.</strong>{' '}
              직계존속 공제 {won(base.deduction)}원 범위 안이기 때문입니다.
              다만 <strong>10년 안에 이미 공제를 받았다면</strong> 얘기가 달라집니다.
            </>
          ) : (
            <>
              부모님께 {label}을 받으면 증여세는 <strong>{won(base.finalTax)}원</strong>입니다.
              공제 {won(base.deduction)}원을 뺀 {won(base.taxBase)}원이 과세표준이고,
              실효세율은 {pct(base.effectiveRate, 2)}입니다.
            </>
          )
        }
      >
        <Breakdown
          headlineLabel="납부할 증여세"
          headlineValue={base.finalTax}
          headlineSub={base.finalTax === 0 ? '공제 범위 안' : `실효세율 ${pct(base.effectiveRate, 2)}`}
          rows={base.steps.map(st => ({ label: st.label, value: st.value, basis: st.basis, tone: st.tone }))}
          footer={
            <>
              <span>{rates.label} 기준 · 근거 {base.source}</span>
              <a href="/calc/gift-tax">관계·10년 내역 바꿔 계산 →</a>
            </>
          }
        />

        <AnswerSection title="계산 조건">
          <Assumptions items={[
            <>직계존속(부모)에게서 받음</>,
            <>받는 사람 <strong>성년</strong></>,
            <>10년 내 증여 <strong>없음</strong></>,
            <>기한 내 신고 (3% 공제)</>,
          ]} />
          <AnswerNote>
            받는 사람이 미성년이면 공제가 2천만원으로 줄어 세금이 늘어납니다.
            조건을 바꾸려면 <a href="/calc/gift-tax">계산기</a>를 쓰세요.
          </AnswerNote>
        </AnswerSection>

        <AnswerSection title="누구에게 받느냐로 갈린다">
          <AnswerTable label="누구에게 받느냐로 갈린다">
            <thead>
              <tr>
                <th scope="col">관계</th>
                <th scope="col">공제</th>
                <th scope="col">과세표준</th>
                <th scope="col">증여세</th>
              </tr>
            </thead>
            <tbody>
              {cases.map(c => (
                <tr key={c.key} className={c.key === RELATION ? s.current : undefined}>
                  <th scope="row">
                    {c.label}
                    {c.key === RELATION && <span className={s.badge}>기준</span>}
                  </th>
                  <td className="num">{won(c.r.deduction)}원</td>
                  <td className="num">{won(c.r.taxBase)}원</td>
                  <td className="num">{won(c.r.finalTax)}원</td>
                </tr>
              ))}
            </tbody>
          </AnswerTable>
          <AnswerNote>
            같은 금액인데 세금이 이렇게 갈리는 건 <strong>관계별 공제 한도가 다르기</strong> 때문입니다.
            배우자 6억, 직계존·비속 5천만(미성년 2천만), 4촌 이내 혈족 1천만, 타인은 공제가 없습니다.
          </AnswerNote>
        </AnswerSection>

        {/* 이 세금의 진짜 함정 */}
        <AnswerSection title="10년 합산 — 가장 큰 함정">
          <AnswerNote>
            공제 한도는 <strong>한 번 쓰면 10년간 다시 열리지 않습니다.</strong>
            5년 전에 부모님께 5천만원을 받아 공제를 다 썼다면, 지금 받는 {label}은
            공제 없이 전액이 과세표준이 됩니다.
          </AnswerNote>
          <AnswerNote>
            같은 {label}이라도 10년 내 5천만원을 이미 받았다면 증여세가{' '}
            <strong>{won(base.finalTax)}원 → {won(calcGiftTax(amount, RELATION, 50_000_000, true, year).finalTax)}원</strong>으로
            늘어납니다. <a href="/calc/gift-tax">계산기</a>에서 이전 금액을 넣어 확인하세요.
          </AnswerNote>
        </AnswerSection>

        <AnswerNav
          base="/gift-tax"
          prev={prev} next={next}
          chips={GIFT.all().filter(m => m % 10_000 === 0)} current={man}
          allHref="/calc/gift-tax"
          allLabel="증여세 계산기"
        />
      </AnswerPage>
    </>
  );
}
