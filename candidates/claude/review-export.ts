/// <reference types="vite/client" />
import { exportReview, normalizeReview, reviewRoutes, type SavedReview } from './review';
import { initialPosts } from './domain';
import { activeEdition } from './edition';
import projectLicense from '../../LICENSE?raw';

const publicBase = 'https://mini920325-gif.github.io';
const colors = { yellow: '#fff4b9', pink: '#ffe1e6', blue: '#deedff', green: '#e0f1d8' };
const exportCSS = `body{margin:0}.export-heading,.export-notes{font:15px/1.6 system-ui,sans-serif;color:#202521;background:#fff;padding:24px max(20px,calc((100vw - 1200px)/2));overflow-wrap:anywhere}.export-heading h1{margin:0 0 8px;font-size:22px}.export-heading p{margin:4px 0}.export-notes h2{font-size:20px}.export-memo{display:block!important;position:relative!important;box-sizing:border-box!important;padding:14px 16px!important;margin:12px 0!important;max-width:100%!important;border:1px solid #a8a48b!important;border-radius:2px!important;color:#252921!important;font:14px/1.6 system-ui,sans-serif!important;white-space:pre-wrap!important;overflow-wrap:anywhere!important;text-align:left!important}.export-memo strong{display:block;font-weight:700}.export-memo p{margin:6px 0 0!important}.draft[data-preview=true]{pointer-events:auto!important}.draft :disabled{opacity:.8}.draft .skip{display:none}`;

