import { CATEGORIES } from '@/lib/catalog';
import { ThemeToggle } from './ThemeToggle';
import s from './SiteNav.module.css';

/** 상단 내비게이션 — 카테고리 탭에 마우스를 올리면 그 카테고리의 계산기가 전부 펼쳐진다.
 *
 *  JS를 쓰지 않는다. `:hover`로 열고 `:focus-within`으로도 열어서 키보드 사용자가 탭 키만으로
 *  같은 메뉴를 쓸 수 있게 했다. 터치 기기는 hover가 없으므로 탭을 누르면 카테고리 허브로
 *  이동한다 — 메뉴가 안 열려도 길이 막히지 않는다.
 */
export function SiteNav() {
  return (
    <header className={s.header}>
      <div className={s.inner}>
        <a href="/" className={s.wordmark}>
          딱<b>계산</b><small>ttakcalc</small>
        </a>

        <nav className={s.tabs} aria-label="계산기 카테고리">
          {CATEGORIES.map(c => (
            <div key={c.slug} className={`${s.item} ${s[c.tone]}`}>
              <a href={`/c/${c.slug}`} className={s.tab}>
                <span className={s.tabIcon} aria-hidden="true">{c.icon}</span>
                {c.name}
              </a>

              {/* 탭과 패널 사이에 틈이 있으면 마우스가 지나가다 닫힌다 —
                  패널의 위쪽 여백이 그 틈을 덮도록 wrapper 안에 붙여 둔다 */}
              <div className={s.panel}>
                <div className={`${s.panelInner} ${c.calcs.length > 6 ? s.panelWide : ''}`}>
                  <a href={`/c/${c.slug}`} className={s.panelHead}>
                    <span className={s.panelIcon} aria-hidden="true">{c.icon}</span>
                    <span>
                      <strong>{c.name} 계산기 {c.calcs.length}개</strong>
                      <span className={s.panelTagline}>{c.tagline}</span>
                    </span>
                  </a>
                  <ul className={s.panelList}>
                    {c.calcs.map(x => (
                      <li key={x.href}>
                        <a href={x.href} className={s.panelLink}>
                          <span className={s.linkIcon} aria-hidden="true">{x.icon}</span>
                          <span>
                            <strong className={s.linkName}>{x.name}</strong>
                            <span className={s.linkDesc}>{x.desc}</span>
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </nav>

        <a href="/changes" className={s.plain}>제도 변화</a>
        <ThemeToggle />
      </div>
    </header>
  );
}
