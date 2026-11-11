/* ParogluMedia V1 — mevcut ana siteyi değiştirmeden portföy bağlantısı ekler.
   Kullanımı: index.html kapanış </body> önüne
   <script src="./pm-portfolio-bridge.js" defer></script>
*/
(() => {
  'use strict';
  const init = () => {
    if (document.getElementById('pm-dynamic-portfolio-cta')) return;
    const section = document.querySelector('#projeler');
    if (!section) return;
    const host = section.querySelector('.works-info') || section.querySelector('.works-top') || section;
    const button = document.createElement('a');
    button.id = 'pm-dynamic-portfolio-cta';
    button.href = './portfoy.html';
    button.textContent = 'TÜM PORTFÖYÜ KEŞFET  ↗';
    button.setAttribute('aria-label', 'Supabase canlı ParogluMedia portföyünü keşfet');
    button.style.cssText = [
      'display:inline-flex','align-items:center','justify-content:center','width:max-content',
      'max-width:100%','border:1px solid #a678f1','border-radius:999px',
      'background:linear-gradient(125deg,#8747d9,#5e2ab9)','color:#fff',
      'font:700 11px/1.3 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',
      'letter-spacing:.07em','padding:13px 16px','margin-top:16px','cursor:pointer',
      'pointer-events:auto','text-decoration:none','text-align:center',
      'box-shadow:0 12px 30px #0008','position:relative','z-index:100'
    ].join(';');
    host.appendChild(button);
    // Kalıcı bölüm animasyonu veya kullanıcı hareketleri değiştirilmez.
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
