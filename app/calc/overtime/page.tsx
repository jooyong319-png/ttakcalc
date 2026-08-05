import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { OvertimeCalc } from '@/components/OvertimeCalculator';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: '연장·야간·휴일수당 계산기',
  description:
    '연장·야간·휴일근로 가산수당을 계산합니다. 가산은 겹칩니다 — 야간에 하는 연장근로는 2.0배, 휴일 8시간 초과분을 야간에 하면 2.5배입니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/overtime' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);
  const o = r.overtime!;

  return (
    <CalcPage
      category="급여·세금"
      tone="c1"
      year={year}
      title={`${year}년 연장·야간·휴일수당 계산기`}
      lead={
        <>
          여기서 제일 많이 틀리는 건 산수가 아니라 <strong>가산이 겹친다</strong>는 사실입니다.
          야간에 하는 연장근로는 1.5배가 아니라 <strong>2.0배</strong>입니다.
        </>
      }
      verifiedAt={o.verifiedAt}
      faqs={[
        {
          q: '야간에 연장근로를 하면 몇 배인가요?',
          a: '2.0배입니다. 연장근로 가산 50%와 야간근로 가산 50%를 각각 더하기 때문입니다(근로기준법 제56조 ①③). 둘 중 하나만 세서 1.5배로 계산하면 절반을 놓칩니다.',
        },
        {
          q: '휴일근로는 몇 배인가요?',
          a: '8시간까지는 1.5배, 8시간을 넘는 시간은 2.0배입니다(제56조 ②). 여기에 야간(밤 10시~새벽 6시)이 겹치면 각각 50%가 더 붙어, 8시간 이내 야간은 2.0배, 8시간 초과 야간은 2.5배가 됩니다.',
        },
        {
          q: '야간근로는 몇 시부터인가요?',
          a: `밤 ${o.nightFromHour}시부터 다음 날 새벽 ${o.nightToHour}시까지입니다(제56조 ③). 이 시간대에 일하면 연장인지 휴일인지와 무관하게 통상임금의 50%가 추가로 붙습니다.`,
        },
        {
          q: '5인 미만 사업장도 받을 수 있나요?',
          a: `받을 수 없습니다. 근로기준법은 상시 ${o.minEmployees}명 이상 사업장에 적용되고(제11조 ①), 가산수당 조항인 제56조는 4명 이하 사업장에 적용되는 규정에서 빠져 있습니다. 다만 일한 시간만큼의 통상임금과 최저임금은 그대로 받아야 합니다.`,
        },
        {
          q: '통상임금 시급은 어떻게 구하나요?',
          a: '월 통상임금을 209시간으로 나눕니다(주 40시간 + 유급주휴 8시간 기준). 다만 어떤 수당이 통상임금에 들어가는지는 판례가 계속 쌓이는 영역이라 이 사이트가 정하지 않고 직접 넣도록 했습니다. 정기·일률·고정성이 인정되는 수당은 대체로 포함됩니다.',
        },
        {
          q: '포괄임금제라 이미 수당이 포함돼 있다는데요?',
          a: '포괄임금 계약이라도 실제 근로시간으로 계산한 법정수당이 계약상 고정수당을 넘으면 그 차액을 더 받아야 합니다. 위에서 계산한 금액과 급여명세서의 고정 연장수당을 비교해 보세요.',
        },
      ]}
      basisItems={[
        `연장근로 통상임금의 ${o.overtimeRate * 100}% 가산 — 근로기준법 제56조 ①`,
        `휴일근로 ${o.holidayBaseHours}시간 이내 ${o.holidayWithin8Rate * 100}%, 초과 ${o.holidayOver8Rate * 100}% 가산 — 제56조 ②`,
        `야간근로(${o.nightFromHour}시~${o.nightToHour}시) ${o.nightRate * 100}% 가산 — 제56조 ③`,
        '가산은 서로 겹친다 — 야간 연장 2.0배, 휴일 8시간 초과·야간 2.5배',
        `상시 ${o.minEmployees}명 이상 사업장에만 적용 — 제11조 ①`,
        '통상임금의 범위는 판례 영역이라 시급을 직접 입력받는다',
      ]}
    >
      <OvertimeCalc year={year} />
    </CalcPage>
  );
}
