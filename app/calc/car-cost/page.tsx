import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { CarCostCalc } from '@/components/CarCostCalculator';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: '자동차 유지비 계산기',
  description:
    '기름값·자동차세·보험료·정비비·주차비를 한 번에 더해 월 유지비와 1km당 비용을 냅니다. 자동차세는 지방세법 조문대로 계산합니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/car-cost' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);

  return (
    <CalcPage
      category="금융·자동차"
      tone="c3"
      year={year}
      title={`${year}년 자동차 유지비 계산기`}
      lead={
        <>
          사람들은 기름값만 떠올리지만, 실제로 나가는 돈은 그 두 배쯤 됩니다.{' '}
          <strong>빠뜨리기 쉬운 항목까지 세워</strong> 월 유지비와 1km당 비용을 냅니다.
        </>
      }
      verifiedAt={r.verifiedAt}
      faqs={[
        {
          q: '자동차보험료는 왜 계산해 주지 않나요?',
          a: '보험료를 정하는 보험개발원 참조순보험요율과 보험사별 요율이 공개되지 않기 때문입니다. 여기에 차량모델등급(1~26등급), 할인할증등급(1~29등급), 가입경력요율, 특약 수십 종이 얽힙니다. 대조할 원문이 없는 값을 그럴듯하게 지어내는 대신 넣으실 수 있게 했습니다. 갱신 안내서에 적힌 금액을 그대로 넣으시면 됩니다.',
        },
        {
          q: '1km당 비용은 어디에 쓰나요?',
          a: '차를 굴릴지 대중교통이나 택시를 탈지 판단할 때 쓰는 숫자입니다. 예를 들어 1km당 400원이면 20km 거리는 차로 8천원, 택시는 2만원쯤이니 차가 낫습니다. 다만 이 숫자에는 보험료·자동차세 같은 고정비가 섞여 있어, 이미 차를 가지고 있다면 실제 추가 비용은 연료비에 가깝습니다.',
        },
        {
          q: '많이 탈수록 1km당 비용이 내려가는 게 맞나요?',
          a: '맞습니다. 보험료·자동차세·주차비는 얼마나 타든 똑같이 나가는 고정비라, 주행거리로 나누면 많이 탈수록 내려갑니다. 반대로 거의 안 타는 차는 1km당 비용이 아주 비싸집니다 — 그게 "차를 유지할 가치가 있나"를 판단하는 신호입니다.',
        },
        {
          q: '감가상각은 왜 빠져 있나요?',
          a: '차값이 떨어지는 것도 실질적인 비용이지만, 모델·연식·주행거리·사고이력에 따라 크게 달라 사이트가 추정하지 않습니다. 중고차 시세를 확인해 직접 더하셔야 정확한 총비용이 됩니다.',
        },
        {
          q: '연비는 뭘 넣어야 하나요?',
          a: '계기판에 표시되는 평균 연비를 넣으세요. 카탈로그의 공인연비는 실제보다 높게 나오는 경우가 많습니다. 시내 주행이 많으면 공인연비의 70~80% 수준으로 잡는 편이 현실적입니다.',
        },
      ]}
      basisItems={[
        `자동차세 배기량별 cc당 세액 · 차령 경감 — ${r.carTax.source}`,
        `지방교육세 자동차세의 30% — 지방세법 제151조 제1항 제2호`,
        '연료 단가·보험료·정비비·주차비는 사이트가 정하지 않고 입력받는다',
        '자동차보험료는 요율이 공개되지 않아 계산하지 않는다',
        '감가상각은 차량·이력마다 달라 계산에서 제외한다',
      ]}
    >
      <CarCostCalc year={year} />
    </CalcPage>
  );
}
