import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { GiftTaxCalc } from '@/components/ExtraCalculators';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: `${latestYear()}년 증여세 계산기`,
  description:
    '부모·배우자·자녀에게 받은 돈의 증여세를 계산합니다. 10년 합산 공제 규정까지 반영해 실제 낼 세금을 보여드립니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/gift-tax' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);
  const g = r.giftTax;
  return (
    <CalcPage
      category="급여·세금"
      tone="c1"
      year={year}
      title="증여세 계산기"
      lead={
        <>
          &ldquo;부모님한테 5천만원 받으면 세금 내나?&rdquo; — <strong>관계별 공제</strong>와{' '}
          <strong>10년 합산</strong>까지 반영해 계산합니다.
          {' '}<a href="/gift-tax/10000">1억</a>·<a href="/gift-tax/30000">3억</a>은 바로 볼 수 있습니다.
        </>
      }
      verifiedAt={r.verifiedAt}
      faqs={[
        { q: '얼마까지 세금이 없나요?',
          a: '배우자 6억원, 직계존속(부모·조부모)에게서 5천만원(받는 사람이 미성년이면 2천만원), 직계비속(자녀)에게서 5천만원, 4촌 이내 혈족·3촌 이내 인척은 1천만원까지 공제됩니다. 이 금액까지는 세금이 없습니다.' },
        { q: '10년 합산이 무슨 뜻인가요?',
          a: '공제 한도는 한 번 쓰면 10년간 다시 안 열립니다. 5년 전에 부모님께 5천만원을 받아 공제를 다 썼다면, 지금 또 받는 돈은 공제 없이 전액이 과세됩니다. 이 계산기의 "10년 내 받은 금액"에 이전 금액을 넣으면 반영됩니다.' },
        { q: '누가 내나요?',
          a: '받는 사람(수증자)이 냅니다. 증여일이 속한 달의 말일부터 3개월 안에 신고·납부해야 하고, 기한 안에 신고하면 산출세액의 3%를 깎아줍니다.' },
        { q: '부모님이 대신 세금을 내주면요?',
          a: '그 세금도 증여로 봅니다. 세금을 대신 내준 금액만큼 다시 증여받은 것이 되어 추가 과세됩니다.' },
        { q: '생활비나 축의금도 증여인가요?',
          a: '사회통념상 인정되는 피부양자의 생활비·교육비, 통상적인 축의금·혼수용품은 비과세입니다. 다만 그 돈을 쓰지 않고 예금·부동산 취득에 썼다면 증여로 볼 수 있습니다.' },
      ]}
      basisItems={[
        ...g.deductions.filter(d => d.amount > 0).map(d => `${d.label} ${d.amount.toLocaleString()}원`),
        `${g.deductionNote}`,
        `세율 10~50% 5단계 · 신고세액공제 ${g.filingCreditRate * 100}% — ${g.source}`,
      ]}
    >
      <GiftTaxCalc year={year} />
    </CalcPage>
  );
}
