// 자동차 유지비.
//
// ## 왜 "보험료 계산기"가 아니라 이건가
//
// 자동차보험료는 이 사이트에서 계산할 수 없다. 보험개발원 참조순보험요율도, 보험사별 요율도
// 공개되지 않는다. 차량모델등급·할인할증등급·가입경력요율·특약이 얽히는데 대조할 원문이
// 아예 없어서, 만들면 숫자를 지어내는 수밖에 없고 틀려도 영영 모른다.
//
// 대신 **보험료를 입력받는다.** 그러면 우리가 지어내는 값 없이 "차 유지하는 데 얼마 드나"라는
// 진짜 질문에 답할 수 있다. 사용자는 자기 보험료를 안다(갱신 안내서에 적혀 있다).
//
// ## 우리가 실제로 계산해 주는 것
//
// 자동차세 하나뿐이다(지방세법 제127조·제128조·제151조 — 이미 검증된 계산기를 그대로 쓴다).
// 나머지는 넣은 값을 더한다. 그래서 이 계산기의 값어치는 산수가 아니라 **빠뜨리기 쉬운 항목을
// 빠짐없이 세워 주는 것**이다. 사람들은 기름값만 떠올리고 자동차세·정비비·주차비를 잊는다.
import { calcCarTax } from './localTax';
import type { Step } from './labor';

const won = (n: number) => Math.floor(n / 10) * 10;
const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');

export interface CarCostInput {
  year: string;
  /** 자동차세 계산용 — 이 두 개만 우리가 계산한다 */
  cc: number;
  ageYears: number;
  /** 연간 주행거리(km) */
  km: number;
  /** 연비(km/L) */
  fuelEfficiency: number;
  /** 연료 단가(원/L). 시세라 우리가 정하지 않는다 */
  fuelPrice: number;
  /** 연간 보험료(원). 갱신 안내서에 적힌 금액 */
  insurance: number;
  /** 연간 정비·소모품비(원) */
  maintenance: number;
  /** 월 주차비(원) */
  parkingMonthly: number;
  /** 월 통행료·기타(원) */
  tollMonthly: number;
}

export interface CostItem {
  key: string;
  name: string;
  annual: number;
  /** 이 금액이 어떻게 나왔는지 */
  basis: string;
  /** 우리가 계산한 값인가, 사용자가 넣은 값인가 — 화면에서 구분해 표시한다 */
  computed: boolean;
}

export interface CarCostResult {
  items: CostItem[];
  annualTotal: number;
  monthlyTotal: number;
  /** 1km당 비용 — 차를 굴릴지 말지 판단할 때 쓰는 숫자 */
  perKm: number;
  /** 연료비가 전체에서 차지하는 비율(0~1) */
  fuelShare: number;
  carTaxTotal: number;
  steps: Step[];
  verifiedAt: string;
}

export function calcCarCost(i: CarCostInput): CarCostResult {
  const km = Math.max(0, i.km);
  const eff = Math.max(0.1, i.fuelEfficiency);
  const liters = km / eff;
  const fuel = won(liters * Math.max(0, i.fuelPrice));

  // 자동차세만 우리가 계산한다. 영업용은 이 계산기의 대상이 아니라 비영업용 고정.
  const tax = calcCarTax({ year: i.year, cc: i.cc, ageYears: i.ageYears, business: false });

  const items: CostItem[] = [
    {
      key: 'fuel',
      name: '연료비',
      annual: fuel,
      basis: `${fmt(km)}km ÷ ${eff}km/L = ${fmt(Math.round(liters))}L × ${fmt(i.fuelPrice)}원`,
      computed: false,
    },
    {
      key: 'tax',
      name: '자동차세',
      annual: tax.total,
      basis:
        `${fmt(i.cc)}cc × ${tax.perCc}원` +
        (tax.ageDiscount > 0 ? ` − 차령 ${i.ageYears}년 경감 ${fmt(tax.ageDiscount)}원` : '') +
        ` + 지방교육세 ${fmt(tax.localEduTax)}원`,
      computed: true,
    },
    {
      key: 'insurance',
      name: '자동차보험료',
      annual: Math.max(0, i.insurance),
      basis: '넣으신 금액 — 보험료는 보험사·등급·특약에 따라 달라 계산하지 않습니다',
      computed: false,
    },
    {
      key: 'maintenance',
      name: '정비·소모품',
      annual: Math.max(0, i.maintenance),
      basis: '엔진오일·타이어·브레이크·정기점검 등 1년치',
      computed: false,
    },
    {
      key: 'parking',
      name: '주차비',
      annual: Math.max(0, i.parkingMonthly) * 12,
      basis: `월 ${fmt(i.parkingMonthly)}원 × 12개월`,
      computed: false,
    },
    {
      key: 'toll',
      name: '통행료·기타',
      annual: Math.max(0, i.tollMonthly) * 12,
      basis: `월 ${fmt(i.tollMonthly)}원 × 12개월`,
      computed: false,
    },
  ];

  const annualTotal = items.reduce((sum, x) => sum + x.annual, 0);
  const monthlyTotal = won(annualTotal / 12);
  const perKm = km > 0 ? Math.round(annualTotal / km) : 0;

  const steps: Step[] = items
    .filter(x => x.annual > 0)
    .map(x => ({
      label: x.name,
      value: x.annual,
      basis: x.basis,
      tone: 'minus' as const,
    }));

  steps.push({ label: '연간 합계', value: annualTotal, basis: '위 항목의 합', tone: 'total' });
  steps.push({
    label: '월 평균',
    value: monthlyTotal,
    basis: `연 ${fmt(annualTotal)}원 ÷ 12개월`,
    tone: 'total',
  });
  if (km > 0) {
    steps.push({
      label: '1km당 비용',
      value: `${fmt(perKm)}원`,
      basis: `연 ${fmt(annualTotal)}원 ÷ ${fmt(km)}km — 택시·대중교통과 견줄 때 쓰는 숫자`,
      tone: 'result',
    });
  }

  return {
    items,
    annualTotal,
    monthlyTotal,
    perKm,
    fuelShare: annualTotal > 0 ? fuel / annualTotal : 0,
    carTaxTotal: tax.total,
    steps,
    verifiedAt: tax.verifiedAt,
  };
}
