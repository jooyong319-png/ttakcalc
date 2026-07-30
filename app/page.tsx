import { latestYear, getRates } from '@/lib/rates';

// 계산기 카탈로그 — 준비된 것만 링크, 나머지는 "준비 중"으로 로드맵을 투명하게 보여준다.
const CALCS = [
  { href: '/calc/salary', name: '연봉 실수령액', desc: '4대보험·세금 공제 내역까지', group: '급여·노동', ready: true },
  { href: '/calc/severance', name: '퇴직금', desc: '평균임금 기준 예상 퇴직금', group: '급여·노동', ready: false },
  { href: '/calc/unemployment', name: '실업급여', desc: '구직급여 일액·수급 기간', group: '급여·노동', ready: false },
  { href: '/calc/holiday-pay', name: '주휴수당', desc: '주 15시간 이상 근무 시', group: '급여·노동', ready: false },
  { href: '/calc/freelancer', name: '프리랜서 3.3%', desc: '원천징수 후 실수령액', group: '급여·노동', ready: false },
  { href: '/calc/acquisition-tax', name: '취득세', desc: '주택 취득 시 세금', group: '부동산', ready: false },
  { href: '/calc/brokerage-fee', name: '중개수수료', desc: '거래금액별 상한요율', group: '부동산', ready: false },
  { href: '/calc/loan', name: '대출 이자', desc: '원리금균등·원금균등 비교', group: '금융', ready: false },
];

export default function HomePage() {
  const year = latestYear();
  const rates = getRates(year);
  const groups = ['급여·노동', '부동산', '금융'];

  return (
    <div className="container" style={{ padding: '2rem 1.1rem 0' }}>
      <section style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 'clamp(1.7rem, 5vw, 2.4rem)', fontWeight: 900, letterSpacing: '-0.035em' }}>
          제도는 바뀝니다.<br />계산은 <span style={{ color: 'var(--accent)' }}>항상 최신</span>으로.
        </h1>
        <p style={{ color: 'var(--text-soft)', marginTop: '0.7rem', fontSize: '1.02rem' }}>
          연봉·세금·부동산 계산기. 결과 숫자만 던지지 않고 <strong>왜 그 금액인지 근거까지</strong> 보여드립니다.
        </p>
        <p style={{ color: 'var(--text-faint)', marginTop: '0.4rem', fontSize: '0.88rem' }}>
          현재 {rates.label} 기준 · 최종 확인 {rates.verifiedAt}
        </p>
      </section>

      {groups.map(g => (
        <section key={g} style={{ marginBottom: '1.6rem' }}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-faint)', letterSpacing: '0.04em', marginBottom: '0.7rem' }}>
            {g}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.7rem' }}>
            {CALCS.filter(c => c.group === g).map(c => {
              const inner = (
                <>
                  <span style={{ fontWeight: 800, fontSize: '1rem' }}>{c.name}</span>
                  <span style={{ color: 'var(--text-faint)', fontSize: '0.83rem' }}>{c.desc}</span>
                  {!c.ready && (
                    <span style={{
                      alignSelf: 'flex-start', marginTop: '0.15rem', padding: '0.1rem 0.45rem',
                      fontSize: '0.7rem', fontWeight: 700, borderRadius: 999,
                      background: 'var(--bg-sunken)', color: 'var(--text-faint)',
                    }}>준비 중</span>
                  )}
                </>
              );
              const style: React.CSSProperties = {
                display: 'flex', flexDirection: 'column', gap: '0.2rem',
                padding: '0.9rem 1rem',
                background: 'var(--bg-elev)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow-sm)',
                opacity: c.ready ? 1 : 0.6,
              };
              return c.ready
                ? <a key={c.href} href={c.href} style={style}>{inner}</a>
                : <div key={c.href} style={style}>{inner}</div>;
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
