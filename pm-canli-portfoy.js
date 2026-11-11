/* ParogluMedia | ANA SİTE / canlı portföy (v1)
 * Yalnızca mevcut #projeler sahnesinin ALTINA yerleşir.
 * Mevcut sahne, kartlar, GSAP/scroll animasyonları ve diğer bölümler korunur.
 * Güvenlik: salt-okunur public key; sadece RLS'in izin verdiği 'published' projeler.
 */
(()=>{'use strict';
 const PROJECT='https://zeydmwhrtsojujpdbcjl.supabase.co';
 const API_KEY='sb_publishable_jKxQ7dhGl36IjgdZVRQS0g_az7n-4aC';
 const q=(sel,root=document)=>root.querySelector(sel);
 const create=(tag,cl,content)=>{const n=document.createElement(tag);if(cl)n.className=cl;if(content!==undefined)n.textContent=String(content);return n};
 const state={services:[],categories:[],projects:[],media:[],service:'',category:'',text:''};
 const norm=s=>String(s||'').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i');
 const select=(table,qs)=>fetch(`${PROJECT}/rest/v1/${table}?${qs}`,{headers:{apikey:API_KEY,Accept:'application/json'},cache:'no-store'}).then(async r=>{if(!r.ok)throw Error(`${table}: HTTP ${r.status} · ${(await r.text()).slice(0,100)}`);return r.json()});
 function mediaUrl(m){
   if(!m||m.bucket_id!=='pm-portfolio'||typeof m.file_path!=='string')return '';
   const parts=m.file_path.split('/');
   if(parts.length!==3||parts[0]!=='projects'||parts.some(s=>!s||s==='.'||s==='..'||/[?#\\]/.test(s)))return '';
   return `${PROJECT}/storage/v1/object/public/pm-portfolio/${parts.map(encodeURIComponent).join('/')}`;
 }
 const category=p=>state.categories.find(c=>String(c.id)===String(p.category_id));
 const service=p=>{const c=category(p);return c&&state.services.find(s=>String(s.id)===String(c.service_id))};
 const media=p=>state.media.filter(m=>m.project_id===p.id&&mediaUrl(m)).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
 let host,serviceFilters,categoryFilters,searchField,count,grid,status,modal,previousFocus=null,lastActive=null;
 function setStateMsg(title,desc,warning=false){status.replaceChildren();const wrap=create('div','pm-live-empty'+(warning?' pm-live-error':''));wrap.append(create('strong','',title),create('p','',desc));status.append(wrap)}
 function filterButton(text,active,onClick){const b=create('button','pm-live-filter'+(active?' is-active':''),text);b.type='button';b.setAttribute('aria-pressed',String(active));b.addEventListener('click',onClick);return b}
 function showFilters(){
   serviceFilters.replaceChildren();categoryFilters.replaceChildren();
   serviceFilters.append(filterButton('Tümü',!state.service,()=>{state.service='';state.category='';showFilters();draw()}));
   state.services.forEach(s=>serviceFilters.append(filterButton(s.name,state.service===s.slug,()=>{state.service=s.slug;state.category='';showFilters();draw()})));
   const selected=state.services.find(s=>s.slug===state.service);
   categoryFilters.hidden=!selected;
   if(selected){categoryFilters.append(filterButton('Tüm Kategoriler',!state.category,()=>{state.category='';showFilters();draw()}));
     state.categories.filter(c=>String(c.service_id)===String(selected.id)).forEach(c=>categoryFilters.append(filterButton(c.name,state.category===c.slug,()=>{state.category=c.slug;showFilters();draw()})));
   }
 }
 function makeCard(p){
   const card=create('button','pm-live-card');card.type='button';card.setAttribute('aria-label',p.title+' projesini aç');
   const cover=create('div','pm-live-cover');const m=media(p)[0];const url=mediaUrl(m);
   if(url&&m.media_type==='image'){const img=create('img');img.src=url;img.loading='lazy';img.alt=m.alt_text||p.title;cover.append(img)}
   else if(url&&m.media_type==='video'){const video=create('video');video.src=url+'#t=0.1';video.muted=true;video.preload='metadata';video.playsInline=true;cover.append(video);cover.append(create('span','pm-live-play','▶ VİDEO'))}
   else cover.append(create('span','pm-live-placeholder','PAROGLU\nMEDIA'));
   const meta=create('div','pm-live-card-info');const c=category(p),s=service(p);
   meta.append(create('div','pm-live-card-category',[s?.name,c?.name].filter(Boolean).join('  /  ')),create('h3','',p.title));
   if(p.client_name)meta.append(create('p','',p.client_name));
   meta.append(create('span','pm-live-open-label','PROJEYİ İNCELE ↗'));
   card.append(cover,meta);card.addEventListener('click',()=>openModal(p,card));return card;
 }
 function draw(){
   grid.replaceChildren();status.replaceChildren();
   const term=norm(state.text);
   const found=state.projects.filter(p=>{
     const c=category(p),s=service(p);
     if(state.service&&s?.slug!==state.service)return false;
     if(state.category&&c?.slug!==state.category)return false;
     if(term&&!norm([p.title,p.client_name,p.description,c?.name,s?.name].join(' ')).includes(term))return false;
     return true;
   });
   count.textContent=found.length+' PROJE';
   if(!state.projects.length){setStateMsg('Henüz yayınlanan proje yok','Admin panelinden projeyi “Yayında” durumuna aldığında burada görünecek.');return}
   if(!found.length){setStateMsg('Bu kategoride henüz çalışma yok','Diğer hizmetlere ve kategorilere göz atabilirsin.');return}
   const frag=document.createDocumentFragment();found.forEach(p=>frag.append(makeCard(p)));grid.append(frag);
 }
 function closeModal(){if(!modal||modal.hidden)return;modal.querySelectorAll('video').forEach(v=>v.pause());modal.hidden=true;document.body.classList.remove('pm-live-modal-open');if(previousFocus?.focus)previousFocus.focus()}
 function openModal(p,opener){previousFocus=opener;const inner=q('.pm-live-modal-body',modal);inner.replaceChildren();
   const c=category(p),s=service(p);inner.append(create('div','pm-live-detail-kicker',[s?.name,c?.name].filter(Boolean).join(' / ')),create('h2','',p.title));
   const meta=[p.client_name,p.project_role].filter(Boolean).join(' · ');if(meta)inner.append(create('div','pm-live-detail-meta',meta));
   if(p.description)inner.append(create('p','pm-live-description',p.description));
   const gallery=create('div','pm-live-gallery');const files=media(p);
   if(!files.length)gallery.append(create('p','','Bu projeye henüz görsel eklenmemiş.'));
   files.forEach((m,i)=>{const url=mediaUrl(m);if(!url)return;const fig=create('figure');if(m.media_type==='video'){
     const v=create('video');v.src=url;v.controls=true;v.playsInline=true;v.preload='metadata';v.setAttribute('aria-label',m.alt_text||p.title+' videosu');fig.append(v);
   }else{const img=create('img');img.src=url;img.alt=m.alt_text||p.title+' görsel '+(i+1);img.loading=i===0?'eager':'lazy';fig.append(img)}gallery.append(fig)});
   inner.append(gallery);modal.hidden=false;document.body.classList.add('pm-live-modal-open');q('.pm-live-close',modal).focus();
 }
 function style(){if(q('#pm-live-style'))return;const st=create('style');st.id='pm-live-style';st.textContent=`
 #pm-live-portfolio{position:relative;z-index:2;background:#08070d;color:#faf7ff;padding:100px clamp(18px,5vw,85px) 130px;font-family:inherit;scroll-margin-top:20px;isolation:isolate}
 #pm-live-portfolio *{box-sizing:border-box}
 #pm-live-portfolio .pm-live-shell{max-width:1450px;margin:0 auto}
 #pm-live-portfolio .pm-live-kicker{font-size:11px;font-weight:800;letter-spacing:.25em;color:#b790f5;margin:0 0 13px}
 #pm-live-portfolio .pm-live-header{display:flex;align-items:end;justify-content:space-between;gap:20px;margin:0 0 25px}
 #pm-live-portfolio .pm-live-header h2{font-size:clamp(37px,5.7vw,82px);line-height:1;letter-spacing:-.07em;color:#faf7ff;margin:0;font-weight:800}
 #pm-live-portfolio .pm-live-header p{color:#b4a8be;font-size:13px;max-width:330px;line-height:1.65}
 #pm-live-portfolio .pm-live-toolbar{border:1px solid #382a48;border-radius:21px;background:#17111e;padding:20px;margin-bottom:24px}
 #pm-live-portfolio .pm-live-filters{display:flex;gap:9px;flex-wrap:wrap;align-items:center}
 #pm-live-portfolio .pm-live-subfilters{margin-top:13px;padding-top:14px;border-top:1px solid #382a48}
 #pm-live-portfolio .pm-live-filter{appearance:none;border:1px solid #534163;background:#21182b;color:#dbd1e7;border-radius:999px;padding:11px 16px;font-family:inherit;font-weight:700;font-size:12px;line-height:1.1;cursor:pointer;transition:.2s}
 #pm-live-portfolio .pm-live-filter.is-active,#pm-live-portfolio .pm-live-filter:hover{background:#783cd4;border-color:#975ee9;color:#fff}
 #pm-live-portfolio .pm-live-searchrow{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-top:15px}
 #pm-live-portfolio .pm-live-search{flex:1;min-width:190px;max-width:410px;background:#0d0a12;border:1px solid #443451;border-radius:12px;padding:13px 15px;color:#fff;font-family:inherit;font-weight:500;font-size:14px}
 #pm-live-portfolio .pm-live-count{font-size:11px;letter-spacing:.16em;color:#c9b4df}
 #pm-live-portfolio .pm-live-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
 #pm-live-portfolio .pm-live-card{min-width:0;appearance:none;text-align:left;border:1px solid #32283b;border-radius:21px;padding:0;background:#17121d;overflow:hidden;color:#faf7ff;cursor:pointer;box-shadow:0 20px 40px #0005;transition:transform .24s,border-color .24s}
 #pm-live-portfolio .pm-live-card:hover{transform:translateY(-6px);border-color:#9160cb}
 #pm-live-portfolio .pm-live-cover{aspect-ratio:4/3;background:radial-gradient(circle at 50% 50%,#382245,#120f19);display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative}
 #pm-live-portfolio .pm-live-cover img,#pm-live-portfolio .pm-live-cover video{height:100%;width:100%;object-fit:contain}
 #pm-live-portfolio .pm-live-placeholder{white-space:pre-line;font-weight:900;text-align:center;color:#ad86e5;font-size:35px;letter-spacing:-.07em;line-height:.8}
 #pm-live-portfolio .pm-live-play{position:absolute;bottom:14px;right:14px;background:#000b;color:#fff;border-radius:20px;padding:7px 12px;font-size:12px}
 #pm-live-portfolio .pm-live-card-info{padding:21px}
 #pm-live-portfolio .pm-live-card-category{font-size:10px;color:#bd98ec;letter-spacing:.12em;text-transform:uppercase}
 #pm-live-portfolio .pm-live-card-info h3{font-size:clamp(18px,2vw,26px);line-height:1.12;letter-spacing:-.04em;margin:10px 0;color:#fff;font-weight:800}
 #pm-live-portfolio .pm-live-card-info p{font-size:13px;color:#bcb0c8;margin:0}
 #pm-live-portfolio .pm-live-open-label{display:block;margin-top:20px;padding-top:14px;border-top:1px solid #382e40;color:#d5b9ff;font-size:11px;letter-spacing:.14em;font-weight:800}
 #pm-live-portfolio .pm-live-empty{padding:36px;border:1px solid #41334b;border-radius:18px;color:#eee1fa;background:#1b1322}
 #pm-live-portfolio .pm-live-empty p{color:#bbafc4;margin:9px 0 0}
 #pm-live-portfolio .pm-live-error{border-color:#b95f6a}
 #projeler .pm-live-jump{display:inline-flex;pointer-events:auto;align-items:center;justify-content:center;gap:10px;color:#fff!important;text-decoration:none!important;background:#813cce;border:1px solid #ad80ef;border-radius:999px;padding:11px 14px;margin-top:18px;font:800 11px/1.1 system-ui,sans-serif;letter-spacing:.1em;box-shadow:0 5px 23px #000a}
 #projeler .pm-live-jump:hover{background:#9954eb}
 .pm-live-modal-open{overflow:hidden!important}
 .pm-live-overlay[hidden]{display:none!important}
 .pm-live-overlay{position:fixed;inset:0;z-index:2147483600;background:#050408ed;backdrop-filter:blur(12px);display:flex;align-items:start;justify-content:center;overflow:auto;padding:6vh 15px 35px;color:#fff}
 .pm-live-overlay .pm-live-dialog{position:relative;width:min(920px,100%);border-radius:22px;border:1px solid #5e397b;background:#1b1424;padding:clamp(22px,4vw,45px);box-shadow:0 35px 120px #000}
 .pm-live-overlay .pm-live-close{position:sticky;top:0;float:right;background:#7b3ccf;color:#fff;border:0;border-radius:50%;width:44px;height:44px;font-size:25px;cursor:pointer;z-index:3}
 .pm-live-overlay .pm-live-detail-kicker{color:#b790ff;font:800 11px system-ui,sans-serif;letter-spacing:.13em;margin:10px 0}
 .pm-live-overlay h2{font:800 clamp(31px,5vw,56px)/1.06 system-ui,sans-serif;letter-spacing:-.06em;margin:16px 0 10px}
 .pm-live-overlay .pm-live-detail-meta{color:#b8a7ca;font-size:13px}
 .pm-live-overlay .pm-live-description{line-height:1.7;color:#dccfe9;white-space:pre-wrap}
 .pm-live-overlay .pm-live-gallery{display:grid;grid-template-columns:1fr;gap:20px;margin-top:25px}
 .pm-live-overlay figure{margin:0;padding:0;background:#100d15;border-radius:13px;overflow:hidden;display:flex;align-items:center;justify-content:center}
 .pm-live-overlay figure img,.pm-live-overlay figure video{display:block;max-width:100%;height:auto;max-height:80vh;object-fit:contain}
 @media(max-width:900px){#pm-live-portfolio .pm-live-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
 @media(max-width:620px){#pm-live-portfolio{padding:76px 18px 95px}#pm-live-portfolio .pm-live-header{display:block}#pm-live-portfolio .pm-live-grid{grid-template-columns:1fr}#pm-live-portfolio .pm-live-card-info h3{font-size:24px}#pm-live-portfolio .pm-live-toolbar{padding:13px}}
 @media(prefers-reduced-motion:reduce){#pm-live-portfolio .pm-live-card{transition:none}}
 `;document.head.append(st)}
 function build(){
   const scene=q('#projeler');if(!scene||q('#pm-live-portfolio'))return false;
   style();host=create('section');host.id='pm-live-portfolio';host.setAttribute('aria-labelledby','pm-live-title');
   const shell=create('div','pm-live-shell');host.append(shell);
   shell.append(create('div','pm-live-kicker','05 / PAROGLUMEDIA · CANLI PORTFÖY'));
   const titleArea=create('div','pm-live-header'),title=create('h2','','Bütün Projelerimiz.');title.id='pm-live-title';titleArea.append(title,create('p','','Kreatif üretimlerimizi hizmet ve kategori bazında keşfet. Görseller doğrudan güncel portföy arşivimizden yüklenir.'));shell.append(titleArea);
   const toolbar=create('div','pm-live-toolbar');serviceFilters=create('div','pm-live-filters');categoryFilters=create('div','pm-live-filters pm-live-subfilters');categoryFilters.hidden=true;
   const sr=create('div','pm-live-searchrow');searchField=create('input','pm-live-search');searchField.type='search';searchField.placeholder='Proje veya marka ara…';searchField.setAttribute('aria-label','Portföyde ara');searchField.addEventListener('input',()=>{state.text=searchField.value;draw()});count=create('span','pm-live-count','YÜKLENİYOR');sr.append(searchField,count);toolbar.append(serviceFilters,categoryFilters,sr);shell.append(toolbar);
   status=create('div');status.setAttribute('role','status');grid=create('div','pm-live-grid');shell.append(status,grid);setStateMsg('Portföy hazırlanıyor','Yayınlanan projeler yükleniyor…');
   // Sadece bu bölümün doğal akışına eklenir, sticky/kart JS animasyonlarına müdahale edilmez.
   scene.append(host);
   const jumpHost=q('.works-top > div',scene)||q('.works-top',scene);
   if(jumpHost&&!q('.pm-live-jump',scene)){const link=create('a','pm-live-jump','TÜM PORTFÖYÜ GÖR  ↘');link.href='#pm-live-portfolio';jumpHost.append(link)}
   modal=create('div','pm-live-overlay');modal.hidden=true;modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Proje detayları');
   const md=create('div','pm-live-dialog');const close=create('button','pm-live-close','×');close.type='button';close.setAttribute('aria-label','Proje detaylarını kapat');close.addEventListener('click',closeModal);const content=create('div','pm-live-modal-body');md.append(close,content);modal.append(md);document.body.append(modal);
   modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
   return true;
 }
 function linkExistingServices(){
   const mapping={'video':'video','grafik-tasarim':'grafik','sosyal-medya':'sosyal','drone-fotograf':'drone'};
   document.querySelectorAll('a[href^="portfolyo/"],a[href^="./portfolyo/"]').forEach(link=>{
     const raw=(link.getAttribute('href')||'').replace(/^\.\//,'');const slug=raw.split('/')[1];const search=mapping[slug];if(!search)return;
     // Yalnızca mevcut sitenin hizmet portföy bağlantılarını aynı sayfanın canlı bölümüne yönlendir.
     link.addEventListener('click',e=>{
       e.preventDefault();const svc=state.services.find(x=>norm(x.slug).includes(search)||norm(x.name).includes(search));
       state.service=svc?.slug||'';state.category='';showFilters();draw();
       host.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
     });
   });
 }
 async function load(){try{
   const [sv,ca,pr,me]=await Promise.all([
     select('pm_services','select=id,name,slug,sort_order&order=sort_order.asc'),
     select('pm_categories','select=id,service_id,name,slug,sort_order&order=sort_order.asc'),
     select('pm_projects','select=id,category_id,title,slug,description,client_name,project_role,featured,sort_order,status&status=eq.published&order=sort_order.asc'),
     select('pm_media','select=project_id,media_type,bucket_id,file_path,alt_text,sort_order&order=sort_order.asc')]);
   if(![sv,ca,pr,me].every(Array.isArray))throw Error('Veriler beklenen biçimde değil.');
   Object.assign(state,{services:sv,categories:ca,projects:pr.sort((a,b)=>Number(!!b.featured)-Number(!!a.featured)||(a.sort_order||0)-(b.sort_order||0)),media:me});
   showFilters();draw();linkExistingServices();
 }catch(e){console.error('[ParogluMedia] Canlı portföy:',e);setStateMsg('Portföy yüklenemedi','Supabase bağlantısı veya herkese açık erişim izinleri kontrol edilmeli. '+String(e.message||e).slice(0,150),true);count.textContent='BAĞLANTI HATASI'}}
 function init(){if(!build())return;load()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
