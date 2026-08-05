// 상속세.
//
// 증여세는 "누구에게 받았나"로 공제가 갈리지만, 상속세는 **공제 조합을 어떻게 짜느냐**로
// 세금이 수억 갈린다. 그게 이 계산의 비선형 지점이다.
//
//   ① 기초공제 2억 + 인적공제 합계   vs   일괄공제 5억   →  큰 쪽을 택한다 (제21조 ①)
//      다만 배우자가 단독 상속받으면 일괄공제를 못 쓴다 (제21조 ②)
//   ② 배우자공제는 실제 상속받은 금액이 한도지만, 5억 미만이어도 5억은 준다 (제19조 ④)
//      상한은 min(법정상속분 한도, 30억)
//
// 조문(전부 시행 2025. 10. 1. 기준으로 원문 대조, 2026-08-03):
//   제18조   기초공제 2억원
//   제19조   배우자 상속공제 — ①한도 min(법정상속분, 30억), ④최소 5억
//   제20조   자녀 1명 5천만원 / 미성년자 1천만원×19세까지 연수 / 65세 이상 5천만원
//   제21조   일괄공제 5억원, ②배우자 단독상속 시 적용 배제
//   제22조   금융재산 상속공제 — 순금융재산 20%(2천만원 하한, 2억 한도)
//   제26조   세율(증여세와 동일)
//   제69조   신고세액공제 3%
//   민법 제1009조 ②  배우자 법정상속분 = 직계비속의 1.5배
//
// 계산하지 않는 것: 사전증여재산 합산(10년), 장애인공제(기대여명 필요), 동거주택 상속공제,
// 가업·영농상속공제, 세대생략 할증. 전부 화면에 명시한다.
import { getRates } from '../rates';
import type { Step } from './labor';

const won = (n: number) => Math.floor(n / 10) * 10;
const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');

export interface InheritanceInput {
  year: string;
  /** 상속재산 총액(원) */
  estate: number;
  /** 채무·공과금·장례비 합계 — 과세가액에서 뺀다 */
  debt: number;
  /** 배우자가 있는가 */
  hasSpouse: boolean;
  /** 배우자가 실제 상속받는 금액. null이면 법정상속분대로 받는다고 본다 */
  spouseTakes: number | null;
  /** 자녀 수 */
  children: number;
  /** 미성년 자녀가 성년까지 남은 연수의 합계(예: 12세·15세 → 7 + 4 = 11) */
  minorYears: number;
  /** 65세 이상 동거가족 수 */
  elderly: number;
  /** 순금융재산(금융재산 − 금융채무) */
  netFinancial: number;
}

export interface InheritanceResult {
  taxableEstate: number;
  /** 기초공제 + 인적공제 합계 */
  personalTotal: number;
  /** 실제 적용된 공제(일괄공제와 비교해 큰 쪽) */
  appliedBaseDeduction: number;
  usedLumpSum: boolean;
  spouseDeduction: number;
  financialDeduction: number;
  totalDeduction: number;
  taxBase: number;
  calculatedTax: number;
  filingCredit: number;
  finalTax: number;
  /** 상속재산 대비 실효세율 */
  effectiveRate: number;
  steps: Step[];
  verifiedAt: string;
}

/** 과세표준 → 산출세액. 누진공제 방식(제26조, 증여세와 같은 표) */
function progressive(base: number, brackets: { upTo: number | null; rate: number; deduction: number }[]) {
  if (base <= 0) return 0;
  for (const b of brackets) {
    if (b.upTo === null || base <= b.upTo) return Math.max(0, base * b.rate - b.deduction);
  }
  return 0;
}

