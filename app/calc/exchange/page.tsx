import type { Metadata } from 'next';
import { CalcPage } from '@/components/CalcPage';
import { ExchangeCalc } from '@/components/ExchangeCalc';
import { fetchExchange } from '@/lib/exchangeFetch';
import { latestYear, getRates } from '@/lib/rates';
import s from './exchange.module.css';

export const metadata: Metadata = {
  title: '환전 계산기',
  description:
    '1,000달러를 환전하면 실제로 얼마가 드는지 계산합니다. 한국수출입은행 고시환율에 환전 스프레드와 우대율을 반영해 보여드립니다.',
  alternates: { canonical: 'https://ttakcalc.com/calc/exchange' },
};

// 고시가 영업일 11시 1회라 실시간일 필요가 없다. 1시간마다 재검증한다.
export const revalidate = 3600;

export default async function Page() {
  const year = latestYear();
  const r = getRates(year);
  const snapshot = await fetchExchange();

  return (
    <CalcPage
      category="금융·자동차"
      tone="c3"
      year={year}
      title="환전 계산기"
      lead={
        <>
          &ldquo;1,000달러 환전하면 실제로 얼마?&rdquo; — 매매기준율에{' '}
          <strong>환전 스프레드와 우대율</strong>을 얹은 진짜 금액을 계산합니다.
        </>
      }
      verifiedAt={snapshot?.date ?? r.verifiedAt}
      faqs={[
        { q: '실시간 환율인가요?',
          a: '아닙니다. 한국수출입은행이 영업일 11시 전후에 고시하는 환율을 씁니다. 초 단위로 움직이는 시장환율이 필요하면 증권사 앱을 보세요. 이 계산기는 "실제 환전 비용"을 따지는 용도라 고시환율이면 충분합니다.' },
        { q: '매매기준율로 환전할 수 있나요?',
          a: '없습니다. 은행은 매매기준율에 스프레드를 얹어 팔고, 빼고 삽니다. 현찰 달러는 보통 1.75% 안팎이고 통화마다·은행마다 다릅니다. 그 차이가 실제 환전 비용입니다.' },
        { q: '환전 우대 90%면 수수료가 90% 없어지나요?',
          a: '스프레드의 90%가 깎입니다. 스프레드가 1.75%면 0.175%만 부담하는 셈입니다. 환율 자체가 90% 싸지는 게 아닙니다.' },
        { q: '왜 스프레드를 직접 넣어야 하나요?',
          a: '은행별 고시 환율은 공시 자료가 아니라 각 은행이 수시로 정합니다. 이 사이트는 공식 고시가 아닌 값을 추정해 넣지 않습니다. 거래하는 은행 앱에서 "현찰 사실 때" 환율을 보고 매매기준율과의 차이를 넣으세요.' },
        { q: '엔화는 왜 100엔 단위인가요?',
          a: '수출입은행이 일본 엔은 100엔 기준으로 고시하기 때문입니다. 계산기는 이를 반영해 입력한 금액 단위로 환산합니다.' },
      ]}
      basisItems={[
        '매매기준율 — 한국수출입은행 고시환율 (영업일 11시 전후 1회)',
        '스프레드·우대율은 은행이 정하는 값이라 공식 고시가 아니다 → 입력받는다',
        '적용 환율 = 매매기준율 × (1 ± 스프레드 × (1 − 우대율))',
      ]}
    >
      {snapshot ? (
        <ExchangeCalc rates={snapshot.rates} date={snapshot.date} />
      ) : (
        // 환율을 못 가져왔을 때 지난 값을 슬쩍 보여주지 않는다.
        // 언제 값인지 모르는 환율은 틀린 환율이다.
        <div className={s.empty}>
          <p className={s.emptyTitle}>지금은 고시환율을 불러오지 못했습니다</p>
          <p className={s.emptyBody}>
            한국수출입은행 고시는 <strong>영업일 11시 전후</strong>에 갱신됩니다.
            주말·공휴일이거나 그 이전 시각이면 당일 데이터가 없습니다.
          </p>
          <p className={s.emptyBody}>
            지난 환율을 대신 보여드리지 않습니다 — 언제 값인지 모르는 환율은 틀린 환율이라서요.
            잠시 뒤 다시 확인하시거나{' '}
            <a href="https://www.koreaexim.go.kr/site/program/financial/exchangeJSON" rel="noreferrer">
              수출입은행 고시환율
            </a>
            을 직접 보세요.
          </p>
        </div>
      )}
    </CalcPage>
  );
}
