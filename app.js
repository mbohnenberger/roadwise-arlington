(() => {
'use strict';

const STORAGE_KEY = 'roadwise-progress';
const SCHEMA_VERSION = 2;
const DAY = 86400000;
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const concepts = {
  mass:{name:'Mass Ave',type:'road',icon:'↔',description:'The east–west spine through Arlington.',view:'local',d:'M55 275 C150 260 235 242 321 231 S490 198 675 174',label:[350,204]},
  center:{name:'Arlington Center',type:'landmark',icon:'◎',description:'The central decision point on Mass Ave.',view:'local',point:[321,231]},
  broadway:{name:'Broadway',type:'road',icon:'↗',description:'Runs east from Arlington Center toward East Arlington and Somerville.',view:'local',d:'M321 231 C390 236 455 227 520 210 S620 183 700 188',label:[472,244]},
  pleasant:{name:'Pleasant St / Route 60',type:'road',icon:'↓',description:'The major southbound branch from Arlington Center.',view:'local',d:'M321 231 C340 274 353 319 346 365 S315 427 286 477',label:[283,344]},
  mystic:{name:'Mystic Street',type:'road',icon:'↑',description:'Heads north from the Center toward the Mystic Lakes.',view:'local',d:'M321 231 C306 188 315 147 352 112 S430 68 504 48',label:[326,132]},
  centerFork:{name:'Center four-way choice',type:'connection',icon:'✦',description:'At the Center: Mass Ave, Broadway, Pleasant, and Mystic each lead differently.'},
  summer:{name:'Summer Street',type:'road',icon:'↗',description:'A northeast connector from the Center area.',view:'local',d:'M321 231 C353 189 399 151 456 129 S557 102 628 83',label:[435,153]},
  park:{name:'Park Avenue',type:'road',icon:'↘',description:'Links Arlington Heights south toward Route 2.',view:'local',d:'M184 252 C211 287 229 326 239 372 S247 432 262 477',label:[194,348]},
  lake:{name:'Lake Street',type:'road',icon:'↘',description:'Links East Arlington south toward Alewife and Cambridge.',view:'local',d:'M459 213 C470 258 466 303 448 351 S434 419 454 477',label:[474,321]},
  heights:{name:'Arlington Heights',type:'landmark',icon:'◉',description:'The western Arlington hub on Mass Ave.',view:'local',point:[184,252]},
  east:{name:'East Arlington',type:'landmark',icon:'◉',description:'The eastern neighborhood near Broadway, Mass Ave, and Lake Street.',view:'local',point:[610,186]},
  spy:{name:'Spy Pond',type:'landmark',icon:'◒',description:'A strong visual anchor south of Mass Ave.',view:'local',point:[391,291]},
  crossTown:{name:'Cross-town connector choices',type:'connection',icon:'⇄',description:'Park, Lake, and Summer solve different north–south/east–west moves.'},
  r2:{name:'Route 2',type:'road',icon:'═',description:'The major east–west highway along southern Arlington.',view:'local',d:'M42 383 C165 378 263 373 350 364 S542 350 730 339',label:[390,389]},
  alewife:{name:'Alewife',type:'landmark',icon:'🚇',description:'Transit hub and regional gateway southeast of Arlington.',view:'local',point:[430,354]},
  r16:{name:'Route 16 parkway arc',type:'road',icon:'⌒',description:'Alewife Brook Parkway becomes Mystic Valley Parkway around Arlington.',view:'local',d:'M395 481 C373 426 382 378 430 349 S528 297 578 263 S651 206 704 108',label:[553,303]},
  gatewayNames:{name:'Route 16 name changes',type:'connection',icon:'⇄',description:'One regional arc uses Alewife Brook Parkway and Mystic Valley Parkway locally.'},
  fresh:{name:'Fresh Pond',type:'landmark',icon:'◒',description:'Cambridge anchor south of Alewife.',view:'regional',point:[356,346]},
  lexington:{name:'Lexington gateway',type:'gateway',icon:'←',description:'Mass Ave continues west toward Lexington.',view:'regional',point:[88,212]},
  wilson:{name:'Wilson Farm',type:'landmark',icon:'◆',description:'A useful Lexington-side landmark near the western approach.',view:'regional',point:[64,180]},
  medford:{name:'Medford gateway',type:'gateway',icon:'↑',description:'Route 16 and northern corridors orient you toward Medford.',view:'regional',point:[520,98]},
  davis:{name:'Davis Square',type:'landmark',icon:'🚇',description:'Somerville destination reached through the east/southeast network.',view:'regional',point:[545,226]},
  gateways:{name:'Regional gateway choices',type:'connection',icon:'✦',description:'Route 2, Route 16, Alewife, and local streets play different roles.'},
  fenway:{name:'Fenway Park',type:'destination',icon:'⚾',description:'A regional destination reached via a gateway, then city streets.',view:'regional',point:[410,430]},
  fenwayRoute:{name:'Fenway gateway decision',type:'connection',icon:'↘',description:'Primary mental model: Arlington → Route 2/Alewife area → Cambridge/Boston; conditions determine the final route.'},
  downtown:{name:'Downtown Boston',type:'destination',icon:'▥',description:'A regional destination east of Cambridge and Somerville.',view:'regional',point:[575,390]},
  garden:{name:'TD Garden',type:'destination',icon:'★',description:'North edge of downtown near major river crossings.',view:'regional',point:[590,350]},
  downtownRoute:{name:'Downtown / Garden gateway decision',type:'connection',icon:'↗',description:'Choose a Cambridge/Somerville gateway, then confirm the city approach.'},
  logan:{name:'Logan Airport',type:'destination',icon:'✈',description:'East Boston destination whose tunnel and airport approaches require live navigation.',view:'regional',point:[700,370]},
  loganRoute:{name:'Logan gateway decision',type:'connection',icon:'→',description:'Think west-to-east through a Boston gateway; tunnels, ramps, traffic, and terminal roads need GPS.'}
};

const regionalRoads = {
  mass:{name:'Mass Ave',d:'M88 212 C190 218 275 235 347 254 S468 285 545 282',label:[262,230]},
  r2:{name:'Route 2',d:'M70 305 C177 302 252 300 320 304 S418 310 474 294',label:[205,323]},
  r16:{name:'Route 16 / Parkway',d:'M322 416 C299 366 303 318 350 286 S455 243 520 196 S570 140 589 88',label:[465,241]},
  broadway:{name:'Broadway / Somerville approach',d:'M256 248 C340 234 437 224 545 226',label:[397,212]},
  pleasant:{name:'Route 60',d:'M256 248 C267 285 276 322 270 365',label:[250,333]},
  city:{name:'Cambridge / Boston approaches',d:'M350 286 C384 340 440 373 575 390 M545 226 C562 277 574 325 590 350 M575 390 C623 385 663 377 700 370',label:[456,382]}
};

const landmarks = {
  center:['center','Arlington Center','◎'],heights:['heights','Arlington Heights','◉'],east:['east','East Arlington','◉'],spy:['spy','Spy Pond','◒'],
  alewife:['alewife','Alewife','🚇'],fresh:['fresh','Fresh Pond','◒'],wilson:['wilson','Wilson Farm','◆'],davis:['davis','Davis Sq','🚇'],
  fenway:['fenway','Fenway','⚾'],garden:['garden','TD Garden','★'],downtown:['downtown','Downtown','▥'],logan:['logan','Logan','✈']
};

const c = (prompt, choices, answer, conceptsUsed, why, map = null) => ({type:'choice',prompt,choices,answer,concepts:conceptsUsed,why,map});
const chain = (prompt, answer, choices, conceptsUsed, why, map = null) => ({type:'chain',prompt,answer,choices,concepts:conceptsUsed,why,map});

const units = [
  {id:1,title:'Arlington backbone',subtitle:'The roads everything else attaches to',color:'#ff8a72',ink:'#45170e',lessons:[
    {id:'u1l1',title:'The spine',icon:'↔',subtitle:'Mass Ave + Arlington Center',newConcepts:['mass','center'],questions:[
      c('Which road is Arlington’s main east–west spine?',['Mass Ave','Summer Street','Lake Street'],'Mass Ave',['mass'],'Mass Ave is the backbone that ties the town together.','mass'),
      c('What landmark is the central decision point on Mass Ave?',['Arlington Center','Alewife','Spy Pond'],'Arlington Center',['center','mass'],'Arlington Center is where several major corridors meet.'),
      c('From Arlington Center, which direction does Mass Ave mainly organize?',['East–west','North only','South only'],'East–west',['mass','center'],'Use Mass Ave as your east–west reference line.'),
      c('Which pair forms the first mental-map anchor?',['Mass Ave + Arlington Center','Route 2 + Logan','Park Ave + Fenway'],'Mass Ave + Arlington Center',['mass','center'],'A road plus a decision point makes a useful first scaffold.')
    ]},
    {id:'u1l2',title:'East from the Center',icon:'↗',subtitle:'Broadway and the eastbound choice',newConcepts:['broadway','centerFork'],questions:[
      c('At Arlington Center, which road heads east toward East Arlington and Somerville?',['Broadway','Mystic Street','Pleasant Street'],'Broadway',['broadway','centerFork'],'Broadway is the clear eastbound branch from the Center.','broadway'),
      c('Which road remains your west–east reference through Arlington?',['Mass Ave','Broadway only','Pleasant Street'],'Mass Ave',['mass'],'Mass Ave stays the backbone even as other roads branch away.','mass'),
      chain('Build the simple eastbound chain from the Heights side.',['Mass Ave','Arlington Center','Broadway'],['Broadway','Mass Ave','Arlington Center','Mystic Street'],['mass','center','broadway','centerFork'],'Mass Ave leads to the Center; Broadway branches east.'),
      c('Broadway is best remembered as…',['The eastbound branch from the Center','The highway south of town','The road to Belmont'],'The eastbound branch from the Center',['broadway','centerFork'],'Tie the road name to its decision point.')
    ]},
    {id:'u1c',title:'Backbone checkpoint',icon:'◆',subtitle:'Pleasant, Mystic, and the Center',checkpoint:true,newConcepts:['pleasant','mystic'],questions:[
      c('At the Center, which corridor heads south toward Belmont?',['Pleasant Street / Route 60','Mystic Street','Broadway'],'Pleasant Street / Route 60',['pleasant','centerFork'],'Pleasant Street / Route 60 is the major southbound choice.','pleasant'),
      c('At the Center, which corridor heads north toward the Mystic Lakes?',['Mystic Street','Broadway','Pleasant Street'],'Mystic Street',['mystic','centerFork'],'Mystic Street is the northbound branch.','mystic'),
      chain('Order the north-to-south backbone through the Center.',['Mystic Street','Arlington Center','Pleasant Street / Route 60'],['Pleasant Street / Route 60','Mass Ave','Mystic Street','Arlington Center'],['mystic','center','pleasant'],'Mystic meets the Center; Pleasant continues south.'),
      c('Which road sends you east from Arlington Center?',['Broadway','Mystic Street','Pleasant Street'],'Broadway',['broadway','centerFork'],'Broadway is the eastbound choice.'),
      c('Which road is the east–west spine across all these choices?',['Mass Ave','Mystic Street','Pleasant Street'],'Mass Ave',['mass'],'Mass Ave is the reference line for the whole junction.')
    ]}
  ]},
  {id:2,title:'Cross-town connectors',subtitle:'Move between the backbone and town edges',color:'#b9dc59',ink:'#253407',lessons:[
    {id:'u2l1',title:'North and south links',icon:'⇅',subtitle:'Summer Street + Park Avenue',newConcepts:['summer','park'],questions:[
      c('Which connector heads northeast from the Center area?',['Summer Street','Park Avenue','Lake Street'],'Summer Street',['summer'],'Summer Street reaches northeast from the Center area.','summer'),
      c('Which road links Arlington Heights south toward Route 2?',['Park Avenue','Broadway','Mystic Street'],'Park Avenue',['park','heights'],'Park Avenue is the useful southbound Heights connector.','park'),
      c('At Arlington Center, which road still points south toward Belmont?',['Pleasant Street / Route 60','Summer Street','Broadway'],'Pleasant Street / Route 60',['pleasant'],'Pleasant remains the direct southbound branch.','pleasant'),
      chain('Build the simple Heights-to-south sequence.',['Mass Ave','Park Avenue'],['Park Avenue','Broadway','Mass Ave'],['mass','park','heights'],'Use Mass Ave to orient at the Heights, then Park Avenue south.')
    ]},
    {id:'u2l2',title:'East side anchors',icon:'◒',subtitle:'Lake Street + Spy Pond',newConcepts:['lake','spy'],questions:[
      c('Which road runs south from East Arlington toward Alewife/Cambridge?',['Lake Street','Mystic Street','Summer Street'],'Lake Street',['lake','east'],'Lake Street is the east-side north–south connector.','lake'),
      c('Which water landmark sits south of Mass Ave as a visual anchor?',['Spy Pond','Mystic Lakes','Boston Harbor'],'Spy Pond',['spy'],'Spy Pond helps orient the center/east side of town.'),
      c('Which connector serves Arlington Heights on the west side?',['Park Avenue','Lake Street','Broadway'],'Park Avenue',['park','heights'],'Park Avenue is the western counterpart to Lake Street.','park'),
      chain('Choose the simple east-side sequence toward the south.',['Mass Ave','Lake Street'],['Summer Street','Mass Ave','Lake Street'],['mass','lake','east'],'Mass Ave anchors East Arlington; Lake Street heads south.')
    ]},
    {id:'u2c',title:'Connector checkpoint',icon:'◆',subtitle:'Heights, East Arlington, and cross-town choices',checkpoint:true,newConcepts:['heights','east','crossTown'],questions:[
      c('Park Avenue is most useful as the southbound connector from…',['Arlington Heights','East Arlington','Arlington Center'],'Arlington Heights',['park','heights'],'Park Avenue is tied to the western Heights hub.'),
      c('Lake Street is most useful as the southbound connector from…',['East Arlington','Lexington','Arlington Heights'],'East Arlington',['lake','east'],'Lake Street is the east-side connector.'),
      chain('Order the familiar west-to-east backbone anchors.',['Arlington Heights','Mass Ave','Arlington Center','East Arlington'],['East Arlington','Arlington Center','Mass Ave','Arlington Heights'],['heights','mass','center','east'],'The anchors line up west to east along the Mass Ave spine.'),
      c('Which landmark helps you recognize the area south of the Center/east side?',['Spy Pond','Logan Airport','Wilson Farm'],'Spy Pond',['spy'],'Spy Pond is a local visual anchor.'),
      c('Which road heads northeast rather than south?',['Summer Street','Park Avenue','Lake Street'],'Summer Street',['summer','crossTown'],'Summer points northeast; Park and Lake are stronger north–south connectors.')
    ]}
  ]},
  {id:3,title:'Regional gateways',subtitle:'Know how Arlington connects outward',color:'#75a8ff',ink:'#0c2855',lessons:[
    {id:'u3l1',title:'The southern gateway',icon:'═',subtitle:'Route 2 + Alewife',newConcepts:['r2','alewife'],questions:[
      c('Which major highway runs east–west along southern Arlington?',['Route 2','Route 16','Route 60'],'Route 2',['r2'],'Route 2 is the southern highway gateway.','r2'),
      c('Which transit hub anchors the southeast gateway?',['Alewife','Davis Square','TD Garden'],'Alewife',['alewife'],'Alewife is a strong regional orientation point.'),
      chain('Build the high-level Heights-to-Alewife-area chain.',['Park Avenue','Route 2','Alewife'],['Alewife','Mass Ave','Route 2','Park Avenue'],['park','r2','alewife'],'Park Avenue reaches Route 2; Alewife anchors the eastern end.'),
      c('Which road remains the town spine north of Route 2?',['Mass Ave','Route 16','Lake Street'],'Mass Ave',['mass','r2'],'Keep the local backbone and regional highway distinct.')
    ]},
    {id:'u3l2',title:'The parkway arc',icon:'⌒',subtitle:'Route 16 and its local names',newConcepts:['r16','gatewayNames'],questions:[
      c('Which regional route arcs around Alewife and the Mystic Valley?',['Route 16','Route 2','Route 60'],'Route 16',['r16'],'Route 16 is the curved regional parkway link.','r16'),
      c('Alewife Brook Parkway and Mystic Valley Parkway are local names associated with…',['Route 16','Mass Ave','Broadway'],'Route 16',['r16','gatewayNames'],'Remember one route number with changing local names.'),
      c('Which gateway is the east–west highway south of Arlington?',['Route 2','Route 16','Broadway'],'Route 2',['r2'],'Route 2 and Route 16 play different shapes and roles.','r2'),
      chain('Order the high-level arc from Alewife toward the Mystic Valley.',['Alewife','Alewife Brook Parkway / Route 16','Mystic Valley Parkway / Route 16'],['Mystic Valley Parkway / Route 16','Alewife','Route 2','Alewife Brook Parkway / Route 16'],['alewife','r16','gatewayNames'],'The same numbered route changes local parkway names along the arc.')
    ]},
    {id:'u3l3',title:'West and south anchors',icon:'◆',subtitle:'Fresh Pond + Lexington / Wilson Farm',newConcepts:['fresh','lexington','wilson'],questions:[
      c('Which Cambridge landmark lies south of Alewife?',['Fresh Pond','Spy Pond','Mystic Lakes'],'Fresh Pond',['fresh','alewife'],'Fresh Pond is a useful anchor beyond the Arlington edge.'),
      c('Which familiar road continues west toward Lexington?',['Mass Ave','Broadway','Lake Street'],'Mass Ave',['mass','lexington'],'Mass Ave is also the western gateway corridor.'),
      c('Which landmark reinforces the Lexington-side approach?',['Wilson Farm','Fenway Park','TD Garden'],'Wilson Farm',['wilson','lexington'],'Wilson Farm is a memorable western landmark.'),
      chain('Build the broad west-to-southeast orientation.',['Lexington / Wilson Farm','Mass Ave','Arlington Center','Alewife'],['Alewife','Arlington Center','Lexington / Wilson Farm','Mass Ave'],['wilson','lexington','mass','center','alewife'],'This is a mental-map chain, not a turn-by-turn route.')
    ]},
    {id:'u3c',title:'Gateway checkpoint',icon:'◆',subtitle:'Medford, Davis, and the whole network',checkpoint:true,newConcepts:['medford','davis','gateways'],questions:[
      c('Which regional arc helps orient toward Medford?',['Route 16 / Mystic Valley Parkway','Route 2 west','Pleasant Street south'],'Route 16 / Mystic Valley Parkway',['r16','medford'],'The Route 16 arc points toward the Mystic and Medford side.'),
      c('Which Somerville hub is an east/southeast destination concept?',['Davis Square','Wilson Farm','Fresh Pond'],'Davis Square',['davis'],'Davis is reached through the eastern network, not the western gateway.'),
      chain('Choose the high-level Arlington-to-Medford chain.',['Arlington network','Route 16 / Mystic Valley Parkway','Medford'],['Medford','Route 2','Arlington network','Route 16 / Mystic Valley Parkway'],['r16','medford','gateways'],'Route 16 is the major regional orientation cue.'),
      chain('Choose the high-level Arlington-to-Davis chain.',['Broadway / East Arlington','Somerville network','Davis Square'],['Davis Square','Route 2','Broadway / East Arlington','Somerville network'],['broadway','east','davis','gateways'],'Broadway and the east side set up the Somerville approach.'),
      c('Which landmark sits south of Alewife?',['Fresh Pond','Wilson Farm','Spy Pond only'],'Fresh Pond',['fresh','alewife'],'Fresh Pond strengthens your Cambridge-side orientation.')
    ]}
  ]},
  {id:4,title:'Destination journeys',subtitle:'Use gateways to reach places that matter',color:'#b392ef',ink:'#28124c',lessons:[
    {id:'u4l1',title:'Journey to Fenway',icon:'⚾',subtitle:'Primary, alternate, and homeward structure',newConcepts:['fenway','fenwayRoute'],destination:true,questions:[
      c('What is the robust first step in a Fenway mental model?',['Choose a southern/eastern gateway before city streets','Memorize every Boston turn','Drive directly east on Broadway'],'Choose a southern/eastern gateway before city streets',['fenwayRoute','fenway'],'Think in layers: Arlington connector, regional gateway, city approach.'),
      c('Which pair is a useful primary gateway concept for Fenway?',['Route 2 / Alewife area','Mystic Street / Mystic Lakes','Lexington / Wilson Farm'],'Route 2 / Alewife area',['r2','alewife','fenwayRoute'],'Route 2 and Alewife orient you toward Cambridge/Boston.'),
      c('Why keep an alternate gateway in mind?',['Traffic and closures can change the city approach','The map is exact','It eliminates GPS'],'Traffic and closures can change the city approach',['fenwayRoute'],'The mental map supports decisions; it does not replace current routing.'),
      chain('Build the high-level outbound structure.',['Arlington connector','Route 2 / Alewife gateway','Cambridge / Boston approach','Fenway'],['Fenway','Arlington connector','Cambridge / Boston approach','Route 2 / Alewife gateway'],['fenway','fenwayRoute','r2','alewife'],'Use the sequence as a scaffold, then verify the final approach.'),
      chain('Build the reverse/home structure.',['Fenway','Cambridge / Alewife-side gateway','Arlington connector','Home area'],['Home area','Arlington connector','Fenway','Cambridge / Alewife-side gateway'],['fenway','fenwayRoute'],'Reverse the same anchors when returning home.')
    ]},
    {id:'u4c',title:'Downtown checkpoint',icon:'★',subtitle:'Downtown + TD Garden',checkpoint:true,destination:true,newConcepts:['downtown','garden','downtownRoute'],questions:[
      c('TD Garden sits on which side of the downtown mental map?',['The north edge of downtown','West of Lexington','South of Fresh Pond'],'The north edge of downtown',['garden','downtown'],'Garden is a northern downtown anchor.'),
      c('For downtown, your high-level choice is mainly between…',['Cambridge/Somerville gateways','Park Ave or Mystic Street only','Wilson Farm or Spy Pond'],'Cambridge/Somerville gateways',['downtownRoute','gateways'],'Select a regional gateway before thinking about city streets.'),
      c('Which condition makes the alternate gateway valuable?',['Traffic, closures, and destination side','The hand-drawn map is exact','Road names never change'],'Traffic, closures, and destination side',['downtownRoute'],'A resilient mental map preserves options.'),
      chain('Build a high-level TD Garden journey.',['Arlington connector','Cambridge or Somerville gateway','Boston crossing / approach','TD Garden'],['TD Garden','Boston crossing / approach','Arlington connector','Cambridge or Somerville gateway'],['garden','downtownRoute'],'This structure helps you recover even when the exact route changes.'),
      chain('Build the homeward structure from downtown.',['Downtown / TD Garden','Cambridge or Somerville gateway','Arlington backbone','Home area'],['Home area','Arlington backbone','Downtown / TD Garden','Cambridge or Somerville gateway'],['downtown','garden','downtownRoute','mass'],'Return by reversing the major anchors, not memorizing tiny turns.')
    ]}
  ]},
  {id:5,title:'Airport journey',subtitle:'A resilient map for the far side of Boston',color:'#4fc1b0',ink:'#083c34',lessons:[
    {id:'u5c',title:'Journey to Logan',icon:'✈',subtitle:'Gateway choices, tunnels, and the trip home',checkpoint:true,destination:true,newConcepts:['logan','loganRoute'],questions:[
      c('What should your mental map do for a Logan trip?',['Organize gateways and decision points','Replace live navigation at airport ramps','Guarantee the fastest tunnel'],'Organize gateways and decision points',['loganRoute','logan'],'The course teaches structure, not live turn-by-turn routing.'),
      c('Which details still warrant GPS near Logan?',['Tunnels, ramps, traffic, and terminal approach','Whether Mass Ave exists','Where Arlington Center is'],'Tunnels, ramps, traffic, and terminal approach',['logan','loganRoute'],'Airport approaches change with traffic, construction, and terminal access.'),
      c('A useful alternate is chosen mainly because…',['Boston traffic can make gateways behave differently','All routes are identical','The study geometry is exact'],'Boston traffic can make gateways behave differently',['loganRoute'],'Keep primary and alternate gateway concepts available.'),
      chain('Build the high-level outbound Logan structure.',['Arlington connector','Cambridge/Somerville gateway','Boston tunnel / harbor crossing','Logan terminal area'],['Logan terminal area','Arlington connector','Boston tunnel / harbor crossing','Cambridge/Somerville gateway'],['logan','loganRoute','gateways'],'Use current GPS for the tunnel, ramp, traffic, and terminal details.'),
      chain('Build the reverse/home structure.',['Logan terminal area','Boston/Cambridge gateway','Arlington backbone','Home area'],['Home area','Arlington backbone','Logan terminal area','Boston/Cambridge gateway'],['logan','loganRoute','mass'],'The same anchors help you recover on the way home.')
    ]}
  ]}
];

const lessons = units.flatMap(unit => unit.lessons.map(lesson => ({...lesson,unit:unit.id})));
const allQuestions = lessons.flatMap(lesson => lesson.questions.map(question => ({...question,lessonId:lesson.id})));

function defaultProgress(){
  return {version:SCHEMA_VERSION,xp:0,streak:0,lastActive:null,currentUnit:1,completedLessons:[],conceptMastery:{},reviewDue:{},answered:0,mistakes:0};
}

function migrateProgress(raw){
  const clean = defaultProgress();
  if(!raw || typeof raw !== 'object') return clean;
  if(!raw.version){
    clean.xp = finite(raw.points);
    clean.streak = finite(raw.streak);
    clean.answered = finite(raw.answered);
    return clean;
  }
  clean.xp = finite(raw.xp ?? raw.points);
  clean.streak = finite(raw.streak);
  clean.answered = finite(raw.answered);
  clean.mistakes = finite(raw.mistakes);
  clean.lastActive = typeof raw.lastActive === 'string' ? raw.lastActive : null;
  clean.completedLessons = Array.isArray(raw.completedLessons) ? raw.completedLessons.filter(id => lessons.some(l => l.id === id)) : [];
  clean.conceptMastery = sanitizeNumberMap(raw.conceptMastery, 0, 100);
  clean.reviewDue = sanitizeNumberMap(raw.reviewDue, 0, Number.MAX_SAFE_INTEGER);
  clean.currentUnit = Math.max(1, Math.min(units.length, finite(raw.currentUnit) || 1));
  return clean;
}
function finite(value){const n=Number(value);return Number.isFinite(n)&&n>=0?Math.floor(n):0;}
function sanitizeNumberMap(value,min,max){
  const result={}; if(!value||typeof value!=='object'||Array.isArray(value))return result;
  Object.entries(value).forEach(([key,val])=>{const n=Number(val);if(concepts[key]&&Number.isFinite(n))result[key]=Math.max(min,Math.min(max,n));});
  return result;
}
function loadProgress(){
  try{return migrateProgress(JSON.parse(localStorage.getItem(STORAGE_KEY)));}catch(error){return defaultProgress();}
}
let progress = loadProgress();
let session = null;
let mapView = 'local';
let mapLabels = true;

function saveProgress(){
  progress.version=SCHEMA_VERSION;
  const firstIncomplete=lessons.find(l=>!progress.completedLessons.includes(l.id));
  progress.currentUnit=firstIncomplete?firstIncomplete.unit:units.length;
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(progress));}catch(error){}
  renderDashboard();
}
function knownConcepts(){return new Set(Object.keys(progress.conceptMastery).filter(id=>progress.conceptMastery[id]>0));}
function dueConcepts(){
  const now=Date.now();
  return Object.keys(progress.conceptMastery).filter(id=>progress.conceptMastery[id]<45||(progress.reviewDue[id]&&progress.reviewDue[id]<=now));
}
function nextLesson(){return lessons.find(l=>!progress.completedLessons.includes(l.id));}
function lessonUnlocked(index){return index===0||progress.completedLessons.includes(lessons[index-1].id);}
function masteredCount(type){return Object.entries(progress.conceptMastery).filter(([id,value])=>value>=35&&concepts[id]?.type===type).length;}
function connectionCount(){return Object.entries(progress.conceptMastery).filter(([id,value])=>value>=35&&['connection','gateway'].includes(concepts[id]?.type)).length;}

