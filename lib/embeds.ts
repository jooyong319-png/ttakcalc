/**
 * 다른 사이트에 끼워 넣을 수 있는 계산기 목록.
 *
 * 왜 만드나 — 우리 병목은 색인이 아니라 순위이고, 순위를 못 올리는 건 외부에서 우리를
 * 가리키는 신호가 없어서다. 블로그 글에 계산기가 박혀 있으면 읽는 사람이 그 자리에서
 * 쓰고, 자기 글에 필요해서 넣은 것이라 억지로 부탁한 링크와 성격이 다르다.
 *
 * ## 기대 효과를 정확히 적어 둔다 (여기 착각하기 쉽다)
 *
 * **iframe 안의 링크는 우리 쪽 백링크로 계산되지 않는다.** 검색엔진은 iframe 내용을
 * 별개 문서로 취급하기 때문이다. 그래서 임베드 코드에는 iframe **바깥에** 출처 링크를
 * 함께 넣는다. 그게 호스트 페이지의 HTML에 실제로 남는 유일한 앵커다.
 *
 * 그리고 위젯으로 뿌린 링크는 구글이 특히 깐깐하게 본다. 문제 삼는 것은 "키워드를
 * 잔뜩 넣은, 숨겨진, 저품질 위젯 링크"다. 그래서 출처 문구는 **브랜드 이름 중심의 한 줄**로
 * 고정하고, 사람이 볼 수 있게 두고, 계산기마다 키워드를 바꿔 심지 않는다.
 *
 * 현실적인 1차 기대값은 링크 점수가 아니라 **참조 트래픽과 브랜드 노출**이다.
 * 링크 신호는 따라오면 좋은 것이지 이 기능의 존재 이유가 아니다.
 *
 * ## 무엇을 고르나
 *
 * 블로그 글의 흐름에 자연스럽게 들어가는 것만 고른다. 입력이 한두 개고 결과가 한 줄로
 * 떨어지는 계산기다. 조건을 열 개 넣어야 하는 계산기는 남의 글 한복판에서 아무도 안 쓴다.
 * 니치를 겹치지 않게 흩어 놓아 블로그 종류마다 하나씩 걸리게 했다.
 */
export interface EmbedSpec {
  slug: string;
  /** 임베드 상단에 뜨는 이름 */
  name: string;
  /** 원본 계산기 페이지 — 출처 링크가 여기로 간다 */
  href: string;
  /** iframe 기본 높이(px). 넓은 화면에서 실제로 필요한 높이를 재서 넣었다.
   *  좁은 화면에서는 입력이 세로로 쌓여 더 길어지는데, 그건 자동 높이 스크립트를
   *  넣은 경우에만 딱 맞는다. 안 넣으면 프레임 안에서 스크롤된다. */
  height: number;
  /** 어떤 글에 어울리는지 — 안내 페이지에 그대로 보여준다 */
  fits: string;
}

export const EMBEDS: EmbedSpec[] = [
  { slug: 'salary', name: '연봉 실수령액 계산기', href: '/calc/salary', height: 1150, fits: '연봉·이직·취업 글' },
  { slug: 'severance', name: '퇴직금 계산기', href: '/calc/severance', height: 930, fits: '퇴사·이직 글' },
  { slug: 'holiday-pay', name: '주휴수당 계산기', href: '/calc/holiday-pay', height: 710, fits: '아르바이트·시급 글' },
  { slug: 'acquisition-tax', name: '취득세 계산기', href: '/calc/acquisition-tax', height: 900, fits: '부동산 매수 글' },
  { slug: 'brokerage-fee', name: '중개보수 계산기', href: '/calc/brokerage-fee', height: 930, fits: '부동산 거래 글' },
  { slug: 'car-tax', name: '자동차세 계산기', href: '/calc/car-tax', height: 1290, fits: '자동차 유지비 글' },
  { slug: 'vat', name: '부가세 계산기', href: '/calc/vat', height: 770, fits: '사업자·세금계산서 글' },
  { slug: 'loan', name: '대출 이자 계산기', href: '/calc/loan', height: 900, fits: '대출·재테크 글' },
];

export const findEmbed = (slug: string) => EMBEDS.find(e => e.slug === slug);
