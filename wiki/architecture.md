# 구조 (라우트 · 데이터 흐름 · 계산 로직)

검증 맥락: **2026-08-13**. 계산기 32종 · 정적 708장 · 사이트맵 699 URL · 테스트 213개.
(708 = 사이트맵 699 + 임베드 8장(noindex) + 404 1장. 빌드 로그의 "716 pages"는
 Next가 라우트 단위로 세는 숫자라 산출물 수와 다르다.)
(이 문서는 2026-07-30 초기 스캐폴딩 시점 기준이었고, 롱테일 확장까지 반영해 전면 갱신했다.)

## 스택
- Next.js 14 App Router (SSG), TypeScript, CSS Modules. Vercel 배포.
- **ko 단독** — 한국 세법·요율 기반이라 en/ja는 제도가 달라 의미가 없다(WhenStage와 다른 점).
- 외부 의존성 최소. 계산은 전부 자체 순수 함수. devDependency로 axe-core만 추가(접근성 감사).

## 라우트 그룹 — 루트 레이아웃이 둘이다

```
app/
├── (site)/     사이트 전체. 헤더 네비 + 푸터 + 분석 스크립트
├── (embed)/    임베드 전용. 계산기 하나 + 출처 한 줄. 13.9KB
├── sitemap.ts  robots.ts  manifest.ts  아이콘  globals.css   ← 그룹 밖(URL 무관 특수 파일)
```

**왜 나눴나** — 임베드를 중첩 레이아웃으로 만들었더니 헤더 네비게이션이 그대로 딸려 들어갔다.
CSS로 숨기는 건 더 나쁘다: **숨겨진 링크가 위젯에 담겨 여러 사이트에 뿌려지는 것**은
검색엔진이 링크 조작이라고 콕 집어 말하는 형태다. 라우트 그룹은 URL에 나타나지 않아
기존 주소를 하나도 건드리지 않고 레이아웃만 갈랐다.

⚠️ 그룹 디렉터리는 URL에 안 나오므로 **빌드 산출물도 `(site)` 없이** 떨어진다
(`.next/server/app/salary/3000.html`). 생성물을 훑는 스크립트는 이걸 알아야 한다.

## 라우트

```
/                          홈 — 검색바(계산기 32종 + 숫자 입력 시 값별 페이지 생성)
/c/[slug]                  카테고리 허브 4개 (tax·property·finance·math)
/calc/*                    계산기 32종 — 이 사이트의 본체
/changes                   제도 변화 — rates.json 연도 차이에서 자동 생성
/corrections               정정 이력 — 우리가 틀렸던 기록 (제도 변화와 다르다)
/about /terms /privacy     운영 주체·약관·방침
/embed                     임베드 안내(코드 생성기). (site) 그룹
/embed/[calc]              임베드 본체 8종. (embed) 그룹, noindex, frame-ancestors *
```

### 프로그래매틱 (값별 페이지) — 699 URL의 대부분

```
/salary/[man]              연봉별 실수령액          106장 (100만원 단위 + 밀집 구간 50만원)
/salary/[man]/[family]     └ 부양가족 조합           51장 (라운드 넘버 × 2·3·4명)
/salary/compare/[pair]     연봉 A vs B 비교          31장 (인접 500만·1,000만원 쌍)
/gift-tax/[man]            증여세                   100장
/net-salary/[man]          월 실수령 → 필요 연봉      56장
/dividend-tax/[man]        배당소득세                40장
/acquisition-tax/[man]     취득세                    39장
/brokerage-fee/[man]       중개보수                  39장
/inheritance-tax/[man]     상속세                    30장
/annual-leave/[years]      근속연수별 연차            30장
/property-tax/[man]        재산세                    29장
/car-tax/[cc]              배기량별 자동차세          23장
/car-tax/[cc]/[age]        └ 연식 조합               72장 (주력 6종 × 차령 1~12년)
```

각 라우트에는 **목록 페이지**(`/salary`, `/car-tax` …)가 있다. 이게 없으면 값별 페이지가
사이트맵과 앞뒤 링크로만 닿아 크롤 순위가 밀린다(2026-08-10에 279장이 "발견됨-색인 안 됨"으로
잡힌 원인이었다). 목록 페이지는 그 자체로 "○○ 표" 검색도 받는다.

`dynamicParams = false` — 범위 밖(`/salary/1234`)은 얇은 페이지를 만들지 않고 404.

## 컴포넌트 구조

- `Breakdown.tsx` — **모든 계산기가 공유하는 결과 UI.** 헤드라인 + 근거 테이블.
  `Row.basis`(계산 근거)를 받도록 설계해 "숫자만 던지지 않는다"는 원칙이 UI에서 강제된다.
  **계산 사용 측정도 여기 한 곳에 있다**(→ [[decisions]]).
- `CalcPage.tsx` — 계산기 페이지 껍데기. 제목·리드·계산기·FAQ·적용기준 + JSON-LD 3종.
  적용기준의 조문은 `lib/lawLink.tsx`가 국가법령정보센터 원문으로 링크한다.
