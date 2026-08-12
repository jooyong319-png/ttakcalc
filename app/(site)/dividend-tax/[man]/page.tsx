import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breakdown } from '@/components/Breakdown';
import {
  AnswerPage, AnswerSection, AnswerNote, Assumptions, AnswerTable, AnswerNav,
} from '@/components/AnswerPage';
import { getRates } from '@/lib/rates';
import { calcDividendTax } from '@/lib/calc/dividend';
import { won, manLabel, manToWon, pct } from '@/lib/format';
import { DIVIDEND, DEFAULT_YEAR } from '@/lib/salaryPages';

export function generateStaticParams() {
  return DIVIDEND.all().map(m => ({ man: String(m) }));
}
export const dynamicParams = false;

/** 이 페이지들의 고정 가정 — 파이어를 준비하는 사람의 전형적인 경우.
 *  화면에 그대로 밝힌다. 안 밝히면 그냥 틀린 숫자다. */
const ASSUME = {
  interest: 0,
  otherIncome: 0,
  deduction: 1_500_000,
};

const base = (man: number, domestic: boolean) =>
  calcDividendTax({ year: DEFAULT_YEAR, dividend: manToWon(man), domestic, ...ASSUME });

/** 근로소득이 있으면 같은 배당이라도 세금이 달라진다 — 이 표가 이 페이지의 존재 이유다 */
const JOBS = [0, 30_000_000, 50_000_000, 80_000_000, 120_000_000];

export function generateMetadata({ params }: { params: { man: string } }): Metadata {
  const man = DIVIDEND.parse(params.man);
  if (man === null) return {};
  const r = base(man, false);
  const label = manLabel(man);
  return {
    title: `배당 ${label} 세금 — ${won(r.totalTax)}원 (세후 ${won(r.netDividend)}원)`,
    description:
      `연간 배당 ${label}을 받으면 세금은 ${won(r.totalTax)}원, 세후 ${won(r.netDividend)}원입니다`
      + `(실효세율 ${pct(r.effectiveRate, 2)}). `
      + (r.comprehensive
        ? '금융소득 2천만원을 넘어 종합과세 대상이며, 비교과세로 어떻게 계산되는지 근거까지 보여드립니다.'
        : '2천만원 이하라 15.4%로 종결됩니다. 근로소득이 있을 때의 차이도 함께 비교합니다.'),
    alternates: { canonical: `https://ttakcalc.com/dividend-tax/${man}` },
  };
}

