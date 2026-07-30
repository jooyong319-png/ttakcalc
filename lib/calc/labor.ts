// 급여·노동 계산 — 퇴직금 / 프리랜서 3.3% / 실업급여 / 주휴수당.
// 전부 순수 함수이고 요율은 lib/rates에서만 온다(하드코딩 금지).
import { getRates } from '../rates';

export interface Step { label: string; value: number | string; basis?: string; unit?: string }

const won = (n: number) => Math.floor(n / 10) * 10;
const day = 24 * 60 * 60 * 1000;

/** 두 날짜 사이 재직일수(입사일·퇴사일 당일 포함하지 않는 관행: 마지막 근무일 다음날이 퇴사일). */
function daysBetween(from: string, to: string): number {
  const a = new Date(from + 'T00:00:00Z').getTime();
  const b = new Date(to + 'T00:00:00Z').getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.round((b - a) / day));
}

// ─────────────────────────────────────────────────────────────
// 퇴직금 — 1일 평균임금 × 30일 × (재직일수 / 365)
// ─────────────────────────────────────────────────────────────
export interface SeveranceInput {
  year: string;
  joinDate: string;      // YYYY-MM-DD
  leaveDate: string;     // YYYY-MM-DD (마지막 근무일 다음날)
  monthlySalary: number; // 퇴직 전 3개월 월평균 임금(세전)
  annualBonus: number;   // 연간 상여금 총액
  annualLeavePay: number;// 연차수당(퇴직 전 1년치)
}

export interface SeveranceResult {
  eligible: boolean;
  reason?: string;
  serviceDays: number;
  serviceYears: number;
  avgDailyWage: number;
  severance: number;
  steps: Step[];
  verifiedAt: string;
}

export function calcSeverance(i: SeveranceInput): SeveranceResult {
  const r = getRates(i.year);
  const sev = r.severance;
  const serviceDays = daysBetween(i.joinDate, i.leaveDate);
  const serviceYears = serviceDays / 365;

  // 평균임금 산정 기간(3개월)의 총일수는 실제로는 달마다 다르지만(89~92일),
  // 입력이 "월평균"이므로 여기서는 3개월=91.25일(365/4)로 환산한다. 이 근사도 화면에 밝힌다.
  const periodDays = 365 / 4;
  const wage3m = i.monthlySalary * 3;
  const bonus3m = i.annualBonus * (3 / 12);
  const leave3m = i.annualLeavePay * (3 / 12);
  const total3m = wage3m + bonus3m + leave3m;
  const avgDailyWage = total3m / periodDays;

  const severance = won(avgDailyWage * sev.daysPerYear * serviceYears);
  const eligible = serviceDays >= 365;

  const steps: Step[] = [
    { label: '재직일수', value: `${serviceDays.toLocaleString()}일`,
      basis: `${i.joinDate} ~ ${i.leaveDate} (약 ${serviceYears.toFixed(2)}년)` },
    { label: '3개월 임금', value: wage3m, basis: `월 ${i.monthlySalary.toLocaleString()}원 × 3개월` },
    ...(i.annualBonus > 0 ? [{ label: '상여금 반영분', value: bonus3m,
      basis: `연 상여 ${i.annualBonus.toLocaleString()}원 × 3/12` }] : []),
    ...(i.annualLeavePay > 0 ? [{ label: '연차수당 반영분', value: leave3m,
      basis: `연차수당 ${i.annualLeavePay.toLocaleString()}원 × 3/12` }] : []),
    { label: '1일 평균임금', value: Math.round(avgDailyWage),
      basis: `${Math.round(total3m).toLocaleString()}원 ÷ ${periodDays.toFixed(2)}일(3개월)` },
    { label: '퇴직금', value: severance, tone: 'result',
      basis: `1일 평균임금 × ${sev.daysPerYear}일 × ${serviceYears.toFixed(2)}년` } as Step,
  ];

  return {
    eligible,
    reason: eligible ? undefined : '계속근로 1년 미만은 법정 퇴직금 지급 대상이 아닙니다.',
    serviceDays, serviceYears, avgDailyWage, severance, steps,
    verifiedAt: r.verifiedAt,
  };
}

