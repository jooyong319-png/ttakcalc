'use client';
import { useEffect } from 'react';

/**
 * 자기 높이를 바깥 페이지에 알려 준다.
 *
 * 브라우저 보안 정책상 다른 사이트 안에 있는 프레임은 바깥의 높이를 직접 바꿀 수 없다.
 * 대신 "나 이만큼 필요하다"고 말해 줄 수는 있다. 받는 쪽 스크립트는 선택이라,
 * 안 넣으면 그냥 고정 높이로 동작한다 — 스크립트를 못 넣는 블로그 서비스가 많다.
 *
 * 보내는 값은 높이 숫자 하나뿐이라 대상 오리진을 '*'로 둬도 새어 나갈 게 없다.
 * 받는 쪽에서 발신 오리진을 확인하도록 안내 페이지의 예시 코드에 넣어 뒀다.
 */
export function EmbedAutoHeight() {
  useEffect(() => {
    if (window.parent === window) return;

    let last = 0;
    const send = () => {
      const h = Math.ceil(document.documentElement.scrollHeight);
      // 1px씩 떨리는 것까지 보내면 바깥 레이아웃이 계속 흔들린다
      if (Math.abs(h - last) < 8) return;
      last = h;
      window.parent.postMessage({ type: 'ttakcalc:height', height: h }, '*');
    };

    send();
    const ro = new ResizeObserver(send);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, []);

  return null;
}
