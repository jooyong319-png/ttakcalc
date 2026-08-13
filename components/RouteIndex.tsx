import type { ReactNode } from 'react';
import { breadcrumbLd, datasetLd, latestVerifiedAt, ldJson } from '@/lib/jsonLd';
import type { Tone } from '@/lib/catalog';
import s from './RouteIndex.module.css';

/** 값 하나당 페이지 하나인 라우트의 **목록 페이지**.
 *
 *  왜 필요한가 (2026-08-10) — GSC에서 279페이지가 "발견됨 - 현재 색인이 생성되지 않음"으로
 *  잡혔다. 크롤조차 안 된 상태다. 확인해 보니 프로그래매틱 페이지 475장 중 대부분이
 *  **사이트맵과 앞뒤 링크로만** 닿았다. 허브(/c/*)에서 가는 링크가 0개였다.
 *  구글은 내부 링크가 많은 페이지를 먼저 크롤하므로, 목록 페이지가 있는 /salary만
 *  잘 잡히고 나머지는 방치되고 있었다.
 *
 *  이 컴포넌트는 크롤 경로이자 그 자체로 "○○ 표" 검색을 받는 페이지다. */
export interface IndexColumn {
  label: string;
  /** 등폭 숫자로 정렬할 열 */
  numeric?: boolean;
  /** 빠지는 돈이라 붉게 */
  minus?: boolean;
}

export interface IndexRow {
  href: string;
  /** 첫 열에 들어갈 링크 텍스트 */
  label: string;
  cells: ReactNode[];
}

export function RouteIndex({
  tone, category, categoryHref, meta, title, firstColumn, lead,
  caption, description, columns, rows, outro,
}: {
  tone: Tone;
  category: string;
  categoryHref: string;
  meta: string;
  title: string;
  /** 첫 열(링크 열)의 머리글 */
  firstColumn: string;
  lead: ReactNode;
  caption: string;
  /** 구조화 데이터(Dataset)의 설명. 검색엔진이 **50자 이상**을 요구하고,
   *  표 아래 각주(caption)는 "2026년 기준 · 최종 확인 …"이라 설명이 못 된다.
   *  페이지 metadata.description과 같은 문장을 넘겨 두 곳이 어긋나지 않게 한다. */
  description: string;
  /** 첫 열(링크)을 제외한 나머지 열 */
  columns: IndexColumn[];
  rows: IndexRow[];
  outro: ReactNode;
}) {
  // 이 페이지는 실제로 데이터셋이다 — 값별로 계산해 둔 표. 그렇게 말해 준다.
  const dateModified = latestVerifiedAt();
  const lds = [
    breadcrumbLd([{ name: category, href: categoryHref }, { name: title }]),
    datasetLd({ name: title, description, dateModified, rowCount: rows.length }),
  ];

  return (
    <div className={`container-narrow ${s[tone]}`}>
      {lds.map((ld, i) => (
        <script key={i} type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      ))}
      <header className={s.head}>
        <p className={s.eyebrow}>
          <a href={categoryHref} className={s.category}>{category}</a>
          <span aria-hidden="true"> · </span>{meta}
        </p>
        <h1 className={s.title}>{title}</h1>
        <p className={s.lead}>{lead}</p>
      </header>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <caption className={s.caption}>{caption}</caption>
          <thead>
            <tr>
              <th scope="col">{firstColumn}</th>
              {columns.map(c => <th key={c.label} scope="col">{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.href}>
                <th scope="row">
                  <a href={row.href} className={s.link}>{row.label}</a>
                </th>
                {row.cells.map((cell, i) => (
                  <td
                    key={i}
                    className={
                      `${columns[i]?.numeric ? 'num' : ''} ${columns[i]?.minus ? s.minus : ''}`.trim()
                    }
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={s.outro}>{outro}</p>
    </div>
  );
}