export default function DividendTaxPage({ params }: { params: { man: string } }) {
  const man = DIVIDEND.parse(params.man);
  if (man === null) notFound();

  const rates = getRates(DEFAULT_YEAR);
  const d = rates.dividend!;
  const label = manLabel(man);
  const amount = manToWon(man);
  const r = base(man, false);
  const home = base(man, true);
  const { prev, next } = DIVIDEND.neighbors(man);
  const threshold = d.comprehensiveThreshold;

  // 근로소득이 있을 때 같은 배당의 세금이 어떻게 달라지는가
  const byJob = JOBS.map(job => ({
    job,
    r: calcDividendTax({ year: DEFAULT_YEAR, dividend: amount, domestic: false, ...ASSUME, otherIncome: job }),
  }));

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `배당 ${label}을 받으면 세금이 얼마인가요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: r.comprehensive
            ? `다른 소득이 없다면 ${won(r.totalTax)}원입니다(실효세율 ${pct(r.effectiveRate, 2)}). `
              + `금융소득 2천만원을 넘어 종합과세 대상이지만, 종합과세 방식과 분리과세 방식 중 큰 쪽을 내므로 `
              + `(소득세법 제62조) 세금이 급증하지는 않습니다.`
            : `${won(r.totalTax)}원입니다. 2천만원 이하라 배당소득세 14%와 지방소득세 1.4%를 합한 `
              + `15.4%로 원천징수되고 납세의무가 끝납니다.`,
        },
      },
      {
        '@type': 'Question',
        name: `배당 ${label}이면 세후로 얼마가 남나요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${won(r.netDividend)}원입니다. 월로 나누면 약 ${won(Math.floor(r.netDividend / 12))}원입니다.`,
        },
      },
      {
        '@type': 'Question',
        name: `근로소득이 있으면 배당 ${label}의 세금이 달라지나요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: r.comprehensive
            ? `달라집니다. 다른 소득이 없으면 ${won(r.totalTax)}원이지만, 근로소득금액 5,000만원이 있으면 `
              + `${won(byJob[2].r.totalTax)}원이 됩니다. 2천만원 초과분이 근로소득 위에 얹혀 더 높은 세율 구간을 타기 때문입니다.`
            : `달라지지 않습니다. 금융소득이 2천만원 이하이면 다른 소득과 무관하게 15.4%로 분리과세됩니다.`,
        },
      },
    ],
  };

  return (
    <AnswerPage
      tone="c3"
      category="금융·자동차"
      categoryHref="/c/finance"
      meta={`${rates.label} 기준`}
      title={`배당 ${label} 세금은 ${won(r.totalTax)}원`}
      lead={
        <>
          다른 소득이 없을 때 세후 <strong>{won(r.netDividend)}원</strong>을 받습니다
          (실효세율 {pct(r.effectiveRate, 2)}).{' '}
          {r.comprehensive
            ? `금융소득 ${won(threshold)}원을 넘어 종합과세 대상입니다.`
            : `${won(threshold)}원 이하라 15.4%로 끝납니다.`}
        </>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      <Assumptions
        items={[
          `${rates.label} 기준`,
          '해외 주식·ETF 배당 (Gross-up 비대상)',
          '이자소득 없음',
          '다른 종합소득 없음',
          '종합소득공제 150만원(본인 기본공제)',
        ]}
      />

      <AnswerSection title="세금이 어떻게 나오는지">
        <Breakdown
          headlineLabel={r.comprehensive ? '총 세금 (종합과세)' : '총 세금 (분리과세로 종결)'}
          headlineValue={r.totalTax}
          headlineSub={`세후 ${won(r.netDividend)}원 · 월 약 ${won(Math.floor(r.netDividend / 12))}원`}
          rows={r.steps.map(st => ({ label: st.label, value: st.value, basis: st.basis, tone: st.tone }))}
          footer={<span>최종 확인 {r.verifiedAt} · 소득세법 제14조·제17조·제56조·제62조·제129조</span>}
        />
      </AnswerSection>

      <AnswerSection title="근로소득이 있으면 달라집니다">
        <p>
          같은 배당이라도 <strong>다른 소득이 있느냐</strong>에 따라 세금이 갈립니다. 2천만원
          초과분이 그 소득 위에 얹혀 더 높은 세율 구간을 타기 때문입니다. 직장을 다니며 배당을
          받는 경우와 배당만으로 사는 경우가 다른 이유입니다.
        </p>
        <AnswerTable label="근로소득이 있으면 달라집니다">
          <thead>
            <tr>
              <th scope="col">다른 종합소득금액</th>
              <th scope="col">총 세금</th>
              <th scope="col">세후 배당</th>
              <th scope="col">실효세율</th>
            </tr>
          </thead>
          <tbody>
            {byJob.map(({ job, r: rr }) => (
              <tr key={job}>
                <th scope="row">{job === 0 ? '없음 (배당만)' : `${won(job)}원`}</th>
                <td className="num">{won(rr.totalTax)}원</td>
                <td className="num">{won(rr.netDividend)}원</td>
                <td className="num">{pct(rr.effectiveRate, 2)}</td>
              </tr>
            ))}
          </tbody>
        </AnswerTable>
        <AnswerNote>
          여기서 "종합소득금액"은 세전 연봉이 아니라 <strong>근로소득공제를 뺀 뒤의 금액</strong>
          입니다. 연봉이 얼마일 때 근로소득금액이 얼마인지는{' '}
          <a href="/calc/salary">연봉 실수령액 계산기</a>에서 확인할 수 있습니다.
        </AnswerNote>
      </AnswerSection>

      <AnswerSection title="국내 주식이면 조금 다릅니다">
        <p>
          국내 상장법인 배당은 이미 법인세를 낸 이익에서 나오므로, 2천만원 초과분에 10%를 더했다가
          같은 금액을 세액공제로 빼 이중과세를 조정합니다(Gross-up). 해외 주식·ETF는 대상이
          아닙니다.
        </p>
        <AnswerTable label="국내 주식이면 조금 다릅니다">
          <thead>
            <tr>
              <th scope="col">배당 종류</th>
              <th scope="col">총 세금</th>
              <th scope="col">세후 배당</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">해외 주식·ETF</th>
              <td className="num">{won(r.totalTax)}원</td>
              <td className="num">{won(r.netDividend)}원</td>
            </tr>
            <tr>
              <th scope="row">국내 상장주식</th>
              <td className="num">{won(home.totalTax)}원</td>
              <td className="num">{won(home.netDividend)}원</td>
            </tr>
          </tbody>
        </AnswerTable>
        <AnswerNote>
          {home.totalTax === r.totalTax
            ? '이 금액대에서는 결과가 같습니다. 비교과세 때문에 분리과세 방식이 하한으로 작동해 배당세액공제가 실제로 적용되지 않기 때문입니다.'
            : `국내 주식이 ${won(r.totalTax - home.totalTax)}원 적습니다.`}{' '}
          다만 해외 배당은 현지에서 원천징수(미국은 15%)되고 종합과세 시 외국납부세액공제로
          정산되므로, 실제 부담은 이 표와 다를 수 있습니다. 나라·조세조약마다 달라 계산에
          넣지 않았습니다.
        </AnswerNote>
      </AnswerSection>

      <AnswerNav
        base="/dividend-tax"
        prev={prev}
        next={next}
        current={man}
        chips={DIVIDEND.all().filter(m => m % 2_000 === 0)}
        allHref="/calc/dividend-tax"
        allLabel="배당소득세 계산기로 직접 계산하기"
      />

      <AnswerNote>
        금융소득종합과세 대상이 되면 세금 외에 <strong>건강보험료</strong>에도 영향이 있습니다.
        지역가입자는 보험료 산정 소득에 잡히고, 피부양자 자격에도 영향을 줍니다. 세금만 보고
        판단하면 놓치는 부분입니다.
      </AnswerNote>
    </AnswerPage>
  );
}
