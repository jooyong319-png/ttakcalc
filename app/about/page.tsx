import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE } from '@/lib/site';
import { CATEGORIES, calcCount } from '@/lib/catalog';
import { availableYears, getRates, latestYear } from '@/lib/rates';
import s from '../legal.module.css';

export const metadata: Metadata = {
  title: '사이트 소개',
  description:
    '딱칼크는 계산 결과만 던지지 않고 어떤 수치를 어떤 순서로 적용했는지 함께 보여줍니다. 요율 검증 방식과 운영 원칙을 소개합니다.',
  alternates: { canonical: `${SITE.url}/about` },
};

// 숫자를 손으로 적지 않는다 — 계산기를 추가했는데 소개 페이지만 옛날 숫자로 남는 일을 막는다.
export default function AboutPage() {
  const years = availableYears();
  const verifiedAt = getRates(latestYear()).verifiedAt;

  return (
    <div className="container-narrow">
      <header className={s.head}>
        <p className={s.eyebrow}>사이트 소개</p>
        <h1 className={s.title}>답만 주는 계산기는 이미 많습니다</h1>
        <p className={s.lead}>
          {SITE.name}는 계산 결과와 함께 <strong>그 숫자가 어떻게 나왔는지</strong>를 보여줍니다.
          어떤 요율을, 어느 구간에, 어떤 순서로 적용했는지 명세서처럼 펼쳐 놓습니다. 결과를 믿을지
          말지는 근거를 본 다음에 정하는 편이 낫다고 생각합니다.
        </p>
      </header>

      <div className={s.body}>
        <section>
          <h2>무엇을 제공하나요</h2>
          <p>
            현재 <strong>계산기 {calcCount()}종</strong>을 {CATEGORIES.length}개 분야로 나누어
            제공합니다. 모두 무료이며 회원가입이 없습니다.
          </p>
          <ul>
            {CATEGORIES.map(c => (
              <li key={c.slug}>
                <Link href={`/c/${c.slug}`}>{c.name}</Link> — {c.tagline} (계산기 {c.calcs.length}종)
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>요율은 이렇게 관리합니다</h2>
          <p>
            계산에 쓰이는 모든 요율·세율은 <strong>공식 고시와 법령 원문</strong>을 대조해
            확인합니다. 블로그나 검색 결과 요약은 근거로 쓰지 않습니다. 옮겨 적는 과정에서 틀어진
            숫자가 그대로 퍼지는 일이 흔하기 때문입니다.
          </p>
          <ul>
            <li>
              모든 요율은 한 파일에서 연도별로 관리하며, 항목마다 <strong>출처 조문</strong>과{' '}
              <strong>최종 확인일</strong>을 함께 기록합니다.
            </li>
            <li>
              화면에 표시되는 변경 이력은 손으로 적지 않고 연도별 데이터의 차이에서 자동으로
              만들어집니다. 데이터와 설명이 어긋날 수 없는 구조입니다.
            </li>
            <li>
              현재 {years.length}개 연도({years[years.length - 1]}~{years[0]})의 제도를 보유하고
              있으며, 최신 데이터의 최종 확인일은 {verifiedAt}입니다.
            </li>
          </ul>
          <p>
            무엇이 언제 어떻게 바뀌었는지는 <Link href="/changes">제도 변화</Link> 페이지에서
            연도별로 비교해 보실 수 있습니다.
          </p>
        </section>

        <section>
          <h2>모르는 것은 계산하지 않습니다</h2>
          <p>
            그럴듯한 숫자를 만들어 내는 것보다 <strong>모른다고 말하는 편</strong>이 낫다고
            봅니다. 개인별 특별공제, 업종별 필요경비율, 은행마다 다른 환전 수수료처럼 사이트가 알 수
            없는 값은 임의로 가정하지 않습니다. 이런 항목은 직접 입력하시도록 하거나, 계산에서
            제외했다는 사실을 화면에 명시합니다.
          </p>
        </section>

        <section>
          <h2>입력하신 금액은 저장되지 않습니다</h2>
          <p>
            모든 계산은 이용자의 브라우저 안에서 이루어집니다. 연봉이든 재산이든, 입력하신 금액은
            서버로 전송되지도 저장되지도 않습니다. 자세한 내용은{' '}
            <Link href="/privacy">개인정보처리방침</Link>을 확인해 주세요.
          </p>
        </section>

        <section>
          <h2>계산 결과의 한계</h2>
          <div className={s.callout}>
            <p>
              계산 결과는 <strong>참고용 추정치</strong>입니다. 세무·법률 자문이 아니며, 실제 세액은
              개인별 공제와 과세관청의 판단에 따라 달라집니다. 중요한 판단을 앞두고 계신다면
              전문가나 관할 기관에 확인하시기 바랍니다. 자세한 내용은{' '}
              <Link href="/terms">이용약관 제6조</Link>에 있습니다.
            </p>
          </div>
        </section>

        <section>
          <h2>문의</h2>
          <p>
            계산이 이상하거나, 요율이 바뀌었는데 반영되지 않았거나, 만들었으면 하는 계산기가 있다면
            알려주세요. <strong>틀린 곳을 알려주시는 제보를 가장 반깁니다.</strong>
          </p>
          <div className={s.contact}>
            <span>
              <span className={s.contactLabel}>이메일</span>
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
