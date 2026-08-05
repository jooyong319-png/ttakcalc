import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { PensionCalc } from '@/components/PensionCalculator';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: '국민연금 예상 수령액 계산기',
  description:
    '가입기간과 평균 소득을 넣으면 노령연금 월 예상 수령액을 계산합니다. 조기수령·연기수령을 나란히 비교하고, 산식의 근거 조문까지 보여드립니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/pension' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);
  const p = r.pension!;
  const won = (n: number) => n.toLocaleString('ko-KR');

  return (
    <CalcPage
      category="금융·자동차"
      tone="c3"
      year={year}
      title={`${year}년 국민연금 예상 수령액 계산기`}
      lead={
        <>
          가입기간과 평균 소득만 넣으면 월 예상 수령액이 나옵니다.{' '}
          <strong>언제부터 받는 게 나은지</strong>도 나란히 비교합니다.
        </>
      }
      verifiedAt={p.verifiedAt}
      faqs={[
        {
          q: '기본연금액은 어떻게 계산되나요?',
          a: `1.29 × (A값 + B값) × (1 + 0.05n)입니다(국민연금법 제51조 ①). A값은 전체 가입자의 평균소득월액 평균으로 ${year}년 기준 ${won(p.aValue)}원이고, B값은 본인의 가입기간 평균 소득입니다. n은 20년을 초과한 가입연수로, 20년을 넘으면 1년마다 5%씩 더 붙습니다. 계수 1.29는 2025년 연금개혁으로 소득대체율이 43%로 오르며 개정된 값입니다.`,
        },
        {
          q: 'A값이 왜 들어가나요? 내가 낸 것만 반영되는 게 아닌가요?',
          a: '국민연금은 절반이 소득재분배 구조이기 때문입니다. A값(전체 평균)과 B값(본인 소득)을 더해서 계산하므로, 소득이 적을수록 낸 것에 비해 많이 받고 소득이 많을수록 적게 받습니다. 그래서 소득이 높을수록 소득대체율은 낮아집니다.',
        },
        {
          q: '10년을 못 채우면 어떻게 되나요?',
          a: '노령연금을 받을 수 없고, 그동안 낸 보험료에 이자를 더한 반환일시금을 받습니다. 다만 임의가입이나 추납으로 10년을 채우면 평생 연금으로 받을 수 있어 대부분 채우는 편이 유리합니다.',
        },
        {
          q: '조기수령하면 얼마나 손해인가요?',
          a: '1년 일찍 받을 때마다 6%씩 깎이고 5년이면 30% 감액됩니다(제63조 ②). 중요한 건 그 감액이 평생 유지된다는 점입니다. 반대로 연기하면 1개월당 0.6%씩, 5년이면 36%가 더 붙습니다(제62조 ②). 위 비교표에서 나란히 보실 수 있습니다.',
        },
        {
          q: '이 계산기 결과와 공단 조회 금액이 다른데요?',
          a: '실제 B값은 과거 소득을 연도별 재평가율로 현재가치 환산해 평균낸 값인데, 이 계산기는 넣으신 금액을 그대로 씁니다. 과거 소득이 지금보다 낮았다면 실제 B값은 이보다 낮습니다. 정확한 금액은 국민연금공단 "내 연금 알아보기"에서 실제 가입 이력으로 확인하세요.',
        },
        {
          q: '부양가족연금은 뭔가요?',
          a: `배우자·자녀·부모를 부양하면 정액으로 더 받습니다. ${year}년 기준 배우자 연 ${won(p.dependentSpouseAnnual)}원, 자녀·부모는 1명당 연 ${won(p.dependentChildAnnual)}원입니다. 조기·연기 조정을 받지 않고 그대로 더해집니다.`,
        },
      ]}
      basisItems={[
        '기본연금액 = 1.29 × (A값 + B값), 20년 초과 1년당 5% 가산 — 국민연금법 제51조 ①',
        `A값 ${won(p.aValue)}원(${year}년 기준) — 국민연금공단 공시`,
        '가입 10~20년은 기본연금액의 50% + 초과 1년당 5% — 제63조 ①',
        '조기수령 1년당 6% 감액(최대 5년 30%) — 제63조 ②',
        '연기수령 1개월당 0.6% 가산(최대 5년 36%) — 제62조 ②',
        `부양가족연금 배우자 연 ${won(p.dependentSpouseAnnual)}원 — 보건복지부고시 제2026-12호`,
        '재평가율·물가조정·크레딧·소득활동 감액은 계산하지 않는다',
      ]}
    >
      <PensionCalc year={year} />
    </CalcPage>
  );
}