// ─────────────────────────────────────────────────────────────
// 프리랜서 3.3% 원천징수
// ─────────────────────────────────────────────────────────────
export interface FreelancerResult {
  gross: number; incomeTax: number; localTax: number; totalTax: number; net: number;
  steps: Step[]; verifiedAt: string;
}

/** mode='gross': 계약금액에서 세금을 뺀 실수령 / mode='net': 원하는 실수령액에서 계약금액 역산 */
export function calcFreelancer(amount: number, year: string, mode: 'gross' | 'net' = 'gross'): FreelancerResult {
  const r = getRates(year);
  const f = r.freelancer;
  const rate = f.incomeTaxRate + f.localTaxRate;

  const gross = mode === 'gross' ? amount : Math.round(amount / (1 - rate));
  const incomeTax = won(gross * f.incomeTaxRate);
  const localTax = won(incomeTax * 0.1); // 지방소득세는 소득세의 10%
  const totalTax = incomeTax + localTax;
  const net = gross - totalTax;

  return {
    gross, incomeTax, localTax, totalTax, net,
    verifiedAt: r.verifiedAt,
    steps: [
      { label: '계약금액(세전)', value: gross,
        basis: mode === 'net' ? `실수령 ${amount.toLocaleString()}원 ÷ ${(1 - rate).toFixed(3)}` : '입력값' },
      { label: '소득세', value: incomeTax, basis: `${gross.toLocaleString()}원 × ${f.incomeTaxRate * 100}%` },
      { label: '지방소득세', value: localTax, basis: `소득세 ${incomeTax.toLocaleString()}원 × 10%` },
      { label: '원천징수 합계', value: totalTax, basis: `총 ${(rate * 100).toFixed(1)}%` },
      { label: '실수령액', value: net, basis: '계약금액 − 원천징수' },
    ],
  };
}

// ─────────────────────────────────────────────────────────────
// 실업급여(구직급여)
// ─────────────────────────────────────────────────────────────
export interface UnemploymentResult {
  dailyWage: number;      // 1일 평균임금
  dailyBenefit: number;   // 1일 구직급여
  cappedBy: 'max' | 'min' | null;
  /** 데이터상 하한 > 상한인 모순 상태(요율 갱신 누락). true면 화면에 경고를 띄운다. */
  boundsConflict: boolean;
  durationDays: number;
  total: number;
  monthlyApprox: number;
  steps: Step[];
  verifiedAt: string;
}

