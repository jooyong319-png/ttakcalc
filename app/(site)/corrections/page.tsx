import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE } from '@/lib/site';
import { CORRECTIONS, valueCorrectionCount } from '@/lib/corrections';
import { breadcrumbLd, ldJson } from '@/lib/jsonLd';
import s from './corrections.module.css';

export const metadata: Metadata = {
  title: '정정 이력',
  description:
    '딱칼크가 틀렸던 내용과 고친 내용을 모두 공개합니다. 무엇이 틀렸는지, 어떤 영향이 있었는지, 같은 일이 다시 일어나지 않게 무엇을 바꿨는지 적었습니다.',
  alternates: { canonical: `${SITE.url}/corrections` },
};

// 이 페이지의 가치는 "잘 썼다"가 아니라 "실제 기록이다"에 있다.
// 없는 일을 적지 않고, 있는 일을 빼지 않는다.
export default function CorrectionsPage() {
  const crumbLd = breadcrumbLd([{ name: '정정 이력' }]);
  const valueCount = valueCorrectionCount();

  return (
    <div className="container-narrow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(crumbLd) }} />

      <header className={s.head}>
        <p className={s.eyebrow}>정정 이력</p>
        <h1 className={s.title}>틀렸던 것을 적어 둡니다</h1>
        <p className={s.lead}>
          세금 계산이 틀리면 그걸 믿은 사람이 손해를 봅니다. 그래서 이 사이트를 믿을지 말지는
          &ldquo;한 번도 안 틀렸다&rdquo;는 말이 아니라 <strong>틀렸을 때 어떻게 하는지</strong>로
          판단하시는 편이 맞다고 생각합니다. 조용히 고치고 넘어가면 아무도 모르지만, 그건 다음에도
          조용히 넘어가겠다는 뜻입니다.
        </p>
        <p className={s.lead}>
          지금까지 <strong>계산 결과가 틀린 적이 {valueCount}번</strong> 있었습니다. 아래에 무엇이
          틀렸고 얼마나 차이가 났는지, 그리고 같은 일이 다시 일어나지 않게 무엇을 바꿨는지
          적었습니다.
        </p>
        <p className={s.note}>
          법이나 요율이 바뀌어 값을 갱신한 것은 정정이 아닙니다. 그쪽은{' '}
          <Link href="/changes">제도 변화</Link>에 따로 있습니다. 여기 있는 것은 전부 우리 잘못입니다.
        </p>
      </header>

      <div className={s.body}>
        {CORRECTIONS.map(c => (
          <article key={`${c.date}-${c.title}`} className={s.item}>
            <div className={s.meta}>
              <time className={`${s.date} num`} dateTime={c.date}>{c.date}</time>
              <span className={c.severity === 'value' ? s.tagValue : s.tagSource}>
                {c.severity === 'value' ? '계산 결과 오류' : '근거 표기 오류'}
              </span>
            </div>

            <h2 className={s.itemTitle}>{c.title}</h2>

            <dl className={s.fields}>
              <dt>무엇이 틀렸나</dt>
              <dd>{c.what}</dd>

              <dt>어떤 영향이 있었나</dt>
              <dd>{c.impact}</dd>

              {c.examples && (
                <>
                  <dt>실제 차이</dt>
                  <dd>
                    <div className={s.tableWrap} tabIndex={0} role="region"
                      aria-label={`${c.title} — 정정 전후 비교`}>
                      <table className={s.table}>
                        <thead>
                          <tr>
                            <th scope="col">조건</th>
                            <th scope="col">틀렸던 값</th>
                            <th scope="col">고친 값</th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.examples.map(e => (
                            <tr key={e.label}>
                              <th scope="row">{e.label}</th>
                              <td className={`num ${s.before}`}>{e.before}</td>
                              <td className="num">{e.after}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </dd>
                </>
              )}

              <dt>왜 그랬나</dt>
              <dd>{c.cause}</dd>

              <dt>어떻게 고쳤나</dt>
              <dd>{c.fix}</dd>

              <dt>다시 일어나지 않게</dt>
              <dd className={s.prevention}>{c.prevention}</dd>
            </dl>
          </article>
        ))}
      </div>

      <section className={s.outro}>
        <h2 className={s.outroTitle}>틀린 곳을 발견하셨다면</h2>
        <p>
          제보를 가장 반깁니다. 어느 계산기의 어떤 값이 이상한지 알려주시면 원문을 대조해
          확인하고, 우리 잘못이면 이 페이지에 그대로 적겠습니다.
        </p>
        <p>
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        </p>
      </section>
    </div>
  );
}
