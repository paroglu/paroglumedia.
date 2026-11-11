/* ParogluMedia — Hizmet kartlarının içinde canlı portföy v2.1 — KEŞFET yönlendirme düzeltmesi
 * Mevcut pm-canli-portfoy.js dosyasının doğrudan yerine geçer.
 * Ana site #projeler ve animasyonları değişmez. Ayrı büyük portföy sahnesi OLUŞTURMAZ.
 * Supabase publishable key kasıtlı olarak istemcidedir; veri erişimini RLS belirler.
 */
(()=>{'use strict';
if(window.__pmv2Loaded)return; window.__pmv2Loaded=true;
const ENDPOINT='https://zeydmwhrtsojujpdbcjl.supabase.co';
const KEY='sb_publishable_jKxQ7dhGl36IjgdZVRQS0g_az7n-4aC';
const STATE={services:[],categories:[],projects:[],media:[],loading:true,error:''};
const SKUS=['video','grafik','sosyal','drone'];
const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
const norm=s=>String(s||'').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i');
const byOrder=(a,b)=>(a.sort_order||0)-(b.sort_order||0);
const categoryFor=p=>STATE.categories.find(x=>String(x.id)===String(p.category_id));
const serviceFor=p=>{const c=categoryFor(p);return c&&STATE.services.find(x=>String(x.id)===String(c.service_id));};
const projectMedia=p=>STATE.media.filter(m=>m.project_id===p.id&&fileUrl(m)).sort(byOrder);
const panels=new Map();
let zoom,zoomTarget=null,zoomPreviousFocus=null;
const request=(table,qs)=>fetch(`${ENDPOINT}/rest/v1/${table}?${qs}`,{headers:{apikey:KEY,Accept:'application/json'},cache:'no-store'}).then(async r=>{
 if(!r.ok)throw Error(`${table}: ${r.status}`);
 const v=await r.json();if(!Array.isArray(v))throw Error(`${table}: veri biçimi geçersiz`);return v;
});
function fileUrl(m){
 if(!m||m.bucket_id!=='pm-portfolio'||typeof m.file_path!=='string')return '';
 const segments=m.file_path.split('/');
 if(segments.length!==3||segments[0]!=='projects'||segments.some(x=>!x||x==='.'||x==='..'||/[?#\\]/.test(x)))return '';
 return `${ENDPOINT}/storage/v1/object/public/pm-portfolio/${segments.map(encodeURIComponent).join('/')}`;
}
function serviceByIndex(index){
 const token=SKUS[index];if(!token)return null;
 return STATE.services.find(s=>norm(s.slug).includes(token)||norm(s.name).includes(token))||STATE.services[index]||null;
}
function inService(serviceId){return STATE.projects.filter(p=>String(categoryFor(p)?.service_id)===String(serviceId));}
function setContent(container){container.replaceChildren(...Array.prototype.slice.call(arguments,1));}
function bt(text,cls,click){const b=el('button',cls,text);b.type='button';if(click)b.addEventListener('click',click);return b;}
function mediaThumb(m,alt){
 const url=fileUrl(m),wrap=el('div','pmv2-thumb');
 if(!url){wrap.append(el('span','pmv2-placeholder','PAROGLU MEDIA'));return wrap;}
 if(m.media_type==='video'){
  const video=el('video');video.src=url+'#t=0.1';video.preload='metadata';video.muted=true;video.playsInline=true;video.setAttribute('aria-label',alt+' video önizlemesi');wrap.append(video,el('span','pmv2-videotag','▶ VIDEO'));
 }else{
  const img=el('img');img.src=url;img.loading='lazy';img.alt=m.alt_text||alt;img.decoding='async';wrap.append(img);
 }
 return wrap;
}
function mkPanel(card,index){
 const p=el('div','pmv2-panel');p.hidden=true;p.setAttribute('aria-label','Hizmet portföyü');
 const top=el('div','pmv2-head');top.append(el('div','pmv2-topmark','PAROGLUMEDIA / PORTFÖY'),bt('✕  KAPAT','pmv2-close',()=>closePanel(index)));
 const scroll=el('div','pmv2-scroll');p.append(top,scroll);card.append(p);
 const item={card,index,p,scroll,selectedCat:'',detail:null,previousFocus:null};panels.set(index,item);return item;
}
function getCats(svc){return STATE.categories.filter(c=>String(c.service_id)===String(svc?.id)).sort(byOrder);}
function closePanel(index){const item=panels.get(index);if(!item||item.p.hidden)return;item.p.hidden=true;item.card.classList.remove('pmv2-is-open');item.card.style.removeProperty('z-index');item.detail=null;item.scroll.scrollTop=0;if(item.previousFocus?.focus)item.previousFocus.focus();}
function closeOthers(except){for(const [i] of panels)if(i!==except)closePanel(i);}
function openPanel(index,trigger){
 const item=panels.get(index);if(!item)return;
 closeOthers(index);item.previousFocus=trigger||document.activeElement;
 const svc=serviceByIndex(index),cats=getCats(svc);
 if(!svc){item.selectedCat='';}else if(!item.selectedCat){
  // Grafik Tasarım ilk açıldığında Spor Tasarımları doğrudan seçilir.
  const sports=index===1?cats.find(c=>norm(c.name).includes('spor')):null;
  item.selectedCat=sports?sports.slug:'';
 }
 item.p.hidden=false;item.card.classList.add('pmv2-is-open');item.card.style.zIndex='80';
 item.detail=null;render(item);item.scroll.scrollTop=0;
 $('.pmv2-close',item.p)?.focus({preventScroll:true});
}
function stateMessage(item,title,detail){
 const box=el('div','pmv2-state');box.append(el('strong','',title),el('p','',detail));item.scroll.append(box);
}
function render(item){
 const svc=serviceByIndex(item.index),cats=getCats(svc),all=svc?inService(svc.id):[];
 item.scroll.replaceChildren();
 const t=el('div','pmv2-titleline');
 const meta=el('div','pmv2-meta');meta.append(el('span','pmv2-kicker',`${String(item.index+1).padStart(2,'0')} / ${svc?.name?.toLocaleUpperCase('tr-TR')||'HİZMET'}`),el('h2','',svc?.name||'Portföy'));
 t.append(meta,el('span','pmv2-live','● CANLI PORTFÖY'));item.scroll.append(t);
 if(STATE.loading){stateMessage(item,'Portföy yükleniyor','Yayınlanan çalışmalar getiriliyor…');return;}
 if(STATE.error){stateMessage(item,'Bağlantı kurulamadı',STATE.error);return;}
 if(!svc){stateMessage(item,'Hizmet bulunamadı','Kategori ayarları kontrol edilmeli.');return;}
 if(item.detail){renderDetail(item,item.detail,svc);return;}
 const sub=el('p','pmv2-intro','Kategoriyi seç, gerçek projelerimizi ve tasarımlarımızı incele.');item.scroll.append(sub);
 const tabs=el('div','pmv2-tabs');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Portföy kategorileri');
 const allBtn=bt('Tüm Çalışmalar','pmv2-tab'+(!item.selectedCat?' is-active':''),()=>{item.selectedCat='';render(item)});
 allBtn.setAttribute('aria-pressed',String(!item.selectedCat));tabs.append(allBtn);
 for(const c of cats){
  const active=item.selectedCat===c.slug;
  const button=bt(c.name,'pmv2-tab'+(active?' is-active':''),()=>{item.selectedCat=c.slug;render(item)});
  button.setAttribute('aria-pressed',String(active));tabs.append(button);
 }
 item.scroll.append(tabs);
 const selected=all.filter(pr=>!item.selectedCat||categoryFor(pr)?.slug===item.selectedCat);
 const count=el('div','pmv2-results');count.append(el('strong','',item.selectedCat?cats.find(c=>c.slug===item.selectedCat)?.name||'Kategori':'Tüm projeler'),el('span','',`${selected.length} PROJE`));item.scroll.append(count);
 if(!selected.length){stateMessage(item,'Henüz yayınlanmış proje yok',all.length?'Başka bir kategoriye geçebilirsin.':'Admin panelinde proje yayınladığında burada otomatik gösterilecek.');return;}
 const grid=el('div','pmv2-grid');
 selected.forEach(pr=>{
  const card=bt('','pmv2-project',()=>{item.detail=pr;render(item);item.scroll.scrollTop=0;});card.setAttribute('aria-label',`${pr.title} projesini incele`);
  const thumb=mediaThumb(projectMedia(pr)[0],pr.title);const info=el('div','pmv2-info');
  const text=el('div');text.append(el('span','pmv2-projectcat',categoryFor(pr)?.name||''),el('h3','',pr.title));
  if(pr.client_name)text.append(el('p','',pr.client_name));
  info.append(text,el('span','pmv2-more','İNCELE ↗'));card.append(thumb,info);grid.append(card);
 });item.scroll.append(grid);
}
function renderDetail(item,pr,svc){
 const back=bt('←  '+(getCats(svc).find(c=>c.slug===item.selectedCat)?.name||'Projeler'),'pmv2-back',()=>{item.detail=null;render(item);item.scroll.scrollTop=0;});item.scroll.append(back);
 const head=el('div','pmv2-detail-head');head.append(el('span','pmv2-detail-category',[svc.name,categoryFor(pr)?.name].filter(Boolean).join(' / ')),el('h2','',pr.title));
 if(pr.client_name||pr.project_role)head.append(el('p','',[pr.client_name,pr.project_role].filter(Boolean).join(' · ')));
 if(pr.description)head.append(el('p','pmv2-description',pr.description));item.scroll.append(head);
 const images=projectMedia(pr);
 if(!images.length){stateMessage(item,'Henüz görsel yok','Bu projeye henüz medya yüklenmemiş.');return;}
 const grid=el('div','pmv2-gallery');
 images.forEach((m,i)=>{
  const mediaBtn=bt('','pmv2-galleryitem',()=>openZoom(m,pr.title,i));mediaBtn.setAttribute('aria-label',`${pr.title}: ${i+1}. medya öğesini büyüt`);
  mediaBtn.append(mediaThumb(m,pr.title));grid.append(mediaBtn);
 });item.scroll.append(grid);
}
function openZoom(m,title,index){
 if(!zoom){zoom=el('div','pmv2-zoom');zoom.hidden=true;zoom.setAttribute('role','dialog');zoom.setAttribute('aria-modal','true');zoom.setAttribute('aria-label','Görsel önizleme');
  const inner=el('div','pmv2-zoom-inner');const close=bt('✕  KAPAT','pmv2-zoom-close',closeZoom);inner.append(close);
  zoomTarget=el('div','pmv2-zoom-content');inner.append(zoomTarget);zoom.append(inner);document.body.append(zoom);
  zoom.addEventListener('click',e=>{if(e.target===zoom)closeZoom();});
 }
 zoomPreviousFocus=document.activeElement;zoomTarget.replaceChildren();
 const url=fileUrl(m);if(!url)return;
 if(m.media_type==='video'){const vid=el('video');vid.src=url;vid.controls=true;vid.playsInline=true;vid.preload='metadata';zoomTarget.append(vid);}
 else{const img=el('img');img.src=url;img.alt=m.alt_text||`${title} görsel ${index+1}`;zoomTarget.append(img);}
 zoom.hidden=false;document.body.classList.add('pmv2-zoom-open');$('.pmv2-zoom-close',zoom).focus();
}
function closeZoom(){if(!zoom||zoom.hidden)return;$$('video',zoom).forEach(v=>v.pause());zoom.hidden=true;document.body.classList.remove('pmv2-zoom-open');if(zoomPreviousFocus?.focus)zoomPreviousFocus.focus();}
function installStyle(){if($('#pmv2-styles'))return;const style=el('style');style.id='pmv2-styles';style.textContent=`
/* V2 is fully scoped to existing service cards; other sections stay unchanged. */
.service-card .pmv2-panel[hidden],.pmv2-zoom[hidden]{display:none!important}
.service-card .pmv2-panel{--pmv2-bg:#eeeae6;--pmv2-fg:#231f27;--pmv2-muted:#706974;--pmv2-line:#d3cbd1;--pmv2-chip:#f9f6f3;position:absolute;inset:0;z-index:95;display:flex;flex-direction:column;background:var(--pmv2-bg);color:var(--pmv2-fg);overflow:hidden;font-family:inherit;transform:translateZ(0)}
.service-card.purple .pmv2-panel{--pmv2-bg:#7150d9;--pmv2-fg:#fff;--pmv2-muted:#eee2ff;--pmv2-line:#ffffff55;--pmv2-chip:#ffffff20}
.service-card.lavender .pmv2-panel{--pmv2-bg:#c9b5ea;--pmv2-fg:#251c31;--pmv2-muted:#554868;--pmv2-line:#aa92c0;--pmv2-chip:#eee5fc}
.service-card.charcoal .pmv2-panel{--pmv2-bg:#222128;--pmv2-fg:#faf8ff;--pmv2-muted:#c3bdc9;--pmv2-line:#55505e;--pmv2-chip:#35313c}
.service-card .pmv2-panel *{box-sizing:border-box}
.service-card .pmv2-head{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:16px clamp(20px,3.2vw,52px);border-bottom:1px solid var(--pmv2-line);flex:none;background:var(--pmv2-bg)}
.service-card .pmv2-topmark{font-size:10px;font-weight:800;letter-spacing:.24em;opacity:.72}
.service-card .pmv2-close,.service-card .pmv2-back{border:1px solid currentColor;border-radius:60px;background:transparent;color:inherit;padding:12px 17px;font-size:11px;font-weight:700;font-family:inherit;letter-spacing:.09em;cursor:pointer;white-space:nowrap}
.service-card .pmv2-scroll{overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;min-height:0;flex:1;padding:clamp(22px,3.1vw,48px) clamp(24px,4vw,72px) 45px}
.service-card .pmv2-titleline{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}
.service-card .pmv2-kicker{display:block;font-size:11px;letter-spacing:.20em;font-weight:800;opacity:.67;margin-bottom:14px}
.service-card .pmv2-titleline h2{font-size:clamp(35px,5.2vw,72px);line-height:1;letter-spacing:-.06em;margin:0;font-weight:850;color:inherit}
.service-card .pmv2-live{font-size:10px;letter-spacing:.15em;font-weight:800;white-space:nowrap;opacity:.70}
.service-card .pmv2-intro{margin:17px 0 20px;font-size:14px;line-height:1.55;color:var(--pmv2-muted);opacity:1}
.service-card .pmv2-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 25px}
.service-card .pmv2-tab{border:1px solid var(--pmv2-line);border-radius:50px;background:var(--pmv2-chip);color:var(--pmv2-fg);padding:10px 16px;font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;transition:background .2s,transform .2s}
.service-card .pmv2-tab:hover{transform:translateY(-2px)}
.service-card .pmv2-tab.is-active{background:#2a212e;color:#fff;border-color:#2a212e}
.service-card.purple .pmv2-tab.is-active,.service-card.charcoal .pmv2-tab.is-active{background:#f3eafb;color:#211628}
.service-card .pmv2-results{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid var(--pmv2-line);padding:18px 0 16px;font-size:11px;letter-spacing:.08em}
.service-card .pmv2-results strong{font-size:13px;letter-spacing:0}
.service-card .pmv2-results span{opacity:.7}
.service-card .pmv2-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.service-card .pmv2-project{min-width:0;border:1px solid var(--pmv2-line);border-radius:15px;background:var(--pmv2-chip);color:var(--pmv2-fg);padding:0;overflow:hidden;text-align:left;cursor:pointer;box-shadow:0 13px 35px #140c1912;transition:transform .25s,box-shadow .25s}
.service-card .pmv2-project:hover{transform:translateY(-4px);box-shadow:0 18px 35px #140c1926}
.service-card .pmv2-thumb{height:auto;aspect-ratio:16/11;position:relative;display:flex;justify-content:center;align-items:center;overflow:hidden;background:#1c142622}
.service-card .pmv2-thumb img,.service-card .pmv2-thumb video{display:block;width:100%;height:100%;object-fit:contain}
.service-card .pmv2-videotag{position:absolute;bottom:12px;right:12px;background:#1c142ee0;border-radius:50px;padding:7px 12px;color:#fff;font-size:10px;font-weight:800}
.service-card .pmv2-placeholder{font-weight:900;letter-spacing:-.05em;opacity:.4}
.service-card .pmv2-info{padding:16px;display:flex;gap:5px;flex-direction:column;justify-content:space-between;min-height:137px}
.service-card .pmv2-projectcat{display:block;font-size:10px;font-weight:800;letter-spacing:.08em;opacity:.65}
.service-card .pmv2-info h3{font-size:clamp(16px,1.6vw,23px);line-height:1.2;letter-spacing:-.035em;margin:8px 0 7px;font-weight:800;color:inherit}
.service-card .pmv2-info p{font-size:12px;line-height:1.4;margin:0;opacity:.65}
.service-card .pmv2-more{font-size:10px;font-weight:800;letter-spacing:.13em;align-self:flex-end;margin-top:18px}
.service-card .pmv2-state{padding:24px;border:1px dashed var(--pmv2-line);border-radius:15px}
.service-card .pmv2-state p{font-size:13px;line-height:1.6;margin:8px 0 0;opacity:.7}
.service-card .pmv2-back{margin-bottom:22px}
.service-card .pmv2-detail-head{max-width:850px}
.service-card .pmv2-detail-category{display:block;font-size:11px;letter-spacing:.13em;font-weight:800;opacity:.66;text-transform:uppercase}
.service-card .pmv2-detail-head h2{font-size:clamp(27px,4vw,55px);font-weight:850;line-height:1.07;letter-spacing:-.04em;margin:14px 0 9px}
.service-card .pmv2-detail-head p{font-size:14px;line-height:1.6;margin:5px 0;opacity:.7}
.service-card .pmv2-detail-head .pmv2-description{white-space:pre-wrap;opacity:.9;margin:15px 0 20px}
.service-card .pmv2-gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin:22px 0}
.service-card .pmv2-galleryitem{border:1px solid var(--pmv2-line);border-radius:14px;background:var(--pmv2-chip);padding:6px;cursor:zoom-in;overflow:hidden}
.service-card .pmv2-galleryitem .pmv2-thumb{aspect-ratio:4/5;border-radius:10px}
.pmv2-zoom{position:fixed;z-index:2147483000;inset:0;background:#08070dee;display:flex;align-items:center;justify-content:center;padding:clamp(12px,3vw,40px);overflow:auto;backdrop-filter:blur(14px)}
.pmv2-zoom-inner{width:min(1100px,100%);max-height:100%;display:flex;flex-direction:column;align-items:flex-end;gap:12px}
.pmv2-zoom-close{border:1px solid #a78bd0;border-radius:50px;background:#191221;color:white;padding:12px 20px;font-weight:800;cursor:pointer}
.pmv2-zoom-content{flex:1;min-height:0;width:100%;display:flex;justify-content:center;align-items:center}
.pmv2-zoom-content img,.pmv2-zoom-content video{display:block;max-width:100%;max-height:83vh;object-fit:contain;border-radius:12px}
body.pmv2-zoom-open{overflow:hidden}
@media(max-width:950px){.service-card .pmv2-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:650px){.service-card .pmv2-head{padding:12px 17px}.service-card .pmv2-topmark{font-size:8px}.service-card .pmv2-close{padding:9px 12px;font-size:10px}.service-card .pmv2-scroll{padding:22px 18px 35px}.service-card .pmv2-titleline{display:block}.service-card .pmv2-live{display:block;margin-top:12px}.service-card .pmv2-titleline h2{font-size:clamp(30px,7vw,50px)}.service-card .pmv2-tab{font-size:10px;padding:9px 12px}.service-card .pmv2-grid,.service-card .pmv2-gallery{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.service-card .pmv2-info{min-height:110px;padding:12px}.service-card .pmv2-info h3{font-size:16px}}
@media(max-width:440px){.service-card .pmv2-grid,.service-card .pmv2-gallery{grid-template-columns:1fr}.service-card .pmv2-thumb{aspect-ratio:5/3}.service-card .pmv2-galleryitem .pmv2-thumb{aspect-ratio:4/5}}
@media(prefers-reduced-motion:reduce){.service-card .pmv2-project,.service-card .pmv2-tab{transition:none!important}}
`;document.head.append(style);
}
function onLinkClick(event){
 // The current live index.html uses href="#markalar" on every service-card KEŞFET button.
 // Its older listener opens a text-only service dialog. Catch the click in capture phase
 // and stop that legacy handler, WITHOUT changing index.html or any scroll animation.
 const target=event.target instanceof Element?event.target:event.target?.parentElement;
 const cta=target?.closest?.('.service-card .service-cta');
 if(cta){
  const card=cta.closest('.service-card');
  const index=Number(card?.getAttribute('data-card'));
  const item=panels.get(index);
  if(Number.isInteger(index)&&item?.card===card){
   event.preventDefault();event.stopImmediatePropagation();
   openPanel(index,cta);
   return;
  }
 }
 // Retain legacy portfolyo/... links elsewhere in the homepage.
 const a=target?.closest?.('a[href*="portfolyo/"]');if(!a)return;
 const href=(a.getAttribute('href')||'').toLowerCase();
 const index=href.includes('/grafik-tasarim/')?1:href.includes('/sosyal-medya/')?2:href.includes('/drone-fotograf/')?3:href.includes('/video/')?0:-1;
 if(index<0||!panels.has(index))return;
 event.preventDefault();event.stopImmediatePropagation();
 const item=panels.get(index);
 if(!a.closest('.service-card'))item.card.scrollIntoView({block:'center',behavior:'smooth'});
 openPanel(index,a);
}
function boot(){
 const cards=$$('.services .service-card');if(!cards.length){console.warn('[ParogluMedia] Hizmet kartları bulunamadı');return;}
 installStyle();cards.forEach((card,index)=>mkPanel(card,index));
 document.addEventListener('click',onLinkClick,true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(zoom&&!zoom.hidden)closeZoom();else for(const [i,item] of panels)if(!item.p.hidden)closePanel(i)}});
 load();
}
async function load(){
 try{
  const [services,categories,projects,media]=await Promise.all([
   request('pm_services','select=id,name,slug,sort_order&order=sort_order.asc'),
   request('pm_categories','select=id,service_id,name,slug,sort_order,group_name&order=sort_order.asc'),
   request('pm_projects','select=id,category_id,title,description,client_name,project_role,status,featured,sort_order&status=eq.published&order=sort_order.asc'),
   request('pm_media','select=project_id,media_type,bucket_id,file_path,alt_text,sort_order&order=sort_order.asc')
  ]);
  Object.assign(STATE,{services,categories,projects:projects.sort((a,b)=>Number(!!b.featured)-Number(!!a.featured)||byOrder(a,b)),media,loading:false});
 }catch(err){STATE.loading=false;STATE.error='Yayınlanan portföy verilerine şu anda erişilemiyor.';console.error('[ParogluMedia] Kart içi portföy bağlantısı:',err);}
 for(const item of panels.values())if(!item.p.hidden)render(item);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
