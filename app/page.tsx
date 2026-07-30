import { latestYear, getRates } from '@/lib/rates';
import styles from './home.module.css';

// 홈 = 계산기 카탈로그를 "전표 묶음"처럼 나열한다.
const CALCS = [
  { no: '01', href: '/calc/salary', name: '연봉 실수령액', desc: '4대보험·세금 공제 내역까지', group: '급여·노동' },
  { no: '02', href: '/calc/severance', name: '퇴직금', desc: '평균임금 기준 예상 퇴직금', group: '급여·노동' },
  { no: '03', href: '/calc/unemployment', name: '실업급여', desc: '구직급여 일액·수급 기간', group: '급여·노동' },
  { no: '04', href: '/calc/holiday-pay', name: '주휴수당', desc: '주 15시간 이상 근무 시', group: '급여·노동' },
  { no: '05', href: '/calc/freelancer', name: '프리랜서 3.3%', desc: '원천징수 후 실수령액', group: '급여·노동' },
  { no: '06', href: '/calc/acquisition-tax', name: '취득세', desc: '주택 취득 시 세금', group: '부동산' },
  { no: '07', href: '/calc/brokerage-fee', name: '중개수수료', desc: '거래금액별 상한요율', group: '부동산' },
  { no: '08', href: '/calc/loan', name: '대출 이자', desc: '원리금균등·원금균등 비교', group: '금융' },
];

export default function HomePage() {
  const year = latestYear();
  const rates = getRates(year);
  const groups = ['급여·노동', '부동산', '금융'];

  return (
    <div className="container" style={{ paddingTop: '2.2rem' }}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>계산 근거를 전부 보여주는 계산기</p>
        <h1 className={styles.title}>
          제도는 바뀝니다.<br />계산은 <span className={styles.mark}>항상 최신</span>으로.
        </h1>
        <p className={styles.lead}>
          연봉·세금·부동산 계산기. 결과 숫자만 던지지 않고 <strong>어떤 요율로 얼마를 뗐는지</strong>{' '}
          명세서처럼 보여드립니다.
        </p>
        <div className={styles.stampRow}>
          <span className="stamp">
            {rates.label} 기준<br />확인 {rates.verifiedAt}
          </span>
          <span className={styles.stampNote}>
            4대보험·최저임금·실업급여·세율을<br />공식 고시로 대조해 관리합니다.
          </span>
        </div>
      </section>

      <div className="perforation" />

      {groups.map(g => (
        <section key={g} className={styles.group}>
          <h2 className={styles.groupTitle}>{g}</h2>
          <ul className={styles.list}>
            {CALCS.filter(c => c.group === g).map(c => (
              <li key={c.href}>
                <a href={c.href} className={styles.item}>
                  <span className={`${styles.no} num`}>{c.no}</span>
                  <span className={styles.itemBody}>
                    <span className={styles.itemName}>{c.name}</span>
                    <span className={styles.itemDesc}>{c.desc}</span>
                  </span>
                  <span className={styles.arrow}>계산 →</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
