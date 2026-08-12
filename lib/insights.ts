import { getRates } from './rates';
import { manToWon } from './format';
import { salaryNeighbors, resultFor } from './salaryPages';

/**
 * **그 값에서만 할 수 있는 이야기**를 계산 결과에서 뽑아낸다.
 *
 * 왜 필요한가 — 값별 페이지를 늘릴 때 진짜 위험은 얇은 콘텐츠가 아니라 **도어웨이 페이지**다.
 * 검색 결과에는 여러 개로 뜨는데 이용자에게는 사실상 같은 페이지인 것. 걸리면 개별 페이지가
 * 아니라 사이트 전체가 평가절하되고, 세금처럼 잘못된 정보가 손해로 이어지는 영역에서는
 * 판정이 특히 가혹하다.
 *
 * 판정 기준은 단순하다 — "연봉 3,200만원의 실수령액은 X원입니다"만 있으면 숫자만 바뀐
 * 껍데기다. 반대로 **그 금액이기 때문에 벌어지는 일**이 적혀 있으면 그 페이지는 존재 이유가
 * 있다. 세율 구간을 넘는 지점, 국민연금 상한에 닿는 지점, 한 단계 올렸을 때 손에 남는 비율이
 * 꺾이는 지점은 전부 실제 계산에서 나오는 사실이라 지어내는 것이 하나도 없다.
 *
 * 그래서 이 파일의 규칙은 하나다: **계산으로 확인되지 않는 문장은 만들지 않는다.**
 * 할 말이 없는 값에는 빈 배열을 돌려주고, 그런 값은 애초에 페이지를 만들지 않는 게 맞다.
 */

export interface Insight {
  /** 화면에 그대로 나가는 문장 */
  text: string;
  /** 눈에 띄게 둘 것인지 — 그 값에서만 일어나는 사건이면 true */
  notable?: boolean;
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const won = (n: number) => Math.round(n).toLocaleString('ko-KR');
const eok = (n: number) => (n >= 100_000_000 ? `${n / 100_000_000}억` : `${won(n / 10_000)}만`);

/** 과세표준이 속한 구간과, 그 구간의 경계까지 남은 거리 */
function bracketOf(year: string, taxBase: number) {
  const brackets = getRates(year).incomeTax.brackets;
  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i];
    if (b.upTo === null || taxBase <= b.upTo) {
      return { index: i, rate: b.rate, upTo: b.upTo, prev: i > 0 ? brackets[i - 1] : null };
    }
  }
  return null;
}

/**
 * 연봉 값 하나에 대한 사실들.
 *
 * 앞뒤 구간과 비교해야 알 수 있는 것들이 많아 이웃 값을 함께 받는다.
 */
