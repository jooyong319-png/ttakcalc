// 연장·야간·휴일 가산수당.
//
// 사람들이 제일 많이 틀리는 건 산수가 아니라 **가산이 겹친다는 것**이다.
// 야간에 하는 연장근로는 연장 50% + 야간 50%를 각각 더해 통상임금의 2.0배가 된다.
// "야간이니까 1.5배" 또는 "연장이니까 1.5배" 하나만 세면 절반을 놓친다.
//
// 조문(시행 2025. 10. 23. 기준으로 원문 대조, 2026-08-06):
//   제56조 ①  연장근로 — 통상임금의 100분의 50 가산
//   제56조 ②  휴일근로 — 8시간 이내 100분의 50, 8시간 초과 100분의 100
//   제56조 ③  야간근로(22시~06시) — 100분의 50 가산
//   제11조 ①  상시 5명 이상 사업장에 적용 → 4명 이하는 가산수당 의무가 없다
//
// 계산하지 않는 것: 통상임금의 범위(어떤 수당이 통상임금에 들어가는지는 판례 영역이라
// 시급을 직접 받는다), 포괄임금제, 보상휴가제(제57조).
import { getRates } from '../rates';
import type { Step } from './labor';

const won = (n: number) => Math.floor(n / 10) * 10;
const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');
const hr = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export interface OvertimeInput {
  year: string;
  /** 통상임금 시급(원) */
  hourlyWage: number;
  /** 평일 연장근로 시간 */
  overtimeHours: number;
  /** 그중 야간(22~06시)에 한 시간 */
  overtimeNightHours: number;
  /** 휴일근로 시간 */
  holidayHours: number;
  /** 그중 야간에 한 시간 */
  holidayNightHours: number;
  /** 상시 근로자 수 — 5명 미만이면 가산 의무가 없다 */
  employees: number;
}

export interface PayLine {
  key: string;
  name: string;
  hours: number;
  /** 통상임금의 몇 배로 지급되는가 */
  multiplier: number;
  amount: number;
  basis: string;
}

export interface OvertimeResult {
  /** 가산수당이 적용되는 사업장인가 */
  applies: boolean;
  lines: PayLine[];
  /** 가산이 없을 때(시급 × 시간)의 금액 */
  plainTotal: number;
  total: number;
  /** 가산 덕분에 더 받는 금액 */
  extra: number;
  totalHours: number;
  steps: Step[];
  verifiedAt: string;
}

export function calcOvertimePay(i: OvertimeInput): OvertimeResult {
  const rates = getRates(i.year);
  const o = rates.overtime;
  if (!o) throw new Error(`${i.year}년 가산수당 데이터가 없습니다`);

  const wage = Math.max(0, i.hourlyWage);
  const ot = Math.max(0, i.overtimeHours);
  const otN = Math.min(Math.max(0, i.overtimeNightHours), ot);
  const hol = Math.max(0, i.holidayHours);
  const holN = Math.min(Math.max(0, i.holidayNightHours), hol);
  const applies = i.employees >= o.minEmployees;

  const steps: Step[] = [];
  const push = (label: string, value: number | string, basis: string, tone?: Step['tone']) =>
    steps.push({ label, value, basis, tone });

  // 휴일근로는 8시간을 경계로 가산율이 갈린다(제56조 ②)
  const holWithin = Math.min(hol, o.holidayBaseHours);
  const holOver = Math.max(0, hol - o.holidayBaseHours);
  // 야간 시간은 8시간 초과분에 먼저 배분한다 — 초과분이 가산율이 높아 근로자에게 유리하고,
  // 실제로도 늦게까지 이어진 근로가 야간에 걸린다.
  const holOverNight = Math.min(holN, holOver);
  const holWithinNight = holN - holOverNight;

  const B = applies ? 1 : 0;   // 가산 적용 여부
  const lines: PayLine[] = [
    {
      key: 'ot-day', name: '연장근로 (주간)', hours: ot - otN,
      multiplier: 1 + B * o.overtimeRate,
      amount: 0,
      basis: `통상임금 + 연장 ${o.overtimeRate * 100}% (제56조 ①)`,
    },
    {
      key: 'ot-night', name: '연장근로 (야간)', hours: otN,
      multiplier: 1 + B * (o.overtimeRate + o.nightRate),
      amount: 0,
      basis: `통상임금 + 연장 ${o.overtimeRate * 100}% + 야간 ${o.nightRate * 100}% — 가산은 겹친다 (제56조 ①③)`,
    },
    {
      key: 'hol-in', name: `휴일근로 (${o.holidayBaseHours}시간 이내)`, hours: holWithin - holWithinNight,
      multiplier: 1 + B * o.holidayWithin8Rate,
      amount: 0,
      basis: `통상임금 + 휴일 ${o.holidayWithin8Rate * 100}% (제56조 ②1)`,
    },
    {
      key: 'hol-in-night', name: `휴일근로 (${o.holidayBaseHours}시간 이내·야간)`, hours: holWithinNight,
      multiplier: 1 + B * (o.holidayWithin8Rate + o.nightRate),
      amount: 0,
      basis: `통상임금 + 휴일 ${o.holidayWithin8Rate * 100}% + 야간 ${o.nightRate * 100}% (제56조 ②1③)`,
    },
    {
      key: 'hol-over', name: `휴일근로 (${o.holidayBaseHours}시간 초과)`, hours: holOver - holOverNight,
      multiplier: 1 + B * o.holidayOver8Rate,
      amount: 0,
      basis: `통상임금 + 휴일 초과 ${o.holidayOver8Rate * 100}% (제56조 ②2)`,
    },
    {
      key: 'hol-over-night', name: `휴일근로 (${o.holidayBaseHours}시간 초과·야간)`, hours: holOverNight,
      multiplier: 1 + B * (o.holidayOver8Rate + o.nightRate),
      amount: 0,
      basis: `통상임금 + 휴일 초과 ${o.holidayOver8Rate * 100}% + 야간 ${o.nightRate * 100}% — 가장 높은 배율 (제56조 ②2③)`,
    },
  ]
    .filter(l => l.hours > 0)
    .map(l => ({ ...l, amount: won(wage * l.hours * l.multiplier) }));

  if (!applies) {
    push(
      '가산수당 적용 여부',
      '적용 안 됨',
      `상시 근로자 ${i.employees}명 — 근로기준법 제56조는 상시 ${o.minEmployees}명 이상 사업장에만 적용된다(제11조 ①). 일한 시간만큼 통상임금은 받는다`,
      'info',
    );
  }

  for (const l of lines) {
    push(
      l.name,
      l.amount,
      `${fmt(wage)}원 × ${hr(l.hours)}시간 × ${l.multiplier.toFixed(1)}배 — ${l.basis}`,
    );
  }

  const totalHours = ot + hol;
  const plainTotal = won(wage * totalHours);
  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  const extra = total - plainTotal;

  push('합계', total, `${hr(totalHours)}시간분`, 'total');
  if (applies && extra > 0) {
    push(
      '가산 덕분에 더 받는 금액',
      extra,
      `가산이 없다면 ${fmt(plainTotal)}원 — 차액이 가산수당이다`,
      'result',
    );
  }

  return { applies, lines, plainTotal, total, extra, totalHours, steps, verifiedAt: o.verifiedAt };
}
