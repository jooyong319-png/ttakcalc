# 구조 (라우트 · 데이터 흐름 · 계산 로직)

검증 맥락: 2026-07-30 초기 스캐폴딩 시점.

## 스택
- Next.js 14 App Router (SSG), TypeScript, CSS Modules. 배포 예정: Vercel.
- **ko 단독** — 한국 세법·요율 기반이라 en/ja는 제도가 달라 의미가 없다(WhenStage와 다른 점).
- 외부 의존성 최소(현재 next/react만). 계산은 전부 자체 순수 함수.

## 라우트 (계산기 8종 완성, 2026-07-30)
```
/                          홈 — 계산기 카탈로그. CALCS 배열이 곧 로드맵
/changes                   제도 변화 — rates.json에서 자동 생성. 차별화 축
급여·노동
  /calc/salary             연봉 실수령액 (4대보험·소득세 공제 내역)
  /calc/severance          퇴직금 (1일 평균임금 → 30일분 × 재직연수)
  /calc/unemployment       실업급여 (구직급여 일액·소정급여일수, 상·하한)
  /calc/holiday-pay        주휴수당 (주 15h 이상, 40h 미만은 비례)
  /calc/freelancer         프리랜서 3.3% (실수령 ↔ 계약금액 양방향)
부동산
  /calc/acquisition-tax    취득세 (+지방교육세·농특세, 다주택 중과)
  /calc/brokerage-fee      중개보수 (매매/임대차 상한요율·한도액·VAT)
금융
  /calc/loan               대출 (원리금균등·원금균등·만기일시)
```

## 컴포넌트 구조
- `components/Breakdown.tsx` — **모든 계산기가 공유하는 결과 UI.** 헤드라인 + 근거 테이블.
  `Row.basis`(계산 근거)를 받도록 설계해 "숫자만 던지지 않는다"는 원칙이 UI 레벨에서 강제된다.
  `InputCard`/`Field`와 공용 CSS(`Breakdown.module.css`: input/grid/segment/chip)도 여기 있다.
- `components/CalcPage.tsx` — 계산기 페이지 껍데기(제목·리드·계산기·FAQ·적용기준·FAQPage JSON-LD).
  새 계산기를 추가할 때 이 둘만 조합하면 되므로 페이지 파일은 30줄 안팎으로 유지된다.
- `components/LaborCalculators.tsx` / `PropertyCalculators.tsx` — 계산기별 입력 UI(클라이언트).

## 데이터 흐름 — 이 프로젝트의 심장
```
data/rates.json  (연도별 요율·세율·한도 + source + verifiedAt)
        │
        ├─> lib/rates.ts        연도별 로더. 없는 연도는 throw(조용히 틀린 계산 금지)
        │        │
        │        ├─> lib/calc/salary.ts    연봉 실수령액
        │        ├─> lib/calc/labor.ts     퇴직금·프리랜서·실업급여·주휴수당
        │        └─> lib/calc/property.ts  취득세·중개보수·대출
        │                 │  (전부 순수 함수. 요율을 절대 하드코딩하지 않는다)
        │                 └─> components/*Calculators.tsx (클라이언트, 실시간 재계산)
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
