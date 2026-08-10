// 육아휴직 **기간** — 언제까지, 얼마나, 몇 번에 나눠 쓸 수 있는가.
//
// 급여 계산기는 이미 있었는데 기간을 안 다뤘다. GSC 검색어에 "육아휴직 기간 계산기"가
// 반복해서 잡히는데(2026-08-10) 들어와도 원하는 답이 없었다.
//
// 조문(시행 2025. 10. 1. 기준으로 원문 대조):
//   제19조 ①    대상 — 만 8세 이하 **또는** 초등학교 2학년 이하
//   제19조 ②    기본 1년. 각 호에 해당하면 6개월 추가(최대 1년 6개월)
//                1. 같은 자녀로 부모가 모두 각각 3개월 이상 사용한 경우
//                2. 한부모  3. 장애아동의 부모
//   제19조 ④    육아휴직 기간은 근속기간에 포함된다
//   제19조의4 ①  분할은 3회까지(총 4번에 나눠 사용). 임신 중 사용분은 횟수에서 뺀다
//
// ## "만 8세 이하 또는 초등학교 2학년 이하"를 어떻게 계산하나
//
// **둘 중 늦은 쪽까지**다. 조문이 "또는"이기 때문이다.
//   만 8세 이하 종료 = 만 9세 생일 전날
//   초등학교 2학년 종료 = (출생연도 + 9)년 2월 말일
//     한국은 만 6세가 된 해의 **다음 해** 3월에 입학한다.
//     2018년생 → 2024년에 만 6세 → 2025년 3월 입학 → 2027년 2월 2학년 종료.
//
// 생일이 3~12월이면 만 8세 기준이 늦고, 1~2월생이면 학년 기준이 늦는 경우가 생긴다.
// 그래서 둘 다 구해 늦은 쪽을 쓴다.
import { getRates } from '../rates';
import type { Step } from './labor';

