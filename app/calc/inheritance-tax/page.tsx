import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { InheritanceCalc } from '@/components/InheritanceCalculator';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: '상속세 계산기',
  description:
    '상속재산과 가족 구성만 넣으면 상속세를 계산합니다. 일괄공제와 인적공제 중 어느 쪽이 유리한지, 배우자공제가 얼마인지 근거 조문과 함께 보여드립니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/inheritance-tax' },
};

const won억 = (n: number) => `${(n / 100_000_000).toLocaleString('ko-KR')}억원`;

export default function Page() {
  const year = latestYear();
  const r = getRates(year);
  const h = r.inheritanceTax!;

  return (
    <CalcPage
      category="급여·세금"
      tone="c1"
      year={year}
      title={`${year}년 상속세 계산기`}
      lead={
        <>
          상속세는 세율보다 <strong>공제를 어떻게 짜느냐</strong>로 갈립니다. 일괄공제
          {' '}{won억(h.lumpSumDeduction)}과 인적공제 중 큰 쪽, 배우자가 있으면 최소{' '}
          {won억(h.spouseMin)}이 더 빠집니다.
        </>
      }
      verifiedAt={r.verifiedAt}
      faqs={[
        {
          q: '얼마부터 상속세를 내나요?',
          a: `자녀만 상속받는다면 일괄공제 ${won억(h.lumpSumDeduction)}까지, 배우자가 함께 상속받는다면 배우자공제 최소 ${won억(h.spouseMin)}이 더해져 ${won억(h.lumpSumDeduction + h.spouseMin)}까지는 상속세가 없습니다. 여기에 금융재산이 있으면 순금융재산의 20%(2억 한도)가 더 공제됩니다.`,
        },
        {
          q: '일괄공제와 인적공제 중 뭘 선택해야 하나요?',
          a: `둘 중 큰 쪽이 자동으로 적용됩니다(상증세법 제21조 ①). 기초공제 ${won억(h.basicDeduction)}에 자녀 1명당 5천만원 등을 더한 금액이 일괄공제 ${won억(h.lumpSumDeduction)}보다 크면 그쪽이 유리합니다. 자녀가 7명 이상이거나 미성년 자녀가 여럿이면 인적공제가 이깁니다. 위 계산기가 어느 쪽을 택했는지 근거에 표시합니다.`,
        },
        {
          q: '배우자가 혼자 상속받으면 더 유리한가요?',
          a: '아닙니다. 오히려 불리할 수 있습니다. 배우자가 단독으로 상속받으면 일괄공제를 쓸 수 없고 기초공제와 인적공제만 적용됩니다(제21조 ②). 자녀와 함께 상속받으면 일괄공제와 배우자공제를 모두 쓸 수 있습니다.',
        },
        {
          q: '배우자공제는 최대 얼마인가요?',
          a: `배우자가 실제 상속받은 금액을 한도로 하되, 법정상속분(민법상 자녀의 1.5배)과 ${won억(h.spouseMax)} 중 작은 금액까지입니다. 실제로 받은 게 없거나 ${won억(h.spouseMin)} 미만이어도 ${won억(h.spouseMin)}은 공제됩니다(제19조 ④). 다만 상속세 신고기한 다음날부터 9개월 안에 재산을 분할하고 신고해야 적용됩니다.`,
        },
        {
          q: '증여를 미리 해두면 상속세가 줄어드나요?',
          a: '상속개시일 전 10년(상속인이 아닌 사람은 5년) 이내에 증여한 재산은 상속재산에 다시 더해집니다. 그보다 오래전 증여만 빠집니다. 이 계산기는 사전증여를 반영하지 않으므로, 해당된다면 실제 세금은 이보다 큽니다.',
        },
        {
          q: '언제까지 신고해야 하나요?',
          a: '상속개시일이 속한 달의 말일부터 6개월 이내입니다. 기한 안에 신고하면 산출세액의 3%를 공제받습니다(제69조). 상속재산이 많아 한 번에 내기 어려우면 분납·연부연납 제도를 활용할 수 있습니다.',
        },
      ]}
      basisItems={[
        `기초공제 ${won억(h.basicDeduction)} — 상속세 및 증여세법 제18조`,
        `일괄공제 ${won억(h.lumpSumDeduction)}(기초+인적과 비교해 큰 쪽) — 제21조`,
        `배우자 상속공제 최소 ${won억(h.spouseMin)}·최대 ${won억(h.spouseMax)} — 제19조`,
        '자녀 1명당 5천만원, 미성년자 연 1천만원, 65세 이상 5천만원 — 제20조',
        '금융재산 상속공제 순금융재산의 20%(2천만원 하한·2억 한도) — 제22조',
        '세율 10~50%와 신고세액공제 3% — 제26조·제69조 (증여세와 같은 표)',
        '배우자 법정상속분은 직계비속의 1.5배 — 민법 제1009조 ②',
        '사전증여 합산·장애인공제·동거주택공제·가업상속공제는 계산하지 않는다',
      ]}
    >
      <InheritanceCalc year={year} />
    </CalcPage>
  );
}