function renderDashboard(){
  $('#xp').textContent=progress.xp;
  $('#streak').textContent=progress.streak;
  $('#roads-known').textContent=masteredCount('road');
  $('#connections-known').textContent=connectionCount();
  const pct=Math.round(progress.completedLessons.length/lessons.length*100);
  $('#course-progress').style.width=`${pct}%`;
  $('#summary-copy').textContent=pct===100?'Course complete — keep your map fresh':progress.completedLessons.length?`${progress.completedLessons.length} of ${lessons.length} lessons complete`:'Your first road is ready';
  const due=dueConcepts();
  $('#review-btn').disabled=due.length===0;
  $('#review-copy').textContent=due.length?`${due.length} concept${due.length===1?'':'s'} ready to strengthen`:'No reviews due yet';
  const path=$('#course-path'); path.replaceChildren();
  units.forEach(unit=>{
    const section=document.createElement('section');
    const unitLessons=unit.lessons;
    const complete=unitLessons.every(l=>progress.completedLessons.includes(l.id));
    section.className=`unit${complete?' complete':''}`;
    section.style.setProperty('--unit-color',unit.color); section.style.setProperty('--unit-ink',unit.ink);
    section.innerHTML=`<div class="unit-banner"><div><span class="unit-number">UNIT ${unit.id}</span><h3>${unit.title}</h3><p>${unit.subtitle}</p></div></div>`;
    unitLessons.forEach(lesson=>{
      const index=lessons.findIndex(l=>l.id===lesson.id);
      const done=progress.completedLessons.includes(lesson.id);
      const unlocked=lessonUnlocked(index);
      const button=document.createElement('button');
      button.className=`lesson-node ${done?'done':unlocked?'current':'locked'}${lesson.checkpoint?' checkpoint':''}`;
      button.disabled=!unlocked;
      button.setAttribute('aria-label',`${lesson.title}. ${done?'Completed':unlocked?'Available':'Locked'}`);
      button.innerHTML=`<span class="node-orb"><span>${done?'✓':unlocked?lesson.icon:'🔒'}</span></span><span class="node-copy"><strong>${lesson.title}</strong><small>${lesson.subtitle}</small><em>${done?'COMPLETED':unlocked?'START LESSON':'LOCKED'}</em></span>`;
      if(unlocked)button.addEventListener('click',()=>openLesson(lesson.id));
      section.append(button);
    });
    path.append(section);
  });
}