export function calcUnemployment(
  monthlySalary: number, year: string, insuredYears: number, age50OrOver: boolean,
): UnemploymentResult {
  const r = getRates(year);
  const u = r.unemployment;

  const dailyWage = (monthlySalary * 3) / (365 / 4);
  const raw = dailyWage * u.wageReplacementRate;
  const lower = r.minimumWage.hourly * u.lowerBoundRateOfMinimumWage * u.dailyWorkHours;

  // 최저임금이 오르면 하한도 오르는데 상한 데이터를 같이 갱신하지 않으면 하한 > 상한 역전이
  // 생긴다(실제 제도에선 발생하지 않는 상태 = 데이터 오류). 이때 상한을 적용하면 저소득자가
  // 하한보다 적게 받는 잘못된 결과가 나오므로, 하한 보장을 우선하고 모순 사실을 노출한다.
  const boundsConflict = lower > u.dailyMax;
  const effectiveMax = boundsConflict ? lower : u.dailyMax;

  let dailyBenefit = raw;
  let cappedBy: 'max' | 'min' | null = null;
  if (raw > effectiveMax) { dailyBenefit = effectiveMax; cappedBy = 'max'; }
  else if (raw < lower) { dailyBenefit = lower; cappedBy = 'min'; }
  dailyBenefit = won(dailyBenefit);

  const tier = u.durationDays.tiers.find(t => t.underYears === null || insuredYears < t.underYears)
    ?? u.durationDays.tiers[u.durationDays.tiers.length - 1];
  const durationDays = age50OrOver ? tier.from50 : tier.under50;
  const total = dailyBenefit * durationDays;

  return {
    dailyWage, dailyBenefit, cappedBy, boundsConflict, durationDays, total,
    monthlyApprox: dailyBenefit * 30,
    verifiedAt: r.verifiedAt,
    steps: [
      { label: '1일 평균임금', value: Math.round(dailyWage),
        basis: `월 ${monthlySalary.toLocaleString()}원 × 3개월 ÷ ${(365 / 4).toFixed(2)}일` },
      { label: '1일 구직급여', value: dailyBenefit,
        basis: cappedBy === 'max' ? `평균임금의 60%(${Math.round(raw).toLocaleString()}원)가 상한 ${Math.round(effectiveMax).toLocaleString()}원을 초과 → 상한 적용`
             : cappedBy === 'min' ? `평균임금의 60%(${Math.round(raw).toLocaleString()}원)가 하한 ${Math.round(lower).toLocaleString()}원 미만 → 하한 적용`
             : `1일 평균임금 × ${u.wageReplacementRate * 100}%` },
      { label: '소정급여일수', value: `${durationDays}일`,
        basis: `고용보험 가입 ${insuredYears}년 · ${age50OrOver ? '50세 이상/장애인' : '50세 미만'}` },
      { label: '총 예상 수령액', value: total, basis: `1일 ${dailyBenefit.toLocaleString()}원 × ${durationDays}일` },
    ],
  };
}

// ─────────────────────────────────────────────────────────────
// 주휴수당
// ─────────────────────────────────────────────────────────────
export interface HolidayPayResult {
  eligible: boolean;
  reason?: string;
  hourlyWage: number;
  holidayHours: number;
  weeklyHolidayPay: number;
  monthlyApprox: number;
  belowMinimum: boolean;
  steps: Step[];
  verifiedAt: string;
}

export function calcHolidayPay(hourlyWage: number, weeklyHours: number, year: string): HolidayPayResult {
  const r = getRates(year);
  const h = r.holidayPay;
  const eligible = weeklyHours >= h.weeklyHoursMin;

  // 주 40시간 미만이면 비례 지급: (소정근로시간 / 40) × 8시간
  const holidayHours = Math.min(weeklyHours, h.standardWeeklyHours) / h.standardWeeklyHours * h.standardHolidayHours;
  const weeklyHolidayPay = eligible ? won(holidayHours * hourlyWage) : 0;

  return {
    eligible,
    reason: eligible ? undefined : `주 소정근로시간이 ${h.weeklyHoursMin}시간 미만이면 주휴수당이 발생하지 않습니다.`,
    hourlyWage, holidayHours, weeklyHolidayPay,
    monthlyApprox: won(weeklyHolidayPay * (365 / 12 / 7)),
    belowMinimum: hourlyWage < r.minimumWage.hourly,
    verifiedAt: r.verifiedAt,
    steps: [
      { label: '주휴 시간', value: `${holidayHours.toFixed(1)}시간`,
        basis: weeklyHours >= h.standardWeeklyHours
          ? `주 ${h.standardWeeklyHours}시간 이상 → ${h.standardHolidayHours}시간`
          : `주 ${weeklyHours}시간 ÷ ${h.standardWeeklyHours} × ${h.standardHolidayHours}시간(비례)` },
      { label: '주휴수당(1주)', value: weeklyHolidayPay,
        basis: `${holidayHours.toFixed(1)}시간 × 시급 ${hourlyWage.toLocaleString()}원` },
      { label: '월 환산(약)', value: won(weeklyHolidayPay * (365 / 12 / 7)),
        basis: '1주 주휴수당 × 4.345주' },
    ],
  };
}