export function calcInheritanceTax(i: InheritanceInput): InheritanceResult {
  const rates = getRates(i.year);
  const h = rates.inheritanceTax;
  if (!h) throw new Error(`${i.year}년 상속세 데이터가 없습니다`);
  const g = rates.giftTax;

  const estate = Math.max(0, i.estate);
  const debt = Math.max(0, i.debt);
  const children = Math.max(0, Math.floor(i.children));
  const taxableEstate = Math.max(0, estate - debt);

  const steps: Step[] = [];
  const push = (label: string, value: number | string, basis: string, tone?: Step['tone']) =>
    steps.push({ label, value, basis, tone });

  push('상속재산', estate, '상속개시일 현재 재산 총액');
  if (debt > 0) push('채무·장례비', debt, '피상속인의 채무·공과금·장례비를 뺀다', 'minus');
  push('상속세 과세가액', taxableEstate, `${fmt(estate)}원 − ${fmt(debt)}원`);

  // ── 공제 ① 기초+인적  vs  일괄 ─────────────────────────────
  const childDed = children * h.childDeduction;
  const minorDed = Math.max(0, i.minorYears) * h.minorPerYear;
  const elderlyDed = Math.max(0, Math.floor(i.elderly)) * h.elderlyDeduction;
  const personalTotal = h.basicDeduction + childDed + minorDed + elderlyDed;

  // 제21조 ② — 배우자가 단독으로 상속받으면 일괄공제를 쓸 수 없다
  const spouseAlone = i.hasSpouse && children === 0;
  const canLumpSum = !spouseAlone;
  const usedLumpSum = canLumpSum && h.lumpSumDeduction > personalTotal;
  const appliedBaseDeduction = usedLumpSum ? h.lumpSumDeduction : personalTotal;

  push(
    usedLumpSum ? '일괄공제' : '기초공제 + 인적공제',
    appliedBaseDeduction,
    usedLumpSum
      ? `기초 ${fmt(h.basicDeduction)}원 + 인적 ${fmt(personalTotal - h.basicDeduction)}원 = ${fmt(personalTotal)}원보다 일괄공제 ${fmt(h.lumpSumDeduction)}원이 커서 이쪽을 택했다(제21조 ①)`
      : spouseAlone
        ? `배우자가 단독으로 상속받으면 일괄공제를 쓸 수 없다(제21조 ②) — 기초 ${fmt(h.basicDeduction)}원 + 인적 ${fmt(personalTotal - h.basicDeduction)}원`
        : `기초 ${fmt(h.basicDeduction)}원 + 자녀 ${children}명 ${fmt(childDed)}원`
          + (minorDed ? ` + 미성년 ${fmt(minorDed)}원` : '')
          + (elderlyDed ? ` + 65세 이상 ${fmt(elderlyDed)}원` : ''),
    'minus',
  );

  // ── 공제 ② 배우자 ──────────────────────────────────────────
  let spouseDeduction = 0;
  if (i.hasSpouse) {
    // 민법 제1009조 ② — 배우자는 직계비속 상속분의 1.5배
    const spouseUnits = 1 + h.spouseShareBonus;
    const legalShare = spouseUnits / (spouseUnits + children);
    const shareLimit = taxableEstate * legalShare;
    const cap = Math.min(shareLimit, h.spouseMax);
    // 실제 상속액을 안 넣었으면 법정상속분대로 받는다고 본다
    const actual = i.spouseTakes === null ? shareLimit : Math.max(0, i.spouseTakes);
    spouseDeduction = won(Math.max(h.spouseMin, Math.min(actual, cap)));

    const reason =
      spouseDeduction === h.spouseMin && Math.min(actual, cap) < h.spouseMin
        ? `실제 상속액이 ${fmt(h.spouseMin)}원 미만이어도 ${fmt(h.spouseMin)}원은 공제한다(제19조 ④)`
        : cap === h.spouseMax && actual >= h.spouseMax
          ? `상한 ${fmt(h.spouseMax)}원까지만 공제한다(제19조 ①2)`
          : `실제 상속액 ${fmt(actual)}원, 법정상속분 한도 ${fmt(Math.round(shareLimit))}원`
            + ` (배우자 ${spouseUnits} : 자녀 각 1 → ${(legalShare * 100).toFixed(1)}%)`;
    push('배우자 상속공제', spouseDeduction, reason, 'minus');
  }

  // ── 공제 ③ 금융재산 ────────────────────────────────────────
  const net = Math.max(0, i.netFinancial);
  let financialDeduction = 0;
  if (net > 0) {
    financialDeduction =
      net <= h.financial.smallThreshold
        ? net
        : Math.min(h.financial.cap, Math.max(net * h.financial.rate, h.financial.floor));
    financialDeduction = won(financialDeduction);
    push(
      '금융재산 상속공제',
      financialDeduction,
      net <= h.financial.smallThreshold
        ? `순금융재산이 ${fmt(h.financial.smallThreshold)}원 이하라 전액 공제(제22조 ①2)`
        : `순금융재산 ${fmt(net)}원 × ${h.financial.rate * 100}%와 ${fmt(h.financial.floor)}원 중 큰 금액, ${fmt(h.financial.cap)}원 한도(제22조 ①1)`,
      'minus',
    );
  }

  const totalDeduction = appliedBaseDeduction + spouseDeduction + financialDeduction;
  const taxBase = Math.max(0, taxableEstate - totalDeduction);
  push('과세표준', taxBase, `과세가액 ${fmt(taxableEstate)}원 − 공제 합계 ${fmt(totalDeduction)}원`);

  const calculatedTax = won(progressive(taxBase, g.brackets));
  const bracket = g.brackets.find(b => b.upTo === null || taxBase <= b.upTo);
  push(
    '산출세액',
    calculatedTax,
    taxBase > 0 && bracket
      ? `세율 ${bracket.rate * 100}% · 누진공제 ${fmt(bracket.deduction)}원 (제26조)`
      : '과세표준이 0이라 세금이 없다',
  );

  const filingCredit = won(calculatedTax * g.filingCreditRate);
  if (filingCredit > 0) {
    push(
      '신고세액공제',
      filingCredit,
      `기한 내 신고 시 산출세액의 ${g.filingCreditRate * 100}%(제69조)`,
      'minus',
    );
  }

  const finalTax = won(Math.max(0, calculatedTax - filingCredit));
  push('납부할 상속세', finalTax, '산출세액 − 신고세액공제', 'total');

  return {
    taxableEstate, personalTotal, appliedBaseDeduction, usedLumpSum,
    spouseDeduction, financialDeduction, totalDeduction,
    taxBase, calculatedTax, filingCredit, finalTax,
    effectiveRate: estate > 0 ? finalTax / estate : 0,
    steps, verifiedAt: h.verifiedAt,
  };
}
