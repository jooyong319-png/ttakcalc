import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { HolidayPayCalc } from '@/components/LaborCalculators';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: `${latestYear()}년 주휴수당 계산기`,
  description: '시급과 주 근로시간으로 주휴수당을 계산합니다. 주 40시간 미만이면 비례 계산까지 근거와 함께 보여드립니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/holiday-pay' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);
  const h = r.holidayPay;
  return (
    <CalcPage
      category="급여·세금"
      tone="c1"
      year={year}
      title="주휴수당 계산기"
      lead={<>주 <strong>{h.weeklyHoursMin}시간 이상</strong> 일하면 유급휴일 수당이 발생합니다. 얼마인지 계산해 보세요.</>}
      verifiedAt={r.verifiedAt}
      faqs={[
        { q: '주휴수당은 누가 받나요?',
          a: `1주 소정근로시간이 ${h.weeklyHoursMin}시간 이상이고 그 주의 소정근로일을 개근하면 받습니다. 아르바이트·단시간 근로자도 조건을 채우면 동일하게 발생합니다.` },
        { q: '주 40시간 미만이면 얼마인가요?',
          a: `비례해서 지급합니다. (1주 소정근로시간 ÷ ${h.standardWeeklyHours}) × ${h.standardHolidayHours}시간 × 시급으로 계산합니다. 예를 들어 주 20시간이면 4시간분이 주휴수당입니다.` },
        { q: '월급제도 주휴수당을 따로 받나요?',
          a: '보통 월급에 이미 포함되어 있습니다. 최저임금 위반 여부를 볼 때는 월 소정근로시간에 주휴시간을 더한 209시간을 기준으로 시급을 환산합니다.' },
        { q: '결근하면 못 받나요?',
          a: '그 주에 결근이 있으면 주휴수당이 발생하지 않습니다. 지각·조퇴는 결근이 아니므로 개근으로 봅니다.' },
      ]}
      basisItems={[
        `주 ${h.weeklyHoursMin}시간 이상 근무 시 발생 — ${h.source}`,
        `주휴시간 = min(주 소정근로시간, ${h.standardWeeklyHours}) ÷ ${h.standardWeeklyHours} × ${h.standardHolidayHours}시간`,
        `${year}년 최저시급 ${r.minimumWage.hourly.toLocaleString()}원 — ${r.minimumWage.source}`,
        ...(r.minimumWage.next
          ? [`${r.minimumWage.next.year}년 최저시급 ${r.minimumWage.next.hourly.toLocaleString()}원으로 확정 — ${r.minimumWage.next.year}년 1월 1일부터 적용. 위 계산은 ${year}년 기준입니다`]
          : []),
      ]}
    >
      <HolidayPayCalc year={year} minimumWage={r.minimumWage.hourly} />
    </CalcPage>
  );
}
