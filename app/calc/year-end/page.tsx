import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { YearEndCalc } from '@/components/TaxCalculators';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: `${latestYear()}년 연말정산 환급금 계산기`,
  description:
    '총급여와 기납부세액으로 연말정산 환급금 또는 추가 납부액을 계산합니다. 결정세액이 어떻게 나오는지 단계별 근거까지 보여드립니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/year-end' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);

  return (
    <CalcPage
      category="급여·세금"
      tone="c1"
      year={year}
      title={`${year}년 연말정산 환급금 계산기`}
      lead={
        <>
          매달 뗀 세금(<strong>기납부세액</strong>)과 실제로 낼 세금(<strong>결정세액</strong>)의
          차이가 환급금입니다. 그 결정세액이 어떻게 나오는지 단계별로 보여드립니다.
        </>
      }
      verifiedAt={r.verifiedAt}
      faqs={[
        { q: '환급금은 왜 생기나요?',
          a: '매달 떼는 소득세는 간이세액표에 따른 어림값입니다. 연말정산에서 1년치 공제를 모두 반영해 실제 세금(결정세액)을 확정하고, 미리 낸 것보다 적으면 돌려받습니다. "13월의 월급"이 아니라 더 낸 돈을 돌려받는 것입니다.' },
        { q: '숫자는 어디서 가져오나요?',
          a: '작년 원천징수영수증이 있으면 정확합니다. 총급여, 기납부세액(소득세), 4대보험료 납부액을 그대로 옮겨 넣으세요. 홈택스 연말정산 간소화에서도 확인할 수 있습니다.' },
        { q: '의료비·교육비·신용카드 공제는 왜 없나요?',
          a: '사람마다 금액이 크게 달라 사이트가 추정하면 오히려 틀린 숫자가 됩니다. 간소화 자료의 공제 합계를 "특별공제 합계"에 넣으면 반영됩니다. 비워 두면 표준세액공제 13만원이 적용됩니다.' },
        { q: '표준세액공제가 뭔가요?',
          a: '특별소득공제·특별세액공제를 신청하지 않는 근로자에게 주는 연 13만원 세액공제입니다(소득세법 제59조의4). 특별공제 합계가 이보다 작으면 표준세액공제를 받는 게 유리합니다.' },
        { q: '언제 받나요?',
          a: '보통 2월분 또는 3월분 급여에 합산해 지급됩니다. 회사 정산 일정에 따라 다릅니다.' },
      ]}
      basisItems={[
        '근로소득공제 — 소득세법 제47조 총급여 구간별 누진',
        `기본세율 6~45% — ${r.incomeTax.source}`,
        '근로소득 세액공제 — 소득세법 제59조(산출세액 구간별 + 총급여별 한도)',
        '표준세액공제 13만원 — 소득세법 제59조의4',
        '자녀세액공제 — 1명 25만 / 2명 55만 / 3명부터 1명당 40만 추가',
      ]}
    >
      <YearEndCalc year={year} />
    </CalcPage>
  );
}