function openLesson(id,review=false){
  const lesson=review?makeReviewLesson():lessons.find(item=>item.id===id);
  if(!lesson)return;
  session={lesson,stage:'intro',index:0,round:review?lesson.questions:makeRound(lesson),correct:0,locked:false,selected:[],review};
  $('#lesson-shell').hidden=false; document.body.style.overflow='hidden';
  renderLesson(); $('#close-lesson').focus();
}
function makeRound(lesson){
  const newSet=new Set(lesson.newConcepts);
  const novel=lesson.questions.filter(q=>q.concepts.some(id=>newSet.has(id))).slice(0,2);
  const lessonIndex=lessons.findIndex(l=>l.id===lesson.id);
  const familiarPool=allQuestions.filter(q=>{
    const sourceIndex=lessons.findIndex(l=>l.id===q.lessonId);
    return sourceIndex<lessonIndex&&!q.concepts.some(id=>newSet.has(id));
  });
  if(lessonIndex===0)return shuffle([...lesson.questions,...lesson.questions]).slice(0,7);
  const familiar=[];
  const shuffledFamiliar=shuffle(familiarPool);
  while(familiar.length<5&&shuffledFamiliar.length)familiar.push(shuffledFamiliar[familiar.length%shuffledFamiliar.length]);
  if(lesson.destination){
    const destinationRound=[...lesson.questions];
    while(destinationRound.length<7&&shuffledFamiliar.length)destinationRound.push(shuffledFamiliar[(destinationRound.length-lesson.questions.length)%shuffledFamiliar.length]);
    return shuffle(destinationRound).slice(0,7);
  }
  const fallback=shuffle(lesson.questions);
  while(familiar.length<5)familiar.push(fallback[familiar.length%fallback.length]);
  return shuffle([...novel,...familiar]).slice(0,7);
}
function makeReviewLesson(){
  const weak=dueConcepts();
  const available=q=>{const index=lessons.findIndex(l=>l.id===q.lessonId);return progress.completedLessons.includes(q.lessonId)||lessonUnlocked(index);};
  let pool=allQuestions.filter(q=>q.concepts.some(id=>weak.includes(id))&&available(q));
  if(!pool.length)pool=allQuestions.filter(available);
  const questions=[];
  while(questions.length<Math.min(7,Math.max(3,pool.length)))questions.push(...shuffle(pool));
  return {id:'review',title:'Weak spots review',subtitle:'Strengthen the roads that need another pass',icon:'↻',newConcepts:[],questions:questions.slice(0,7),unit:progress.currentUnit};
}
function closeLesson(){
  $('#lesson-shell').hidden=true; $('#lesson-footer').hidden=true; document.body.style.overflow=''; session=null; reserveFooter();
}
function renderLesson(){
  const content=$('#lesson-content'); content.replaceChildren();
  $('#lesson-footer').hidden=true; $('#lesson-footer').className='lesson-footer'; reserveFooter();
  if(session.stage==='intro')return renderIntro(content);
  if(session.stage==='question')return renderQuestion(content);
  renderComplete(content);
}
function renderIntro(content){
  const lesson=session.lesson;
  $('#lesson-count').textContent=session.review?'REVIEW':'INTRO'; $('#lesson-progress-bar').style.width='0%';
  const section=document.createElement('section'); section.className='intro';
  const newCards=session.review?dueConcepts().slice(0,3):lesson.newConcepts;
  section.innerHTML=`<span class="lesson-badge">${session.review?'PERSONALIZED REVIEW':lesson.checkpoint?'CHECKPOINT':'UNIT '+lesson.unit}</span><h2>${lesson.title}</h2><p>${lesson.subtitle}</p><div class="concept-reveal">${newCards.map(id=>concepts[id]?`<div class="concept-card"><span aria-hidden="true">${concepts[id].icon}</span><div><strong>${concepts[id].name}</strong><small>${concepts[id].description}</small></div></div>`:'').join('')}</div><p class="mix-note">${session.review?'Questions focus on due or low-mastery concepts.':'This round mixes about 70% familiar recall with 30% newer ideas when prior material is available.'}</p><button class="primary" id="begin-lesson">${session.review?'Start review':'Begin lesson'} →</button>`;
  content.append(section); $('#begin-lesson').onclick=()=>{session.stage='question';renderLesson();};
}
function renderQuestion(content){
  const q=session.round[session.index]; session.locked=false; session.selected=[];
  const pct=session.index/session.round.length*100; $('#lesson-progress-bar').style.width=`${pct}%`; $('#lesson-count').textContent=`${session.index+1}/${session.round.length}`;
  const section=document.createElement('section'); section.className='question';
  section.innerHTML=`<span class="question-type">${q.type==='chain'?'BUILD THE ROUTE CHAIN':'CHOOSE THE BEST ANSWER'}</span><h2>${q.prompt}</h2><p>${q.type==='chain'?'Tap the anchors in order, then check your chain.':'Use the network, not tiny turn-by-turn details.'}</p><div class="map-card"><svg id="lesson-map" viewBox="0 0 760 500" role="img" aria-label="Approximate study map for this question"></svg><div class="compass" aria-hidden="true">N<br>↑</div><div class="map-note">Approximate study geometry · not to scale</div></div>`;
  content.append(section);
  const questionView=(q.map&&concepts[q.map]?.view==='regional')||session.lesson.destination?'regional':'local';
  drawMap($('#lesson-map'),questionView,{highlight:q.map,includeLesson:session.lesson,labels:true});
  if(q.type==='chain')renderChain(section,q); else renderChoices(section,q);
}
function renderChoices(section,q){
  const box=document.createElement('div'); box.className='answers';
  shuffle(q.choices).forEach((choice,index)=>{
    const button=document.createElement('button'); button.className='answer'; button.dataset.letter=String.fromCharCode(65+index); button.textContent=choice;
    button.onclick=()=>gradeQuestion(button,choice===q.answer,q); box.append(button);
  });
  section.append(box);
}
function renderChain(section,q){
  const zone=document.createElement('div'); zone.className='chain-zone'; zone.setAttribute('aria-label','Selected route chain');
  const answers=document.createElement('div'); answers.className='answers';
  shuffle(q.choices).forEach((choice,index)=>{
    const button=document.createElement('button'); button.className='answer'; button.dataset.letter=String.fromCharCode(65+index); button.textContent=choice;
    button.onclick=()=>{if(session.locked)return;session.selected.push(choice);button.disabled=true;const chip=document.createElement('button');chip.className='chain-chip';chip.textContent=`${choice} ×`;chip.onclick=()=>{const i=session.selected.indexOf(choice);if(i>=0)session.selected.splice(i,1);chip.remove();button.disabled=false;};zone.append(chip);};answers.append(button);
  });
  const actions=document.createElement('div'); actions.className='chain-actions';
  const clear=document.createElement('button');clear.className='secondary';clear.textContent='Clear';clear.onclick=()=>{session.selected=[];zone.replaceChildren();answers.querySelectorAll('button').forEach(b=>b.disabled=false);};
  const check=document.createElement('button');check.className='primary small';check.textContent='Check chain';check.onclick=()=>{const ok=session.selected.length===q.answer.length&&session.selected.every((item,i)=>item===q.answer[i]);gradeQuestion(zone,ok,q);};
  actions.append(clear,check); section.append(zone,answers,actions);
}
function gradeQuestion(element,correct,q){
  if(session.locked)return; session.locked=true; element.classList.add(correct?'correct':'wrong');
  progress.answered++;
  q.concepts.forEach(id=>{
    const old=progress.conceptMastery[id]||0;
    if(correct){progress.conceptMastery[id]=Math.min(100,old+10);if(progress.conceptMastery[id]>=45)delete progress.reviewDue[id];}
    else{progress.conceptMastery[id]=Math.max(0,old-14);progress.reviewDue[id]=Date.now();}
  });
  if(correct){session.correct++;progress.xp+=5;}else progress.mistakes++;
  saveProgress();
  const footer=$('#lesson-footer');footer.hidden=false;footer.className=`lesson-footer ${correct?'good':'bad'}`;
  $('#footer-title').textContent=correct?'Nice connection!':'Not quite — add it to review';
  const answer=Array.isArray(q.answer)?q.answer.join(' → '):q.answer;
  $('#footer-copy').textContent=correct?q.why:`Answer: ${answer}. ${q.why}`;
  $('#footer-action').textContent=session.index===session.round.length-1?'Finish':'Continue';
  $('#footer-action').onclick=nextQuestion;
  requestAnimationFrame(()=>{reserveFooter();$('#footer-action').focus({preventScroll:true});});
}
function nextQuestion(){
  if(session.index<session.round.length-1){session.index++;renderLesson();}else{session.stage='complete';completeLesson();renderLesson();}
}
function completeLesson(){
  const lesson=session.lesson;
  if(!session.review&&!progress.completedLessons.includes(lesson.id)){
    progress.completedLessons.push(lesson.id); progress.xp+=25;
    lesson.newConcepts.forEach(id=>{progress.conceptMastery[id]=Math.max(progress.conceptMastery[id]||0,40);});
  } else if(session.review){progress.xp+=10;}
  updateDailyStreak(); saveProgress();
}
function updateDailyStreak(){
  const today=new Date().toISOString().slice(0,10);
  if(progress.lastActive===today)return;
  if(progress.lastActive){const delta=Math.round((Date.parse(today)-Date.parse(progress.lastActive))/DAY);progress.streak=delta===1?progress.streak+1:1;}else progress.streak=1;
  progress.lastActive=today;
}
function renderComplete(content){
  $('#lesson-count').textContent='DONE'; $('#lesson-progress-bar').style.width='100%';
  const lesson=session.lesson; const next=nextLesson(); const accuracy=Math.round(session.correct/session.round.length*100);
  const section=document.createElement('section');section.className='complete-screen';
  const airportNote=lesson.id==='u5c'?'<p class="mix-note"><strong>Keep GPS on for the final approach:</strong> tunnels, ramps, traffic, construction, and terminal roads are not represented here.</p>':'';
  section.innerHTML=`<div class="complete-mark">✓</div><span class="lesson-badge">${session.review?'REVIEW COMPLETE':'LESSON COMPLETE'}</span><h2>${session.review?'Weak spots strengthened':lesson.title+' complete'}</h2><p>${session.review?'Due concepts received another pass. Come back when more reviews are scheduled.':next?`Unlocked: ${next.title}`:'You completed the current Roadwise course.'}</p>${airportNote}<div class="xp-earned"><div><strong>+${session.review?10:25}</strong><span>completion XP</span></div><div><strong>${accuracy}%</strong><span>accuracy</span></div></div><br><button class="primary" id="done-button">${next&&!session.review?'Continue to course':'Back to course'} →</button>`;
  content.append(section); $('#done-button').onclick=closeLesson;
}

