import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE } from '@/lib/site';
import { TAX_EVENTS, CALENDAR_VERIFIED_AT } from '@/lib/taxCalendar';
import { UpcomingTax } from '@/components/UpcomingTax';
import { breadcrumbLd, ldJson } from '@/lib/jsonLd';
import { linkifyLaw } from '@/lib/lawLink';
import s from './calendar.module.css';

/** 페이지 설명. 검색 결과 스니펫과 구조화 데이터가 같은 문장을 쓰도록 한곳에 둔다. */
const DESCRIPTION =
  '재산세·종합소득세·연말정산·종합부동산세를 언제 내고 언제 신고하는지 법정 기한을 '
  + '한 표에 정리했습니다. 세목마다 근거 조문과 계산기를 함께 연결했습니다.';

export const metadata: Metadata = {
  title: '세금 달력 — 언제 무엇을 내나',
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}/calendar` },
};

/**
 * 세금 달력.
 *
 * 계산기는 "얼마인가"에 답하지만 "지금 해야 하나"에는 답하지 못했다. 재산세 납부가
 * 코앞인데 그걸 알려 주는 페이지가 한 장도 없었다(2026-08-23).
 *
 * 담는 것은 **법정 기한뿐**이다. 국세청 실무 관행이나 지자체별 운영은 넣지 않는다 —
 * 조문으로 확인할 수 없는 것은 이 사이트가 다루지 않는 종류의 정보다.
 */
export default function CalendarPage() {
  const crumbLd = breadcrumbLd([{ name: '세금 달력' }]);

  // 월별로 묶는다. 검색은 "9월 재산세"처럼 달과 함께 오는 경우가 많다.
  const byMonth = new Map<string, typeof TAX_EVENTS>();
  for (const e of TAX_EVENTS) {
    const m = e.from.slice(0, 2);
    byMonth.set(m, [...(byMonth.get(m) ?? []), e]);
  }

  return (
    <div className="container-narrow" style={{ paddingTop: '1.8rem' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(crumbLd) }} />

      <header className={s.head}>
        <p className={s.eyebrow}>세금 달력</p>
        <h1 className={s.title}>언제 무엇을 내나</h1>
        <p className={s.lead}>
          세금은 매년 같은 시기에 돌아옵니다. 재산세는 7월과 9월, 종합소득세는 5월,
          연말정산은 2월. <strong>법이 정한 기한만</strong> 모아 두었고, 세목마다 근거 조문과
          계산기를 함께 걸었습니다.
        </p>
      </header>

      {/* 오늘 기준 임박한 것. 클라이언트에서 계산한다 — 정적 생성이라 서버에서 하면 굳는다. */}
      <UpcomingTax />

      <div className={s.body}>
        {Array.from(byMonth.entries()).map(([month, events]) => (
          <section key={month} className={s.month}>
            <h2 className={s.monthTitle}>
              <span className="num">{Number(month)}</span>월
            </h2>
            <ul className={s.events}>
              {events.map(e => (
                <li key={e.id} className={s.event}>
                  <div className={s.eventHead}>
                    <h3 className={s.eventName}>{e.name}</h3>
                    <span className={`${s.period} num`}>
                      {Number(e.from.slice(0, 2))}.{e.from.slice(3)} ~ {Number(e.to.slice(0, 2))}.{e.to.slice(3)}
                    </span>
                  </div>
                  <p className={s.what}>{e.what}</p>
                  <p className={s.note}>{e.note}</p>
                  <p className={s.meta}>
                    <span className={s.law}>{linkifyLaw(e.law, s.lawLink)}</span>
                    <Link href={e.calc} className={s.calcLink}>{e.calcLabel}</Link>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className={s.outro}>
        <h2 className={s.outroTitle}>여기 없는 세목이 있습니다</h2>
        <p>
          <strong>자동차세 정기분</strong>과 <strong>부가가치세 일반과세자</strong>의 기한은
          넣지 않았습니다. 해당 조문이 표 형태라 국가법령정보센터 원문에서 확인하지 못했습니다.
          아는 값을 못 싣는 건 아쉽지만, 확인하지 못한 값을 그럴듯하게 적는 것보다 낫다고
          생각합니다. 원문을 대조하는 대로 채우겠습니다.
        </p>
        <p>
          여기 적힌 기한은 <strong>법이 정한 기간</strong>입니다. 실제 고지서의 납부기한은
          지자체 조례나 개별 사정에 따라 다를 수 있으니 고지서를 확인해 주세요.
        </p>
        <div className={s.verified}>
          <span className="stamp">확인 {CALENDAR_VERIFIED_AT}</span>
          <p>
            제도가 바뀌면 <Link href="/changes">제도 변화</Link>에 기록하고, 우리가 틀렸던 것은{' '}
            <Link href="/corrections">정정 이력</Link>에 남깁니다.
          </p>
        </div>
      </section>
    </div>
  );
}
