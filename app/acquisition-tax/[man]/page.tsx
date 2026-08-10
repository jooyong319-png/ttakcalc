import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breakdown } from '@/components/Breakdown';
import {
  AnswerPage, AnswerSection, AnswerNote, Assumptions, AnswerTable, AnswerNav,
} from '@/components/AnswerPage';
import { getRates } from '@/lib/rates';
import { calcAcquisitionTax } from '@/lib/calc/property';
import { won, manLabel, manToWon, pct } from '@/lib/format';
import { PRICE, popularPrice, ACQ_ASSUMPTION, ACQ_CASES, DEFAULT_YEAR } from '@/lib/propertyPages';

export function generateStaticParams() {
  return PRICE.all().map(m => ({ man: String(m) }));
}
// 범위 밖은 얇은 페이지를 만들지 않고 확실히 404
export const dynamicParams = false;

const calc = (man: number, c: (typeof ACQ_CASES)[number], year: string) =>
  calcAcquisitionTax({
    year, price: manToWon(man),
    areaSqm: c.areaSqm, houseCount: c.houseCount, regulated: c.regulated,
  });

export function generateMetadata({ params }: { params: { man: string } }): Metadata {
  const man = PRICE.parse(params.man);
  if (man === null) return {};
  const r = calc(man, ACQ_CASES[0], DEFAULT_YEAR);
  const label = manLabel(man);
  return {
    // 검색어는 "주택"이 아니라 "아파트"로 들어온다(GSC 노출 1위: "20억 아파트 취득세").
    // 화면 제목은 법령 용어인 "주택"을 유지하되, 검색 결과에 나가는 title에는 둘 다 담는다.
    title: `${label} 아파트·주택 취득세 — 총 ${won(r.total)}원`,
    description:
      `${DEFAULT_YEAR}년 기준 ${label} 주택을 살 때 취득세는 ${won(r.acquisitionTax)}원, ` +
      `지방교육세까지 합치면 ${won(r.total)}원입니다(1주택·전용 85㎡ 이하 기준). ` +
      `다주택·85㎡ 초과일 때 얼마나 달라지는지 함께 비교합니다.`,
    alternates: { canonical: `https://ttakcalc.com/acquisition-tax/${man}` },
  };
}

