import type { ReactNode } from 'react';

/**
 * 적용 기준 문장에 담긴 **법령 조문을 국가법령정보센터 원문으로 링크**한다.
 *
 * 왜 하는가 — 세금 계산은 구글이 YMYL(잘못된 정보가 금전적 피해로 이어지는 영역)로 분류해
 * 신뢰 신호를 까다롭게 본다. 우리는 조문을 이미 전부 적어 두고도 링크를 안 걸고 있었다.
 * 권위 있는 공공 사이트로 나가는 외부 링크는 그 자체가 신뢰 신호인데 그냥 버리고 있던 셈이다.
 * 텍스트가 이미 있으니 링크를 붙이는 비용은 사실상 0이다.
 *
 * ## 왜 정규식이 아니라 화이트리스트인가
 *
 * 처음엔 `([가-힣]+법)\s*(제\d+조)` 같은 패턴으로 잡으려 했는데, 한국어 문장에서 이건
 * 반드시 깨진다. 실제로 이런 이름들이 나왔다:
 *
 *   "이자율은 지방세법 시행령"   ← 앞 문맥을 법령명으로 삼킴
 *   "한도는 시행령이 아니라 법"   ← 서술문을 법령명으로 오인
 *   "보장법"                     ← "근로자퇴직급여 보장법"에서 띄어쓰기 앞이 잘림
 *   "가정 양립 지원에 관한 법률"  ← 긴 법령명의 뒤쪽만 남음
 *
 * 이런 이름으로 만든 URL은 전부 죽은 링크다. 신뢰 신호를 얻으려다 오히려 잃는다.
 * 그래서 **우리가 실제로 인용하는 법령만 아래 표에 적어 두고, 표에 없으면 링크하지 않는다.**
 * 계산기에서 지켜 온 "모르는 건 계산하지 않는다"를 링크에도 그대로 적용한 것이다.
 *
 * ## 링크하지 않는 것
 *
 * **고시·행정규칙은 링크하지 않는다.** 국가법령정보센터에서 고시는 내부 일련번호(admRulSeq)로
 * 주소가 정해져서 이름만으로 URL을 만들 수 없다. 고시 번호는 텍스트 그대로 둔다 — 그 번호로
 * 검색하면 찾을 수 있고, 없는 주소를 지어내는 것보다 낫다.
 *
 * **"같은 법 시행령"처럼 앞 문장을 받는 표현도 링크하지 않는다.** 어느 법인지는 사람은 알아도
 * 이 함수는 모른다. 모르면 안 건다.
 */

/**
 * 우리가 인용하는 법령의 정식 명칭. 왼쪽은 본문에 쓰는 표기, 오른쪽은 국가법령정보센터 등록명.
 * 같으면 오른쪽을 생략한다.
 *
 * 새 계산기를 추가하면서 새 법령을 인용하게 되면 여기에 한 줄 추가해야 링크가 붙는다.
 * 빠뜨려도 링크만 안 붙을 뿐 화면은 멀쩡하다 — 안전한 쪽으로 실패한다.
 */
const LAWS: Record<string, string | null> = {
  소득세법: null,
  '소득세법 시행령': null,
  지방세법: null,
  '지방세법 시행령': null,
  국민건강보험법: null,
  '국민건강보험법 시행령': null,
  노인장기요양보험법: null,
  '노인장기요양보험법 시행령': null,
  고용보험법: null,
  '고용보험법 시행령': null,
  국민연금법: null,
  근로기준법: null,
  '근로자퇴직급여 보장법': null,
  농어촌특별세법: null,
  부가가치세법: null,
  종합부동산세법: null,
  주택임대차보호법: null,
  '주택임대차보호법 시행령': null,
  '개인정보 보호법': null,
  민법: null,
  '상속세 및 증여세법': null,
  // 본문에서 줄여 쓰는 표기 — 보이는 글자는 그대로 두고 링크만 정식 명칭으로 보낸다
  상증세법: '상속세 및 증여세법',
  '남녀고용평등법': '남녀고용평등과 일ㆍ가정 양립 지원에 관한 법률',
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * 긴 이름을 먼저 시도한다 — "소득세법 시행령"이 "소득세법"에 먹히면 안 된다.
 * 조문 뒤에 "·제128조"처럼 같은 법의 다른 조가 이어지면 그것도 같은 법으로 링크한다.
 */
const NAMES = Object.keys(LAWS).sort((a, b) => b.length - a.length);
const CITATION = new RegExp(
  `(${NAMES.map(escape).join('|')})\\s*(제\\d+조(?:의\\d+)?)((?:\\s*[·ㆍ、,]\\s*제\\d+조(?:의\\d+)?)*)`,
  'g',
);
const EXTRA_ARTICLE = /제\d+조(?:의\d+)?/g;

const lawUrl = (law: string, article: string) =>
  `https://www.law.go.kr/법령/${encodeURIComponent(LAWS[law] ?? law)}/${encodeURIComponent(article)}`;

/**
 * 문장을 조각내 조문 부분만 링크로 바꾼다.
 * 링크할 게 없으면 원문 문자열을 그대로 돌려준다 — 쓸데없는 래퍼를 만들지 않는다.
 */
export function linkifyLaw(text: string, linkClassName?: string): ReactNode {
  CITATION.lastIndex = 0;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;

  const link = (law: string, article: string, label: string) => (
    <a
      key={`${n++}`}
      href={lawUrl(law, article)}
      target="_blank"
      rel="noopener noreferrer"
      className={linkClassName}
    >
      {label}
    </a>
  );

  while ((m = CITATION.exec(text)) !== null) {
    const [full, law, article, trailing] = m;
    if (m.index > last) out.push(text.slice(last, m.index));
    // 보이는 글자는 원문 그대로 둔다 — 띄어쓰기를 우리가 고쳐 쓰지 않는다
    out.push(link(law, article, full.slice(0, full.length - trailing.length)));

    // "제127조·제128조" — 뒤따르는 조문도 같은 법으로 건다. 구분자(·)는 링크 밖에 둔다.
    if (trailing) {
      EXTRA_ARTICLE.lastIndex = 0;
      let e: RegExpExecArray | null;
      let cursor = 0;
      while ((e = EXTRA_ARTICLE.exec(trailing)) !== null) {
        out.push(trailing.slice(cursor, e.index));
        out.push(link(law, e[0], e[0]));
        cursor = e.index + e[0].length;
      }
      if (cursor < trailing.length) out.push(trailing.slice(cursor));
    }
    last = m.index + full.length;
  }

  if (out.length === 0) return text;
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

/** 링크가 하나라도 붙는지 — 테스트와 안내 문구 판단에 쓴다 */
export function hasLawCitation(text: string): boolean {
  CITATION.lastIndex = 0;
  return CITATION.test(text);
}

/** 테스트용 — 이 문장에서 만들어질 URL 목록 */
export function lawUrlsIn(text: string): string[] {
  CITATION.lastIndex = 0;
  const urls: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = CITATION.exec(text)) !== null) {
    const [, law, article, trailing] = m;
    urls.push(lawUrl(law, article));
    EXTRA_ARTICLE.lastIndex = 0;
    let e: RegExpExecArray | null;
    while ((e = EXTRA_ARTICLE.exec(trailing ?? '')) !== null) urls.push(lawUrl(law, e[0]));
  }
  return urls;
}
