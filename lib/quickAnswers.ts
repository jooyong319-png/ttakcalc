// 홈에 실제 답을 박아 넣는다.
//
// "연봉 3,000만원이면 실수령 얼마?"의 답이 홈에 **숫자로** 있어야 한다.
// 계산기 목록만 늘어놓으면 사용자는 한 번 더 눌러야 답을 보고, 검색엔진은 이 페이지가
// 무엇에 답하는지 알 수 없다. 답은 전부 빌드 시각에 실제 계산 함수로 구한다 — 손으로 적으면
// 요율이 바뀔 때 조용히 거짓말이 된다.
import { calcSalary } from './calc/salary';
import { calcReverseSalary } from './calc/compare';
import { calcAcquisitionTax } from './calc/property';
import { calcCarTax, calcPropertyTax } from './calc/localTax';
import { getRates, latestYear } from './rates';
import { won, manLabel, manToWon } from './format';
import type { Tone } from './catalog';

export interface QuickAnswer {
  question: string;
  answer: string;
  /** 답 아래 한 줄 — 조건이나 근거 */
  note: string;
  href: string;
  tone: Tone;
}

export function quickAnswers(): QuickAnswer[] {
  const year = latestYear();
  const rates = getRates(year);
  const nonTaxable = rates.nonTaxable.mealAllowanceMonthlyMax;

  const salaryAt = (man: number) =>
    calcSalary({
      annualSalary: manToWon(man), year,
      dependents: 1, childrenUnder20: 0, monthlyNonTaxable: nonTaxable,
    });

  const out: QuickAnswer[] = [];

  for (const man of [3000, 4000, 5000]) {
    const r = salaryAt(man);
    out.push({
      question: `연봉 ${manLabel(man)}이면 실수령 얼마?`,
      answer: `월 ${won(r.monthlyNet)}원`,
      note: `공제 ${won(r.totalDeduction)}원 (${(r.deductionRate * 100).toFixed(1)}%)`,
      href: `/salary/${man}`,
      tone: 'c1',
    });
  }

  const rev = calcReverseSalary({
    year, targetNet: 3_000_000, dependents: 1, childrenUnder20: 0, monthlyNonTaxable: nonTaxable,
  });
  out.push({
    question: '월 300만원 받으려면 연봉 얼마?',
    answer: `${won(rev.annualSalary)}원`,
    note: `월 급여 ${won(rev.actual.monthlyGross)}원`,
    href: '/net-salary/300',
    tone: 'c1',
  });

  const acq = calcAcquisitionTax({
    year, price: 500_000_000, areaSqm: 84, houseCount: 1, regulated: false,
  });
  out.push({
    question: '5억 주택 취득세는?',
    answer: `${won(acq.total)}원`,
    note: '1주택 · 전용 85㎡ 이하',
    href: '/acquisition-tax/50000',
    tone: 'c2',
  });

  const prop = calcPropertyTax({
    year, publicPrice: 400_000_000, oneHouse: true, urbanArea: true,
  });
  out.push({
    question: '공시가격 4억 재산세는?',
    answer: `연 ${won(prop.total)}원`,
    note: `1세대 1주택 · 7·9월에 ${won(prop.half)}원씩`,
    href: '/property-tax/40000',
    tone: 'c2',
  });

  const car = calcCarTax({ year, cc: 2000, ageYears: 3, business: false });
  out.push({
    question: '2,000cc 자동차세는?',
    answer: `연 ${won(car.total)}원`,
    note: `차령 3년 · 1월 연납 시 ${won(car.prepayments[0].payable)}원`,
    href: '/car-tax/2000',
    tone: 'c3',
  });

  return out;
}
