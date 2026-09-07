import raw from '@/data/taxCalendar.json';

/**
 * 세금 달력 — "지금 뭘 해야 하나"에 답한다.
 *
 * 왜 만드나 (2026-08-23) — 자매 사이트 WhenStage와 GSC를 나란히 놓고 보니 격차의 원인이
 * 도메인 나이가 아니었다. 시작이 9일밖에 차이 안 나는데 노출이 8배 갈렸다.
 *
 *   WhenStage  1,137 URL 중 읽을거리 237장(news·blog·guide), 30일 중 22일 새 콘텐츠
 *   딱칼크       699 URL 중 읽을거리   0장,                    30일 중  8일
 *
 * 계산기는 한 번 만들면 끝나는 콘텐츠다. 값별 페이지를 아무리 늘려도 **같은 종류**가
 * 늘 뿐이라 이 격차를 못 메운다. 필요한 건 새로운 종류다.
 *
 * 세금에는 달력이 있다. 재산세 9월, 종소세 5월, 연말정산 2월… 매년 같은 시기에 검색이
 * 몰리는데 우리는 계산기만 있고 **"지금 이걸 해야 한다"고 말해 주는 페이지가 없었다.**
 *
 * ## 여기 없는 세목이 있는 이유
 *
 * 자동차세 정기분과 부가가치세 일반과세자 기한은 **넣지 않았다.** 조문이 표 형태라
 * 국가법령정보센터 원문에서 확인하지 못했다. 아는 값을 못 넣는 건 아쉽지만, 확인 못 한
 * 값을 그럴듯하게 적는 것보다 낫다 — 이 사이트가 지켜 온 규칙 그대로다.
 */
export interface TaxEvent {
  id: string;
  name: string;
  /** MM-DD */
  from: string;
  to: string;
  what: string;
  note: string;
  /** 근거 조문 — 화면에 그대로 노출하고 국가법령정보센터로 링크한다 */
  law: string;
  calc: string;
  calcLabel: string;
}

const data = raw as { verifiedAt: string; items: TaxEvent[] };

/** 달력 순서(1월 → 12월)로 정렬해 둔다 */
export const TAX_EVENTS: TaxEvent[] = data.items
  .slice()
  .sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : 0));

export const CALENDAR_VERIFIED_AT = data.verifiedAt;

/** "09-16" → 그 해의 Date. 연도를 넘겨 받아야 클라이언트·서버가 어긋나지 않는다. */
function dateOf(year: number, mmdd: string): Date {
  const [m, d] = mmdd.split('-').map(Number);
  return new Date(year, m - 1, d);
}

export interface EventStatus {
  event: TaxEvent;
  /** 납부·신고 기간 안에 있다 */
  ongoing: boolean;
  /** 시작까지 남은 날. 진행 중이면 0, 올해 이미 지났으면 내년까지의 날짜 */
  daysUntil: number;
  /** 끝까지 남은 날 (진행 중일 때만 의미 있다) */
  daysLeft: number;
}

/**
 * 오늘 기준으로 각 일정의 상태를 매긴다.
 *
 * `today`를 인자로 받는 이유 — 이 사이트는 정적 생성이라 서버에서 오늘을 계산하면
 * **빌드한 날에 굳어버린다.** 화면에서 "3주 남음"이라고 해 놓고 두 달 뒤에도 같은 말을
 * 하게 된다. 그래서 계산은 순수 함수로 두고, 호출부(클라이언트)가 진짜 오늘을 넘긴다.
 */
export function statusOf(events: TaxEvent[], today: Date): EventStatus[] {
  const y = today.getFullYear();
  const midnight = new Date(y, today.getMonth(), today.getDate());
  const DAY = 86_400_000;

  return events.map(event => {
    const start = dateOf(y, event.from);
    const end = dateOf(y, event.to);
    const ongoing = midnight >= start && midnight <= end;

    // 올해 기간이 이미 끝났으면 다음은 내년이다
    const nextStart = midnight > end ? dateOf(y + 1, event.from) : start;
    const daysUntil = ongoing ? 0 : Math.round((nextStart.getTime() - midnight.getTime()) / DAY);
    const daysLeft = ongoing ? Math.round((end.getTime() - midnight.getTime()) / DAY) : 0;

    return { event, ongoing, daysUntil, daysLeft };
  });
}

/**
 * 월별 페이지를 만들 달.
 *
 * **일정이 있는 달만 만든다.** 4·6·8·10·11월은 법정 기한이 없는데, "이번 달은 낼 세금이
 * 없습니다"만 적힌 페이지를 네 장 만들면 서로 내용이 거의 같아진다 — 검색 결과에는
 * 여러 개로 뜨는데 이용자에게는 같은 페이지인 것, 그게 도어웨이다.
 *
 * 연도를 URL에 넣지 않는 이유 — 세금 일정은 매년 같은 날에 돌아온다. `/calendar/9`는
 * 내년에도 그대로 쓰이지만 `/calendar/2026-09`는 매년 새 URL이 필요하고, 지난 URL은
 * 죽은 페이지로 남는다.
 */
export function monthsWithEvents(): number[] {
  return Array.from(new Set(TAX_EVENTS.map(e => Number(e.from.slice(0, 2)))))
    .sort((a, b) => a - b);
}

export function eventsInMonth(month: number): TaxEvent[] {
  return TAX_EVENTS.filter(e => Number(e.from.slice(0, 2)) === month);
}

export function parseMonth(param: string): number | null {
  const n = Number(param);
  return Number.isInteger(n) && monthsWithEvents().includes(n) ? n : null;
}

/** 일정이 있는 달 중 앞뒤. 없는 달은 건너뛴다 — 링크한 곳에 페이지가 있어야 한다. */
export function neighborMonths(month: number): { prev: number | null; next: number | null } {
  const all = monthsWithEvents();
  const i = all.indexOf(month);
  if (i < 0) return { prev: null, next: null };
  return {
    prev: i > 0 ? all[i - 1] : all[all.length - 1],
    next: i < all.length - 1 ? all[i + 1] : all[0],
  };
}

/** 임박한 순서로. 진행 중인 것이 먼저, 그다음 가까운 순. */
export function upcoming(events: TaxEvent[], today: Date, limit = 3): EventStatus[] {
  return statusOf(events, today)
    .sort((a, b) => {
      if (a.ongoing !== b.ongoing) return a.ongoing ? -1 : 1;
      return a.daysUntil - b.daysUntil;
    })
    .slice(0, limit);
}

/**
 * 격자 칸에 넣을 짧은 이름.
 *
 * 이름 뒤 괄호("재산세 (건축물)")는 칸에서 너무 길어 떼어내지만, **7월처럼 같은 세목이
 * 두 건 걸린 달**에서는 떼면 "재산세 / 재산세"가 된다. 그래서 떼어낸 결과가 겹치면
 * 그 달만 원래 이름을 그대로 쓴다 — 짧은 것보다 구분되는 것이 먼저다.
 */
export function shortNames(events: TaxEvent[]): string[] {
  const short = events.map(e => e.name.replace(/\s*\([^)]*\)/g, '').trim());
  return short.map((s, i) => (short.filter(x => x === s).length > 1 ? events[i].name : s));
}
