import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE } from '@/lib/site';
import { getAllPosts } from '@/lib/blog';
import { breadcrumbLd, ldJson } from '@/lib/jsonLd';
import s from './blog.module.css';

/** 페이지 설명. 검색 결과 스니펫과 구조화 데이터가 같은 문장을 쓰도록 한곳에 둔다. */
const DESCRIPTION =
  '계산기가 답하지 못하는 것을 글로 답합니다. 세금을 언제 내는지, 왜 그 금액이 나오는지, '
  + '무엇을 조심해야 하는지를 근거 조문과 함께 풀어 씁니다.';

export const metadata: Metadata = {
  title: '블로그',
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}/blog` },
};

/**
 * 글 목록.
 *
 * 계산기는 "얼마인가"에 답하지만 "지금 해야 하나", "왜 이런가"에는 답하지 못한다.
 * 그 자리를 메우는 것이 이 글들이다(→ lib/blog.ts).
 */
export default function BlogIndexPage() {
  const posts = getAllPosts();
  const crumbLd = breadcrumbLd([{ name: '블로그' }]);

  return (
    <div className="container-narrow" style={{ paddingTop: '1.8rem' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(crumbLd) }} />

      <header className={s.head}>
        <p className={s.eyebrow}>블로그</p>
        <h1 className={s.title}>계산기가 답하지 못하는 것</h1>
        <p className={s.lead}>
          세금을 <strong>언제</strong> 내는지, <strong>왜</strong> 그 금액이 나오는지,
          무엇을 조심해야 하는지를 근거 조문과 함께 풀어 씁니다. 글에 나오는 요율과 금액은
          손으로 적지 않고 <Link href="/changes">계산기와 같은 데이터</Link>에서 가져오므로,
          제도가 바뀌면 글의 숫자도 함께 바뀝니다.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className={s.empty}>아직 글이 없습니다.</p>
      ) : (
        <ul className={s.list}>
          {posts.map(p => (
            <li key={p.slug} className={s.item}>
              <p className={s.meta}>
                <time className="num" dateTime={p.date}>{p.date}</time>
                {p.tags.length > 0 && (
                  <span className={s.tags}>
                    {p.tags.map(t => <span key={t} className={s.tag}>{t}</span>)}
                  </span>
                )}
              </p>
              <h2 className={s.itemTitle}>
                <Link href={`/blog/${p.slug}`}>{p.title}</Link>
              </h2>
              <p className={s.desc}>{p.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