- `AnswerPage.tsx` — 값별 페이지 껍데기(`AnswerSection`/`AnswerTable`/`Assumptions`/`AnswerNav`).
- `RouteIndex.tsx` — 값별 라우트의 목록 페이지. Dataset JSON-LD를 낸다.
- `EmbedPicker.tsx` / `EmbedAutoHeight.tsx` — 임베드 코드 생성기와 높이 통지.
- `*Calculators.tsx` — 계산기별 입력 UI(클라이언트). 대부분 `{ year }`만 받는다.

## 데이터 흐름 — 이 프로젝트의 심장

```
data/rates.json  (연도별 요율·세율·한도 + source + verifiedAt)
        │
        ├─> lib/rates.ts        연도별 로더. 없는 연도는 throw(조용히 틀린 계산 금지)
        │        │
        │        ├─> lib/calc/*.ts   순수 함수 14개 파일. 요율을 절대 하드코딩하지 않는다
        │        │        ├─> components/*Calculators.tsx  (클라이언트, 실시간 재계산)
        │        │        └─> lib/*Pages.ts → 값별 정적 페이지 (빌드 시)
        │        │
        │        └─> lib/insights.ts   "그 값에서만 성립하는 문장"을 계산에서 뽑는다
        │
        ├─> app/(site)/changes         같은 데이터로 "제도 변화" 자동 생성
        └─> lib/jsonLd → dateModified  모든 verifiedAt 중 최댓값
```

**한 데이터가 계산기와 콘텐츠를 동시에 만든다** — 제도가 바뀌면 양쪽이 같이 갱신되는 게 설계 의도.

`data/corrections.json`은 별도 계보다. 요율 데이터가 **지금 무엇이 맞는지**를 담는다면,
이쪽은 **우리가 무엇을 틀렸었는지**를 담는다. 섞으면 우리 실수가 제도 개정처럼 보인다.

## 계산 로직 규약

- `lib/calc/*`의 함수는 **순수 함수**: 입력 → 출력만, 전역/시간/랜덤 의존 없음.
- 반환값에 **`deductions[].basis`(사람이 읽는 계산 근거)** 를 담는다. UI는 이걸 그대로 렌더한다.
- 원 단위 절사(`Math.floor(n/10)*10`)는 급여 실무 관행.
- 국민연금은 기준소득월액 **상·하한**이 있어 고연봉에서 보험료가 고정된다.
- `SalaryResult.annualTaxBase` — 화면에 직접 쓰진 않지만 "이 구간에서 세율이 올라간다"고
  말할 근거다. 계산기 밖에서 다시 구하면 두 곳이 어긋나므로 결과에 실어 보낸다.

## 구조화 데이터 (`lib/jsonLd.tsx`)

| 타입 | 어디에 | 개수 |
|---|---|---:|
| Organization / WebSite | 루트 레이아웃 | 전 페이지 |
| BreadcrumbList | CalcPage · AnswerPage · RouteIndex | 전 페이지 |
| FAQPage | 계산기 + 값별 페이지 | 499+ |
| WebApplication | 계산기 | 32 |
| Dataset | 목록 페이지 | 10 |

원칙은 하나 — **화면에 없는 것은 마크업하지 않는다.** breadcrumb의 마지막 항목에 URL을
넣지 않는 이유도 여기 있다(→ [[decisions]]).

## 외부 연동 현황

- **Vercel** — ttakcalc.com. apex/www 정본은 **Vercel 도메인 설정 한 곳에서만** 정한다
  (코드가 같은 판단을 중복하면 리다이렉트 루프가 난다. 2026-08-03 사고).
- **GA4** `G-RS0PLXVBPQ` — 프로덕션에서만 로드. `next/script`가 아니라 **생 `<script>`**
  (App Router SSR에서 afterInteractive는 실제 태그를 안 남긴다).
- **GSC · 네이버 서치어드바이저** — 소유 확인 완료, 사이트맵 제출됨.
- **한국수출입은행 환율 API** — `KOREAEXIM_API_KEY`는 `.env.local`에만(gitignore).
- CSP `frame-ancestors`: 기본 `'self'` + 구글 태그 어시스턴트, `/embed/*`만 `*`.
  ⚠️ 한 응답에 CSP가 두 번 붙으면 좁은 쪽이 이기므로, 기본 규칙 경로에서 `/embed/`를 뺐다.

## 검증 도구

- `npm test` — 213개. 계산값 + **출처**(`sources.test.ts`) + **고유성**(`insights.test.ts`)
  + 구조화 데이터 요구사항.
- `npm run axe` — light/dark × desktop/mobile 접근성. 대비 위반은 한쪽 테마에서만,
  레이아웃 위반은 좁은 화면에서만 나서 한 조합만 보면 절반을 놓친다.
- `scripts/make-og.mjs`, `make-icons.mjs` — 이미지 안 숫자를 손으로 적지 않고 함수에서 가져온다.
