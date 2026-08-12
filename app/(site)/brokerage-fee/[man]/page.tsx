import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breakdown } from '@/components/Breakdown';
import {
  AnswerPage, AnswerSection, AnswerNote, Assumptions, AnswerTable, AnswerNav,
} from '@/components/AnswerPage';
import { getRates } from '@/lib/rates';
import { calcBrokerage } from '@/lib/calc/property';
import { won, manLabel, manToWon, pct } from '@/lib/format';
import { PRICE, popularPrice, DEFAULT_YEAR } from '@/lib/propertyPages';

export function generateStaticParams() {
  return PRICE.all().map(m => ({ man: String(m) }));
}
export const dynamicParams = false;

export function generateMetadata({ params }: { params: { man: string } }): Metadata {
  const man = PRICE.parse(params.man);
  if (man === null) return {};
  const sale = calcBrokerage(manToWon(man), DEFAULT_YEAR, 'sale', true);
  const label = manLabel(man);
  return {
    title: `${label} 중개수수료 — 최대 ${won(sale.total)}원`,
    description:
      `${DEFAULT_YEAR}년 기준 ${label} 주택 매매의 중개보수 상한은 ${won(sale.fee)}원, ` +
      `부가세를 포함하면 ${won(sale.total)}원입니다. 임대차(전세)일 때 금액과 구간별 상한요율도 함께 보여드립니다.`,
    alternates: { canonical: `https://ttakcalc.com/brokerage-fee/${man}` },
  };
}

export default function BrokerageFeePage({ params }: { params: { man: string } }) {
  const man = PRICE.parse(params.man);
  if (man === null) notFound();

  const year = DEFAULT_YEAR;
  const rates = getRates(year);
  const amount = manToWon(man);
  const label = manLabel(man);

  const sale = calcBrokerage(amount, year, 'sale', true);
  const lease = calcBrokerage(amount, year, 'lease', true);
  const { prev, next } = PRICE.neighbors(man);

  const rows = [
    { label: '거래금액', value: amount, basis: `${label} · 매매`, tone: 'info' as const },
    { label: '상한요율', value: pct(sale.tier.rate, 1), basis: sale.steps[1].basis },
    { label: '중개보수(상한)', value: sale.fee, basis: sale.steps[2].basis },
    { label: '부가가치세', value: sale.vat, basis: `중개보수 × ${rates.brokerageFee.vatRate * 100}% (일반과세 중개사)` },
    { label: '총 지급액', value: sale.total, tone: 'result' as const },
  ];

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `${label} 주택을 매매하면 중개수수료가 얼마인가요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            `${rates.label} 기준 상한요율 ${pct(sale.tier.rate, 1)}를 적용해 ${won(sale.fee)}원이 상한이고, ` +
            `부가세를 포함하면 ${won(sale.total)}원입니다. 이 금액은 법정 상한이며 실제 보수는 ` +
            `상한 안에서 중개사와 협의해 정합니다.`,
        },
      },
      {
        '@type': 'Question',
        name: `전세(임대차)일 때는 얼마인가요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            `보증금 ${label} 기준 상한요율 ${pct(lease.tier.rate, 1)}를 적용해 ${won(lease.fee)}원, ` +
            `부가세 포함 ${won(lease.total)}원입니다. 매매보다 ${won(sale.total - lease.total)}원 적습니다.`,
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
        category="중개수수료"
        categoryHref="/calc/brokerage-fee"
        meta={`${rates.label} 기준`}
        title={`${label} 중개수수료`}
        lead={
          <>
            {label} 주택을 매매하면 중개보수 상한은 <strong>{won(sale.fee)}원</strong>,
            부가세를 포함하면 <strong>{won(sale.total)}원</strong>입니다.
            {sale.cappedByMax
              ? ' 이 구간은 한도액이 걸려 요율 계산값보다 적습니다.'
              : ` 적용 상한요율은 ${pct(sale.tier.rate, 1)}입니다.`}
          </>
        }
      >
        <Breakdown
          headlineLabel="매매 · 총 지급액(상한)"
          headlineValue={sale.total}
          headlineSub={`중개보수 ${won(sale.fee)}원 + 부가세 ${won(sale.vat)}원`}
          rows={rows}
          footer={
            <>
              <span>{rates.label} 기준 · 최종 확인 {sale.verifiedAt}</span>
              <a href="/calc/brokerage-fee">임대차·부가세 조건 바꾸기 →</a>
            </>
          }
        />

        <AnswerSection title="계산 조건">
          <Assumptions items={[
            <>주택 (오피스텔·상가는 요율이 다름)</>,
            <>부가가치세 <strong>포함</strong> (일반과세 중개사)</>,
            <>지자체 조례 <strong>미반영</strong></>,
          ]} />
          <AnswerNote>
            표시 금액은 <strong>법정 상한</strong>입니다. 실제 보수는 이 안에서 중개사와 협의해
            정하므로 더 낮게 지급할 수 있습니다. 조건을 바꾸려면{' '}
            <a href="/calc/brokerage-fee">중개수수료 계산기</a>를 쓰세요.
          </AnswerNote>
        </AnswerSection>

        <AnswerSection title="매매 vs 임대차 — 같은 금액, 다른 요율">
          <AnswerTable label="매매 vs 임대차 — 같은 금액, 다른 요율">
            <thead>
              <tr>
                <th scope="col">거래 유형</th>
                <th scope="col">상한요율</th>
                <th scope="col">중개보수</th>
                <th scope="col">부가세 포함</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">매매·교환</th>
                <td className="num">{pct(sale.tier.rate, 1)}</td>
                <td className="num">{won(sale.fee)}원</td>
                <td className="num">{won(sale.total)}원</td>
              </tr>
              <tr>
                <th scope="row">임대차(전세·월세 환산)</th>
                <td className="num">{pct(lease.tier.rate, 1)}</td>
                <td className="num">{won(lease.fee)}원</td>
                <td className="num">{won(lease.total)}원</td>
              </tr>
            </tbody>
          </AnswerTable>
          <AnswerNote>
            {sale.cappedByMax || lease.cappedByMax
              ? '이 금액대에는 한도액이 있어, 거래금액이 올라도 중개보수가 한동안 그대로입니다. 구간이 바뀌는 지점에서 금액이 한 번에 뜁니다.'
              : '거래금액이 구간 경계를 넘으면 요율이 바뀌어 보수가 한 번에 뜁니다.'}{' '}
            앞뒤 금액과 비교해 보면 그 지점이 보입니다.
          </AnswerNote>
        </AnswerSection>

        <AnswerNav
          base="/brokerage-fee"
          prev={prev} next={next}
          chips={popularPrice()} current={man}
          allHref="/calc/brokerage-fee"
          allLabel="중개수수료 계산기"
        />
      </AnswerPage>
    </>
  );
}
