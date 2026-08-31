import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE } from '@/lib/site';
import { getAllPosts, getPostBySlug, renderPost } from '@/lib/blog';
import { breadcrumbLd, ldJson } from '@/lib/jsonLd';
import s from '../blog.module.css';

export function generateStaticParams() {
  return getAllPosts().map(p => ({ slug: p.slug }));
}
export const dynamicParams = false;

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPostBySlug(params.slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `${SITE.url}/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      tags: post.tags,
    },
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  // 토큰 치환이 여기서 일어난다. 못 찾는 토큰이 있으면 빌드가 선다 — 화면에
  // {{rates:...}}가 그대로 찍히는 것보다 배포가 막히는 편이 낫다.
  const html = renderPost(post);

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    inLanguage: 'ko-KR',
    author: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE.url}/blog/${post.slug}` },
    keywords: post.tags.join(', '),
  };
  const crumbLd = breadcrumbLd([
    { name: '블로그', href: '/blog' },
    { name: post.title },
  ]);

  return (
    <>
      {[articleLd, crumbLd].map((ld, i) => (
        <script key={i} type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      ))}

      <article className="container-narrow" style={{ paddingTop: '1.8rem' }}>
        <header className={s.postHead}>
          <p className={s.meta}>
            <Link href="/blog" className={s.backLink}>블로그</Link>
            <span aria-hidden="true"> · </span>
            <time className="num" dateTime={post.date}>{post.date}</time>
            {post.updated && post.updated !== post.date && (
              <>
                <span aria-hidden="true"> · </span>
                <span>고침 <span className="num">{post.updated}</span></span>
              </>
            )}
          </p>
          <h1 className={s.postTitle}>{post.title}</h1>
          <p className={s.postDesc}>{post.description}</p>
          {post.tags.length > 0 && (
            <p className={s.tags}>
              {post.tags.map(t => <span key={t} className={s.tag}>{t}</span>)}
            </p>
          )}
        </header>

        {/* 본문은 우리가 쓴 마크다운에서만 나온다. 변환기가 링크 스킴을 검사한다(lib/blog.ts). */}
        <div className={s.body} dangerouslySetInnerHTML={{ __html: html }} />

        {post.calc && (
          <aside className={s.calcBox}>
            <p className={s.calcLead}>직접 계산해 보세요</p>
            <Link href={post.calc} className={s.calcLink}>
              {post.calcLabel ?? '계산기 열기'} →
            </Link>
          </aside>
        )}

        <footer className={s.postFoot}>
          <p>
            글에 나오는 요율과 금액은 손으로 적지 않고 계산기와 같은 데이터에서 가져옵니다.
            제도가 바뀌면 <Link href="/changes">제도 변화</Link>에 기록하고, 우리가 틀렸던
            것은 <Link href="/corrections">정정 이력</Link>에 남깁니다.
          </p>
          <p>
            납부·신고 기한은 <Link href="/calendar">세금 달력</Link>에 모아 두었습니다.
          </p>
        </footer>
      </article>
    </>
  );
}