function learnedRoadIds(view){
  const known=knownConcepts();
  if(view==='local')return Object.keys(concepts).filter(id=>concepts[id].type==='road'&&concepts[id].view==='local'&&known.has(id));
  return Object.keys(regionalRoads).filter(id=>known.has(id)||id==='city'&&progress.completedLessons.some(x=>x.startsWith('u4')||x.startsWith('u5')));
}
function previewIds(view,includeLesson){
  const lesson=includeLesson||nextLesson(); if(!lesson)return[];
  return lesson.newConcepts.filter(id=>view==='local'?concepts[id]?.type==='road'&&concepts[id]?.view==='local':regionalRoads[id]);
}
function svg(tag,attrs={},text=''){const node=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,value));if(text)node.textContent=text;return node;}
function drawMap(target,view='local',options={}){
  target.replaceChildren();
  const known=knownConcepts(); const roads=view==='local'?concepts:regionalRoads;
  target.append(svg('path',{class:'water',d:view==='local'?'M0 420 C145 390 225 422 350 405 S570 395 760 365 L760 500 L0 500Z':'M300 500 C340 420 400 405 485 420 S640 438 760 410 L760 500Z'}));
  target.append(svg('text',{x:24,y:45,class:'town-label'},view==='local'?'ARLINGTON + NEIGHBORS':'ARLINGTON → BOSTON REGION'));
  const learned=new Set(learnedRoadIds(view)); const preview=new Set(previewIds(view,options.includeLesson));
  Object.entries(roads).forEach(([id,road])=>{
    if(view==='local'&&road.type!=='road')return;
    const visible=learned.has(id)||preview.has(id)||options.highlight===id;
    if(!visible)return;
    let cls='road '+(learned.has(id)?'learned':'preview');
    if(options.highlight)cls+=options.highlight===id?' highlight':' dim';
    target.append(svg('path',{class:cls,d:road.d}));
    if(options.labels!==false&&road.label)target.append(svg('text',{x:road.label[0],y:road.label[1],class:'road-label'},road.name||road.short));
  });
  Object.values(landmarks).forEach(([id,label,icon])=>{
    const concept=concepts[id]; if(!concept||concept.view!==view)return;
    const isKnown=known.has(id),isPreview=options.includeLesson?.newConcepts.includes(id);
    if(!isKnown&&!isPreview)return;
    const [x,y]=concept.point;target.append(svg('circle',{cx:x,cy:y,r:7,class:'landmark-dot'}));target.append(svg('text',{x:x-5,y:y+5,class:'landmark-icon'},icon));
    if(options.labels!==false)target.append(svg('text',{x:x+12,y:y-9,class:'landmark-label'},label));
  });
}
function openMap(){mapView='local';mapLabels=true;$('#map-modal').hidden=false;document.body.style.overflow='hidden';renderStudyMap();$('#close-map').focus();}
function closeMap(){$('#map-modal').hidden=true;document.body.style.overflow='';}
function renderStudyMap(){
  $$('.map-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.mapView===mapView));
  $('#toggle-labels').textContent=mapLabels?'Hide labels':'Show labels';drawMap($('#study-map'),mapView,{labels:mapLabels});
}
function reserveFooter(){
  const footer=$('#lesson-footer');const height=footer.hidden?0:Math.ceil(footer.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--footer-space',`${height}px`);
}
function showToast(message){const toast=$('#toast');toast.textContent=message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2200);}
function shuffle(items){const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}

$('#close-lesson').onclick=closeLesson;
$('#review-btn').onclick=()=>openLesson('review',true);
$('#explore-btn').onclick=openMap;
$('#close-map').onclick=closeMap;
$('#map-modal').addEventListener('click',event=>{if(event.target===$('#map-modal'))closeMap();});
$$('[data-map-view]').forEach(button=>button.onclick=()=>{mapView=button.dataset.mapView;renderStudyMap();});
$('#toggle-labels').onclick=()=>{mapLabels=!mapLabels;renderStudyMap();};
$('#reset-btn').onclick=()=>{if(confirm('Reset all Roadwise course progress, mastery, XP, and streak?')){progress=defaultProgress();saveProgress();showToast('Course progress reset');}};
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){if(!$('#map-modal').hidden)closeMap();else if(!$('#lesson-shell').hidden)closeLesson();return;}
  if(!session||session.stage!=='question'||session.locked)return;
  const n=Number(event.key);if(n>=1&&n<=9){const buttons=$$('.answer:not(:disabled)');buttons[n-1]?.click();}
});
window.addEventListener('resize',reserveFooter);
if('ResizeObserver' in window)new ResizeObserver(reserveFooter).observe($('#lesson-footer'));

window.RoadwiseTest={migrateProgress,defaultProgress,makeRound,lessons,concepts};
saveProgress();
})();
