// 연도별 요율 데이터에서 "무엇이 어떻게 바뀌었는지"를 뽑아낸다.
// 변경 이력을 따로 손으로 적지 않는 게 핵심 — rates.json 하나만 갱신하면 /changes가 따라온다.
// 손으로 적으면 데이터와 설명이 반드시 어긋난다.
import { getRates, availableYears, type YearRates } from './rates';

export interface RateField {
  key: string;
  label: string;
  /** 사람이 읽는 값 문자열 */
  format: (r: YearRates) => string;
  /** 비교용 원시값. 이게 같으면 "변화 없음" */
  raw: (r: YearRates) => number;
  note: (r: YearRates) => string;
  source: (r: YearRates) => string;
}

// 소수점 뒤의 남는 0만 자른다 — /\.?0+$/ 로 자르면 "40"이 "4"가 된다(lib/format.ts 주석 참고)
const pct = (n: number, digits = 3) =>
  `${(n * 100).toFixed(digits).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')}%`;
const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

export const FIELDS: RateField[] = [
  {
    key: 'nationalPension',
    label: '국민연금',
    format: r => `근로자 부담 ${pct(r.insurance.nationalPension.employeeRate)}`,
    raw: r => r.insurance.nationalPension.employeeRate,
    note: r => r.insurance.nationalPension.note,
    source: r => r.insurance.nationalPension.source,
  },
  {
    key: 'pensionCap',
    label: '국민연금 기준소득월액',
    format: r =>
      `${won(r.insurance.nationalPension.monthlyIncomeMin)} ~ ${won(r.insurance.nationalPension.monthlyIncomeMax)}`,
    raw: r => r.insurance.nationalPension.monthlyIncomeMax,
    note: () => '보험료를 매기는 소득의 상·하한. 상한을 넘는 소득은 더 내지 않는다.',
    source: r => r.insurance.nationalPension.source,
  },
  {
    key: 'healthInsurance',
    label: '건강보험',
    format: r => `근로자 부담 ${pct(r.insurance.healthInsurance.employeeRate)}`,
    raw: r => r.insurance.healthInsurance.employeeRate,
    note: r => r.insurance.healthInsurance.note,
    source: r => r.insurance.healthInsurance.source,
  },
  {
    key: 'longTermCare',
    label: '장기요양보험',
    format: r => `건강보험료의 ${pct(r.insurance.longTermCare.rateOfHealthInsurance, 2)}`,
    raw: r => r.insurance.longTermCare.rateOfHealthInsurance,
    note: r => r.insurance.longTermCare.note,
    source: r => r.insurance.longTermCare.source,
  },
  {
    key: 'employmentInsurance',
    label: '고용보험',
    format: r => `근로자 부담 ${pct(r.insurance.employmentInsurance.employeeRate, 1)}`,
    raw: r => r.insurance.employmentInsurance.employeeRate,
    note: r => r.insurance.employmentInsurance.note,
    source: r => r.insurance.employmentInsurance.source,
  },
  {
    key: 'minimumWage',
    label: '최저임금',
    format: r => `시급 ${won(r.minimumWage.hourly)}`,
    raw: r => r.minimumWage.hourly,
    note: r => r.minimumWage.note,
    source: r => r.minimumWage.source,
  },
  {
    key: 'unemploymentMax',
    label: '실업급여 상한',
    format: r => `1일 ${won(r.unemployment.dailyMax)}`,
    raw: r => r.unemployment.dailyMax,
    note: r => r.unemployment.note,
    source: r => r.unemployment.source,
  },
  {
    key: 'mealAllowance',
    label: '식대 비과세',
    format: r => `월 ${won(r.nonTaxable.mealAllowanceMonthlyMax)}`,
    raw: r => r.nonTaxable.mealAllowanceMonthlyMax,
    note: r => r.nonTaxable.note,
    source: r => r.nonTaxable.source,
  },
  {
    key: 'incomeTaxTopBracket',
    label: '소득세 최저구간',
    format: r => `${won(r.incomeTax.brackets[0].upTo ?? 0)} 이하 ${pct(r.incomeTax.brackets[0].rate, 0)}`,
    raw: r => r.incomeTax.brackets[0].upTo ?? 0,
    note: () => '과세표준 기준 기본세율 구간. 실제 원천징수는 간이세액표를 따른다.',
    source: r => r.incomeTax.source,
  },
];

export interface FieldChange {
  key: string;
  label: string;
  from: string;
  to: string;
  direction: 'up' | 'down';
  note: string;
  source: string;
}

export interface YearDiff {
  year: string;
  label: string;
  prevYear: string | null;
  verifiedAt: string;
  changes: FieldChange[];
  /** 바뀌지 않은 항목 — "동결"도 정보다 */
  unchanged: { label: string; value: string }[];
}

/** 최신 연도부터 내림차순으로, 각 연도가 직전 연도 대비 무엇이 바뀌었는지. */
export function yearDiffs(): YearDiff[] {
  const years = availableYears();               // 내림차순
  return years.map((y, i) => {
    const cur = getRates(y);
    const prevYear = years[i + 1] ?? null;      // 내림차순이므로 다음 원소가 과거
    const prev = prevYear ? getRates(prevYear) : null;

    const changes: FieldChange[] = [];
    const unchanged: { label: string; value: string }[] = [];

    for (const f of FIELDS) {
      const to = f.format(cur);
      if (!prev) { unchanged.push({ label: f.label, value: to }); continue; }
      const from = f.format(prev);
      if (f.raw(cur) === f.raw(prev)) {
        unchanged.push({ label: f.label, value: to });
      } else {
        changes.push({
          key: f.key, label: f.label, from, to,
          direction: f.raw(cur) > f.raw(prev) ? 'up' : 'down',
          note: f.note(cur), source: f.source(cur),
        });
      }
    }
    return { year: y, label: cur.label, prevYear, verifiedAt: cur.verifiedAt, changes, unchanged };
  });
}