/** A standalone visual reference built from an isolated synthetic page, never the user's live posts or forms. */
export async function exportReviewHTML(input: SavedReview, currentRoute: string): Promise<string> {
  const draft = normalizeReview(input);
  const route = reviewRoutes.includes(currentRoute as typeof reviewRoutes[number]) ? currentRoute : 'home';
  const url = new URL(activeEdition.path, location.origin);
  url.searchParams.set('view', route);
  url.searchParams.set('designPreview', '1');
  url.searchParams.set('design', JSON.stringify(draft.design));
  if (route === 'detail') url.searchParams.set('post', initialPosts()[0]?.id || '');
  const iframe = document.createElement('iframe');
  iframe.title = '내보내기용 예시 화면';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.tabIndex = -1;
  iframe.style.cssText = 'position:fixed;left:-20000px;top:0;width:1280px;height:1000px;pointer-events:none;opacity:0';
  const loaded = new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('화면 생성 시간이 초과됐습니다. JSON과 수정 요청서는 별도로 저장할 수 있어요.')), 15000);
    iframe.onload = () => { clearTimeout(timeout); resolve(); };
    iframe.onerror = () => { clearTimeout(timeout); reject(new Error('내보낼 화면을 읽지 못했습니다.')); };
  });
  iframe.src = url.href;
  document.body.append(iframe);
  try {
    await loaded;
    const frameDoc = iframe.contentDocument;
    if (!frameDoc) throw new Error('내보낼 화면을 읽지 못했습니다.');
    const started = performance.now();
    while (!frameDoc.querySelector('.draft[data-ready="true"]')) {
      if (performance.now() - started > 10000) throw new Error('내보낼 화면이 준비되지 않았습니다.');
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    const css = await Promise.all(Array.from(frameDoc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).map(async link => {
      if (new URL(link.href).origin !== location.origin) return '';
      const response = await fetch(link.href, { credentials: 'omit' });
      if (!response.ok) throw new Error('화면 스타일을 읽지 못했습니다.');
      return response.text();
    }));
    const licenseResponse = await fetch(new URL('THIRD_PARTY_NOTICES.txt', url), { credentials: 'omit' });
    if (!licenseResponse.ok) throw new Error('라이선스 고지를 읽지 못했습니다.');
    const licenses = projectLicense + '\n\n' + await licenseResponse.text();
    const doc = document.implementation.createHTMLDocument(draft.name);
    doc.documentElement.lang = 'ko';
    const charset = doc.createElement('meta'); charset.setAttribute('charset', 'utf-8'); doc.head.prepend(charset);
    const viewport = doc.createElement('meta'); viewport.name = 'viewport'; viewport.content = 'width=device-width,initial-scale=1'; doc.head.append(viewport);
    const style = doc.createElement('style'); style.textContent = css.join('\n') + '\n' + exportCSS; doc.head.append(style);
    const heading = doc.createElement('header'); heading.className = 'export-heading';
    const title = doc.createElement('h1'); title.textContent = `${activeEdition.number}안 · ${activeEdition.name} / ${draft.name}`; heading.append(title);
    for (const text of [
      `시각 참고 HTML · ${route} 화면 · ${draft.notes.length}개 메모`,
      '선택한 디자인을 예시 글로 재현한 정적 화면입니다. 체험 글·댓글·로그인·작성 중인 입력은 포함하지 않습니다.',
      '다시 편집하려면 함께 내보낸 JSON을 기능판의 ‘에이전트 전달 → JSON 불러오기’에서 여세요. 다른 페이지 메모는 하단에 모았습니다.',
    ]) { const p = doc.createElement('p'); p.textContent = text; heading.append(p); }
    doc.body.append(heading);
    const page = frameDoc.querySelector<HTMLElement>('.draft')!.cloneNode(true) as HTMLElement;
    page.removeAttribute('inert');
    page.querySelectorAll('script,iframe,object,embed,.dx-panel,.review-workspace,.rw-pins').forEach(node => node.remove());
    page.querySelectorAll<HTMLElement>('*').forEach(node => {
      for (const attr of Array.from(node.attributes)) {
        if (attr.name.startsWith('on') || attr.name === 'srcdoc') node.removeAttribute(attr.name);
      }
      node.removeAttribute('inert');
      if (node.tagName === 'INPUT') { (node as HTMLInputElement).value = ''; node.removeAttribute('value'); (node as HTMLInputElement).checked = false; node.removeAttribute('checked'); }
      if (node.tagName === 'TEXTAREA') { (node as HTMLTextAreaElement).value = ''; node.textContent = ''; }
      if (node.matches('button,input,textarea,select')) node.setAttribute('disabled', '');
      if (node.tagName === 'A') {
        const href = node.getAttribute('href') || '';
        if (href.startsWith('#')) return;
        try {
          const dest = new URL(href, url);
          if (!['https:', 'http:'].includes(dest.protocol)) node.removeAttribute('href');
          else { if (dest.origin === location.origin) { dest.protocol = 'https:'; dest.host = new URL(publicBase).host; } node.setAttribute('href', dest.href); node.setAttribute('rel', 'noopener noreferrer'); }
        } catch { node.removeAttribute('href'); }
      }
    });
    const leftover = doc.createElement('section'); leftover.className = 'export-notes';
    const subheading = doc.createElement('h2'); subheading.textContent = '다른 페이지·영역의 메모'; leftover.append(subheading);
    for (const [index, note] of draft.notes.entries()) {
      const card = doc.createElement('aside'); card.className = 'export-memo'; card.style.background = colors[note.color];
      const label = doc.createElement('strong'); label.textContent = `${index + 1}. ${note.label} · ${note.route} · ${note.done ? '반영 완료' : '조정 요청'}`;
      const body = doc.createElement('p'); body.textContent = note.text; card.append(label, body);
      const originalTarget = frameDoc.querySelector(`[data-review-target="${note.target}"]`);
      const target = note.route === route && originalTarget?.getClientRects().length ? page.querySelector(`[data-review-target="${note.target}"]`) : null;
      if (target) target.prepend(card); else leftover.append(card);
    }
    doc.body.append(page);
    if (leftover.children.length > 1) doc.body.append(leftover);
    const footer = doc.createElement('footer'); footer.className = 'export-heading';
    const source = doc.createElement('a'); source.href = 'https://github.com/mini920325-gif/site-lab-artifacts'; source.textContent = 'Claude Code 원안 · Codex 통합 | 공개 소스·라이선스 고지'; footer.append(source); doc.body.append(footer);
    const licenseBlock = doc.createElement('details'); licenseBlock.className = 'export-heading';
    const licenseSummary = doc.createElement('summary'); licenseSummary.textContent = '라이선스 고지';
    const licenseText = doc.createElement('pre'); licenseText.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere'; licenseText.textContent = licenses; licenseBlock.append(licenseSummary, licenseText); doc.body.append(licenseBlock);
    const data = doc.createElement('script'); data.type = 'application/json'; data.id = 'community-review-data';
    data.textContent = JSON.stringify(exportReview(draft)).replace(/[<>&\u2028\u2029]/g, char => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0'));
    doc.body.append(data);
    return '<!doctype html>\n' + doc.documentElement.outerHTML;
  } finally { iframe.remove(); }
}
