// 고시환율 가져오기 — 서버 전용 I/O.
// 순수 계산(lib/exchange.ts)과 분리했다. 테스트는 계산만 컴파일하면 되고,
// 여기 있는 next 확장 fetch 타입은 Next.js 빌드에서만 필요하다.
import { toRate, type ExchangeRow, type ExchangeSnapshot } from './exchange';

/**
 * 고시환율을 가져온다. 키가 없거나 호출이 실패하면 **null을 돌려준다.**
 * 마지막으로 성공한 값을 캐시해 두었다가 슬쩍 보여주는 짓은 하지 않는다 —
 * 환율은 어제 값과 오늘 값이 다르고, 언제 값인지 모르는 환율은 틀린 환율이다.
 */
export async function fetchExchange(date?: string): Promise<ExchangeSnapshot | null> {
  const key = process.env.KOREAEXIM_API_KEY;
  if (!key) return null;

  const searchdate = date ?? new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const url = `https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON`
    + `?authkey=${encodeURIComponent(key)}&searchdate=${searchdate}&data=AP01`;

  try {
    // 고시가 하루 1회라 1시간마다 재검증하면 충분하다
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = (await res.json()) as ExchangeRow[];
    // 영업일이 아니거나 11시 이전이면 빈 배열이 온다 — 그때도 조용히 넘기지 않는다
    if (!Array.isArray(json) || json.length === 0) return null;

    const rates = json.filter(r => r.result === 1).map(toRate).filter(r => r.base > 0);
    if (rates.length === 0) return null;

    const d = searchdate;
    return { date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`, rates };
  } catch {
    return null;
  }
}
