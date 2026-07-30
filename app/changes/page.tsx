import type { Metadata } from 'next';
import { availableYears, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: '제도 변화',
  description:
    '4대보험 요율, 세법, 최저임금 등 계산에 영향을 주는 제도가 언제 어떻게 바뀌었는지 기록합니다.',
  alternates: { canonical: 'https://ttakcalc.com/changes' },
};

// 이 페이지가 이 사이트의 차별화 축이다 — 계산기는 유입, 제도 변화 추적이 재방문·신뢰를 만든다.
// 앞으로 리서처 자동화가 여기에 항목을 쌓는다(현재는 요율 데이터에서 자동 생성).
export default function ChangesPage() {
  const years = availableYears();

  return (
    <div className="container" style={{ padding: '1.6rem 1.1rem 0' }}>
      <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 900 }}>제도 변화</h1>
      <p style={{ color: 'var(--text-soft)', margin: '0.5rem 0 1.5rem' }}>
        계산에 영향을 주는 요율·세법·지원 제도가 <strong>언제 어떻게 바뀌었는지</strong> 기록합니다.
        바뀌면 계산기도 같은 날 갱신됩니다.
      </p>

      {years.map(y => {
        const r = getRates(y);
        const items = [
          { name: '국민연금', value: `근로자 부담 ${(r.insurance.nationalPension.employeeRate * 100).toFixed(3)}%`, note: r.insurance.nationalPension.note },
          { name: '건강보험', value: `근로자 부담 ${(r.insurance.healthInsurance.employeeRate * 100).toFixed(3)}%`, note: r.insurance.healthInsurance.note },
          { name: '장기요양보험', value: `건강보험료의 ${(r.insurance.longTermCare.rateOfHealthInsurance * 100).toFixed(2)}%`, note: r.insurance.longTermCare.note },
          { name: '고용보험', value: `근로자 부담 ${(r.insurance.employmentInsurance.employeeRate * 100).toFixed(1)}%`, note: r.insurance.employmentInsurance.note },
          { name: '최저임금', value: `시급 ${r.minimumWage.hourly.toLocaleString()}원`, note: r.minimumWage.note },
          { name: '식대 비과세', value: `월 ${r.nonTaxable.mealAllowanceMonthlyMax.toLocaleString()}원`, note: r.nonTaxable.note },
        ];
        return (
          <section key={y} style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{r.label} 기준</h2>
            <p style={{ color: 'var(--text-faint)', fontSize: '0.83rem', margin: '0 0 0.8rem' }}>
              최종 확인 {r.verifiedAt}
            </p>
            <div style={{
              background: 'var(--bg-elev)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', overflow: 'hidden',
            }}>
              {items.map((it, i) => (
                <div key={it.name} style={{
                  display: 'flex', flexWrap: 'wrap', gap: '0.3rem 0.8rem',
                  alignItems: 'baseline', padding: '0.75rem 1rem',
                  borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                }}>
                  <strong style={{ minWidth: '7rem', fontSize: '0.92rem' }}>{it.name}</strong>
                  <span className="num" style={{ fontWeight: 700, color: 'var(--accent)' }}>{it.value}</span>
                  <span style={{ color: 'var(--text-faint)', fontSize: '0.82rem', flexBasis: '100%' }}>{it.note}</span>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <p style={{ color: 'var(--text-faint)', fontSize: '0.85rem' }}>
        연도별 기준을 그대로 보관하기 때문에, 계산기에서 <strong>과거 연도를 선택하면 그 시점 기준</strong>으로
        계산됩니다.
      </p>
    </div>
  );
}
