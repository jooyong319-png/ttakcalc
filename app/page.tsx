import { latestYear, getRates } from '@/lib/rates';
import { CATEGORIES } from '@/lib/catalog';
import { quickAnswers } from '@/lib/quickAnswers';
import styles from './home.module.css';

/* 홈 = 답이 먼저 있는 페이지.
   계산기가 25개를 넘어가면서 목록을 다 늘어놓는 건 불가능해졌다. 대신
   (1) 자주 찾는 질문의 **실제 답**을 숫자로 박아 두고
   (2) 카테고리로 나눠 각 카테고리의 대표 계산기만 보여준다.
   답은 전부 빌드 시각에 계산 함수로 구한다 — 손으로 적으면 요율이 바뀔 때 거짓말이 된다. */
export default function HomePage() {
  const rates = getRates(latestYear());
  const answers = quickAnswers();

  return (
    <div className="container">
      <section className={styles.hero}>
        <h1 className={styles.title}>연봉·세금·부동산 <span className={styles.mark}>계산기</span></h1>
        <p className={styles.lead}>
          결과 숫자만 던지지 않고 <strong>어떤 요율로 얼마를 뗐는지</strong> 명세서처럼 보여드립니다.
        </p>
      </section>

      {/* 답이 먼저 — 한 번 더 누르지 않아도 숫자가 보인다 */}
      <section className={styles.qaSection}>
        <h2 className={styles.sectionTitle}>자주 찾는 답</h2>
        <ul className={styles.qaGrid}>
          {answers.map(a => (
            <li key={a.href} className={styles[a.tone]}>
              <a href={a.href} className={styles.qa}>
                <span className={styles.qaQ}>{a.question}</span>
                <strong className={`${styles.qaA} num`}>{a.answer}</strong>
                <span className={styles.qaNote}>{a.note}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className={styles.qaFoot}>
          {rates.label} 기준 · 부양가족 본인 1명 · 월 비과세액 {rates.nonTaxable.mealAllowanceMonthlyMax.toLocaleString('ko-KR')}원 기준.
          조건을 바꾸려면 각 계산기에서 직접 넣으세요.
        </p>
      </section>

      {/* 카테고리 — 대표 계산기만 보여주고 나머지는 허브로 */}
      {CATEGORIES.map(c => {
        const featured = c.calcs.filter(x => x.featured);
        const rest = c.calcs.length - featured.length;
        return (
          <section key={c.slug} className={`${styles.group} ${styles[c.tone]}`}>
            <div className={styles.groupHead}>
              <h2 className={styles.groupTitle}>
                <span className={styles.groupIcon} aria-hidden="true">{c.icon}</span>
                {c.name}
              </h2>
              <span className={styles.groupTagline}>{c.tagline}</span>
              <a href={`/c/${c.slug}`} className={styles.groupMore}>
                전체 {c.calcs.length}개 →
              </a>
            </div>
            <ul className={styles.cards}>
              {featured.map(x => (
                <li key={x.href}>
                  <a href={x.href} className={styles.card}>
                    <span className={styles.cardIcon} aria-hidden="true">{x.icon}</span>
                    <span className={styles.cardName}>{x.name}</span>
                    <span className={styles.cardDesc}>{x.desc}</span>
                    <span className={styles.cardGo}>계산하기 →</span>
                  </a>
                </li>
              ))}
              {rest > 0 && (
                <li>
                  <a href={`/c/${c.slug}`} className={`${styles.card} ${styles.cardMore}`}>
                    <span className={styles.cardIcon} aria-hidden="true">+</span>
                    <span className={styles.cardName}>{c.name} 계산기 {rest}개 더</span>
                    <span className={styles.cardDesc}>
                      {c.calcs.filter(x => !x.featured).slice(0, 3).map(x => x.name).join(' · ')}
                      {rest > 3 ? ' 외' : ''}
                    </span>
                    <span className={styles.cardGo}>전체 보기 →</span>
                  </a>
                </li>
              )}
            </ul>
          </section>
        );
      })}

      <aside className={styles.band}>
        <div className={styles.bandBody}>
          <h2 className={styles.bandTitle}>제도는 바뀝니다. 계산은 항상 최신으로.</h2>
          <p className={styles.bandText}>
            4대보험·최저임금·실업급여·세율을 <strong>공식 고시로 대조해</strong> 관리합니다.
            바뀌면 계산기도 같은 날 갱신하고, 무엇이 어떻게 바뀌었는지 기록으로 남깁니다.
          </p>
        </div>
        <div className={styles.bandSide}>
          <a href="/changes" className={styles.bandLink}>제도 변화 보기 →</a>
          <p className={styles.bandMeta}>
            {rates.label} 기준 · 최종 확인 {rates.verifiedAt}
          </p>
        </div>
      </aside>
    </div>
  );
}
