import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CATEGORIES, categoryBySlug } from '@/lib/catalog';
import { getRates, latestYear } from '@/lib/rates';
import s from './category.module.css';

export function generateStaticParams() {
  return CATEGORIES.map(c => ({ slug: c.slug }));
}
export const dynamicParams = false;

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const c = categoryBySlug(params.slug);
  if (!c) return {};
  return {
    title: `${c.name} 계산기`,
    description: c.description,
    alternates: { canonical: `https://ttakcalc.com/c/${c.slug}` },
  };
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const c = categoryBySlug(params.slug);
  if (!c) notFound();
  const rates = getRates(latestYear());
  const others = CATEGORIES.filter(x => x.slug !== c.slug);

  return (
    <div className={`container ${s[c.tone]}`}>
      <header className={s.head}>
        <p className={s.eyebrow}>
          <a href="/" className={s.home}>딱칼크</a>
          <span aria-hidden="true"> · </span>{rates.label} 기준
        </p>
        <h1 className={s.title}>
          <span className={s.icon} aria-hidden="true">{c.icon}</span>
          {c.name} 계산기
        </h1>
        <p className={s.lead}>{c.description}</p>
      </header>

      <ul className={s.cards}>
        {c.calcs.map(x => (
          <li key={x.href}>
            <a href={x.href} className={s.card}>
              <span className={s.cardIcon} aria-hidden="true">{x.icon}</span>
              <span className={s.cardName}>{x.name}</span>
              <span className={s.cardDesc}>{x.desc}</span>
              <span className={s.cardGo}>계산하기 →</span>
            </a>
          </li>
        ))}
      </ul>

      <nav className={s.others} aria-label="다른 카테고리">
        <h2 className={s.othersTitle}>다른 카테고리</h2>
        <ul className={s.othersList}>
          {others.map(o => (
            <li key={o.slug} className={s[o.tone]}>
              <a href={`/c/${o.slug}`} className={s.otherCard}>
                <span className={s.otherIcon} aria-hidden="true">{o.icon}</span>
                <span>
                  <strong className={s.otherName}>{o.name}</strong>
                  <span className={s.otherTagline}>{o.tagline}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <p className={s.outro}>
        요율·세율은 공식 고시를 대조해 관리합니다. 무엇이 언제 바뀌었는지는{' '}
        <a href="/changes">제도 변화</a>에 기록해 두었습니다.
        {' '}최종 확인 {rates.verifiedAt}.
      </p>
    </div>
  );
}
