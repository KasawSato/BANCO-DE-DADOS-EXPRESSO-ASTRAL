import { criarModo } from './modo.js'
import { buscarConteudo, difere, mesclar, ehAutor, forcado } from './conteudo.js'

const KEY='arquivoModularExpressoV3';
const DEFAULT_DB={
 sessions:[
 {id:'s1',name:'Xianzhou',description:'Registros, lore, história e campanha da Xianzhou.'},
 {id:'s2',name:'Expresso Astral',description:'Tripulação, sistemas, arquivos e acontecimentos do Expresso.'},
 {id:'s3',name:'Aeons & Caminhos',description:'Aeons, Caminhos, Emanators, Pathstriders e relações.'},
 {id:'s4',name:'Enxame / Propagação',description:'Criaturas, eventos e ameaças da Propagação.'},
 {id:'s5',name:'Campanha',description:'Conteúdo original do RPG.'}],
 posts:[]
};
let db=DEFAULT_DB;
let currentSession='all',editingId=null;
const cu=c=>"url('"+String(c).replace(/'/g,'%27')+"')";
const THEMES={
 expresso:{accent:'#82cfff',line:'#2b4164',bg1:'#182b47',h1:'#13243b',h2:'#0b1422',star:'170,215,255',icon:'🚂'},
 xianzhou:{accent:'#ffd27a',line:'#5a4a2b',bg1:'#3a2c12',h1:'#2a2112',h2:'#140f08',star:'255,222,150',icon:'🏮'},
 aeons:{accent:'#c6a2ff',line:'#45307a',bg1:'#2a1b4d',h1:'#231640',h2:'#0f0a1d',star:'216,190,255',icon:'✦'},
 propagacao:{accent:'#8dff9c',line:'#2f5a3a',bg1:'#12351c',h1:'#10301a',h2:'#07140b',star:'170,255,180',icon:'🦠'},
 campanha:{accent:'#ff9bb0',line:'#5a2b3c',bg1:'#431a2b',h1:'#331626',h2:'#14080f',star:'255,185,205',icon:'⚔'}};
let curTheme='expresso';
function themeOf(s){const k=Object.keys(THEMES);return THEMES[s.theme]?s.theme:({s1:'xianzhou',s2:'expresso',s3:'aeons',s4:'propagacao',s5:'campanha'}[s.id])||k[[...s.id].reduce((a,c)=>a+c.charCodeAt(0),0)%k.length]}
function applyTheme(){
 const s=db.sessions.find(x=>x.id===currentSession);curTheme=s?themeOf(s):'expresso';const t=THEMES[curTheme],r=document.documentElement.style;
 r.setProperty('--accent',t.accent);r.setProperty('--line',t.line);r.setProperty('--bg1',t.bg1);r.setProperty('--h1',t.h1);r.setProperty('--h2',t.h2);
 const l=document.querySelector('.logo');if(l)l.textContent=t.icon
}
function cycleTheme(id){const k=Object.keys(THEMES),s=db.sessions.find(x=>x.id===id);s.theme=k[(k.indexOf(themeOf(s))+1)%k.length];save()}
// armazenamento em IndexedDB (sem o limite de 5 MB do localStorage)
const idb=()=>new Promise((res,rej)=>{const r=indexedDB.open('ArquivoExpresso',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
async function idbGet(k){const d=await idb();return new Promise((res,rej)=>{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
async function idbSet(k,v){const d=await idb();return new Promise((res,rej)=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=()=>res();t.onerror=()=>rej(t.error)})}
async function loadDB(){try{let x=await idbGet('db');if(!x){const old=localStorage.getItem(KEY);if(old)x=JSON.parse(old)}if(x&&x.sessions&&x.posts)db=x;navigator.storage?.persist?.()}catch(e){console.error(e)}}
function clean(h){const d=new DOMParser().parseFromString('<body>'+(h||''),'text/html');d.querySelectorAll('script,object,embed').forEach(n=>n.remove());d.body.querySelectorAll('*').forEach(n=>[...n.attributes].forEach(a=>{if(/^on/i.test(a.name)||/^\s*javascript:/i.test(a.value))n.removeAttribute(a.name)}));return d.body.innerHTML}
function readImg(file,max){return new Promise(res=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height));if(file.type==='image/gif'||(k===1&&file.size<300000))return res(r.result);const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);res(c.toDataURL('image/webp',.85))};im.onerror=()=>res(r.result);im.src=r.result};r.readAsDataURL(file)})}

