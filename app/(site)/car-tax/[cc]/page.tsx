import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breakdown } from '@/components/Breakdown';
import {
  AnswerPage, AnswerSection, AnswerNote, Assumptions, AnswerTable, AnswerNav,
} from '@/components/AnswerPage';
import { getRates } from '@/lib/rates';
import { calcCarTax } from '@/lib/calc/localTax';
import { won, pct } from '@/lib/format';
import {
  CC, popularCc, CAR_ASSUMPTION, CAR_AGE_ROWS, DEFAULT_YEAR, hasAgePage,
} from '@/lib/localTaxPages';
import s from './carTax.module.css';

export function generateStaticParams() {
  return CC.all().map(cc => ({ cc: String(cc) }));
}
export const dynamicParams = false;

const ccLabel = (cc: number) => `${cc.toLocaleString('ko-KR')}cc`;

export function generateMetadata({ params }: { params: { cc: string } }): Metadata {
  const cc = CC.parse(params.cc);
  if (cc === null) return {};
  const r = calcCarTax({ year: DEFAULT_YEAR, cc, ...CAR_ASSUMPTION });
  return {
    title: `${ccLabel(cc)} 자동차세 — 연 ${won(r.total)}원`,
    description:
      `${DEFAULT_YEAR}년 기준 ${ccLabel(cc)} 승용차의 연간 자동차세는 지방교육세를 포함해 ${won(r.total)}원입니다` +
      `(차령 3년 기준). 차령별 세액과 1월 연납 할인액까지 함께 보여드립니다.`,
    alternates: { canonical: `https://ttakcalc.com/car-tax/${cc}` },
  };
}

export default function CarTaxPage({ params }: { params: { cc: string } }) {
  const cc = CC.parse(params.cc);
  if (cc === null) notFound();

  const year = DEFAULT_YEAR;
  const rates = getRates(year);
  const r = calcCarTax({ year, cc, ...CAR_ASSUMPTION });
  const { prev, next } = CC.neighbors(cc);
  const byAge = CAR_AGE_ROWS.map(age => ({ age, r: calcCarTax({ year, cc, ageYears: age, business: false }) }));
  const jan = r.prepayments[0];

  const band = cc <= 1000 ? '1,000cc 이하 (cc당 80원)'
    : cc <= 1600 ? '1,600cc 이하 (cc당 140원)'
      : '1,600cc 초과 (cc당 200원)';

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `${ccLabel(cc)} 자동차세는 얼마인가요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            `${rates.label} 기준 차령 3년 승용차라면 자동차세 ${won(r.carTax)}원에 지방교육세 ` +
            `${won(r.localEduTax)}원을 더해 연 ${won(r.total)}원입니다. 6월과 12월에 ` +
            `${won(r.halfYear)}원씩 나눠 냅니다.`,
        },
      },
      {
        '@type': 'Question',
        name: `${ccLabel(cc)} 자동차세를 1월에 연납하면 얼마인가요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            `${won(jan.discount)}원이 공제돼 ${won(jan.payable)}원을 냅니다. ` +
            `연세액에 (납부기한 다음 날부터 12월 31일까지의 일수 ÷ 365) × 5%를 곱한 금액을 빼며, ` +
            `1월에 신청할 때 공제 대상 기간이 가장 길어 할인이 가장 큽니다.`,
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, '\\u003c') }} />

      <AnswerPage
        tone="c3"
        category="자동차세"
        categoryHref="/calc/car-tax"
        meta={`${rates.label} 기준`}
        title={`${ccLabel(cc)} 자동차세`}
        lead={
          <>
            비영업용 승용차 차령 3년 기준으로 지방교육세까지 합쳐 연 <strong>{won(r.total)}원</strong>입니다.
            이 배기량은 <strong>{band}</strong> 구간이고, 6월·12월에 {won(r.halfYear)}원씩 나눠 냅니다.
          </>
        }
      >
        <Breakdown
          headlineLabel="연간 자동차세 (지방교육세 포함)"
          headlineValue={r.total}
          headlineSub={`6월·12월에 ${won(r.halfYear)}원씩`}
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

        <AnswerSection title="계산 조건">
          <Assumptions items={[
            <>비영업용 승용차</>,
            <>차령 <strong>{CAR_ASSUMPTION.ageYears}년</strong></>,
            <>지자체 탄력세율 <strong>미적용</strong></>,
          ]} />
          <AnswerNote>
            지자체는 조례로 표준세율의 50%까지 올려 정할 수 있어 실제 고지서와 다를 수 있습니다.
            연중에 차를 사거나 팔면 보유 일수만큼 일할 계산됩니다.
          </AnswerNote>
        </AnswerSection>

        {/* 이 표가 페이지의 존재 이유 — 같은 차라도 해가 갈수록 세금이 줄어든다 */}
        <AnswerSection title="차령별 자동차세 — 오래 탈수록 줄어든다">
          <AnswerTable label="차령별 자동차세 — 오래 탈수록 줄어든다">
            <thead>
              <tr>
                <th scope="col">차령</th>
                <th scope="col">경감률</th>
                <th scope="col">연간 총액</th>
                <th scope="col">1월 연납 시</th>
              </tr>
            </thead>
            <tbody>
              {byAge.map(a => (
                <tr key={a.age} className={a.age === CAR_ASSUMPTION.ageYears ? s.current : undefined}>
                  <th scope="row">
                    {/* 연식별 페이지로 가는 유일한 크롤 경로다 — 사이트맵만으로는 잘 안 긁힌다 */}
                    {hasAgePage(cc, a.age)
                      ? <a href={`/car-tax/${cc}/${a.age}`}>{a.age}년</a>
                      : `${a.age}년`}
                    {a.age === CAR_ASSUMPTION.ageYears && <span className={s.badge}>기준</span>}
                  </th>
                  <td className="num">{a.r.ageDiscountRate > 0 ? pct(a.r.ageDiscountRate, 0) : '—'}</td>
                  <td className="num">{won(a.r.total)}원</td>
                  <td className="num">{won(a.r.prepayments[0].payable)}원</td>
                </tr>
              ))}
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
          <AnswerNote>
            공제액 = 연세액 × (납부기한 다음 날부터 12월 31일까지의 일수 ÷ 365) × 5%.
            일찍 신청할수록 공제 대상 기간이 길어 할인이 커집니다. 신청은 위택스에서 합니다.
          </AnswerNote>
        </AnswerSection>

        <AnswerSection title="배기량 구간">
          <AnswerNote>
            1,000cc와 1,600cc가 경계입니다. cc당 세액이 <strong>80원 → 140원 → 200원</strong>으로
            뛰기 때문에, 배기량이 조금만 넘어도 세금이 꽤 달라집니다.
            {prev !== null && <> <a href={`/car-tax/${prev}`}>{ccLabel(prev)}</a>와 비교해 보세요.</>}
          </AnswerNote>
        </AnswerSection>

        <AnswerNav
          base="/car-tax"
          prev={prev} next={next}
          chips={popularCc()} current={cc}
          format={ccLabel}
          allHref="/calc/car-tax"
          allLabel="자동차세 계산기"
          label="다른 배기량으로 보기"
        />
      </AnswerPage>
    </>
  );
}
