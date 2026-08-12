import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breakdown } from '@/components/Breakdown';
import {
  AnswerPage, AnswerSection, AnswerNote, Assumptions, AnswerTable,
} from '@/components/AnswerPage';
import { getRates } from '@/lib/rates';
import { calcCarTax } from '@/lib/calc/localTax';
import { won, pct } from '@/lib/format';
import {
  CC, carAgePairs, parseAge, modelYearOf, CAR_AGE_PAGES, DEFAULT_YEAR,
} from '@/lib/localTaxPages';
import { carAgeInsights } from '@/lib/insights';
import { breadcrumbLd, ldJson } from '@/lib/jsonLd';
import s from '../carTax.module.css';

/**
 * "2023년식 2000cc 자동차세" 검색을 받는 페이지.
 *
 * 배기량만으로 나눈 페이지가 이미 있는데 연식 축을 더 붙이는 이유는 **답이 실제로
 * 다르기 때문**이다. 차령 경감(지방세법 제127조 ②)이 3년째부터 매년 5%씩 붙어
 * 12년째에 50%가 되므로, 같은 2000cc라도 연식마다 세액이 갈린다. 답이 같은 조합으로
 * 페이지를 늘리면 그건 도어웨이지만, 여기는 각 페이지가 다른 답을 준다.
 */
export function generateStaticParams() {
  return carAgePairs().map(({ cc, age }) => ({ cc: String(cc), age: String(age) }));
}
export const dynamicParams = false;

const ccLabel = (cc: number) => `${cc.toLocaleString('ko-KR')}cc`;

/** 검색어는 "차령 3년"이 아니라 "2023년식"으로 친다. 화면에는 둘 다 둔다. */
const modelLabel = (age: number) => `${modelYearOf(age, DEFAULT_YEAR)}년식`;

export function generateMetadata({ params }: { params: { cc: string; age: string } }): Metadata {
  const cc = CC.parse(params.cc);
  const age = parseAge(params.age);
  if (cc === null || age === null) return {};
  const r = calcCarTax({ year: DEFAULT_YEAR, cc, ageYears: age, business: false });
  return {
    title: `${modelLabel(age)} ${ccLabel(cc)} 자동차세 — 연 ${won(r.total)}원`,
    description:
      `${DEFAULT_YEAR}년 기준 ${modelLabel(age)}(차령 ${age}년) ${ccLabel(cc)} 승용차의 연간 자동차세는 `
      + `지방교육세를 포함해 ${won(r.total)}원입니다. `
      + (r.ageDiscountRate > 0
        ? `차령 경감 ${pct(r.ageDiscountRate, 0)}가 적용된 금액이며, `
        : '아직 차령 경감이 적용되지 않는 구간이며, ')
      + '1월 연납 할인액까지 함께 보여드립니다.',
    alternates: { canonical: `https://ttakcalc.com/car-tax/${cc}/${age}` },
  };
}

