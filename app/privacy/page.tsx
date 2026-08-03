import type { Metadata } from 'next';
import { SITE } from '@/lib/site';
import s from '../legal.module.css';

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description:
    '딱칼크가 수집하는 정보와 그 이유를 밝힙니다. 계산은 브라우저 안에서 끝나며 입력하신 금액은 서버로 전송되지 않습니다.',
  alternates: { canonical: `${SITE.url}/privacy` },
};

// 개인정보 보호법 제30조 ①의 법정 기재사항을 순서대로 채운다.
// 과장하지 않는 게 이 페이지의 핵심이다 — 실제로 하는 것만 적는다.
// 계산기는 전부 클라이언트 컴포넌트라 입력값이 서버로 가지 않는다. 이건 사실이므로 적는다.
export default function PrivacyPage() {
  return (
    <div className="container-narrow">
      <header className={s.head}>
        <p className={s.eyebrow}>개인정보처리방침</p>
        <h1 className={s.title}>무엇을 수집하고, 무엇을 수집하지 않는가</h1>
        <p className={s.lead}>
          {SITE.name}(이하 &ldquo;사이트&rdquo;)은 이용자의 개인정보를 소중히 다루며, 개인정보 보호법
          등 관계 법령을 준수합니다. 이 방침은 사이트가 어떤 정보를 어떤 이유로 처리하는지 알리기
          위해 마련되었습니다.
        </p>
        <p className={s.effective}>시행일 {SITE.effectiveDate}</p>
      </header>

      <div className={s.body}>
        <section>
          <h2>1. 계산기에 입력한 값은 수집하지 않습니다</h2>
          <div className={s.callout}>
            <p>
              <strong>연봉·재산·급여 등 계산기에 입력하신 모든 금액은 이용자의 브라우저 안에서만
              처리되며, 사이트 서버로 전송되지도 저장되지도 않습니다.</strong> 모든 계산은
              내려받은 자바스크립트가 기기 안에서 수행합니다.
            </p>
            <p>
              사이트는 회원가입·로그인을 제공하지 않으며, 이름·연락처·주민등록번호 등 이용자를
              식별할 수 있는 정보를 직접 수집하는 절차가 없습니다.
            </p>
          </div>
        </section>

        <section>
          <h2>2. 처리하는 개인정보 항목과 목적</h2>
          <p>
            사이트는 서비스 이용 통계를 위해 아래 정보를 <strong>자동으로</strong> 수집합니다.
          </p>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">수집 항목</th>
                  <th scope="col">수집 방법</th>
                  <th scope="col">이용 목적</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>방문한 페이지 주소, 방문 일시, 체류 시간, 유입 경로</td>
                  <td>Google Analytics 4 (쿠키)</td>
                  <td>어떤 계산기가 실제로 쓰이는지 파악해 개선 우선순위를 정하기 위해</td>
                </tr>
                <tr>
                  <td>기기 종류, 운영체제, 브라우저, 화면 크기, 대략적인 지역(국가·도시 수준)</td>
                  <td>Google Analytics 4 (쿠키)</td>
                  <td>화면이 깨지는 환경을 찾고 대응하기 위해</td>
                </tr>
                <tr>
                  <td>IP 주소</td>
                  <td>서비스 접속 시 자동 생성</td>
                  <td>
                    Google Analytics 4는 지역 추정에만 사용한 뒤 IP를 저장하지 않습니다. 호스팅
                    사업자는 보안·장애 대응을 위해 접속 기록을 일시적으로 보관합니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            수집된 정보는 통계 형태로만 확인하며, 특정 개인을 식별하거나 추적하는 용도로 사용하지
            않습니다.
          </p>
        </section>

        <section>
          <h2>3. 보유 및 이용 기간</h2>
          <ul>
            <li>
              Google Analytics 수집 데이터: <strong>수집일로부터 14개월</strong> (Google Analytics의
              데이터 보관 설정에 따르며, 기간 경과 후 자동 삭제됩니다)
            </li>
            <li>호스팅 사업자의 접속 로그: 사업자의 정책에 따른 기간 경과 후 자동 삭제</li>
          </ul>
          <p>
            법령에 따라 보존할 의무가 있는 경우에는 해당 법령이 정한 기간 동안 보관한 뒤 지체 없이
            파기합니다.
          </p>
        </section>

        <section>
          <h2>4. 개인정보의 제3자 제공</h2>
          <p>
            사이트는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만 법령에 근거하거나 수사
            기관이 적법한 절차에 따라 요구하는 경우에는 예외로 합니다.
          </p>
        </section>

        <section>
          <h2>5. 개인정보 처리의 위탁 및 국외 이전</h2>
          <p>
            사이트는 서비스 운영을 위해 아래와 같이 처리를 위탁하고 있으며, 해당 사업자의 서버가
            국외에 있어 정보가 국외로 이전됩니다.
          </p>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">수탁자</th>
                  <th scope="col">위탁 업무</th>
                  <th scope="col">이전 국가 · 항목 · 시점</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Google LLC</td>
                  <td>웹사이트 이용 통계 분석 (Google Analytics 4)</td>
                  <td>
                    미국 · 위 2항의 자동 수집 항목 · 이용자가 사이트에 접속하는 시점에 네트워크를
                    통해 전송
                  </td>
                </tr>
                <tr>
                  <td>Vercel Inc.</td>
                  <td>웹사이트 호스팅 및 콘텐츠 전송</td>
                  <td>미국 등 · IP 주소를 포함한 접속 기록 · 접속 시점에 자동 생성</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            이용자는 국외 이전을 원하지 않을 경우 아래 7항의 방법으로 쿠키를 차단하거나 사이트
            이용을 중단할 수 있습니다. 다만 호스팅에 필요한 접속 기록은 서비스 제공에 반드시
            수반되므로, 이를 원하지 않으시면 사이트 이용이 제한됩니다.
          </p>
        </section>

        <section>
          <h2>6. 정보주체의 권리와 행사 방법</h2>
          <p>
            이용자는 언제든지 자신의 개인정보에 대해 열람·정정·삭제·처리정지를 요구할 수 있습니다.
            아래 9항의 연락처로 요청하시면 지체 없이 조치합니다.
          </p>
          <p>
            다만 사이트는 이용자를 식별할 수 있는 정보를 보유하지 않으므로, 특정 개인의 통계
            데이터만을 골라 열람하거나 삭제하는 것은 기술적으로 불가능합니다. 이 경우 아래 7항의
            방법으로 수집 자체를 차단하실 수 있습니다.
          </p>
        </section>

        <section>
          <h2>7. 쿠키의 운영과 거부 방법</h2>
          <p>
            쿠키는 웹사이트가 이용자의 브라우저에 저장하는 작은 텍스트 파일입니다. 사이트는 이용
            통계를 위한 쿠키와, 이용자가 선택한 화면 테마(밝게/어둡게)를 기억하기 위한 저장소를
            사용합니다. 테마 정보는 기기 안에만 남고 외부로 전송되지 않습니다.
          </p>
          <p>이용자는 다음 방법으로 통계 수집을 거부할 수 있습니다.</p>
          <ul>
            <li>
              <strong>브라우저 설정</strong> — 크롬: 설정 &gt; 개인정보 보호 및 보안 &gt; 서드파티
              쿠키 / 사파리: 환경설정 &gt; 개인정보 보호 / 엣지: 설정 &gt; 쿠키 및 사이트 권한
            </li>
            <li>
              <strong>Google Analytics 차단 부가기능 설치</strong> —{' '}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
              >
                tools.google.com/dlpage/gaoptout
              </a>
            </li>
          </ul>
          <p>쿠키를 차단해도 계산기 기능은 그대로 사용하실 수 있습니다.</p>
        </section>

        <section>
          <h2>8. 개인정보의 파기 및 안전성 확보 조치</h2>
          <p>
            보유 기간이 지나거나 처리 목적이 달성된 정보는 지체 없이 파기합니다. 전자적 파일은
            복구할 수 없는 방법으로 삭제합니다.
          </p>
          <p>
            사이트는 전 구간을 HTTPS로 암호화해 전송하며, 통계 데이터에 접근할 수 있는 인원을
            운영자로 한정하고 있습니다.
          </p>
        </section>

        <section>
          <h2>9. 개인정보 보호책임자</h2>
          <p>
            개인정보 처리에 관한 문의·불만·피해 구제는 아래로 연락해 주시면 신속히 답변드리겠습니다.
          </p>
          <div className={s.contact}>
            <span>
              <span className={s.contactLabel}>개인정보 보호책임자</span>
              {SITE.name} 운영자
            </span>
            <span>
              <span className={s.contactLabel}>이메일</span>
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </span>
          </div>
        </section>

        <section>
          <h2>10. 권익침해 구제 방법</h2>
          <p>
            개인정보 침해로 인한 신고나 상담이 필요한 경우 아래 기관에 문의하실 수 있습니다.
          </p>
          <ul>
            <li>개인정보 분쟁조정위원회 — 1833-6972 (www.kopico.go.kr)</li>
            <li>개인정보 침해신고센터 — 118 (privacy.kisa.or.kr)</li>
            <li>대검찰청 사이버수사과 — 1301 (www.spo.go.kr)</li>
            <li>경찰청 사이버수사국 — 182 (ecrm.police.go.kr)</li>
          </ul>
        </section>

        <section>
          <h2>11. 방침의 변경</h2>
          <p>
            이 방침의 내용이 추가·삭제·수정될 경우 시행 7일 전부터 사이트를 통해 공지합니다. 다만
            이용자의 권리에 중대한 영향을 주는 변경은 30일 전에 공지합니다.
          </p>
          <p className={s.effective}>시행일 {SITE.effectiveDate}</p>
        </section>
      </div>
    </div>
  );
}
