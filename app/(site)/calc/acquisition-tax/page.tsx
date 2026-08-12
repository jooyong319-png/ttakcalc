import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { AcquisitionTaxCalc } from '@/components/PropertyCalculators';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: `${latestYear()}년 취득세 계산기`,
  description: '주택 취득가액·면적·주택 수로 취득세와 지방교육세, 농어촌특별세까지 계산합니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/acquisition-tax' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);
  const a = r.acquisitionTax;
  return (
    <CalcPage
      category="부동산"
      tone="c2"
      year={year}
      title="취득세 계산기"
      lead={<>주택을 살 때 내는 <strong>취득세 + 지방교육세 + 농어촌특별세</strong>를 한 번에 계산합니다.{' '}<a href="/acquisition-tax/50000">5억</a>·<a href="/acquisition-tax/100000">10억</a> 같은 대표 금액은 바로 볼 수 있습니다.</>}
      verifiedAt={r.verifiedAt}
      faqs={[
        { q: '취득세율은 어떻게 정해지나요?',
          a: '1주택 기준으로 6억 이하 1%, 6~9억은 취득가액에 따라 1~3% 사이 누진식, 9억 초과 3%입니다. 조정대상지역 2주택은 8%, 3주택 이상은 12%로 중과됩니다.' },
        { q: '농어촌특별세는 왜 붙나요?',
          a: `전용면적 ${a.ruralTax.areaThresholdSqm}㎡를 초과하는 주택에만 취득가액의 ${a.ruralTax.rate * 100}%가 부과됩니다. ${a.ruralTax.areaThresholdSqm}㎡ 이하 국민주택 규모는 비과세입니다.` },
        { q: '생애최초 구입이면 감면되나요?',
          a: '요건을 충족하면 취득세 감면 제도가 있습니다. 소득·주택가액 요건과 실거주 의무가 붙고 기간마다 내용이 바뀌므로, 이 계산기는 감면 전 금액을 보여줍니다. 관할 시군구청에서 확인하세요.' },
        { q: '언제까지 내나요?',
          a: '취득일(잔금일 또는 등기일 중 빠른 날)부터 60일 이내에 신고·납부해야 합니다. 늦으면 가산세가 붙습니다.' },
      ]}
      basisItems={[
        `주택 유상취득 표준세율 1~3%, 다주택 중과 8·12% — ${a.source}`,
        `농어촌특별세 ${a.ruralTax.rate * 100}% (전용 ${a.ruralTax.areaThresholdSqm}㎡ 초과)`,
        '지방교육세는 취득세율의 1/10 수준으로 계산',
      ]}
    >
      <AcquisitionTaxCalc year={year} />
    </CalcPage>
  );
}
