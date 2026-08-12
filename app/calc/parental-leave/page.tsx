import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { ParentalLeaveCalc } from '@/components/TaxCalculators';
import { LeavePeriodCalc } from '@/components/LeavePeriodCalculator';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: `${latestYear()}년 육아휴직 급여·기간 계산기`,
  description:
    '육아휴직급여와 사용 기간을 함께 계산합니다. 자녀 생년월일을 넣으면 언제까지 쓸 수 있는지, 몇 개월 남았는지, 분할은 몇 번 가능한지 조문 근거와 함께 보여드립니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/parental-leave' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);
  const pl = r.parentalLeave;
  // 데이터가 없는 연도면 페이지를 만들지 않는다(현재는 최신 연도에 항상 있다)
  if (!pl) throw new Error(`육아휴직급여 데이터가 없는 연도입니다: ${year}`);

  return (
    <CalcPage
      category="급여·세금"
      tone="c1"
      year={year}
      title={`${year}년 육아휴직급여 계산기`}
      lead={
        <>
          월 통상임금으로 <strong>개월별 육아휴직급여</strong>를 계산합니다.
          2025년부터 상한이 250만원으로 오르고 <strong>사후지급금이 폐지</strong>됐습니다.
        </>
      }
      verifiedAt={r.verifiedAt}
      faqs={[
        { q: '얼마를 받나요?',
          a: '1~3개월은 통상임금 100%(상한 250만원), 4~6개월은 100%(상한 200만원), 7개월부터는 80%(상한 160만원)입니다. 모든 구간의 하한은 70만원입니다.' },
        { q: '사후지급금이 폐지됐다는 게 무슨 뜻인가요?',
          a: '예전에는 급여의 25%를 복직 후 6개월을 더 일해야 받을 수 있었습니다. 2025년부터는 그 제한이 없어져 육아휴직 중에 전액을 받습니다.' },
        { q: '통상임금이 뭔가요?',
          a: '정기적·일률적으로 소정근로에 대해 지급하기로 정한 금액입니다. 기본급과 고정수당이 포함되고, 성과급처럼 실적에 따라 달라지는 금액은 보통 제외됩니다. 육아휴직 시작일 기준으로 봅니다.' },
        { q: '부부가 같이 쓰면 더 받나요?',
          a: '같은 자녀에 대해 부모가 모두 육아휴직을 쓰면 첫 6개월에 대해 상한이 더 높아지는 특례가 있습니다(고용보험법 시행령 제95조의3). 이 계산기는 일반 육아휴직급여만 계산합니다.' },
        { q: '4대보험료도 내야 하나요?',
          a: '육아휴직 기간에는 건강보험료가 경감되고 국민연금은 납부예외를 신청할 수 있습니다. 이 계산기는 급여만 계산합니다.' },
      ]}
      basisItems={[
        ...pl.tiers.map(t =>
          `${t.label}: 통상임금의 ${t.rate * 100}%, 상한 ${t.max.toLocaleString()}원 / 하한 ${t.min.toLocaleString()}원`),
        `${pl.source} — ${pl.note}`,
      ]}
    >
      <ParentalLeaveCalc year={year} />

      <h2 style={{ marginTop: '2.4rem' }}>언제까지, 얼마나 쓸 수 있나</h2>
      <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: '38rem' }}>
        급여만큼 자주 묻는 게 <strong>기간</strong>입니다. 자녀 생년월일을 넣으면 신청 기한과
        남은 개월, 분할 가능 횟수를 계산합니다.
      </p>
      <LeavePeriodCalc year={year} />

    </CalcPage>
  );
}