const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const strip=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
function save(){renderSessions();idbSet('db',db).catch(()=>toast('Falha ao salvar. Exporte um backup e libere espaço do navegador.'))}
function toast(t,ms=1800){const x=document.getElementById('toast');x.textContent=t;x.style.display='block';setTimeout(()=>x.style.display='none',ms)}
const modo=criarModo({toast});
const bloqueado=()=>modo.bloquear();
function renderSessions(){
 applyTheme();
 document.getElementById('sessionList').innerHTML=db.sessions.map(s=>`<div class="session"><button class="main ${currentSession===s.id?'active':''}" onclick="showSession('${s.id}')">${esc(s.name)}</button><button class="iconbtn" title="Trocar tema" onclick="cycleTheme('${s.id}')">🎨</button><button class="iconbtn edita" onclick="renameSession('${s.id}')">✎</button><button class="iconbtn edita" onclick="deleteSession('${s.id}')">×</button></div>`).join('');
}
function showAll(){currentSession='all';renderSessions();renderLibrary()}
function showSession(id){currentSession=id;renderSessions();renderLibrary()}
function renderLibrary(){
 const s=db.sessions.find(x=>x.id===currentSession),posts=currentSession==='all'?db.posts:db.posts.filter(p=>p.sessionId===currentSession);
 document.getElementById('app').innerHTML=`<div class="hero"><h2>${currentSession==='all'?'Todas as publicações':esc(s?.name||'Seção')}</h2><p>${currentSession==='all'?'Explore todo o arquivo em formato de publicações.':esc(s?.description||'')}</p></div>
 <div class="toolbar"><input id="q" placeholder="Pesquisar publicações..." oninput="filterPosts()"><select id="sort" onchange="filterPosts()"><option value="new">Mais recentes</option><option value="old">Mais antigas</option><option value="title">Título</option></select></div><div id="posts" class="grid"></div>`;
 renderPostCards(posts)
}
function renderPostCards(posts){
 const el=document.getElementById('posts');if(!el)return;
 if(!posts.length){el.innerHTML='<div class="empty">Nenhuma publicação nesta seção.<br><br>Use <b>＋ Publicação</b> para criar um registro.</div>';return}
 el.innerHTML=posts.map(p=>`<article class="post-card" onclick="openPost('${p.id}')"><div class="cover" style="background-image:${p.cover?cu(p.cover):'linear-gradient(145deg,#1b3150,#111c2d)'}"><span>${esc(db.sessions.find(s=>s.id===p.sessionId)?.name||'Arquivo')}</span></div><div class="post-body"><h3>${esc(p.title||'Sem título')}</h3><p>${esc((p.excerpt||strip(p.html)).slice(0,180))}</p><div class="meta">${(p.tags||[]).map(t=>`<span class="tag">#${esc(t)}</span>`).join('')}</div></div></article>`).join('')
}
function filterPosts(){
 const q=(document.getElementById('q')?.value||'').toLowerCase(),sort=document.getElementById('sort')?.value;
 let posts=currentSession==='all'?[...db.posts]:db.posts.filter(p=>p.sessionId===currentSession);
 posts=posts.filter(p=>(p.title+' '+p.excerpt+' '+strip(p.html)+' '+(p.tags||[]).join(' ')).toLowerCase().includes(q));
 posts.sort((a,b)=>sort==='title'?a.title.localeCompare(b.title):sort==='old'?a.createdAt-b.createdAt:b.createdAt-a.createdAt);renderPostCards(posts)
}
function newSession(){if(bloqueado())return;
 const name=prompt('Nome da nova seção:');if(!name)return;const description=prompt('Descrição da seção:')||'';
 const id='s'+Date.now();db.sessions.push({id,name,description});save();showSession(id)
}
function renameSession(id){if(bloqueado())return;const s=db.sessions.find(x=>x.id===id),n=prompt('Novo nome:',s?.name);if(n){s.name=n;save();renderLibrary()}}
function deleteSession(id){if(bloqueado())return;
 if(db.sessions.length===1)return alert('Mantenha pelo menos uma seção.');
 const target=db.sessions.find(x=>x.id!==id);if(!confirm('Excluir seção? As publicações serão movidas para outra seção.'))return;
 db.posts.forEach(p=>{if(p.sessionId===id)p.sessionId=target.id});db.sessions=db.sessions.filter(x=>x.id!==id);currentSession=target.id;save();renderLibrary()
}
function newPost(){if(bloqueado())return;editingId=null;showEditor()}
function showEditor(id=null){if(bloqueado())return;setTimeout(()=>hydrateEmbeds(document.getElementById('editor'),true),0);
 editingId=id;const p=id?db.posts.find(x=>x.id===id):null;
 const selected=p?.sessionId||(currentSession!=='all'?currentSession:db.sessions[0].id);
 document.getElementById('app').innerHTML=`<div class="hero"><h2>${p?'Editar publicação':'Nova publicação'}</h2><p>Crie um registro completo e salve-o no arquivo local.</p></div>
 <div class="editor-wrap"><section class="editor"><div class="editorbar">
 <button onclick="cmd('bold')"><b>B</b></button><button onclick="cmd('italic')"><i>I</i></button><button onclick="cmd('underline')"><u>U</u></button>
 <button onclick="cmd('formatBlock','H2')">Título</button><button onclick="cmd('formatBlock','H3')">Subtítulo</button><button onclick="cmd('insertUnorderedList')">Lista</button><button onclick="cmd('insertOrderedList')">1. Lista</button>
 <button onclick="addLink()">🔗 Link</button>
<button onclick="chooseEditorImage()">🖼 Imagem</button>
<input id="editorImageFile" type="file" accept="image/*" hidden onchange="insertLocalEditorImage(this)">
<button onclick="insertHTML()">⌘ HTML</button><button onclick="cmd('removeFormat')">Limpar</button>
 </div><div id="editor" contenteditable="true">${safeView(p?.html)}</div></section>
 <aside class="side-panel"><h3>Dados da publicação</h3>
 <div class="field"><label>Título</label><input id="postTitle" value="${esc(p?.title||'')}"></div>
 <div class="field"><label>Seção</label><select id="postSession">${db.sessions.map(s=>`<option value="${s.id}" ${s.id===selected?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div>
 <div class="field">
<label>Capa da publicação</label>
<input id="postCoverFile" type="file" accept="image/*" onchange="previewCover(this)">
<div id="coverPreview" style="margin-top:7px;display:${p?.cover?'block':'none'}">
<img id="coverPreviewImg" src="${esc(p?.cover||'')}" style="width:100%;max-height:150px;object-fit:cover;border-radius:8px;border:1px solid var(--line)">
</div>
<input id="postCover" type="hidden" value="${esc(p?.cover||'')}">
<small style="display:block;color:var(--muted);margin-top:5px">A imagem será armazenada dentro do banco local do navegador.</small>
</div>
 <div class="field"><label>Resumo / chamada</label><textarea id="postExcerpt" rows="4">${esc(p?.excerpt||'')}</textarea></div>
 <div class="field"><label>Tags</label><input id="postTags" value="${esc((p?.tags||[]).join(', '))}" placeholder="lore, Xianzhou, campanha"></div>
 <div class="warn">O botão <b>⌘ HTML</b> insere código como conteúdo do post. Ao visualizar a publicação, esse HTML será interpretado pelo navegador. Use somente código confiável.</div>
 <div style="display:flex;gap:7px;margin-top:13px"><button class="btn" style="flex:1" onclick="savePost()">💾 Salvar</button><button class="btn" onclick="cancelEditor()">Cancelar</button></div>
 ${p?`<button class="btn" style="width:100%;margin-top:8px;color:#ff9baa" onclick="deletePost('${p.id}')">Excluir publicação</button>`:''}
 </aside></div>`
}
function cmd(c,v=null){document.execCommand(c,false,v);document.getElementById('editor').focus()}
function addLink(){const url=prompt('URL do hyperlink:');if(url)cmd('createLink',url)}
function chooseEditorImage(){document.getElementById('editorImageFile').click()}
async function insertLocalEditorImage(input){
 const file=input.files?.[0];if(!file)return;const url=await readImg(file,1600);input.value='';
 const img=document.createElement('img');img.src=url;img.alt=file.name;img.style.maxWidth='100%';img.style.borderRadius='10px';
 const ed=document.getElementById('editor'),sel=window.getSelection();
 if(sel&&sel.rangeCount&&ed.contains(sel.anchorNode)){const r=sel.getRangeAt(0);r.deleteContents();r.insertNode(img);r.setStartAfter(img);r.collapse(true);sel.removeAllRanges();sel.addRange(r)}else ed.appendChild(img)
}
async function previewCover(input){
 const file=input.files?.[0];if(!file)return;const url=await readImg(file,1400);
 document.getElementById('postCover').value=url;document.getElementById('coverPreviewImg').src=url;document.getElementById('coverPreview').style.display='block'
}
function insertHTML(){
 const code=prompt('Cole o HTML. Ele será exibido isolado e não afetará a página:');if(!code||!code.trim())return;
 const ed=document.getElementById('editor'),box=document.createElement('div');box.className='html-embed';box.dataset.code=encodeURIComponent(code);
 const sel=getSelection(),r=sel.rangeCount?sel.getRangeAt(0):null;
 if(r&&ed.contains(r.commonAncestorContainer)){r.deleteContents();r.insertNode(box)}else ed.appendChild(box);
 const para=document.createElement('p');para.innerHTML='<br>';box.after(para);hydrateEmbeds(ed,true)
}
// HTML de terceiros roda num iframe com sandbox: sem acesso à página, ao armazenamento ou ao banco
function embedDoc(code){return '<!doctype html><meta charset="utf-8"><base target="_blank"><style>html,body{margin:0}body{color:#e8f0fb;font:16px/1.6 system-ui,sans-serif}</style>'+code+'<script>(function(){var l=0;function s(){var h=document.documentElement.scrollHeight;if(h!==l){l=h;parent.postMessage({embedH:h},"*")}}addEventListener("load",s);new ResizeObserver(s).observe(document.documentElement)})()<\/script>'}
function hydrateEmbeds(root,edit){
 root.querySelectorAll('.html-embed').forEach(b=>{
  const code=decodeURIComponent(b.dataset.code||'');b.contentEditable='false';b.textContent='';
  if(edit){const bar=document.createElement('div');bar.className='embedbar';bar.innerHTML='<span>HTML isolado</span><button type="button">Editar código</button><button type="button">Remover</button>';
   const[be,br]=bar.querySelectorAll('button');
   be.onclick=()=>{const n=prompt('Edite o HTML:',code);if(n===null)return;b.dataset.code=encodeURIComponent(n);hydrateEmbeds(root,true)};
   br.onclick=()=>b.remove();b.appendChild(bar)}
  const f=document.createElement('iframe');f.setAttribute('sandbox','allow-scripts allow-popups');f.title='HTML isolado';f.srcdoc=embedDoc(code);b.appendChild(f)})
}
addEventListener('message',e=>{if(!e.data||typeof e.data.embedH!=='number')return;for(const f of document.querySelectorAll('.html-embed iframe'))if(f.contentWindow===e.source)f.style.height=Math.min(Math.max(e.data.embedH,40),3000)+'px'});
function editorHTML(){const c=document.getElementById('editor').cloneNode(true);c.querySelectorAll('.html-embed').forEach(b=>{b.textContent='';b.removeAttribute('contenteditable')});return c.innerHTML}
// visualização segura do conteúdo comum (não altera o que está salvo)
function safeView(h){const d=new DOMParser().parseFromString('<body>'+(h||''),'text/html');d.querySelectorAll('script,style,link,meta,base,object,embed,iframe').forEach(n=>n.remove());d.body.querySelectorAll('*').forEach(n=>[...n.attributes].forEach(a=>{if(/^on/i.test(a.name)||/^\s*javascript:/i.test(a.value))n.removeAttribute(a.name)}));return d.body.innerHTML}
function savePost(){if(bloqueado())return;
 const p={id:editingId||'p'+Date.now(),title:document.getElementById('postTitle').value.trim()||'Sem título',sessionId:document.getElementById('postSession').value,cover:document.getElementById('postCover').value.trim(),excerpt:document.getElementById('postExcerpt').value.trim(),tags:document.getElementById('postTags').value.split(',').map(x=>x.trim()).filter(Boolean),html:editorHTML(),createdAt:editingId?(db.posts.find(x=>x.id===editingId)?.createdAt||Date.now()):Date.now()};
 const i=db.posts.findIndex(x=>x.id===p.id);if(i>=0)db.posts[i]=p;else db.posts.push(p);save();toast('Publicação salva.');showSession(p.sessionId)
}
function cancelEditor(){renderLibrary()}
function openPost(id){
 const p=db.posts.find(x=>x.id===id);if(!p)return;document.getElementById('readerTitle').textContent=p.title||'Sem título';
 document.getElementById('readerContent').innerHTML=`${p.cover?`<div class="readcover" style="background-image:${cu(p.cover)}"></div>`:''}<div class="readcontent">${safeView(p.html)}</div><div style="margin-top:20px;display:flex;gap:7px"><button class="btn edita" onclick="closeReader();showEditor('${p.id}')">✎ Editar</button><button class="btn" onclick="closeReader()">Fechar</button></div>`;
 document.getElementById('reader').classList.add('show');hydrateEmbeds(document.getElementById('readerContent'),false)
}
function closeReader(){document.getElementById('reader').classList.remove('show')}
function deletePost(id){if(bloqueado())return;if(!confirm('Excluir esta publicação?'))return;db.posts=db.posts.filter(p=>p.id!==id);save();showAll()}
function exportDB(){const b=new Blob([JSON.stringify(db,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='arquivo_modular_expresso.json';a.click();URL.revokeObjectURL(a.href)}
document.getElementById('import').addEventListener('change',e=>{if(bloqueado()){e.target.value='';return}const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{const x=JSON.parse(ev.target.result);if(!x.sessions||!x.posts)throw Error('Formato inválido');x.posts.forEach(p=>p.html=clean(p.html));db=x;currentSession='all';save();renderLibrary();toast('Arquivo importado.')}catch(err){alert('Erro: '+err.message)}};r.readAsText(f);e.target.value=''});
document.getElementById('reader').addEventListener('click',e=>{if(e.target.id==='reader')closeReader()});
const cv=document.getElementById('stars'),cx=cv.getContext('2d');
let S=[],W=0,H=0,mx=0,my=0,shoot=null,fx=localStorage.getItem('starfx')!=='off'&&!matchMedia('(prefers-reduced-motion:reduce)').matches;
function initStars(){W=cv.width=innerWidth;H=cv.height=innerHeight;S=Array.from({length:Math.min(220,W*H/7000|0)},()=>({x:Math.random()*W,y:Math.random()*H,z:Math.random()*.9+.1,p:Math.random()*6.28}))}
function tick(t){
 cx.clearRect(0,0,W,H);if(!fx)return;requestAnimationFrame(tick);const c=THEMES[curTheme].star;
 for(const s of S){s.x-=s.z*.12;if(s.x<0)s.x=W;cx.fillStyle=`rgba(${c},${(.35+.65*Math.abs(Math.sin(t/900*s.z+s.p)))*s.z})`;cx.fillRect(s.x+mx*s.z*12,s.y+my*s.z*12,s.z*2,s.z*2)}
 if(!shoot&&Math.random()<.003)shoot={x:Math.random()*W*.7,y:Math.random()*H*.5,a:1};
 if(shoot){shoot.x+=13;shoot.y+=5;shoot.a-=.012;cx.strokeStyle=`rgba(${c},${Math.max(shoot.a,0)})`;cx.lineWidth=1.6;cx.beginPath();cx.moveTo(shoot.x,shoot.y);cx.lineTo(shoot.x-90,shoot.y-35);cx.stroke();if(shoot.a<=0)shoot=null}
}
function toggleFX(){fx=!fx;localStorage.setItem('starfx',fx?'on':'off');toast(fx?'Estrelas ativadas.':'Estrelas desativadas.');if(fx)requestAnimationFrame(tick)}
addEventListener('resize',initStars);addEventListener('mousemove',e=>{mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5});

// ===== Conteúdo inicial (public/conteudo/arquivo.json) =====
async function carregarSeed(){
  const r=await buscarConteudo();
  if(r.status==='invalido'){toast('conteudo/arquivo.json está em formato inválido.',5000);return false}
  if(r.status==='erro'){console.warn('Conteúdo inicial indisponível:',r.erro);return false}
  if(r.status!=='ok'){console.info('[conteúdo] conteudo/arquivo.json não encontrado (confira public/conteudo/arquivo.json).');return false}
  const s=r.dados;s.posts.forEach(p=>p.html=clean(p.html));
  const pendente=difere(db,s);
  if(ehAutor()&&db.posts.length&&!forcado()){
    if(pendente)toast('O arquivo conteudo/arquivo.json difere do seu. Para aplicá-lo aqui, abra o endereço com ?forcar=1',7000);
    return false}
  if(!pendente)return false;
  db=mesclar(db,s);await idbSet('db',db);
  toast('Conteúdo atualizado a partir do arquivo.',3000);
  return true;
}
loadDB().then(carregarSeed).then(()=>{renderSessions();renderLibrary();initStars();requestAnimationFrame(tick)});

// Funções usadas pelos onclick/onchange do HTML precisam ficar globais (o código agora é um módulo)
Object.assign(window,{addLink,cancelEditor,chooseEditorImage,closeReader,cmd,cycleTheme,deletePost,deleteSession,exportDB,filterPosts,insertHTML,insertLocalEditorImage,newPost,newSession,openPost,previewCover,renameSession,savePost,showAll,showEditor,showSession,toggleFX,
  alternarModo:()=>modo.alternar(renderLibrary),fecharUnlock:modo.fechar,tentarDesbloquear:modo.tentar});
