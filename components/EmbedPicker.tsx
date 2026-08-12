'use client';
import { useState } from 'react';
import type { EmbedSpec } from '@/lib/embeds';
import s from './EmbedPicker.module.css';

/**
 * 계산기를 고르면 붙여 넣을 코드를 만들어 준다.
 *
 * 코드에 iframe **바깥의** 출처 링크를 함께 넣는 게 핵심이다. iframe 안쪽 내용은
 * 검색엔진이 별개 문서로 보기 때문에, 그 안에 아무리 링크를 넣어도 넣어 준 글에서
 * 우리를 가리키는 앵커는 하나도 생기지 않는다. 바깥의 저 한 줄이 전부다.
 *
 * 문구는 계산기마다 바꾸지 않고 브랜드 이름 중심으로 고정한다. 위젯으로 뿌린 링크에
 * 계산기별 키워드를 심어 두는 건 검색엔진이 링크 조작으로 보는 전형적인 형태다.
 */
export function EmbedPicker({
  embeds, base, siteName,
}: { embeds: EmbedSpec[]; base: string; siteName: string }) {
  const [slug, setSlug] = useState(embeds[0].slug);
  const [copied, setCopied] = useState(false);
  const spec = embeds.find(e => e.slug === slug) ?? embeds[0];

  const src = `${base}/embed/${spec.slug}`;
  const code = [
    `<iframe src="${src}" width="100%" height="${spec.height}"`,
    `        style="border:1px solid #ddd;border-radius:8px" loading="lazy"`,
    `        title="${spec.name}"></iframe>`,
    `<p style="font-size:13px;margin-top:6px">`,
    `  계산기 제공: <a href="${base}${spec.href}" target="_blank" rel="noopener">${siteName}</a>`,
    `</p>`,
  ].join('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className={s.wrap}>
      <h2 className={s.h2}>1. 계산기 고르기</h2>
      <ul className={s.grid}>
        {embeds.map(e => (
          <li key={e.slug}>
            <button
              type="button"
              onClick={() => setSlug(e.slug)}
              aria-pressed={e.slug === slug}
              className={`${s.pick} ${e.slug === slug ? s.on : ''}`}
            >
              <span className={s.pickName}>{e.name}</span>
              <span className={s.pickFits}>{e.fits}</span>
            </button>
          </li>
        ))}
      </ul>

      <h2 className={s.h2}>2. 코드 붙여 넣기</h2>
      <div className={s.codeBox}>
        {/* 가로로 넘치는 영역은 키보드로도 스크롤할 수 있어야 한다(axe scrollable-region-focusable).
            tabIndex만 주면 스크린리더에 정체불명의 포커스 지점이 되므로 이름도 함께 붙인다. */}
        <pre className={s.pre} tabIndex={0} role="region" aria-label="임베드 코드">
          <code>{code}</code>
        </pre>
        <button type="button" onClick={copy} className={s.copy}>
          {copied ? '복사했습니다' : '코드 복사'}
        </button>
      </div>

      <h2 className={s.h2}>3. 이렇게 보입니다</h2>
      <iframe
        key={spec.slug}
        src={`/embed/${spec.slug}`}
        width="100%"
        height={spec.height}
        className={s.preview}
        loading="lazy"
        title={`${spec.name} 미리보기`}
      />
      <p className={s.previewNote}>
        계산기 제공: <a href={spec.href}>{siteName}</a> — 넣어 주신 글에는 이 한 줄이 함께 들어갑니다.
      </p>
    </section>
  );
}
