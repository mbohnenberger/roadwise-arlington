(() => {
'use strict';
const roads={
 mass:{name:'Massachusetts Avenue',short:'Mass Ave',d:'M72 276 C160 255 240 242 320 230 S475 198 640 172',label:[335,205]},
 r2:{name:'Route 2',short:'Route 2',d:'M58 380 C170 375 258 370 345 362 S520 348 718 340',label:[390,382]},
 r16:{name:'Route 16 / Alewife Brook Pkwy / Mystic Valley Pkwy',short:'Rte 16 · Alewife Brook · Mystic Valley',d:'M375 455 C350 410 362 365 406 334 S500 292 552 264 S628 212 682 118',label:[525,307]},
 pleasant:{name:'Route 60 / Pleasant Street',short:'Pleasant St / Rte 60',d:'M318 230 C337 270 350 315 345 362 S307 423 278 468',label:[287,335]},
 broadway:{name:'Broadway',short:'Broadway',d:'M320 230 C380 233 442 230 506 216 S612 186 690 190',label:[465,242]},
 park:{name:'Park Avenue',short:'Park Ave',d:'M190 252 C210 282 228 320 240 372 S246 430 258 468',label:[202,347]},
 lake:{name:'Lake Street',short:'Lake St',d:'M430 210 C440 252 440 300 425 350 S415 410 438 468',label:[449,320]},
 summer:{name:'Summer Street',short:'Summer St',d:'M320 230 C350 188 392 153 447 132 S545 105 615 89',label:[427,151]},
 mystic:{name:'Mystic Street',short:'Mystic St',d:'M320 230 C305 190 310 150 344 116 S420 70 490 50',label:[322,133]},
 medford:{name:'Medford Street',short:'Medford St',d:'M506 216 C535 180 557 144 570 105 S584 58 600 30',label:[566,143]}
};
const nodes={lex:{x:72,y:276,label:'Lexington →'},heights:{x:190,y:252,label:'Arlington Heights'},center:{x:320,y:230,label:'Arlington Center'},alewife:{x:406,y:334,label:'Alewife'},belmont:{x:278,y:468,label:'Belmont'},cambridge:{x:438,y:468,label:'Cambridge'},somerville:{x:690,y:190,label:'Somerville'},medford:{x:600,y:30,label:'Medford'},east:{x:640,y:172,label:'East Arlington'}};
const questions={
 trace:[
  ['mass','This east–west spine runs from Lexington through Arlington Center toward Cambridge.'],['r2','The limited-access east–west highway along southern Arlington.'],['r16','The parkway arc linking Alewife, East Arlington, and the Mystic Valley.'],['pleasant','The north–south road from Arlington Center toward Belmont.'],['summer','The northeast branch from Arlington Center toward the Winchester side.']
 ],
 connect:[
  {title:'Arlington Heights → Alewife',hint:'Order the major-road chain from west to southeast.',chain:['Mass Ave','Lake St','Route 2'],choices:['Mass Ave','Broadway','Lake St','Route 2']},
  {title:'Arlington Center → Belmont',hint:'Choose the direct major corridor south.',chain:['Pleasant St / Rte 60'],choices:['Park Ave','Pleasant St / Rte 60','Broadway']},
  {title:'Arlington Center → Somerville',hint:'Build the simplified eastbound chain.',chain:['Broadway','Route 16'],choices:['Broadway','Summer St','Route 16','Route 2']},
  {title:'Arlington Heights → Cambridge',hint:'Order the major corridors southeast.',chain:['Park Ave','Route 2','Alewife Brook Pkwy'],choices:['Park Ave','Mass Ave','Route 2','Alewife Brook Pkwy']},
  {title:'Arlington Center → Medford',hint:'Use the major northeast link shown on the map.',chain:['Broadway','Medford St'],choices:['Mystic St','Broadway','Medford St','Lake St']}
 ],
 turn:[
  {title:'At Arlington Center, toward Belmont?',hint:'You are eastbound on Mass Ave.',answer:'Pleasant St / Route 60 south',choices:['Summer St northeast','Pleasant St / Route 60 south','Broadway east'],why:'Pleasant Street (Route 60) is the major southbound connection from Arlington Center toward Belmont.'},
  {title:'At Arlington Center, toward Somerville?',hint:'Choose the eastbound corridor.',answer:'Broadway east',choices:['Broadway east','Mystic St north','Pleasant St south'],why:'Broadway continues east from the Center and links toward East Arlington and Somerville.'},
  {title:'Near Alewife, toward Medford?',hint:'Choose the parkway that arcs north and east.',answer:'Route 16 north/east',choices:['Route 2 west','Route 16 north/east','Lake St south'],why:'Route 16 follows Alewife Brook Parkway and Mystic Valley Parkway toward the Mystic and Medford.'},
  {title:'At Arlington Heights, toward Route 2?',hint:'Choose the useful southbound connector.',answer:'Park Ave south',choices:['Mass Ave west','Park Ave south','Summer St northeast'],why:'Park Avenue runs south from the Heights and connects with Route 2.'},
  {title:'At Arlington Center, toward Winchester?',hint:'Choose the northeast branch.',answer:'Summer St northeast',choices:['Pleasant St south','Broadway east','Summer St northeast'],why:'Summer Street branches northeast from the Center toward the Winchester direction.'}
 ]
};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let state={mode:'trace',index:0,round:[],selected:[],locked:false};
let saved;try{saved=JSON.parse(localStorage.getItem('roadwise-progress'))||{};}catch(e){saved={};}
const progress={points:saved.points||0,streak:saved.streak||0,answered:saved.answered||0};
function save(){try{localStorage.setItem('roadwise-progress',JSON.stringify(progress));}catch(e){} updateStats();}
function updateStats(){$('#points').textContent=progress.points;$('#streak').textContent=progress.streak;}
function svg(tag,attrs,text){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs||{}).forEach(([k,v])=>e.setAttribute(k,v));if(text)e.textContent=text;return e;}
function drawMap(highlight=null,labels=true){const map=$('#road-map');map.replaceChildren();map.append(svg('path',{class:'water',d:'M0 420 C130 390 210 420 330 405 S550 400 760 368 L760 500 L0 500Z'}));map.append(svg('text',{x:25,y:55,class:'town'},'ARLINGTON + NEIGHBORS'));
 Object.entries(roads).forEach(([id,r])=>{let cls='road';if(highlight)cls+=id===highlight?' highlight':' dim';map.append(svg('path',{id:'road-'+id,class:cls,d:r.d}));});
 if(labels)Object.values(roads).forEach(r=>map.append(svg('text',{x:r.label[0],y:r.label[1],class:'road-label'},r.short)));
 Object.values(nodes).forEach(n=>{map.append(svg('circle',{cx:n.x,cy:n.y,r:6,class:'node'}));if(labels)map.append(svg('text',{x:n.x+9,y:n.y-9,class:'node-label'},n.label));});
}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function openGame(mode){state={mode,index:0,round:mode==='map'?[]:shuffle(questions[mode]).slice(0,5),selected:[],locked:false};$('#home').closest('main').hidden=true;$('#game').hidden=false;document.body.style.overflow='hidden';render();$('#close-game').focus();}
function closeGame(){$('#game').hidden=true;$('#home').closest('main').hidden=false;document.body.style.overflow='';window.scrollTo({top:0});}
function reserveFeedbackSpace(){const panel=$('#feedback');const main=$('.game-main');const height=panel.hidden?0:Math.ceil(panel.getBoundingClientRect().height)+20;main.style.setProperty('--feedback-space',`${height}px`);}
function render(){const isMap=state.mode==='map';$('#study-controls').hidden=!isMap;$('#answers').hidden=isMap;$('#feedback').hidden=true;reserveFeedbackSpace();$('#question-count').textContent=isMap?'STUDY':`${state.index+1}/5`;$('#progress-bar').style.width=isMap?'100%':`${(state.index+1)*20}%`;
 const labels={trace:'TRACE THE ROAD',connect:'BUILD THE CHAIN',turn:'NEXT TURN',map:'MENTAL MAP'};$('#mode-pill').textContent=labels[state.mode];state.locked=false;state.selected=[];
 if(isMap){$('#question-title').textContent='Study the network';$('#question-hint').textContent='Notice directions, junctions, and where road names change.';drawMap(null,true);return}
 const q=state.round[state.index];if(state.mode==='trace')renderTrace(q);else if(state.mode==='connect')renderConnect(q);else renderTurn(q);
}
function answerButton(text,i){const b=document.createElement('button');b.className='answer';b.dataset.letter=String.fromCharCode(65+i);b.textContent=text;return b}
function renderTrace(q){$('#question-title').textContent='Which road is highlighted?';$('#question-hint').textContent=q[1];drawMap(q[0],false);const opts=shuffle([roads[q[0]].name,...shuffle(Object.values(roads).filter(r=>r!==roads[q[0]]).map(r=>r.name)).slice(0,3)]);const box=$('#answers');box.replaceChildren();opts.forEach((o,i)=>{const b=answerButton(o,i);b.onclick=()=>grade(b,o===roads[q[0]].name,roads[q[0]].name,`Follow its shape and the places it links: ${q[1]}`);box.append(b)});}
function renderTurn(q){$('#question-title').textContent=q.title;$('#question-hint').textContent=q.hint;drawMap(null,true);const box=$('#answers');box.replaceChildren();shuffle(q.choices).forEach((o,i)=>{const b=answerButton(o,i);b.onclick=()=>grade(b,o===q.answer,q.answer,q.why);box.append(b)});}
function renderConnect(q){$('#question-title').textContent=q.title;$('#question-hint').textContent=q.hint;drawMap(null,false);const box=$('#answers');box.replaceChildren();const chain=document.createElement('div');chain.className='chain';chain.setAttribute('aria-label','Your route chain');box.append(chain);shuffle(q.choices).forEach((o,i)=>{const b=answerButton(o,i);b.onclick=()=>{if(state.locked)return;state.selected.push(o);const chip=document.createElement('button');chip.className='chain-chip';chip.textContent=o+' ×';chip.onclick=()=>{const j=state.selected.indexOf(o);if(j>=0)state.selected.splice(j,1);chip.remove();b.disabled=false};chain.append(chip);b.disabled=true;if(state.selected.length===q.chain.length){const ok=state.selected.every((x,j)=>x===q.chain[j]);grade(chain,ok,q.chain.join(' → '),'Major-road chains are simplified here; learn the sequence, then verify real routes before travel.')}};box.append(b)});}
function grade(el,ok,correct,why){if(state.locked)return;state.locked=true;el.classList.add(ok?'correct':'wrong');progress.answered++;if(ok){progress.points+=10;progress.streak++;}else progress.streak=0;save();$('#feedback-title').textContent=ok?'Nice connection!':'Not quite — study the link';$('#feedback-copy').textContent=ok?why:`Answer: ${correct}. ${why}`;$('#feedback').hidden=false;requestAnimationFrame(()=>{reserveFeedbackSpace();el.scrollIntoView({block:'center',behavior:'smooth'});});$('#next-btn').focus();}
function next(){if(state.index<4){state.index++;render()}else{progress.points+=25;save();showToast('Round complete · +25 points');closeGame();}}
function showToast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200)}
$$('[data-mode]').forEach(b=>b.onclick=()=>openGame(b.dataset.mode));$('#start-btn').onclick=()=>openGame(['trace','connect','turn'][Math.floor(Math.random()*3)]);$('#close-game').onclick=closeGame;$('#next-btn').onclick=next;
$('#toggle-labels').onclick=()=>{const hidden=$('#toggle-labels').textContent.includes('Show');drawMap(null,hidden);$('#toggle-labels').textContent=hidden?'Hide labels':'Show labels'};$('#study-quiz').onclick=()=>openGame('trace');
$('#reset-btn').onclick=()=>{if(confirm('Reset your points and streak?')){progress.points=progress.streak=progress.answered=0;save();showToast('Progress reset')}};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#game').hidden)closeGame()});
window.addEventListener('resize',reserveFeedbackSpace);
if('ResizeObserver' in window)new ResizeObserver(reserveFeedbackSpace).observe($('#feedback'));
updateStats();drawMap();
})();
