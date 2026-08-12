import type { ReactNode } from 'react';
import { linkifyLaw } from '@/lib/lawLink';
import { breadcrumbLd, categoryHrefByName, ldJson, webApplicationLd } from '@/lib/jsonLd';
import type { Tone } from '@/lib/catalog';
import styles from './CalcPage.module.css';

/** 계산기 페이지 공통 껍데기 — 제목·계산·문답·적용기준 순으로 놓는다.
 *  category는 홈의 컬러 블록과 같은 갈래라서, 어디서 들어왔든 위치를 잃지 않게 한다. */
export function CalcPage({
  category, tone, title, lead, children, faqs, basisItems, verifiedAt, year,
}: {
  category: string;
  tone: Tone;
  title: string;
  lead: ReactNode;
  children: ReactNode;
  faqs: { q: string; a: string }[];
  basisItems: string[];
  verifiedAt: string;
  year: string;
}) {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  // 눈썹줄 링크와 같은 곳을 가리켜야 한다 — 화면과 다른 경로를 마크업하면 그건 거짓말이다
  const catHref = categoryHrefByName(category);
  const crumbLd = breadcrumbLd([{ name: category, href: catHref }, { name: title }]);
  // 마지막 대조일을 그대로 쓴다. 화면의 "확인 {verifiedAt}"과 같은 날짜다.
  const appLd = webApplicationLd({
    name: title,
    description: `${category} 계산기. 적용한 요율과 근거 조문을 함께 표시합니다.`,
    dateModified: verifiedAt,
  });

  return (
    <>
      {[faqLd, crumbLd, appLd].map((ld, i) => (
        <script key={i} type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      ))}

      <div className={`container-narrow ${styles[tone]}`} style={{ paddingTop: '1.8rem' }}>
        <header className={styles.head}>
          <p className={styles.eyebrow}>
            <a href={catHref} className={styles.category}>{category}</a>
            <span aria-hidden="true"> · </span>{year}년 기준
          </p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.lead}>{lead}</p>
        </header>

        <div className={styles.body}>{children}</div>

        {faqs.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>자주 묻는 질문</h2>
            {faqs.map(f => (
              <details key={f.q} className={styles.faq}>
                <summary className={styles.faqQ}>{f.q}</summary>
                <p className={styles.faqA}>{f.a}</p>
              </details>
            ))}
          </section>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>계산에 적용된 기준</h2>
          <ul className={styles.basisList}>
            {/* 조문은 국가법령정보센터 원문으로 링크한다 — YMYL 신뢰 신호 */}
            {basisItems.map(b => <li key={b}>{linkifyLaw(b, styles.lawLink)}</li>)}
          </ul>
          <div className={styles.verified}>
            <span className="stamp">확인 {verifiedAt}</span>
            <p className={styles.verifiedNote}>
              공식 고시를 대조해 관리합니다. 제도가 바뀌면 기준도 함께 갱신하고,
              무엇이 바뀌었는지 <a href="/changes">제도 변화</a>에 기록합니다.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
