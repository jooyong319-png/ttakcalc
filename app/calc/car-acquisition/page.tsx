import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { CarAcquisitionCalc } from '@/components/ExtraCalculators';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: '자동차 취득세 계산기',
  description:
    '차량 가격으로 자동차 취득세를 계산합니다. 승용 7%, 경차 4%, 이륜차 2% 등 종류별 세율을 근거와 함께 보여드립니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/car-acquisition' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);
  return (
    <CalcPage
      category="금융·자동차"
      tone="c3"
      year={year}
      title="자동차 취득세 계산기"
      lead={
        <>
          차를 살 때 내는 <strong>취득세</strong>를 계산합니다. 매년 내는{' '}
          <a href="/calc/car-tax">자동차세</a>와는 다른 세금입니다.
        </>
      }
      verifiedAt={r.verifiedAt}
      faqs={[
        { q: '취득세율이 얼마인가요?',
          a: '비영업용 승용차는 7%입니다. 경차(승용)는 4%, 승합·화물 등 그 밖의 자동차는 비영업용 5%·영업용 4%, 이륜차는 2%입니다.' },
        { q: '자동차세와 뭐가 다른가요?',
          a: '취득세는 차를 살 때 한 번 내고, 자동차세는 보유하는 동안 매년 냅니다. 취득세는 가격 기준이고 자동차세는 배기량 기준이라 계산 방식도 완전히 다릅니다.' },
        { q: '경차는 취득세가 없다던데요?',
          a: '지방세특례제한법에 따라 감면되지만 한도가 있고 요건과 금액이 해마다 바뀝니다. 이 계산기는 표준세율만 보여주므로 실제 감면액은 위택스나 등록 대행처에서 확인하세요.' },
        { q: '공채매입비도 포함인가요?',
          a: '아닙니다. 도시철도채권·지역개발채권 매입 부담은 지자체마다 달라 따로 듭니다. 즉시 매도하면 할인율만큼만 실제 비용이 됩니다.' },
      ]}
      basisItems={[
        ...r.carAcquisitionTax.rates.map(t => `${t.label} ${(t.rate * 100).toFixed(0)}%`),
        r.carAcquisitionTax.source,
      ]}
    >
      <CarAcquisitionCalc year={year} />
    </CalcPage>
  );
}
