// 고시환율 가져오기 — 서버 전용 I/O.
// 순수 계산(lib/exchange.ts)과 분리했다. 테스트는 계산만 컴파일하면 되고,
// 여기 있는 next 확장 fetch 타입은 Next.js 빌드에서만 필요하다.
import { toRate, type ExchangeRow, type ExchangeSnapshot } from './exchange';

/** 실패 원인 — 화면에는 안 내보내지만 서버 로그에는 반드시 남긴다.
 *  "키 없음"과 "영업일 아님"과 "호출 실패"가 화면에서 똑같이 보이면 배포 후 원인을 못 찾는다. */
type FailReason =
  | 'no-key'          // KOREAEXIM_API_KEY 미설정 (Vercel은 저장 후 재배포해야 반영된다)
  | 'http-error'      // 응답 코드 이상
  | 'empty'           // 비영업일이거나 11시 고시 전
  | 'rate-limited'    // 일일 1,000회 초과 (result: 4)
  | 'bad-payload'     // 형식이 예상과 다름
  | 'network';        // 타임아웃·DNS 등

function fail(reason: FailReason, detail?: string): null {
  // Vercel Functions 로그에서 바로 보인다
  console.warn(`[exchange] 고시환율을 못 가져왔다: ${reason}${detail ? ` — ${detail}` : ''}`);
  return null;
}

/** YYYYMMDD 문자열에서 n일 뺀 날짜 */
function minusDays(yyyymmdd: string, n: number): string {
  const y = Number(yyyymmdd.slice(0, 4));
  const m = Number(yyyymmdd.slice(4, 6));
  const d = Number(yyyymmdd.slice(6, 8));
  const dt = new Date(Date.UTC(y, m - 1, d - n));
  return dt.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * 고시환율을 가져온다. 오늘 고시가 없으면 **가장 최근 영업일까지 거슬러 올라간다.**
 *
 * 고시는 영업일 11시 전후 1회뿐이라, 오늘 것만 보면 주말·공휴일·오전에는 계산기가 통째로 죽는다.
 * 그렇다고 "언제 값인지 모르는 환율"을 보여주는 건 안 되므로, **어느 날 고시인지를 함께 돌려주고**
 * 화면에 그 날짜를 표시한다. 지난 값을 오늘 값인 척하지만 않으면 된다.
 *
 * 연휴를 감안해 최대 7일까지만 거슬러 올라간다. 그보다 오래된 환율은 참고 가치가 없다.
 */
export async function fetchExchange(date?: string): Promise<ExchangeSnapshot | null> {
  const start = date ?? new Date().toISOString().slice(0, 10).replace(/-/g, '');
  for (let back = 0; back <= 7; back++) {
    const snapshot = await fetchOneDay(minusDays(start, back));
    if (snapshot) return { ...snapshot, stale: back > 0 };
  }
  console.warn('[exchange] 최근 7일 안에 고시가 없다 — 키·네트워크를 확인할 것');
  return null;
}

/** 특정 날짜 하루치만 조회한다. 없으면 null. */
async function fetchOneDay(date: string): Promise<ExchangeSnapshot | null> {
  const key = process.env.KOREAEXIM_API_KEY;
  if (!key) return fail('no-key', 'Vercel은 환경변수를 저장한 뒤 재배포해야 반영된다');

  const searchdate = date;
  const url = 'https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON'
    + `?authkey=${encodeURIComponent(key)}&searchdate=${searchdate}&data=AP01`;

  try {
    // 고시가 하루 1회라 1시간마다 재검증하면 충분하다
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return fail('http-error', `HTTP ${res.status}`);

    const json = (await res.json()) as ExchangeRow[];
    if (!Array.isArray(json)) return fail('bad-payload', '배열이 아님');
    // 비영업일·고시 전에는 빈 배열이 온다
    if (json.length === 0) return fail('empty', `${searchdate} (비영업일이거나 11시 고시 전)`);
    // 일일 호출 한도를 넘기면 result: 4가 온다
    if (json.some(r => r.result === 4)) return fail('rate-limited', '일일 1,000회 초과');

    const rates = json.filter(r => r.result === 1).map(toRate).filter(r => r.base > 0);
    if (rates.length === 0) {
      const codes = json.map(r => r.result).filter((v, i, a) => a.indexOf(v) === i);
      return fail('bad-payload', `result 코드: ${codes.join(',')}`);
    }

    const d = searchdate;
    return { date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`, stale: false, rates };
  } catch (e) {
    return fail('network', e instanceof Error ? e.message : String(e));
  }
}