export default function AcquisitionTaxPage({ params }: { params: { man: string } }) {
  const man = PRICE.parse(params.man);
  if (man === null) notFound();

  const year = DEFAULT_YEAR;
  const rates = getRates(year);
  const price = manToWon(man);
  const label = manLabel(man);
  const base = calc(man, ACQ_CASES[0], year);
  const cases = ACQ_CASES.map(c => ({ ...c, r: calc(man, c, year) }));
  const { prev, next } = PRICE.neighbors(man);

  // 6억·9억 경계에서 실효세율이 어떻게 움직이는지 — 이 페이지가 어느 구간에 있는지 알려준다
  const band =
    price <= 600_000_000 ? '6억 이하 (표준세율 1%)'
      : price <= 900_000_000 ? '6억 초과 9억 이하 (누진식 구간)'
        : '9억 초과 (표준세율 3%)';

  const rows = [
    { label: '취득가액', value: price, basis: `${label}`, tone: 'info' as const },
    { label: '취득세', value: base.acquisitionTax, basis: base.steps[1].basis },
    { label: '지방교육세', value: base.localEduTax, basis: base.steps[2].basis },
    { label: '농어촌특별세', value: base.ruralTax, basis: base.steps[3].basis },
    { label: '총 납부액', value: base.total, tone: 'result' as const },
  ];

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `${label} 아파트 취득세는 얼마인가요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            `${rates.label} 기준 1주택·전용 85㎡ 이하라면 취득세 ${won(base.acquisitionTax)}원, ` +
            `지방교육세 ${won(base.localEduTax)}원으로 총 ${won(base.total)}원입니다. ` +
            `실효세율은 ${pct(base.effectiveRate, 2)}입니다.`,
        },
      },
      {
        '@type': 'Question',
        name: `${label} 주택이 2주택·3주택이면 취득세가 얼마나 늘어나나요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            `전용 85㎡ 초과 기준으로 조정대상지역 2주택은 총 ${won(cases[2].r.total)}원(취득세 8% 중과), ` +
            `3주택 이상은 총 ${won(cases[3].r.total)}원(12% 중과)입니다. ` +
            `1주택 기준 ${won(base.total)}원과 비교하면 각각 ` +
            `${won(cases[2].r.total - base.total)}원, ${won(cases[3].r.total - base.total)}원 더 냅니다. ` +
            `중과 시에는 지방교육세(0.4%)와 농어촌특별세(0.6%·1.0%)도 함께 무거워집니다.`,
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
        category="취득세"
        categoryHref="/calc/acquisition-tax"
        meta={`${rates.label} 기준`}
        title={`${label} 주택 취득세`}
        lead={
          <>
            1주택·전용 85㎡ 이하로 {label} 주택을 사면 취득세와 지방교육세를 합쳐{' '}
            <strong>{won(base.total)}원</strong>을 냅니다. 실효세율 {pct(base.effectiveRate, 2)},
            이 금액대는 <strong>{band}</strong>에 해당합니다.
          </>
        }
      >
        <Breakdown
          headlineLabel="총 납부액"
          headlineValue={base.total}
          headlineSub={`취득세 ${won(base.acquisitionTax)}원 · 실효세율 ${pct(base.effectiveRate, 2)}`}
          rows={rows}
          footer={
            <>
              <span>{rates.label} 기준 · 최종 확인 {base.verifiedAt}</span>
              <a href="/calc/acquisition-tax">면적·주택 수 바꿔 계산 →</a>
            </>
          }
        />

        <AnswerSection title="계산 조건">
          <Assumptions items={[
            <>주택 수 <strong>{ACQ_ASSUMPTION.houseCount}주택</strong></>,
            <>전용면적 <strong>{ACQ_ASSUMPTION.areaSqm}㎡</strong> (85㎡ 이하 → 농특세 비과세)</>,
            <>조정대상지역 <strong>아님</strong></>,
            <>유상취득 (매매)</>,
          ]} />
          <AnswerNote>
            상속·증여 취득이나 오피스텔·토지는 세율 체계가 다릅니다.
            면적·주택 수를 직접 바꾸려면 <a href="/calc/acquisition-tax">취득세 계산기</a>를 쓰세요.
          </AnswerNote>
        </AnswerSection>

        {/* 이 표가 페이지의 존재 이유 — 같은 가격인데 조건에 따라 세금이 몇 배로 갈린다 */}
        <AnswerSection title="조건별 비교 — 같은 가격, 다른 세금">
          <AnswerTable>
            <thead>
              <tr>
                <th scope="col">조건</th>
                <th scope="col">취득세</th>
                <th scope="col">총 납부액</th>
                <th scope="col">실효세율</th>
              </tr>
            </thead>
            <tbody>
              {cases.map(c => (
                <tr key={c.key}>
                  <th scope="row">{c.label}</th>
                  <td className="num">{won(c.r.acquisitionTax)}원</td>
                  <td className="num">{won(c.r.total)}원</td>
                  <td className="num">{pct(c.r.effectiveRate, 2)}</td>
                </tr>
              ))}
            </tbody>
          </AnswerTable>
          <AnswerNote>
            85㎡를 넘으면 농어촌특별세가 붙습니다. 다주택은 중과세율(조정대상지역 2주택 8% /
            3주택 이상 12%)이 적용돼 총액이 몇 배로 뜁니다.
          </AnswerNote>
          <AnswerNote>
            다주택 중과 시에는 부가세목도 함께 무거워집니다. 지방교육세는 0.4%
            (지방세법 제151조 제1항 제1호 나목), 농어촌특별세는 8% 중과 0.6% / 12% 중과 1.0%
            (농어촌특별세법 제5조 제1항 제6호)로 표준세율일 때보다 높습니다.
          </AnswerNote>
          <AnswerNote>
            6억·9억을 경계로 세율이 달라지므로{' '}
            <a href={`/acquisition-tax/${prev ?? next ?? man}`}>{manLabel(prev ?? next ?? man)}</a>과
            비교해 보면 차이가 보입니다.
          </AnswerNote>
        </AnswerSection>

        <AnswerNav
          base="/acquisition-tax"
          prev={prev} next={next}
          chips={popularPrice()} current={man}
          allHref="/calc/acquisition-tax"
          allLabel="취득세 계산기"
        />
      </AnswerPage>
    </>
  );
}
