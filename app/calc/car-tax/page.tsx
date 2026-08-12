import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { CarTaxCalc } from '@/components/TaxCalculators';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: `${latestYear()}년 자동차세 계산기`,
  description:
    '배기량과 차령을 넣으면 연간 자동차세와 지방교육세, 1월 연납 할인액까지 근거와 함께 계산합니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/car-tax' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);
  const c = r.carTax;

  return (
    <CalcPage
      category="금융·자동차"
      tone="c3"
      year={year}
      title={`${year}년 자동차세 계산기`}
      lead={
        <>
          배기량과 차령으로 <strong>연간 자동차세와 연납 할인액</strong>을 계산합니다.
          {' '}<a href="/car-tax/2000">2,000cc</a>·<a href="/car-tax/1600">1,600cc</a> 같은 대표
          배기량은 바로 볼 수 있습니다.
        </>
      }
      verifiedAt={r.verifiedAt}
      faqs={[
        { q: '자동차세는 어떻게 계산하나요?',
          a: '비영업용 승용차는 배기량 1,000cc 이하 cc당 80원, 1,600cc 이하 140원, 1,600cc 초과 200원입니다. 여기에 자동차세의 30%가 지방교육세로 더 붙습니다.' },
        { q: '차가 오래되면 세금이 줄어드나요?',
          a: '네. 차령 3년째부터 매년 5%씩 줄어 12년째에 50%까지 경감됩니다. 계산식은 기분세액 = A/2 − (A/2 × 5/100)(n−2)이고, n은 차령(2~12)입니다. 영업용은 경감 대상이 아닙니다.' },
        { q: '연납하면 얼마나 아끼나요?',
          a: '연세액에서 (납부기한 다음 날부터 12월 31일까지의 일수 ÷ 365) × 5%만큼 공제됩니다. 1월에 신청하면 공제 대상 기간이 가장 길어 약 4.6%를 아낍니다. 신청은 위택스에서 합니다.' },
        { q: '왜 실제 고지서와 다를 수 있나요?',
          a: '지자체는 조례로 표준세율의 50%까지 초과해 정할 수 있습니다(탄력세율). 또 연중에 차를 사거나 팔면 보유 일수만큼 일할 계산됩니다.' },
      ]}
      basisItems={[
        `비영업용 승용 cc당 세액 80/140/200원 — ${c.source}`,
        `지방교육세 자동차세의 ${c.localEduRateOfCarTax * 100}% — 지방세법 제151조 제1항 제2호`,
        `차령 경감 — ${c.ageReduction.note}`,
        `연납 공제 — ${c.prepayment.note}`,
      ]}
    >
      <CarTaxCalc year={year} />
    </CalcPage>
  );
}