const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');
const ymd = (d: Date) =>
  `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;

export interface LeavePeriodInput {
  year: string;
  /** 자녀 생년월일 (YYYY-MM-DD) */
  birth: string;
  /** 오늘 날짜 (YYYY-MM-DD). 빌드 시각에 굳지 않도록 넘겨받는다 */
  today: string;
  /** 이미 사용한 육아휴직 개월 수 */
  usedMonths: number;
  /** 이미 나눠 쓴 횟수(첫 사용은 0회로 센다) */
  usedSplits: number;
  /** 부모가 모두 각각 3개월 이상 사용했거나, 한부모·장애아동의 부모인가 */
  eligibleForExtra: boolean;
}

export interface LeavePeriodResult {
  /** 아직 신청할 수 있는가 */
  eligible: boolean;
  /** 만 8세 이하 기준 종료일 */
  byAge: Date;
  /** 초등학교 2학년 이하 기준 종료일 */
  bySchool: Date;
  /** 실제 기한 — 둘 중 늦은 쪽 */
  deadline: Date;
  /** 기한까지 남은 개월(내림) */
  monthsLeft: number;
  /** 쓸 수 있는 총 개월 */
  maxMonths: number;
  /** 남은 개월 — 총 한도와 기한 중 작은 쪽 */
  remainMonths: number;
  splitsLeft: number;
  steps: Step[];
  verifiedAt: string;
}

/** 두 날짜 사이 개월 수(내림). 일 단위는 버린다 — 신청은 개월 단위로 한다. */
function monthsBetween(from: Date, to: Date): number {
  let m = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) m -= 1;
  return m;
}

export function calcLeavePeriod(i: LeavePeriodInput): LeavePeriodResult {
  const rates = getRates(i.year);
  const p = rates.parentalLeave?.period;
  if (!p) throw new Error(`${i.year}년 육아휴직 기간 데이터가 없습니다`);

  const birth = new Date(i.birth);
  const today = new Date(i.today);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(today.getTime())) {
    throw new Error('날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)');
  }

  const steps: Step[] = [];
  const push = (label: string, value: number | string, basis: string, tone?: Step['tone']) =>
    steps.push({ label, value, basis, tone });

  // ── 기한 ① 만 8세 이하 = 만 9세 생일 전날 ──────────────────
  const byAge = new Date(birth);
  byAge.setFullYear(birth.getFullYear() + p.childAgeLimit + 1);
  byAge.setDate(byAge.getDate() - 1);

  // ── 기한 ② 초등학교 2학년 종료 = (출생연도 + 9)년 2월 말일 ──
  // 만 6세가 된 해의 다음 해 3월 입학 → 1학년 그해 3월~다음 2월, 2학년은 그 다음 해 2월까지
  const gradeEndYear = birth.getFullYear() + 6 + p.schoolGradeLimit + 1;
  const bySchool = new Date(gradeEndYear, 2, 0); // 3월 0일 = 2월 말일

  const deadline = byAge > bySchool ? byAge : bySchool;
  push(
    '만 8세 이하 기준',
    ymd(byAge),
    `만 ${p.childAgeLimit}세 이하이므로 만 ${p.childAgeLimit + 1}세 생일 전날까지 (제19조 ①)`,
    'info',
  );
  push(
    '초등학교 2학년 기준',
    ymd(bySchool),
    `만 6세가 된 해의 다음 해 3월 입학 → ${gradeEndYear}년 2월 학년 종료 (제19조 ①)`,
    'info',
  );
  push(
    '실제 기한',
    ymd(deadline),
    `조문이 "또는"이라 둘 중 늦은 쪽까지다 — ${byAge > bySchool ? '만 8세' : '학년'} 기준이 늦다`,
  );

  const monthsLeft = Math.max(0, monthsBetween(today, deadline));
  const eligible = deadline >= today;

  if (!eligible) {
    push(
      '신청 가능 여부',
      '기한 지남',
      `${ymd(deadline)}이 지나 육아휴직을 새로 신청할 수 없다`,
      'info',
    );
    return {
      eligible: false, byAge, bySchool, deadline, monthsLeft: 0,
      maxMonths: 0, remainMonths: 0, splitsLeft: 0, steps, verifiedAt: p.verifiedAt,
    };
  }

  // ── 총 한도 ────────────────────────────────────────────────
  const maxMonths = p.baseMonths + (i.eligibleForExtra ? p.extraMonths : 0);
  push(
    '쓸 수 있는 총 기간',
    `${maxMonths}개월`,
    i.eligibleForExtra
      ? `기본 ${p.baseMonths}개월 + 추가 ${p.extraMonths}개월 — 부모가 각각 ${p.extraConditionMonths}개월 이상 사용했거나 한부모·장애아동의 부모 (제19조 ②)`
      : `기본 ${p.baseMonths}개월. 부모가 모두 각각 ${p.extraConditionMonths}개월 이상 쓰면 ${p.extraMonths}개월이 더 열린다 (제19조 ② 1호)`,
  );

  const used = Math.max(0, i.usedMonths);
  if (used > 0) push('이미 사용', `${used}개월`, '남은 기간에서 뺀다', 'minus');

  const remainByQuota = Math.max(0, maxMonths - used);
  const remainMonths = Math.min(remainByQuota, monthsLeft);
  push(
    '기한까지 남은 기간',
    `${monthsLeft}개월`,
    `오늘부터 ${ymd(deadline)}까지`,
    'info',
  );
  push(
    '실제로 쓸 수 있는 기간',
    `${remainMonths}개월`,
    remainByQuota <= monthsLeft
      ? `한도 ${maxMonths}개월 중 ${remainByQuota}개월이 남았다`
      : `한도는 ${remainByQuota}개월 남았지만 기한이 ${monthsLeft}개월밖에 안 남았다 — 기한이 먼저 닫힌다`,
    'total',
  );

  const splitsLeft = Math.max(0, p.splitLimit - Math.max(0, i.usedSplits));
  push(
    '남은 분할 횟수',
    `${splitsLeft}회`,
    `분할은 ${p.splitLimit}회까지 — 총 ${p.splitLimit + 1}번에 나눠 쓸 수 있다.`
      + ' 임신 중 모성보호로 쓴 육아휴직은 이 횟수에 넣지 않는다 (제19조의4 ①)',
    'result',
  );

  return {
    eligible: true, byAge, bySchool, deadline,
    monthsLeft, maxMonths, remainMonths, splitsLeft,
    steps, verifiedAt: p.verifiedAt,
  };
}