export function salaryInsights(man: number, year: string): Insight[] {
  const out: Insight[] = [];
  const r = resultFor(man, year);
  const rates = getRates(year);

  // 이웃은 **실제로 페이지가 있는 값**이어야 한다. 범위 최소값(2,000만원)에서 기계적으로
  // 한 단계 빼면 "연봉 1,900만원에서 2,000만원으로 올랐을 때"라고 말하게 되는데,
  // 그 연봉의 페이지는 존재하지 않는다. 없는 것을 근거로 삼지 않는다.
  //
  // 아래쪽 이웃이 없는 최소값에서는 위쪽과 비교한다. "여기서 한 단계 올리면 얼마가
  // 더 남는가"도 같은 종류의 정보라, 최소값만 할 말 없는 페이지가 되는 것보다 낫다.
  const { prev, next } = salaryNeighbors(man);
  const lower = prev ?? man;
  const upper = prev !== null ? man : next;
  const prevMan = prev ?? (next !== null ? man : null);

  // ── 국민연금 상한. 여기부터는 연봉이 올라도 연금 보험료가 그대로다.
  const np = rates.insurance.nationalPension;
  const monthlyTaxable = r.monthlyTaxable;
  const prevTaxable = prev !== null ? resultFor(prev, year).monthlyTaxable : 0;
  if (monthlyTaxable >= np.monthlyIncomeMax) {
    const justCrossed = prevTaxable < np.monthlyIncomeMax;
    out.push({
      text: justCrossed
        ? `이 연봉부터 국민연금 보험료가 더 이상 오르지 않습니다. 기준소득월액 상한이 ${won(np.monthlyIncomeMax)}원이라, 과세 대상 급여가 이 금액을 넘으면 보험료는 월 ${won(np.monthlyIncomeMax * np.employeeRate)}원에 고정됩니다.`
        : `국민연금 보험료는 월 ${won(np.monthlyIncomeMax * np.employeeRate)}원에 고정되어 있습니다. 기준소득월액 상한(${won(np.monthlyIncomeMax)}원)을 넘었기 때문에, 연봉이 더 올라도 이 항목은 늘지 않습니다.`,
      notable: justCrossed,
    });
  }

  // ── 소득세 과표 구간. 구간이 바뀌는 지점은 그 값에서만 할 수 있는 이야기다.
  const taxBase = annualTaxBase(man, year);
  const cur = bracketOf(year, taxBase);
  const prevBracket = prev !== null ? bracketOf(year, annualTaxBase(prev, year)) : null;
  if (cur) {
    const room = cur.upTo !== null ? cur.upTo - taxBase : null;
    if (prevBracket && prevBracket.index < cur.index) {
      out.push({
        text: `이 구간에서 소득세율이 ${pct(prevBracket.rate)}에서 ${pct(cur.rate)}로 올라갑니다. 과세표준이 ${eok(prevBracket.upTo ?? 0)}원을 넘어서면서 위 구간에 들어가기 때문인데, 올라간 세율은 넘어선 금액에만 붙습니다.`,
        notable: true,
      });
    } else if (room !== null && room > 0 && room <= 5_000_000) {
      // 다음 구간이 코앞이면 그게 더 중요한 정보다
      out.push({
        text: `과세표준이 ${won(taxBase)}원으로, 세율 ${pct(cur.rate)} 구간의 위쪽 경계(${eok(cur.upTo!)}원)까지 ${won(room)}원 남았습니다. 이 선을 넘는 금액에는 더 높은 세율이 붙습니다.`,
      });
    } else {
      // 특별한 사건이 없는 값에도 자기 자리를 말할 거리는 있다. 과세표준은 연봉마다
      // 다르므로, 이 한 줄만으로도 페이지가 서로 구별된다. 이게 없으면 이웃과 비교하는
      // 문장 하나뿐이라, 인접한 두 페이지가 똑같은 말을 하게 된다.
      out.push({
        text: `연봉에서 근로소득공제와 인적공제를 뺀 과세표준은 ${won(taxBase)}원으로, 소득세 기본세율 ${pct(cur.rate)} 구간에 해당합니다.`,
      });
    }
  }

  // ── 한 단계 올렸을 때 실제로 손에 남는 비율. 연봉 협상에서 궁금해하는 값이다.
  if (upper !== null && lower !== upper) {
    const lo = resultFor(lower, year);
    const hi = resultFor(upper, year);
    const grossGap = manToWon(upper) - manToWon(lower);
    const netGap = hi.annualNet - lo.annualNet;
    if (grossGap > 0 && netGap > 0) {
      out.push({
        text: `연봉 ${won(lower)}만원에서 ${won(upper)}만원으로 ${won(grossGap / 10_000)}만원 오르면, 실제로 손에 더 들어오는 돈은 연 ${won(netGap)}원입니다. 오른 금액의 ${pct(netGap / grossGap)}가 남는 셈입니다.`,
      });
    }
  }

  // ── 공제율 자체. 이웃과 비교해 얼마나 가팔라졌는지가 정보다.
  if (prevMan !== null && prev !== null) {
    const prevRate = resultFor(prev, year).deductionRate;
    const diff = r.deductionRate - prevRate;
    if (Math.abs(diff) >= 0.002) {
      out.push({
        text: `세전 대비 공제율은 ${pct(r.deductionRate)}로, 한 단계 아래 연봉(${pct(prevRate)})보다 ${(Math.abs(diff) * 100).toFixed(1)}%포인트 ${diff > 0 ? '높습니다' : '낮습니다'}. 연봉이 오를수록 높은 세율 구간이 적용되는 금액이 늘어나기 때문입니다.`,
      });
    }
  }

  return out;
}

/** 계산기가 이미 구한 과세표준을 그대로 쓴다. 여기서 다시 계산하면 두 곳이 어긋난다. */
function annualTaxBase(man: number, year: string): number {
  return Math.max(0, resultFor(man, year).annualTaxBase);
}

/**
 * 자동차세 차령 경감.
 *
 * 지방세법 제127조 ② — 3년째부터 매년 5%씩 줄어 12년째에 50%에서 멈춘다.
 * **같은 배기량이라도 연식마다 세액이 다르다**는 것이 연식별 페이지가 성립하는 근거다.
 */
export function carAgeInsights(cc: number, age: number, year: string): Insight[] {
  const out: Insight[] = [];
  const capped = Math.min(Math.max(age, 0), 12);

  if (capped < 3) {
    out.push({
      text: `차령 ${age}년은 아직 경감 대상이 아닙니다. 자동차세 경감은 등록 후 3년째부터 시작해 매년 5%씩 커집니다.`,
      notable: age === 2,
    });
  } else if (capped >= 12) {
    out.push({
      text: `차령 12년을 넘으면 경감이 50%에서 멈춥니다. 더 오래 타도 자동차세는 이보다 내려가지 않습니다.`,
      notable: age === 12,
    });
  } else {
    const rate = (capped - 2) * 5;
    out.push({
      text: `차령 ${age}년이면 ${rate}% 경감이 적용됩니다. 3년째부터 매년 5%씩 커져 12년째에 50%로 멈춥니다.`,
      notable: capped === 3,
    });
  }

  void cc;
  void year;
  return out;
}
