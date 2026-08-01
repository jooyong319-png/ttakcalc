// 환율 — 한국수출입은행 고시환율.
//
// "실시간 환율"은 만들지 않는다. 초 단위 시장환율은 네이버·증권사가 이미 잘 하고 있고,
// 우리가 근거로 댈 게 없다. 대신 **한국수출입은행이 영업일 11시에 고시하는 환율**을 쓴다.
// 이건 공식 고시라 이 사이트의 원칙("공식 고시를 근거로 쓴다")과 정확히 맞고,
// 하루 1회 갱신이라 정적 재생성(ISR)으로 충분하다.
//
// 우리가 답하는 질문도 "달러 환율 얼마"가 아니라 **"1,000달러 환전하면 실제로 얼마 드나"**다.
// 매매기준율에 환전 스프레드와 우대율을 얹은 금액은 검색해도 잘 안 나온다.

/** 수출입은행 API 응답 한 줄 */
export interface ExchangeRow {
  /** 통화 코드 (예: USD, JPY(100), EUR) */
  cur_unit: string;
  /** 국가/통화명 */
  cur_nm: string;
  /** 전신환(송금) 받으실 때 */
  ttb: string;
  /** 전신환(송금) 보내실 때 */
  tts: string;
  /** 매매기준율 */
  deal_bas_r: string;
  result: number;
}

export interface Rate {
  code: string;
  name: string;
  /** JPY는 100엔 단위로 고시된다 — 1단위 금액으로 환산할 때 쓴다 */
  unit: number;
  base: number;
  ttb: number;
  tts: number;
}

/** "1,234.56" → 1234.56 */
const num = (s: string) => Number(String(s).replace(/,/g, '')) || 0;

/** "JPY(100)" → { code: 'JPY', unit: 100 } */
export function parseCurUnit(curUnit: string): { code: string; unit: number } {
  const m = curUnit.match(/^([A-Z]+)\((\d+)\)$/);
  if (m) return { code: m[1], unit: Number(m[2]) };
  return { code: curUnit.trim(), unit: 1 };
}

export function toRate(row: ExchangeRow): Rate {
  const { code, unit } = parseCurUnit(row.cur_unit);
  return {
    code, unit,
    name: row.cur_nm,
    base: num(row.deal_bas_r),
    ttb: num(row.ttb),
    tts: num(row.tts),
  };
}

export interface ExchangeSnapshot {
  /** 고시 기준일 (YYYY-MM-DD) */
  date: string;
  /** 오늘 고시가 아니라 과거 영업일 고시인지 — 화면에 그 사실을 밝힌다 */
  stale: boolean;
  rates: Rate[];
}

// ─────────────────────────────────────────────────────────────
// 환전 비용 계산
// ─────────────────────────────────────────────────────────────
export interface ExchangeCalcInput {
  /** 외화 금액 (예: 1000 달러) */
  amount: number;
  rate: Rate;
  /** 'buy' = 외화를 산다(원화를 낸다) / 'sell' = 외화를 판다(원화를 받는다) */
  direction: 'buy' | 'sell';
  /** 현찰 환전 스프레드(%). 은행마다 다르고 고시가 아니라 입력받는다. USD는 보통 1.75% 안팎. */
  spreadPercent: number;
  /** 환전 우대율(%). 스프레드에서 이만큼을 깎아준다. */
  preferentialPercent: number;
}

export interface ExchangeCalcResult {
  base: number;
  /** 우대 적용 후 실제 적용 환율 */
  appliedRate: number;
  /** 매매기준율 대비 얹힌/깎인 금액(1단위당) */
  spreadPerUnit: number;
  /** 총 원화 금액 */
  krw: number;
  /** 매매기준율로 환전했다면 냈을 금액 */
  krwAtBase: number;
  /** 스프레드로 인한 손실(원). buy면 더 내는 돈, sell이면 덜 받는 돈 */
  cost: number;
  steps: { label: string; value: number | string; basis?: string; tone?: 'minus' | 'total' | 'result' | 'info' }[];
}

export function calcExchange(i: ExchangeCalcInput): ExchangeCalcResult {
  const amount = Math.max(0, i.amount);
  const base = i.rate.base;
  const unit = i.rate.unit || 1;

  // 우대율은 스프레드를 깎는다 — 90% 우대면 스프레드의 10%만 부담
  const spread = Math.max(0, i.spreadPercent) / 100;
  const pref = Math.min(100, Math.max(0, i.preferentialPercent)) / 100;
  const effectiveSpread = spread * (1 - pref);

  const appliedRate = i.direction === 'buy'
    ? base * (1 + effectiveSpread)
    : base * (1 - effectiveSpread);

  const perUnit = (r: number) => (r * amount) / unit;
  const krw = Math.round(perUnit(appliedRate));
  const krwAtBase = Math.round(perUnit(base));
  const cost = Math.abs(krw - krwAtBase);

  const dirLabel = i.direction === 'buy' ? '살 때' : '팔 때';
  const unitNote = unit === 1 ? '' : ` (${unit}단위 고시)`;

  return {
    base, appliedRate,
    spreadPerUnit: Math.abs(appliedRate - base),
    krw, krwAtBase, cost,
    steps: [
      { label: `매매기준율`, value: `${base.toLocaleString('ko-KR')}원`,
        basis: `${i.rate.code} 1${unit === 1 ? '' : `×${unit}`}당${unitNote} · 수출입은행 고시` },
      { label: '환전 스프레드', value: `${i.spreadPercent}%`, basis: `${dirLabel} 기준. 은행별로 다르다` },
      { label: '환전 우대', value: `${i.preferentialPercent}%`,
        basis: pref > 0 ? `스프레드의 ${(pref * 100).toFixed(0)}%를 깎아준다` : '우대 없음' },
      { label: '적용 환율', value: `${appliedRate.toFixed(2)}원`,
        basis: `매매기준율 ${i.direction === 'buy' ? '+' : '−'} ${(effectiveSpread * 100).toFixed(3)}%` },
      { label: '매매기준율로 계산하면', value: krwAtBase, basis: '스프레드가 없다고 가정', tone: 'info' },
      { label: i.direction === 'buy' ? '더 내는 돈' : '덜 받는 돈', value: cost,
        basis: '스프레드 때문에 생기는 차이', tone: 'minus' },
      { label: i.direction === 'buy' ? '내야 할 원화' : '받는 원화', value: krw, tone: 'result' },
    ],
  };
}
