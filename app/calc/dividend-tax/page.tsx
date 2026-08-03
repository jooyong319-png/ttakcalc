import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { DividendTaxCalc, DividendReverseCalc } from '@/components/DividendCalculator';
import { latestYear, getRates } from '@/lib/rates';

export const metadata: Metadata = {
  title: '배당소득세 계산기',
  description:
    '배당금에서 세금이 얼마나 빠지는지, 금융소득 2천만원을 넘으면 얼마나 달라지는지 계산합니다. 세후 월 배당 목표에서 필요한 배당금도 역산합니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/dividend-tax' },
};

export default function Page() {
  const year = latestYear();
  const r = getRates(year);
  const d = r.dividend!;
  const 만 = (n: number) => (n / 10_000).toLocaleString('ko-KR');

  return (
    <CalcPage
      category="금융·자동차"
      tone="c3"
      year={year}
      title={`${year}년 배당소득세 계산기`}
      lead={
        <>
          배당은 <strong>연 {만(d.comprehensiveThreshold)}만원</strong>을 경계로 계산 방식이 통째로
          바뀝니다. 그 아래는 15.4%로 끝나고, 넘으면 초과분이 다른 소득과 합쳐져 누진세율을 탑니다.
        </>
      }
      verifiedAt={r.verifiedAt}
      faqs={[
        {
          q: '배당 2천만원까지는 세금이 얼마인가요?',
          a: `배당소득세 14%에 지방소득세 1.4%를 더해 15.4%입니다. 증권사가 지급할 때 이미 떼고 주기 때문에 따로 신고할 필요가 없습니다. 2천만원을 받으면 308만원이 빠지고 1,692만원이 들어옵니다.`,
        },
        {
          q: '2천만원을 넘으면 세금이 갑자기 뛰나요?',
          a: '아닙니다. 초과분만 종합과세되고, 그마저도 "종합과세로 계산한 세금"과 "전부 14%로 계산한 세금" 중 큰 쪽을 냅니다(비교과세, 소득세법 제62조). 그래서 경계를 1원 넘겼다고 세금이 급증하지 않습니다. 다른 소득이 없다면 배당이 꽤 커질 때까지 실효세율이 15.4% 근처에 머뭅니다.',
        },
        {
          q: '그럼 언제부터 세금이 실제로 늘어나나요?',
          a: '다른 소득이 있을 때 빨리 늘어납니다. 근로소득이 있으면 배당 초과분이 그 위에 얹혀 더 높은 세율 구간으로 올라가기 때문입니다. 같은 배당이라도 직장이 있는지 없는지에 따라 세금이 크게 달라집니다 — 위 계산기에서 "그 밖의 종합소득금액"을 넣어 비교해 보세요.',
        },
        {
          q: '국내 주식과 해외 ETF는 뭐가 다른가요?',
          a: '국내 상장법인 배당은 이미 법인세를 낸 이익에서 나오므로, 2천만원 초과분에 10%를 더했다가 같은 금액을 세액공제로 빼 이중과세를 조정합니다(Gross-up, 소득세법 제17조·제56조). 해외 법인 배당은 대상이 아닙니다. 대신 해외 배당은 현지에서 원천징수되고 종합과세 시 외국납부세액공제로 정산됩니다.',
        },
        {
          q: '금융소득종합과세 대상이 되면 뭐가 불편한가요?',
          a: '5월에 종합소득세를 직접 신고해야 하고, 건강보험 지역가입자라면 보험료 산정 소득에 잡힙니다. 피부양자 자격에도 영향을 줍니다. 세금만 보고 판단하면 놓치는 부분입니다.',
        },
        {
          q: 'ISA나 연금계좌 배당도 여기에 해당하나요?',
          a: '아닙니다. ISA는 계좌 내 순이익 기준으로 비과세 한도가 있고 초과분은 9% 분리과세, 연금계좌는 인출할 때 연금소득세가 붙습니다. 과세 방식이 완전히 달라 이 계산기는 일반 계좌 기준입니다.',
        },
      ]}
      basisItems={[
        `배당소득 원천징수 ${d.withholdingRate * 100}% + 지방소득세 ${(d.withholdingRate * r.incomeTax.localTaxRateOfIncomeTax * 100).toFixed(1)}% — 소득세법 제129조 제1항 제2호 나목`,
        `금융소득종합과세 기준금액 ${만(d.comprehensiveThreshold)}만원 — 소득세법 제14조 제3항 제6호`,
        '비교과세(종합과세 방식과 분리과세 방식 중 큰 금액) — 소득세법 제62조',
        `귀속법인세 가산 ${d.grossUpRate * 100}%와 배당세액공제 — 소득세법 제17조 제3항 단서·제56조`,
        '기준금액을 채우는 순서(이자 → 그 밖의 배당 → 가산 대상 배당) — 소득세법 시행령 제116조의2',
        '해외 현지 원천징수세·외국납부세액공제는 나라마다 달라 계산하지 않는다',
      ]}
    >
      <DividendTaxCalc year={year} />

      <h2 style={{ marginTop: '2.4rem' }}>세후 월 배당에서 거꾸로 구하기</h2>
      <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: '38rem' }}>
        실제로 궁금한 건 보통 반대 방향입니다 — <strong>세후로 월 300만원을 받으려면 배당이 얼마여야
        하는가.</strong> 누진세라 나누기 한 번으로는 안 나오므로 역산합니다.
      </p>
      <DividendReverseCalc year={year} />
    </CalcPage>
  );
}
