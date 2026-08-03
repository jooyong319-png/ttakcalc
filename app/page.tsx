import type { Metadata } from 'next';
import { latestYear, getRates } from '@/lib/rates';
import { CATEGORIES } from '@/lib/catalog';
import { quickAnswers } from '@/lib/quickAnswers';
import { homeProof } from '@/lib/homeProof';
import { SITE } from '@/lib/site';
import styles from './home.module.css';

const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');

/* title/description은 layout의 기본값을 그대로 쓴다. canonical만 여기서 지정한다 —
   layout에 넣으면 canonical을 빠뜨린 페이지가 전부 홈을 정본으로 가리키게 되어,
   없는 것보다 나쁜 상태가 된다. */
export const metadata: Metadata = {
  alternates: { canonical: SITE.url },
};

/* 홈 = 답이 먼저 있는 페이지.
   계산기가 25개를 넘어가면서 목록을 다 늘어놓는 건 불가능해졌다. 대신
   (1) 자주 찾는 질문의 **실제 답**을 숫자로 박아 두고
   (2) 카테고리로 나눠 각 카테고리의 대표 계산기만 보여준다.
   답은 전부 빌드 시각에 계산 함수로 구한다 — 손으로 적으면 요율이 바뀔 때 거짓말이 된다. */
export default function HomePage() {
  const rates = getRates(latestYear());
  const answers = quickAnswers();
  const proof = homeProof();

  return (
    <div className="container">
      <section className={styles.hero}>
        <h1 className={styles.title}>연봉·세금·부동산 <span className={styles.mark}>계산기</span></h1>
        <p className={styles.lead}>
          결과 숫자만 던지지 않고 <strong>어떤 요율로 얼마를 뗐는지</strong> 명세서처럼 보여드립니다.
        </p>
      </section>

      {/* 증거 — "근거를 보여준다"고 말하는 대신 실제 계산 하나를 통째로 펼쳐 놓는다.
          다른 계산기가 주는 건 왼쪽 숫자 하나뿐이다. */}
      <section className={styles.proof} aria-labelledby="proof-title">
        <div className={styles.proofHead}>
          <h2 id="proof-title" className={styles.proofTitle}>
            다른 계산기는 여기까지, <span className={styles.mark}>딱계산은 여기까지</span>
          </h2>
          <p className={styles.proofLead}>
            연봉 {proof.man.toLocaleString('ko-KR')}만원의 실수령액입니다. 숫자 하나만 받고 끝나면
            그 숫자를 믿을지 말지 판단할 수가 없습니다.
          </p>
        </div>

        <div className={styles.proofBody}>
          <div className={styles.proofOnly}>
            <span className={styles.proofOnlyTag}>보통 여기서 끝납니다</span>
            <strong className={`${styles.proofOnlyNum} num`}>
              {fmt(proof.monthlyNet)}<em>원</em>
            </strong>
            <span className={styles.proofOnlyNote}>월 실수령액</span>
          </div>

          <div className={styles.proofFull}>
            <span className={styles.proofFullTag}>딱계산이 더 보여주는 것</span>
            <table className={styles.proofTable}>
              <caption className="sr-only">
                연봉 {proof.man}만원 월 공제 명세와 각 금액의 근거
              </caption>
              <thead>
                <tr>
                  <th scope="col">공제 항목</th>
                  <th scope="col">월 금액</th>
                  <th scope="col">왜 이 금액인지</th>
                </tr>
              </thead>
              <tbody>
                {proof.rows.map(row => (
                  <tr key={row.name}>
                    <th scope="row">{row.name}</th>
                    <td className={`${styles.proofAmt} num`}>−{fmt(row.amount)}</td>
                    <td className={styles.proofBasis}>{row.basis}</td>
                  </tr>
                ))}
                <tr className={styles.proofSum}>
                  <th scope="row">공제 합계</th>
                  <td className={`${styles.proofAmt} num`}>−{fmt(proof.totalDeduction)}</td>
                  <td className={styles.proofBasis}>
                    세전 {fmt(proof.monthlyGross)}원의 {(proof.deductionRate * 100).toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>

            <details className={styles.proofSources}>
              <summary>이 계산에 쓴 요율의 출처 {proof.sources.length}건</summary>
              <ul>
                {proof.sources.map(src => <li key={src}>{src}</li>)}
              </ul>
              <p>
                모든 요율은 공식 고시·법령 원문을 대조해 확인합니다. 블로그나 검색 요약은 근거로
                쓰지 않습니다 — 옮겨 적는 과정에서 틀어진 숫자가 그대로 퍼지기 때문입니다.
              </p>
            </details>

            <a href={proof.href} className={styles.proofGo}>
              연봉 {proof.man.toLocaleString('ko-KR')}만원 전체 명세 보기 →
            </a>
          </div>
        </div>
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
