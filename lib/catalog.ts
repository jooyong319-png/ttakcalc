// 사이트의 계산기 카탈로그 — 홈·카테고리 허브·사이트맵이 전부 여기 하나만 본다.
//
// 계산기가 20개를 넘어가면서 홈 한 장에 다 늘어놓는 게 불가능해졌다. 카테고리로 나누되
// **개별 계산기 URL은 그대로 둔다** — 검색 유입은 대부분 계산기로 직접 들어오므로
// 거길 건드리면 손해다. 허브는 위에 얹기만 한다.

export type Tone = 'c1' | 'c2' | 'c3' | 'c4';

export interface CalcItem {
  href: string;
  name: string;
  desc: string;
  icon: string;
  /** 카테고리 허브·홈에서 앞줄에 세울 것 */
  featured?: boolean;
}

export interface Category {
  slug: string;
  name: string;
  tagline: string;
  /** 허브 페이지 설명 — metadata에도 쓴다 */
  description: string;
  tone: Tone;
  icon: string;
  calcs: CalcItem[];
}

export const CATEGORIES: Category[] = [
  {
    slug: 'tax',
    name: '급여·세금',
    tagline: '내 월급에서 뭐가 얼마나 빠지나',
    description:
      '연봉 실수령액, 연말정산 환급금, 종합소득세, 퇴직금, 실업급여까지. '
      + '4대보험과 세금이 어떤 요율로 얼마씩 빠지는지 근거와 함께 계산합니다.',
    tone: 'c1',
    icon: '₩',
    calcs: [
      { href: '/calc/salary', name: '연봉 실수령액', desc: '4대보험·세금 공제 내역까지', icon: '₩', featured: true },
      { href: '/salary', name: '연봉별 실수령액 표', desc: '2천만~1억, 100만원 단위', icon: '☰', featured: true },
      { href: '/calc/reverse-salary', name: '연봉 역산', desc: '실수령액 → 필요한 연봉', icon: '⇄', featured: true },
      { href: '/calc/year-end', name: '연말정산 환급금', desc: '결정세액 vs 기납부세액', icon: '↺' },
      { href: '/calc/comprehensive-tax', name: '종합소득세', desc: '5월 신고 · 환급·추가납부', icon: '⊞' },
      { href: '/calc/freelancer', name: '프리랜서 3.3%', desc: '원천징수 후 실수령액', icon: '%' },
      { href: '/calc/employment-compare', name: '정규직 vs 프리랜서', desc: '같은 금액, 다른 실수령', icon: '⚖' },
      { href: '/calc/severance', name: '퇴직금', desc: '평균임금 기준 예상 퇴직금', icon: '◷' },
      { href: '/calc/unemployment', name: '실업급여', desc: '구직급여 일액·수급 기간', icon: '◇' },
      { href: '/calc/holiday-pay', name: '주휴수당', desc: '주 15시간 이상 근무 시', icon: '◴' },
      { href: '/calc/overtime', name: '연장·야간·휴일수당', desc: '가산은 겹친다 · 야간 연장 2.0배', icon: '◑', featured: true },
      { href: '/calc/parental-leave', name: '육아휴직급여', desc: '개월별 지급액 · 2025 개편 반영', icon: '☺' },
      { href: '/calc/annual-leave', name: '연차수당', desc: '근속연수별 발생일수 · 미사용 수당', icon: '◷' },
      { href: '/calc/gift-tax', name: '증여세', desc: '관계별 공제 · 10년 합산', icon: '⊛' },
      { href: '/calc/inheritance-tax', name: '상속세', desc: '일괄공제·배우자공제로 갈린다', icon: '⌂', featured: true },
      { href: '/calc/employer-cost', name: '사업주 4대보험 부담', desc: '직원 1명의 실제 인건비', icon: '⊡' },
    ],
  },
  {
    slug: 'property',
    name: '부동산',
    tagline: '집 살 때·가지고 있을 때 드는 세금',
    description:
      '집을 살 때(취득세·중개수수료), 가지고 있을 때(재산세·종합부동산세), 팔 때(양도소득세)까지. '
      + '6억·9억·12억 같은 구간 경계에서 세금이 어떻게 뛰는지 함께 보여드립니다.',
    tone: 'c2',
    icon: '⌂',
    calcs: [
      { href: '/calc/acquisition-tax', name: '취득세', desc: '주택 취득 시 세금', icon: '⌂', featured: true },
      { href: '/calc/property-tax', name: '재산세', desc: '공시가격 기준 · 7·9월 부과', icon: '▤', featured: true },
      { href: '/calc/transfer-tax', name: '양도소득세', desc: '집 팔 때 · 12억 비과세·장특공제', icon: '⇱', featured: true },
      { href: '/calc/comprehensive-property-tax', name: '종합부동산세', desc: '공시가격 합계 · 12월 부과', icon: '⌸' },
      { href: '/calc/rent-conversion', name: '전월세 전환율', desc: '보증금 → 월세 법정 상한', icon: '⇆' },
      { href: '/calc/brokerage-fee', name: '중개수수료', desc: '거래금액별 상한요율', icon: '◎' },
    ],
  },
  {
    slug: 'finance',
    name: '금융·자동차',
    tagline: '대출·자동차세·환전',
    description:
      '대출 상환 방식별 이자, 배기량·차령별 자동차세와 연납 할인, 고시환율 기준 환전 비용을 계산합니다.',
    tone: 'c3',
    icon: '↗',
    calcs: [
      { href: '/calc/dividend-tax', name: '배당소득세', desc: '2천만원 넘으면 얼마나 달라지나', icon: '％', featured: true },
      { href: '/calc/pension', name: '국민연금 예상 수령액', desc: '조기·연기 수령 비교까지', icon: '◷', featured: true },
      { href: '/calc/loan', name: '대출 이자', desc: '원리금균등·원금균등 비교', icon: '↗', featured: true },
      { href: '/calc/car-tax', name: '자동차세', desc: '배기량·차령 · 연납 할인', icon: '◈', featured: true },
      { href: '/calc/car-cost', name: '자동차 유지비', desc: '기름값·세금·보험료 다 합쳐 월 얼마', icon: '◐', featured: true },
      { href: '/calc/exchange', name: '환전', desc: '고시환율 + 스프레드·우대율', icon: '⇌', featured: true },
      { href: '/calc/car-acquisition', name: '자동차 취득세', desc: '차 살 때 · 승용 7%', icon: '⊙' },
    ],
  },
  {
    slug: 'math',
    name: '계산·단위',
    tagline: '자주 쓰는 변환과 비율',
    description:
      '평↔㎡ 변환, 부가가치세, 퍼센트, 예·적금 복리 계산. '
      + '전부 세금·부동산 계산기로 이어지는 계산들입니다.',
    tone: 'c4',
    icon: '±',
    calcs: [
      { href: '/calc/pyeong', name: '평 ↔ ㎡', desc: '85㎡ 넘으면 취득세가 달라진다', icon: '▦', featured: true },
      { href: '/calc/vat', name: '부가가치세', desc: '공급가액 ↔ 합계금액', icon: '⊕', featured: true },
      { href: '/calc/percent', name: '퍼센트', desc: '증감률·비율·할인', icon: '％', featured: true },
      { href: '/calc/compound', name: '예·적금 이자', desc: '단리·월복리 + 이자소득세 15.4%', icon: '↑' },
    ],
  },
];

export function categoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find(c => c.slug === slug);
}

/** 사이트맵·검증용 — 모든 계산기 경로 */
export function allCalcHrefs(): string[] {
  return CATEGORIES.flatMap(c => c.calcs.map(x => x.href));
}
