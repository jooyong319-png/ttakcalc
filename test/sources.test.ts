// 출처 검증 테스트 — 계산이 아니라 "그 숫자를 어디서 가져왔는가"를 지킨다.
//
// 왜 있나 (2026-08-03):
//   2026년 식대 비과세 한도를 300,000원으로, "2026-01-01부터 20만원 → 30만원 상향"이라고
//   적어 두었다. 그런 개정은 없었다. 출처는 "소득세법 시행령 제17조의2"였는데 그 조문은
//   식대와 무관한 "비과세되는 기업 출산지원금의 범위"다. 실수령액이 전부 과대계상됐다.
//
//   테스트 120개는 전부 통과했다. 계산 로직은 멀쩡했기 때문이다. 틀린 건 입력 데이터였고,
//   계산 테스트로는 잡을 수 없다.
//
// 무엇을 잡나:
//   그 오류에는 기계로 읽을 수 있는 지문이 있었다 — **값이 바뀌었다고 주장하는데 출처에
//   그 개정을 만든 근거(고시 번호나 개정일)가 없었다.** 없는 개정을 지어내면 인용할 문서도
//   없으므로, 출처는 두루뭉술해질 수밖에 없다.
//
//   그래서 "연도 간에 값이 달라진 항목"은 출처에 날짜나 고시 번호를 요구한다. 사람이 원문을
//   찾아갈 수 있는 좌표가 없으면 다음 사람도 검증을 건너뛴다.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { availableYears, getRates } from '../lib/rates';

type Json = unknown;

/** 값이 아니라 설명인 키 — 비교 대상에서 뺀다 */
const META = new Set(['note', 'source', 'label', 'verifiedAt', 'name']);

/** 중첩 객체를 "경로 → 숫자" 로 편다. 문자열은 요율이 아니므로 제외한다. */
function flattenNumbers(node: Json, prefix = '', out: Map<string, number> = new Map()) {
  if (Array.isArray(node)) {
    node.forEach((v, i) => flattenNumbers(v, `${prefix}[${i}]`, out));
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node as Record<string, Json>)) {
      if (META.has(k)) continue;
      flattenNumbers(v, prefix ? `${prefix}.${k}` : k, out);
    }
  } else if (typeof node === 'number') {
    out.set(prefix, node);
  }
  return out;
}

/** 경로가 속한 가장 가까운 상위 섹션의 source를 찾는다 */
function sourceFor(year: string, path: string): string | null {
  const parts = path.split('.').map(p => p.replace(/\[\d+\]$/, ''));
  let node: Json = getRates(year) as unknown as Json;
  let found: string | null = null;
  for (const p of parts) {
    if (!node || typeof node !== 'object' || Array.isArray(node)) break;
    const rec = node as Record<string, Json>;
    if (!(p in rec)) break;
    node = rec[p];
    if (node && typeof node === 'object' && !Array.isArray(node)) {
      const src = (node as Record<string, Json>).source;
      if (typeof src === 'string') found = src;
    }
  }
  return found;
}

/** 원문을 찾아갈 수 있는 좌표: 개정일/시행일 같은 날짜, 또는 고시·법률 번호 */
const HAS_ANCHOR = /\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.|제\s*\d{4}\s*[-–]\s*\d+\s*호|제\d+호,|\d{4}년\s*\d{1,2}월\s*\d{1,2}일/;

test('출처 — 모든 요율 항목에 source가 있다', () => {
  for (const year of availableYears()) {
    // Map 직접 순회는 tsconfig.test의 target에서 downlevelIteration을 요구한다
    for (const path of Array.from(flattenNumbers(getRates(year) as unknown as Json).keys())) {
      const src = sourceFor(year, path);
      assert.ok(src && src.trim().length > 0, `${year} ${path}: source가 없다`);
    }
  }
});

test('출처 — 연도 간에 값이 바뀐 항목은 그 개정의 근거(날짜·고시번호)를 인용해야 한다', () => {
  const years = availableYears(); // 내림차순
  const problems: string[] = [];

  for (let i = 0; i < years.length - 1; i++) {
    const cur = years[i];
    const prev = years[i + 1];
    const a = flattenNumbers(getRates(prev) as unknown as Json);
    const b = flattenNumbers(getRates(cur) as unknown as Json);

    for (const [path, vb] of Array.from(b.entries())) {
      const va = a.get(path);
      if (va === undefined || va === vb) continue; // 안 바뀐 값은 이 테스트의 관심사가 아니다

      const src = sourceFor(cur, path) ?? '';
      if (!HAS_ANCHOR.test(src)) {
        problems.push(
          `${cur} ${path}: ${va} → ${vb} 로 바뀌었다고 되어 있는데 ` +
            `출처에 개정일·고시번호가 없다 — "${src}"`,
        );
      }
    }
  }

  assert.deepEqual(
    problems,
    [],
    `값이 바뀐 항목은 그 개정을 만든 문서를 인용해야 한다:\n  ${problems.join('\n  ')}`,
  );
});

test('출처 — 최신 연도의 비과세 한도는 실제 조문(소득세법 제12조)을 가리킨다', () => {
  // 시행령 제17조의2를 인용하던 실제 사고를 고정한다. 그 조문은 식대와 무관하다.
  for (const year of availableYears()) {
    const src = getRates(year).nonTaxable.source;
    assert.match(
      src,
      /소득세법 제12조/,
      `${year} 식대 비과세 출처가 틀렸다 — 한도는 시행령이 아니라 법 제12조제3호에 있다: "${src}"`,
    );
    assert.equal(
      getRates(year).nonTaxable.mealAllowanceMonthlyMax,
      200000,
      `${year} 식대 비과세 한도는 2023-01-01 이후 월 20만원이다`,
    );
  }
});
