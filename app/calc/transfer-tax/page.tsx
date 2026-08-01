import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { TransferTaxCalc } from '@/components/ExtraCalculators';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: '양도소득세 계산기',
  description:
    '집을 팔 때 내는 양도소득세를 계산합니다. 1세대 1주택 12억 비과세, 장기보유특별공제, 다주택 중과까지 반영합니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/transfer-tax' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);
  const t = r.transferTax;
  return (
    <CalcPage
      category="부동산"
      tone="c2"
      year={year}
      title="양도소득세 계산기"
      lead={
        <>
          집을 팔 때 내는 세금입니다. <strong>1세대 1주택 12억 비과세</strong>와{' '}
          <strong>장기보유특별공제</strong>가 결과를 크게 바꿉니다.
        </>
      }
      verifiedAt={r.verifiedAt}
      faqs={[
        { q: '1세대 1주택이면 세금이 없나요?',
          a: '양도가액 12억원까지는 비과세입니다. 12억을 넘으면 초과분에 해당하는 양도차익만 과세합니다. 예를 들어 15억에 팔았다면 양도차익의 20%((15억−12억)÷15억)만 과세 대상입니다. 다만 2년 이상 보유(조정대상지역은 2년 거주)해야 비과세가 적용됩니다.' },
        { q: '장기보유특별공제가 뭔가요?',
          a: '오래 보유할수록 양도차익에서 빼주는 공제입니다. 일반 부동산은 3년 6%부터 매년 2%p씩 15년 30%가 한도이고, 1세대 1주택은 보유 연 4%(최대 40%) + 거주 연 4%(최대 40%)로 최대 80%까지 됩니다. 거주 요건을 못 채우면 일반 표가 적용돼 공제가 절반 이하로 줄어듭니다.' },
        { q: '짧게 보유하면 세금이 많나요?',
          a: '주택·조합원입주권은 1년 미만 70%, 1년 이상 2년 미만 60% 단일세율입니다. 2년 이상이어야 기본세율(6~45%)이 적용됩니다.' },
        { q: '다주택 중과는 지금 적용되나요?',
          a: '2022년 5월부터 한시 배제됐다가 2026년 5월 9일 종료돼 다시 적용됩니다. 조정대상지역 2주택은 기본세율 +20%p, 3주택 이상은 +30%p입니다.' },
        { q: '이 계산을 그대로 믿어도 되나요?',
          a: '금액이 가장 큰 세금이고 개인 사정에 따라 결과가 크게 달라집니다. 취득가액을 모르면 환산취득가액을 써야 하고, 필요경비 인정 범위도 사안마다 다릅니다. 실제 신고 전에는 반드시 세무 상담을 받으세요.' },
      ]}
      basisItems={[
        `1세대 1주택 비과세 한도 ${t.oneHouseExemptLimit.toLocaleString()}원`,
        t.longTermGeneral.note,
        t.longTermOneHouse.note,
        '주택 보유 1년 미만 70% / 1~2년 60% / 2년 이상 기본세율',
        t.heavySurcharge.note,
        `양도소득 기본공제 ${t.basicDeduction.toLocaleString()}원 · 지방소득세 ${t.localTaxRateOfIncomeTax * 100}%`,
        t.source,
      ]}
    >
      <TransferTaxCalc year={year} />
    </CalcPage>
  );
}