export default function CarTaxAgePage({ params }: { params: { cc: string; age: string } }) {
  const cc = CC.parse(params.cc);
  const age = parseAge(params.age);
  if (cc === null || age === null) notFound();

  const year = DEFAULT_YEAR;
  const rates = getRates(year);
  const r = calcCarTax({ year, cc, ageYears: age, business: false });
  const jan = r.prepayments[0];

  // 이 페이지가 존재하는 이유를 문장으로 만든다 — 차령이 세액을 어떻게 바꾸는지
  const insights = carAgeInsights(cc, age, year);

  // 앞뒤 연식. 범위 밖은 링크하지 않는다 — 없는 페이지를 가리키지 않기 위해.
  const younger = age > CAR_AGE_PAGES.min ? age - 1 : null;
  const older = age < CAR_AGE_PAGES.max ? age + 1 : null;

  // 신차 대비 얼마나 줄었나. 이 조합에서만 할 수 있는 비교다.
  const brandNew = calcCarTax({ year, cc, ageYears: CAR_AGE_PAGES.min, business: false });
  const saved = brandNew.total - r.total;

  const ages = Array.from(
    { length: CAR_AGE_PAGES.max - CAR_AGE_PAGES.min + 1 },
    (_, i) => CAR_AGE_PAGES.min + i,
  );

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `${modelLabel(age)} ${ccLabel(cc)} 자동차세는 얼마인가요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            `${rates.label} 기준 자동차세 ${won(r.carTax)}원에 지방교육세 ${won(r.localEduTax)}원을 더해 `
            + `연 ${won(r.total)}원입니다. 6월과 12월에 ${won(r.halfYear)}원씩 나눠 냅니다.`,
        },
      },
      {
        '@type': 'Question',
        name: `차령 ${age}년이면 자동차세가 얼마나 줄어드나요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: insights.map(i => i.text).join(' ')
            + (saved > 0 ? ` 차령 ${CAR_AGE_PAGES.min}년일 때(${won(brandNew.total)}원)보다 연 ${won(saved)}원 적습니다.` : ''),
        },
      },
    ],
  };

  const crumbLd = breadcrumbLd([
    { name: '자동차세', href: '/calc/car-tax' },
    { name: `${ccLabel(cc)} 자동차세`, href: `/car-tax/${cc}` },
    { name: `${modelLabel(age)} ${ccLabel(cc)} 자동차세` },
  ]);

  return (
    <>
      {[faqLd, crumbLd].map((ld, i) => (
        <script key={i} type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      ))}

      <AnswerPage
        tone="c3"
        category={`${ccLabel(cc)} 자동차세`}
        categoryHref={`/car-tax/${cc}`}
        meta={`${rates.label} 기준`}
        title={`${modelLabel(age)} ${ccLabel(cc)} 자동차세`}
        lead={
          <>
            차령 {age}년 비영업용 승용차 기준으로 지방교육세까지 합쳐 연{' '}
            <strong>{won(r.total)}원</strong>입니다.
            {r.ageDiscountRate > 0
              ? <> 차령 경감 {pct(r.ageDiscountRate, 0)}가 적용돼 차령 {CAR_AGE_PAGES.min}년일 때보다 연 {won(saved)}원 적습니다.</>
              : <> 아직 차령 경감이 붙지 않는 구간입니다.</>}
          </>
        }
      >
        <Breakdown
          headlineLabel="연간 자동차세 (지방교육세 포함)"
          headlineValue={r.total}
          headlineSub={`6월·12월에 ${won(r.halfYear)}원씩 · 1월 연납 시 ${won(jan.payable)}원`}
          rows={[
            ...r.steps.slice(0, -1).map(st => ({ label: st.label, value: st.value, basis: st.basis, tone: st.tone })),
            { label: '연간 총액', value: r.total, tone: 'result' as const },
          ]}
          footer={
            <>
              <span>{rates.label} 기준 · 최종 확인 {r.verifiedAt}</span>
              <a href="/calc/car-tax">차령·용도 바꿔 계산 →</a>
            </>
          }
        />

        {/* 이 페이지가 따로 존재하는 이유 — 그 차령에서만 성립하는 사실 */}
        <AnswerSection title={`차령 ${age}년이라서 달라지는 것`}>
          <ul className={s.insights}>
            {insights.map(i => (
              <li key={i.text} className={i.notable ? s.notable : undefined}>{i.text}</li>
            ))}
            {saved > 0 && (
              <li>
                차령 {CAR_AGE_PAGES.min}년일 때 연 {won(brandNew.total)}원이던 세금이 {won(r.total)}원으로,
                연 {won(saved)}원 줄었습니다.
              </li>
            )}
          </ul>
        </AnswerSection>

        <AnswerSection title="계산 조건">
          <Assumptions items={[
            <>비영업용 승용차</>,
            <>차령 <strong>{age}년</strong> ({modelLabel(age)} 기준)</>,
            <>지자체 탄력세율 <strong>미적용</strong></>,
          ]} />
          <AnswerNote>
            <strong>연식과 차령은 정확히 같지 않습니다.</strong> 자동차세의 차령은 최초 등록일을
            기준으로 세기 때문에, 같은 연식이어도 등록이 늦었으면 차령이 한 해 적을 수 있습니다.
            고지서의 차령을 확인해 <a href="/calc/car-tax">계산기</a>에 직접 넣으시는 편이 정확합니다.
          </AnswerNote>
          <AnswerNote>
            지자체는 조례로 표준세율의 50%까지 올려 정할 수 있어 실제 고지서와 다를 수 있습니다.
            연중에 차를 사거나 팔면 보유 일수만큼 일할 계산됩니다.
          </AnswerNote>
        </AnswerSection>

        <AnswerSection title={`${ccLabel(cc)} 차령별 자동차세`}>
          <AnswerTable label={`${ccLabel(cc)} 차령별 자동차세`}>
            <thead>
              <tr>
                <th scope="col">차령</th>
                <th scope="col">경감률</th>
                <th scope="col">연간 총액</th>
                <th scope="col">1월 연납 시</th>
              </tr>
            </thead>
            <tbody>
              {ages.map(a => {
                const x = calcCarTax({ year, cc, ageYears: a, business: false });
                return (
                  <tr key={a} className={a === age ? s.current : undefined}>
                    <th scope="row">
                      {a === age ? `${a}년` : <a href={`/car-tax/${cc}/${a}`}>{a}년</a>}
                      {a === age && <span className={s.badge}>이 페이지</span>}
                    </th>
                    <td className="num">{x.ageDiscountRate > 0 ? pct(x.ageDiscountRate, 0) : '—'}</td>
                    <td className="num">{won(x.total)}원</td>
                    <td className="num">{won(x.prepayments[0].payable)}원</td>
                  </tr>
                );
              })}
            </tbody>
          </AnswerTable>
          <AnswerNote>
            차령 3년째부터 매년 5%씩 줄어 12년째에 50%까지 경감됩니다
            (지방세법 제127조 제2항). 12년을 넘어도 더는 줄지 않습니다.
          </AnswerNote>
        </AnswerSection>

        <AnswerSection title="연납 신청 시기별 할인">
          <AnswerTable label="연납 신청 시기별 할인">
            <thead>
              <tr>
                <th scope="col">신청 시기</th>
                <th scope="col">공제액</th>
                <th scope="col">납부액</th>
              </tr>
            </thead>
            <tbody>
              {r.prepayments.map(p => (
                <tr key={p.month} className={p.month === 1 ? s.current : undefined}>
                  <th scope="row">
                    {p.month}월
                    {p.month === 1 && <span className={s.badge}>가장 유리</span>}
                  </th>
                  <td className="num">{won(p.discount)}원</td>
                  <td className="num">{won(p.payable)}원</td>
                </tr>
              ))}
            </tbody>
          </AnswerTable>
        </AnswerSection>

        <nav className={s.ageNav} aria-label="다른 연식으로 보기">
          {younger !== null
            ? <a href={`/car-tax/${cc}/${younger}`}>← {modelLabel(younger)} (차령 {younger}년)</a>
            : <span />}
          <a href={`/car-tax/${cc}`}>{ccLabel(cc)} 자동차세 전체</a>
          {older !== null
            ? <a href={`/car-tax/${cc}/${older}`}>{modelLabel(older)} (차령 {older}년) →</a>
            : <span />}
        </nav>
      </AnswerPage>
    </>
  );
}
