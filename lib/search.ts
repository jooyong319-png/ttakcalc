// 홈 검색바가 쓰는 인덱스. 빌드 시각에 만들어 클라이언트로 넘긴다.
//
// 계산기가 계속 늘어날 예정이라 목록을 훑게 두면 안 된다. 다만 인덱스를 통째로 보내면
// 프로그래매틱 페이지 475장 때문에 번들이 터지므로 **두 갈래로 나눈다.**
//
//   1) 계산기 29개 — 이름·설명·동의어를 그대로 실어 보낸다(작다)
//   2) "연봉 5000" 같은 숫자 — 페이지를 다 싣지 않고 **범위 규격만** 보내서
//      입력값이 유효 구간에 들면 그 자리에서 URL을 만든다
//
// 사람들은 "연봉 실수령액"이 아니라 "월급", "세후", "실수령"이라고 친다. 동의어가 검색
// 품질의 대부분이다 — 화면에 안 보이지만 이게 없으면 검색바는 있으나 마나다.
import { CATEGORIES, type Tone } from './catalog';
import { SALARY, NET, LEAVE_YEARS, GIFT, DIVIDEND } from './salaryPages';
import { PRICE } from './propertyPages';
import { CC, PUBLIC_PRICE } from './localTaxPages';

export interface SearchItem {
  href: string;
  name: string;
  desc: string;
  icon: string;
  category: string;
  tone: Tone;
  /** 검색 대상 문자열을 미리 하나로 합쳐 둔다 — 클라이언트에서 매번 이어붙이지 않도록 */
  haystack: string;
}

/** 계산기별 동의어. 실제로 사람들이 치는 말이지 정식 명칭이 아니다. */
const KEYWORDS: Record<string, string[]> = {
  '/calc/salary': ['월급', '실수령', '세후', '실수령액', '공제', '4대보험', '급여', '월급실수령'],
  '/salary': ['연봉표', '실수령표', '월급표', '연봉별'],
  '/calc/reverse-salary': ['역산', '세전', '희망연봉', '연봉협상', '거꾸로'],
  '/calc/year-end': ['연말정산', '환급', '13월의월급', '소득공제'],
  '/calc/comprehensive-tax': ['종소세', '5월신고', '사업소득', '신고'],
  '/calc/freelancer': ['3.3', '삼쩜삼', '원천징수', '프리랜서', '알바세금'],
  '/calc/employment-compare': ['정규직', '프리랜서', '계약직', '비교'],
  '/calc/severance': ['퇴직', '퇴사', '평균임금', '퇴직연금'],
  '/calc/unemployment': ['구직급여', '실업', '고용보험', '퇴사', '실직'],
  '/calc/holiday-pay': ['주휴', '알바', '시급', '아르바이트'],
  '/calc/parental-leave': ['육아휴직', '출산', '육휴', '출산휴가'],
  '/calc/annual-leave': ['연차', '휴가', '미사용연차', '월차'],
  '/calc/gift-tax': ['증여', '물려받', '용돈', '자녀증여'],
  '/calc/employer-cost': ['사업주', '회사부담', '인건비', '4대보험', '고용주'],
  '/calc/acquisition-tax': ['집사기', '매수', '아파트', '주택구입', '취득'],
  '/calc/property-tax': ['보유세', '공시가격', '재산'],
  '/calc/transfer-tax': ['양도세', '집팔기', '매도', '1가구1주택'],
  '/calc/comprehensive-property-tax': ['종부세', '보유세', '다주택'],
  '/calc/rent-conversion': ['전세', '월세', '전환', '반전세'],
  '/calc/brokerage-fee': ['복비', '부동산수수료', '중개보수', '공인중개사'],
  '/calc/dividend-tax': ['배당', '주식', '금융소득', '파이어', '배당금', 'etf'],
  '/calc/loan': ['대출', '원리금', '이자', '상환', '주담대', '월납입금'],
  '/calc/car-tax': ['자동차', '차량', '연납', '자동차세연납'],
  '/calc/car-cost': ['유지비', '차유지비', '기름값', '주유비', '보험료', '자동차보험', '차값', '월유지비', '연비'],
  '/calc/exchange': ['환율', '달러', '엔화', '유로', '환전'],
  '/calc/car-acquisition': ['신차', '차구입', '등록세', '자동차취득'],
  '/calc/pyeong': ['평수', '제곱미터', '면적', '전용면적'],
  '/calc/vat': ['부가세', '공급가액', '세금계산서', '10퍼센트'],
  '/calc/percent': ['비율', '할인', '증감', '퍼센트계산'],
  '/calc/compound': ['적금', '예금', '복리', '이자', '만기'],
};

export const SEARCH_ITEMS: SearchItem[] = CATEGORIES.flatMap(c =>
  c.calcs.map(x => ({
    href: x.href,
    name: x.name,
    desc: x.desc,
    icon: x.icon,
    category: c.name,
    tone: c.tone,
    // 띄어쓰기를 지운 형태도 넣는다 — "연봉실수령"처럼 붙여 치는 사람이 많다
    haystack: [x.name, x.desc, c.name, ...(KEYWORDS[x.href] ?? [])]
      .join(' ')
      .toLowerCase()
      .concat(' ', [x.name, c.name].join('').replace(/\s/g, '').toLowerCase()),
  })),
);

/** 숫자를 입력했을 때 만들어 줄 수 있는 페이지들. 범위 규격만 보내고 URL은 클라이언트에서 만든다. */
export interface NumericRoute {
  base: string;
  label: string;
  /** 값 뒤에 붙는 단위 표시 */
  unit: string;
  min: number;
  max: number;
  step: number;
  tone: Tone;
}

export const NUMERIC_ROUTES: NumericRoute[] = [
  { base: '/salary', label: '연봉', unit: '만원 실수령액', ...pick(SALARY), tone: 'c1' },
  { base: '/net-salary', label: '월 실수령', unit: '만원이면 연봉은', ...pick(NET), tone: 'c1' },
  { base: '/annual-leave', label: '근속', unit: '년차 연차 일수', ...pick(LEAVE_YEARS), tone: 'c1' },
  { base: '/gift-tax', label: '증여', unit: '만원 증여세', ...pick(GIFT), tone: 'c1' },
  { base: '/dividend-tax', label: '배당', unit: '만원 배당소득세', ...pick(DIVIDEND), tone: 'c3' },
  { base: '/acquisition-tax', label: '주택', unit: '만원 취득세', ...pick(PRICE), tone: 'c2' },
  { base: '/brokerage-fee', label: '주택', unit: '만원 중개수수료', ...pick(PRICE), tone: 'c2' },
  { base: '/property-tax', label: '공시가격', unit: '만원 재산세', ...pick(PUBLIC_PRICE), tone: 'c2' },
  { base: '/car-tax', label: '배기량', unit: 'cc 자동차세', ...pick(CC), tone: 'c3' },
];

function pick(r: { min: number; max: number; step: number }) {
  return { min: r.min, max: r.max, step: r.step };
}
