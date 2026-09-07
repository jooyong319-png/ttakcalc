import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE } from '@/lib/site';
import {
  monthsWithEvents, eventsInMonth, parseMonth, neighborMonths, CALENDAR_VERIFIED_AT,
} from '@/lib/taxCalendar';
import { postsForCalc } from '@/lib/blog';
import { breadcrumbLd, ldJson } from '@/lib/jsonLd';
import { linkifyLaw } from '@/lib/lawLink';
import s from '../calendar.module.css';

/**
 * "9월에 내는 세금" 검색을 받는 페이지.
 *
 * 달력 한 장에 1년치를 다 넣어 두면 "9월 재산세"로 들어온 사람이 자기 달을 찾아 스크롤해야
 * 한다. 달마다 페이지를 나누면 검색 결과에서 바로 그 달로 닿는다.
 *
 * **일정이 있는 달만 만든다.** 4·6·8·10·11월은 법정 기한이 없는데, "이번 달은 낼 세금이
 * 없습니다"만 적힌 페이지 네 장은 서로 내용이 거의 같아져 도어웨이가 된다.
 *
 * URL에 연도를 넣지 않는다 — 세금 일정은 매년 같은 날에 돌아오므로 `/calendar/9`는
 * 내년에도 그대로 쓰인다.
 */
export function generateStaticParams() {
  return monthsWithEvents().map(m => ({ month: String(m) }));
}
export const dynamicParams = false;

export function generateMetadata({ params }: { params: { month: string } }): Metadata {
  const month = parseMonth(params.month);
  if (month === null) return {};
  const events = eventsInMonth(month);
  const names = events.map(e => e.name.replace(/\s*\([^)]*\)/g, '')).join('·');
  return {
    title: `${month}월에 내는 세금 — ${names}`,
    description:
      `${month}월 세금 납부·신고 기한을 정리했습니다. ${events.map(e =>
        `${e.name} ${Number(e.from.slice(0, 2))}월 ${Number(e.from.slice(3))}일~${Number(e.to.slice(3))}일`
      ).join(', ')}. 근거 조문과 계산기를 함께 연결했습니다.`,
    alternates: { canonical: `${SITE.url}/calendar/${month}` },
  };
}

export default function MonthPage({ params }: { params: { month: string } }) {
  const month = parseMonth(params.month);
  if (month === null) notFound();

  const events = eventsInMonth(month);
  const { prev, next } = neighborMonths(month);

  const crumbLd = breadcrumbLd([
    { name: '세금 달력', href: '/calendar' },
    { name: `${month}월` },
  ]);

  const day = (mmdd: string) => Number(mmdd.slice(3));

  return (
    <div className="container-narrow" style={{ paddingTop: '1.8rem' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(crumbLd) }} />

      <header className={s.head}>
        <p className={s.eyebrow}>
          <Link href="/calendar">세금 달력</Link>
        </p>
        <h1 className={s.title}>
          <span className="num">{month}</span>월에 내는 세금
        </h1>
        <p className={s.lead}>
          {month}월에는 <strong>{events.length}가지</strong> 법정 기한이 있습니다.
          아래는 법이 정한 기간이고, 실제 고지서의 납부기한은 지자체 조례나 개별 사정에 따라
          다를 수 있습니다.
        </p>
      </header>

      <div className={s.body}>
        {events.map(e => {
          // 이 세목을 다룬 글이 있으면 함께 건다. 없으면 아무것도 안 나온다.
          const related = e.calc ? postsForCalc(e.calc) : [];
          return (
            <section key={e.id} className={s.month}>
              <h2 className={s.monthTitle}>{e.name}</h2>
              <ul className={s.events}>
                <li className={s.event}>
                  <div className={s.eventHead}>
                    <h3 className={s.eventName}>납부·신고 기간</h3>
                    <span className={`${s.period} num`}>
                      {month}.{e.from.slice(3)} ~ {Number(e.to.slice(0, 2))}.{e.to.slice(3)}
                    </span>
                  </div>
                  <p className={s.what}>{e.what}</p>
                  <p className={s.note}>{e.note}</p>
                  <p className={s.meta}>
                    <span className={s.law}>{linkifyLaw(e.law, s.lawLink)}</span>
                    <Link href={e.calc} className={s.calcLink}>{e.calcLabel}</Link>
                  </p>
                </li>
              </ul>

              {related.length > 0 && (
                <ul className={s.related}>
                  {related.map(p => (
                    <li key={p.slug}>
                      <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                      <span className={s.relatedDesc}>{p.description}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <nav className={s.monthNav} aria-label="다른 달 보기">
        {prev !== null && (
          <Link href={`/calendar/${prev}`}>← {prev}월에 내는 세금</Link>
        )}
        <Link href="/calendar">1년 전체 보기</Link>
        {next !== null && (
          <Link href={`/calendar/${next}`}>{next}월에 내는 세금 →</Link>
        )}
      </nav>

      <section className={s.outro}>
        <p>
          법정 기한이 없는 달(4·6·8·10·11월)은 페이지를 만들지 않았습니다. 낼 세금이 없다는
          말만 적힌 페이지는 도움이 되지 않기 때문입니다.
        </p>
        <div className={s.verified}>
          <span className="stamp">확인 {CALENDAR_VERIFIED_AT}</span>
          <p>
            기한은 전부 법령 원문을 대조해 넣었습니다. 제도가 바뀌면{' '}
            <Link href="/changes">제도 변화</Link>에, 우리가 틀렸던 것은{' '}
            <Link href="/corrections">정정 이력</Link>에 남깁니다.
          </p>
        </div>
      </section>
    </div>
  );
}
