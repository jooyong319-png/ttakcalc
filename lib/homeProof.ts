// 홈 상단의 "증거" 블록에 쓸 실제 계산 결과.
//
// 이 사이트의 차별점은 "근거를 보여준다"는 것인데, 그 말을 문장으로 적어 두면 아무 힘이 없다.
// 그래서 홈에서 **실제 계산 하나를 통째로 펼쳐 놓는다.** 다른 계산기가 주는 건 맨 위 숫자
// 하나뿐이고, 그 아래 명세와 근거 조문이 우리가 더 주는 것이다.
//
// 손으로 적지 않는다 — 요율이 바뀌면 이 블록도 같이 바뀌어야 하기 때문이다.
import { calcSalary } from './calc/salary';
import { getRates, latestYear } from './rates';
import { manToWon } from './format';

/** 예시로 쓸 연봉(만원). 실수령액 검색이 가장 많이 몰리는 구간이다. */
export const PROOF_MAN = 5_000;

export interface ProofRow {
  name: string;
  amount: number;
  /** 이 금액이 어떻게 나왔는지 — 요율과 조문. 이게 이 블록의 존재 이유다. */
  basis: string;
}

export interface HomeProof {
  year: string;
  label: string;
  man: number;
  href: string;
  monthlyGross: number;
  monthlyNet: number;
  totalDeduction: number;
  deductionRate: number;
  rows: ProofRow[];
  verifiedAt: string;
  /** 계산에 쓴 제도의 출처 — 조문·고시 번호까지 */
  sources: string[];
}

export function homeProof(): HomeProof {
  const year = latestYear();
  const rates = getRates(year);
  const r = calcSalary({
    annualSalary: manToWon(PROOF_MAN),
    year,
    monthlyNonTaxable: rates.nonTaxable.mealAllowanceMonthlyMax,
    dependents: 1,
    childrenUnder20: 0,
  });

  return {
    year,
    label: rates.label,
    man: PROOF_MAN,
    href: `/salary/${PROOF_MAN}`,
    monthlyGross: r.monthlyGross,
    monthlyNet: r.monthlyNet,
    totalDeduction: r.totalDeduction,
    deductionRate: r.deductionRate,
    rows: r.deductions.map(d => ({ name: d.name, amount: d.amount, basis: d.basis })),
    verifiedAt: r.verifiedAt,
    sources: [
      rates.insurance.nationalPension.source,
      rates.insurance.healthInsurance.source,
      rates.insurance.employmentInsurance.source,
      rates.incomeTax.source,
      rates.nonTaxable.source,
    ]
      // 같은 고시를 두 항목이 함께 쓰는 경우가 있어 중복을 접는다
      .filter((v, i, a) => a.indexOf(v) === i),
  };
}
