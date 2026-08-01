// 화면에 쓰는 숫자 표기. 계산 로직과 분리해 둔다(표기가 바뀌어도 계산은 안 건드리게).

export const won = (n: number) => Math.round(n).toLocaleString('ko-KR');

/** 만원 단위 정수를 한국식 금액 이름으로. 4000 → "4,000만원", 50000 → "5억원", 55000 → "5억 5,000만원" */
export function manLabel(man: number): string {
  if (man >= 10000) {
    const eok = Math.floor(man / 10000);
    const rest = man % 10000;
    return rest === 0 ? `${eok}억원` : `${eok}억 ${rest.toLocaleString('ko-KR')}만원`;
  }
  return `${man.toLocaleString('ko-KR')}만원`;
}

/** 만원 → 원 */
export const manToWon = (man: number) => man * 10_000;

/** 0.0359 → "3.595%". 소수점 뒤의 남는 0만 정리한다.
 *  주의: /\.?0+$/ 로 자르면 "40"이 "4"가 된다(정수부의 0까지 먹는다). 실제로 차령 경감률
 *  40%·50%가 4%·5%로 표시되는 버그가 있었다. 소수점 뒤에서만 자를 것. */
export function pct(rate: number, digits = 3): string {
  const s = (rate * 100).toFixed(digits).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  return `${s}%`;
}

/**
 * 등차수열 범위 생성 + 검증. 프로그래매틱 라우트가 전부 같은 규약(만원 단위)을 쓰도록 묶는다.
 * 범위 밖 값은 페이지를 만들지 않고 404로 보낸다 — 얇은 페이지를 찍어내지 않기 위해서.
 */
export function makeRange(min: number, max: number, step: number) {
  const all = () => {
    const out: number[] = [];
    for (let v = min; v <= max; v += step) out.push(v);
    return out;
  };
  const isValid = (v: number) =>
    Number.isInteger(v) && v >= min && v <= max && (v - min) % step === 0;
  const neighbors = (v: number) => ({
    prev: v - step >= min ? v - step : null,
    next: v + step <= max ? v + step : null,
  });
  const parse = (param: string) => {
    const n = Number(param);
    return isValid(n) ? n : null;
  };
  return { min, max, step, all, isValid, neighbors, parse };
}
