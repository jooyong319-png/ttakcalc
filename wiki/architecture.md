# 구조 (라우트 · 데이터 흐름 · 계산 로직)

검증 맥락: 2026-07-30 초기 스캐폴딩 시점.

## 스택
- Next.js 14 App Router (SSG), TypeScript, CSS Modules. 배포 예정: Vercel.
- **ko 단독** — 한국 세법·요율 기반이라 en/ja는 제도가 달라 의미가 없다(WhenStage와 다른 점).
- 외부 의존성 최소(현재 next/react만). 계산은 전부 자체 순수 함수.

## 라우트
```
/                     홈 — 계산기 카탈로그(준비 중 항목도 노출해 로드맵을 투명하게)
/calc/salary          연봉 실수령액 계산기 (첫 계산기, 완성)
/changes              제도 변화 — rates.json에서 자동 생성. 차별화 축
```
앞으로: `/calc/severance`(퇴직금) · `/calc/freelancer`(3.3%) · `/calc/unemployment`(실업급여) ·
`/calc/acquisition-tax`(취득세) · `/calc/loan`(대출) — 홈 카탈로그의 `CALCS` 배열이 로드맵이다.

## 데이터 흐름 — 이 프로젝트의 심장
```
data/rates.json  (연도별 요율·세율·한도 + source + verifiedAt)
        │
        ├─> lib/rates.ts        연도별 로더. 없는 연도는 throw(조용히 틀린 계산 금지)
        │        │
        │        └─> lib/calc/salary.ts   순수 함수. 요율을 절대 하드코딩하지 않는다
        │                 │
        │                 └─> components/SalaryCalculator.tsx  (클라이언트, 실시간 재계산)
        │
        └─> app/changes/page.tsx   같은 데이터로 "제도 변화" 페이지를 자동 생성
```
**한 데이터가 계산기와 콘텐츠를 동시에 만든다** — 제도가 바뀌면 양쪽이 같이 갱신되는 게 설계 의도.

## 계산 로직 규약
- `lib/calc/*`의 함수는 **순수 함수**: 입력 → 출력만, 전역/시간/랜덤 의존 없음.
- 반환값에 **`deductions[].basis`(사람이 읽는 계산 근거)** 를 담는다. UI는 이걸 그대로 렌더한다 —
  "결과 숫자만 던지지 않는다"는 제품 원칙이 타입 레벨에서 강제되는 구조.
- 원 단위 절사(`Math.floor(n/10)*10`)는 급여 실무 관행을 따른 것.
- 국민연금은 기준소득월액 **상·하한**이 있어 고연봉에서 보험료가 고정된다(계산에 반영됨).

## UI 원칙
- 숫자는 항상 `.num`(모노 + `tabular-nums`) — 자릿수가 흔들리면 신뢰가 깎인다.
- 결과 URL 공유: 입력값을 쿼리 파라미터로 직렬화하고, 로드 시 복원한다(`?annual=&year=&dep=…`).
- 디자인 톤: WhenStage의 "무대 조명"과 정반대인 **"서류·영수증"** — 밝은 종이 배경 + 잉크 텍스트 +
  신뢰의 파랑 단일 액센트. 공제(빠져나감)는 빨강, 실수령(남음)은 초록으로 의미를 색에 싣는다.

## 외부 연동 현황
- (없음) — 도메인·Vercel·GSC·GA4·Supabase 전부 미연결. 요율 검증 후 진행 예정.
- 통합 위키(`d:/Gcalen/wiki/`)의 검증된 패턴을 적용할 것: soft-404 방지(`dynamicParams=false`),
  사이트맵 `lastmod`에 빌드시각 금지, 구조화 데이터, axe 접근성 감사, GA4 프로덕션 전용 로드.
