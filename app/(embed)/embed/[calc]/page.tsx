import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { availableYears, latestYear, getRates } from '@/lib/rates';
import { EMBEDS, findEmbed } from '@/lib/embeds';
import { SITE } from '@/lib/site';
import { SalaryCalculator } from '@/components/SalaryCalculator';
import { SeveranceCalc, HolidayPayCalc } from '@/components/LaborCalculators';
import { AcquisitionTaxCalc, BrokerageCalc, LoanCalc } from '@/components/PropertyCalculators';
import { CarTaxCalc } from '@/components/TaxCalculators';
import { VatCalc } from '@/components/BasicCalculators';
import { EmbedAutoHeight } from '@/components/EmbedAutoHeight';
import s from './embed.module.css';

export const dynamicParams = false;
export const generateStaticParams = () => EMBEDS.map(e => ({ calc: e.slug }));

export function generateMetadata({ params }: { params: { calc: string } }): Metadata {
  const spec = findEmbed(params.calc);
  return { title: spec ? `${spec.name} (임베드)` : '임베드' };
}

export default function EmbedPage({ params }: { params: { calc: string } }) {
  const spec = findEmbed(params.calc);
  if (!spec) notFound();

  const year = latestYear();
  const years = availableYears();
  const rates = getRates(year);

  // 계산기는 전부 { year }만 받는다. 연봉만 연도 선택이 있어 예외.
  const body = {
    salary: <SalaryCalculator years={years} defaultYear={year} />,
    severance: <SeveranceCalc year={year} />,
    'holiday-pay': <HolidayPayCalc year={year} minimumWage={rates.minimumWage.hourly} />,
    'acquisition-tax': <AcquisitionTaxCalc year={year} />,
    'brokerage-fee': <BrokerageCalc year={year} />,
    'car-tax': <CarTaxCalc year={year} />,
    vat: <VatCalc year={year} />,
    loan: <LoanCalc year={year} />,
  }[spec.slug];

  return (
    <main className={s.frame}>
      <EmbedAutoHeight />
      <header className={s.head}>
        <h1 className={s.title}>{spec.name}</h1>
        <span className={s.year}>{year}년 기준</span>
      </header>

      <div className={s.body}>{body}</div>

      {/* 임베드 안에서도 원본으로 가는 길은 열어 둔다. 다만 이 링크는 검색엔진에게
          백링크로 계산되지 않는다 — iframe은 별개 문서다. 실제 앵커는 임베드 코드의
          iframe 바깥에 있다. 여기 있는 건 순전히 사람이 눌러서 오라고 두는 것이다. */}
      <footer className={s.foot}>
        <a href={`${SITE.url}${spec.href}?utm_source=embed&utm_medium=widget&utm_campaign=${spec.slug}`}
          target="_blank" rel="noopener">
          {SITE.name}에서 자세히 보기 — 계산 근거와 적용 조문까지
        </a>
      </footer>
    </main>
  );
}
