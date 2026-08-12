import raw from '@/data/corrections.json';

/**
 * 우리가 틀렸던 기록.
 *
 * 왜 공개하나 — 세금 계산기는 틀리면 사람이 손해를 본다. 그런 사이트를 믿을지 말지는
 * "한 번도 안 틀렸다"는 주장이 아니라 **틀렸을 때 어떻게 하는지**로 판단하는 게 맞다.
 * 조용히 고치고 넘어가면 아무도 모르지만, 그건 다음에도 조용히 넘어가겠다는 뜻이다.
 *
 * [[제도 변화]] 페이지와 다르다. 그쪽은 **법이 바뀐 것**이고, 여기는 **우리가 틀린 것**이다.
 * 섞으면 우리 실수가 제도 개정처럼 보인다.
 *
 * 규칙 하나 — 계산 결과에 영향을 준 것만 적는다. 화면 깨짐이나 배포 설정 실수까지
 * 늘어놓으면 정작 중요한 항목이 묻힌다.
 */
export interface Correction {
  /** 고친 날 */
  date: string;
  /** value: 이용자가 본 숫자가 틀렸다 / source: 값은 맞았고 근거 표기가 틀렸다 */
  severity: 'value' | 'source';
  title: string;
  /** 무엇이 틀렸나 */
  what: string;
  /** 이용자에게 어떤 영향이 있었나 — 숨기지 않는다 */
  impact: string;
  /** 틀린 값과 고친 값의 실제 예시 */
  examples?: { label: string; before: string; after: string }[];
  /** 왜 그랬나 */
  cause: string;
  /** 어떻게 고쳤나 */
  fix: string;
  /** 같은 일이 다시 일어나지 않게 무엇을 바꿨나 — 이게 없으면 그냥 사과문이다 */
  prevention: string;
}

/** 최근 것이 위로 */
export const CORRECTIONS: Correction[] = (raw as Correction[])
  .slice()
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

export const valueCorrectionCount = () =>
  CORRECTIONS.filter(c => c.severity === 'value').length;
