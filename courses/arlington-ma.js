(function(root, factory){
  const course=factory();
  if(typeof module==='object'&&module.exports) module.exports=course;
  root.RoadwiseCourses=root.RoadwiseCourses||{};
  root.RoadwiseCourses[course.id]=course;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const concepts = {
  mass:{name:'Mass Ave',type:'road',icon:'↔',description:'The east–west spine: west to Arlington Heights and Lexington; east to East Arlington and Cambridge.',view:'local',d:'M55 275 C150 260 235 242 321 231 C420 240 525 249 675 260',label:[470,270]},
  center:{name:'Arlington Center',type:'landmark',icon:'◎',description:'The central decision point on Mass Ave.',view:'local',point:[321,231]},
  broadway:{name:'Broadway',type:'road',icon:'→',description:'Branches east from Arlington Center and runs east–west north of Mass Ave toward Somerville.',view:'local',d:'M321 231 C370 214 430 205 500 204 S625 209 700 214',label:[520,190]},
  pleasant:{name:'Pleasant St / Route 60',type:'road',icon:'↓',description:'Runs south from Mass Ave toward Route 2, the Belmont line, and Belmont Center.',view:'local',d:'M321 231 C340 274 353 319 346 365 S315 427 286 477',label:[283,344]},
  mystic:{name:'Mystic Street',type:'road',icon:'↑',description:'Runs north from Mass Ave toward the Mystic Lakes and Winchester line.',view:'local',d:'M321 231 C306 188 315 147 352 112 S430 68 504 48',label:[326,132]},
  centerFork:{name:'Center four-way choice',type:'connection',icon:'✦',description:'At the Center: Mass Ave, Broadway, Pleasant, and Mystic each lead differently.'},
  summer:{name:'Summer Street',type:'road',icon:'↖',description:'Runs west/northwest from the Mystic/Mill and Arlington High area past Ed Burns Arena toward the Reservoir and Lexington line.',view:'local',d:'M346 181 C307 170 269 154 225 146 S133 126 48 104',label:[157,130]},
  park:{name:'Park Avenue',type:'road',icon:'↘',description:'Links Arlington Heights south to Route 2 and its Alewife-side gateway.',view:'local',d:'M184 252 C211 287 229 326 239 372 S247 432 262 477',label:[194,348]},
  lake:{name:'Lake Street',type:'road',icon:'↘',description:'Links East Arlington south to Route 2, Alewife, and Cambridge.',view:'local',d:'M565 253 C554 300 535 337 510 359 S478 420 482 477',label:[535,325]},
  heights:{name:'Arlington Heights',type:'landmark',icon:'◉',description:'The western Arlington hub on Mass Ave.',view:'local',point:[184,252]},
  east:{name:'East Arlington',type:'landmark',icon:'◉',description:'The eastern neighborhood along Mass Ave, south of Broadway.',view:'local',point:[610,255]},
  spy:{name:'Spy Pond',type:'landmark',icon:'◒',description:'A strong visual anchor south of Mass Ave.',view:'local',point:[410,315]},
  mysticLakes:{name:'Mystic Lakes / Winchester direction',type:'gateway',icon:'▲',description:'The northern anchor reached by following Mystic Street toward the Winchester line.',view:'local',point:[504,48]},
  belmont:{name:'Belmont Center',type:'gateway',icon:'▼',description:'Route 60 continues south from Pleasant Street through the Belmont line to Belmont Center.',view:'local',point:[286,477]},
  highArena:{name:'Arlington High / Ed Burns Arena',type:'landmark',icon:'◆',description:'The eastern Summer Street corridor begins near Arlington High and passes Ed Burns Arena.',view:'local',point:[292,158]},
  reservoir:{name:'Arlington Reservoir',type:'landmark',icon:'◒',description:'A western anchor between Mass Ave and Summer Street near the Lexington line.',view:'local',point:[103,184]},
  somerville:{name:'Somerville / Teele direction',type:'gateway',icon:'→',description:'Broadway carries the eastbound mental model toward Somerville and the Teele/Ball Square side.',view:'local',point:[700,214]},
  cambridge:{name:'Cambridge direction',type:'gateway',icon:'↘',description:'Mass Ave east and the Lake Street/Alewife gateway both orient toward Cambridge.',view:'local',point:[706,276]},
  lexingtonLocal:{name:'Lexington direction',type:'gateway',icon:'←',description:'Mass Ave west and the Summer Street corridor both reach the Lexington side.',view:'local',point:[55,275]},
  wholeFoods:{name:'Whole Foods Market',type:'landmark',icon:'🛒',description:'A current store landmark at 808 Mass Ave near Bartlett Avenue and Arlington Center.',view:'local',point:[342,233]},
  stopShop:{name:'Stop & Shop',type:'landmark',icon:'🛒',description:'A current store landmark at 905 Mass Ave, west of Whole Foods.',view:'local',point:[270,242]},
  traderJoes:{name:'Trader Joe’s',type:'landmark',icon:'🛒',description:'A current store landmark at 1427 Mass Ave in the Arlington Heights area.',view:'local',point:[132,263]},
  crossTown:{name:'Cross-town connector choices',type:'connection',icon:'⇄',description:'Summer runs west/northwest; Park and Lake run south to Route 2 gateways.'},
  r2:{name:'Route 2',type:'road',icon:'═',description:'The southern highway: east toward Alewife/Cambridge; west toward Lexington and Route 128.',view:'local',d:'M42 383 C165 378 263 373 350 364 S542 350 730 339',label:[390,389]},
  alewife:{name:'Alewife',type:'landmark',icon:'🚇',description:'Transit hub and regional gateway southeast of Arlington.',view:'local',point:[430,354]},
  r16:{name:'Route 16 parkway arc',type:'road',icon:'⌒',description:'Alewife Brook Parkway becomes Mystic Valley Parkway toward the Mystic Valley and Medford.',view:'local',d:'M395 481 C373 426 382 378 430 349 S528 297 578 263 S651 206 704 108',label:[553,303]},
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
  mass:{name:'Mass Ave',d:'M88 212 C190 218 275 235 347 254 S468 275 545 280',label:[275,230]},
  r2:{name:'Route 2',d:'M70 305 C177 302 252 300 320 304 S418 310 474 294',label:[205,323]},
  r16:{name:'Route 16 / Parkway',d:'M322 416 C299 366 303 318 350 286 S455 243 520 196 S570 140 589 88',label:[465,241]},
  broadway:{name:'Broadway / Somerville approach',d:'M347 254 C395 236 462 230 545 232',label:[438,216]},
  pleasant:{name:'Route 60',d:'M256 248 C267 285 276 322 270 365',label:[250,333]},
  city:{name:'Cambridge / Boston approaches',d:'M350 286 C384 340 440 373 575 390 M545 226 C562 277 574 325 590 350 M575 390 C623 385 663 377 700 370',label:[456,382]}
};

const landmarks = {
  center:['center','Arlington Center','◎'],heights:['heights','Arlington Heights','◉'],east:['east','East Arlington','◉'],spy:['spy','Spy Pond','◒'],
  mysticLakes:['mysticLakes','Mystic Lakes / Winchester','▲'],belmont:['belmont','Belmont Center','▼'],highArena:['highArena','High School / Arena','◆'],
  reservoir:['reservoir','Arlington Reservoir','◒'],somerville:['somerville','Somerville / Teele →','→'],cambridge:['cambridge','Cambridge →','↘'],lexingtonLocal:['lexingtonLocal','← Lexington','←'],
  wholeFoods:['wholeFoods','Whole Foods','🛒',12,24],stopShop:['stopShop','Stop & Shop','🛒',-82,-10],traderJoes:['traderJoes','Trader Joe’s','🛒',12,-10],
  alewife:['alewife','Alewife','🚇'],fresh:['fresh','Fresh Pond','◒'],wilson:['wilson','Wilson Farm','◆'],davis:['davis','Davis Sq','🚇'],
  fenway:['fenway','Fenway','⚾'],garden:['garden','TD Garden','★'],downtown:['downtown','Downtown','▥'],logan:['logan','Logan','✈']
};

const c = (prompt, choices, answer, conceptsUsed, why, map = null) => ({type:'choice',prompt,choices,answer,concepts:conceptsUsed,why,map});
const chain = (prompt, answer, choices, conceptsUsed, why, map = null) => ({type:'chain',prompt,answer,choices,concepts:conceptsUsed,why,map});

const units = [
  {id:1,title:'Arlington backbone',subtitle:'Roads tied to memorable destinations',color:'#ff8a72',ink:'#45170e',lessons:[
    {id:'u1l1',title:'The spine',icon:'↔',subtitle:'Start with Mass Ave and Arlington Center',newConcepts:['mass','center'],questions:[
      c('Which road is Arlington’s main east–west spine?',['Mass Ave','Summer Street','Lake Street'],'Mass Ave',['mass'],'Mass Ave ties Arlington’s major hubs together.','mass'),
      c('What landmark is the central decision point on Mass Ave?',['Arlington Center','Alewife','Spy Pond'],'Arlington Center',['center','mass'],'Arlington Center is where several major corridors meet.'),
      c('Where does Mass Ave lead west from Arlington?',['Arlington Heights and Lexington','Belmont Center','Medford'],'Arlington Heights and Lexington',['mass','lexingtonLocal'],'The western Mass Ave anchor is Lexington.','mass'),
      c('Where does Mass Ave lead east?',['East Arlington and Cambridge','Mystic Lakes','Belmont Center'],'East Arlington and Cambridge',['mass','cambridge'],'Mass Ave continues through East Arlington toward Cambridge.','mass'),
      chain('Which roads and anchors take you from Lexington direction to Arlington Center?',['Mass Ave west','Arlington Heights','Mass Ave','Arlington Center'],['Arlington Center','Mass Ave','Mass Ave west','Arlington Heights'],['mass','lexingtonLocal','heights','center'],'Mass Ave is the continuous high-level spine.'),
      chain('Which roads and anchors take you from Arlington Center toward Cambridge?',['Mass Ave east','East Arlington','Cambridge direction'],['Cambridge direction','Mass Ave east','East Arlington','Arlington Center'],['mass','center','east','cambridge'],'Stay on the Mass Ave mental model east through East Arlington.','mass')
    ]},
    {id:'u1stores',title:'Stores on the spine',icon:'🛒',subtitle:'Whole Foods, Stop & Shop, and Trader Joe’s on Mass Ave',newConcepts:['wholeFoods','stopShop','traderJoes'],questions:[
      c('Which major road are Whole Foods, Stop & Shop, and Trader Joe’s all on?',['Mass Ave','Broadway','Summer Street'],'Mass Ave',['mass','wholeFoods','stopShop','traderJoes'],'These current store landmarks reinforce the same Mass Ave spine.','mass'),
      c('Which store landmark is near Arlington Center and Bartlett Avenue?',['Whole Foods Market','Trader Joe’s','Broadway Market'],'Whole Foods Market',['wholeFoods','center','mass'],'Whole Foods at 808 Mass Ave is the Center-side store anchor.','mass'),
      c('Which store is west of Whole Foods along Mass Ave?',['Stop & Shop','A store on Mystic Street','A store on Pleasant Street'],'Stop & Shop',['wholeFoods','stopShop','mass'],'Stop & Shop at 905 Mass Ave is a short distance west along the spine.','mass'),
      c('Which store anchor is farthest west, in the Arlington Heights area?',['Trader Joe’s','Whole Foods Market','Stop & Shop'],'Trader Joe’s',['traderJoes','heights','mass'],'Trader Joe’s at 1427 Mass Ave is the western store anchor.','mass'),
      chain('Which major road takes you from Arlington Center / Whole Foods to Trader Joe’s?',['Mass Ave west','Stop & Shop','Arlington Heights / Trader Joe’s'],['Arlington Heights / Trader Joe’s','Mass Ave west','Whole Foods','Stop & Shop'],['center','wholeFoods','mass','stopShop','heights','traderJoes'],'Follow Mass Ave west through the intermediate store anchor toward Arlington Heights.','mass'),
      chain('Which major road takes you from Trader Joe’s to Whole Foods?',['Mass Ave east','Stop & Shop','Arlington Center / Whole Foods'],['Arlington Center / Whole Foods','Mass Ave east','Trader Joe’s','Stop & Shop'],['traderJoes','heights','mass','stopShop','wholeFoods','center'],'Follow Mass Ave east toward Arlington Center.','mass'),
      chain('Which major road takes you from Whole Foods to Stop & Shop?',['Mass Ave west','Stop & Shop'],['Stop & Shop','Broadway west','Mass Ave west'],['wholeFoods','mass','stopShop'],'Follow Mass Ave west for this short high-level sequence.','mass'),
      chain('Which major road brings you from Stop & Shop to Whole Foods?',['Mass Ave east','Whole Foods / Arlington Center'],['Whole Foods / Arlington Center','Mass Ave east','Stop & Shop'],['stopShop','mass','wholeFoods','center'],'Follow Mass Ave east toward Arlington Center.','mass')
    ]},
    {id:'u1l2',title:'East from the Center',icon:'→',subtitle:'Broadway to Somerville / Teele direction',newConcepts:['broadway','centerFork','somerville'],questions:[
      c('At Arlington Center, which road branches east toward Somerville, north of Mass Ave?',['Broadway','Mystic Street','Pleasant Street'],'Broadway',['broadway','centerFork'],'Broadway branches east and stays north of Mass Ave.','broadway'),
      c('What destination anchor belongs to Broadway east?',['Somerville / Teele direction','East Arlington on Mass Ave','Belmont Center'],'Somerville / Teele direction',['broadway','somerville'],'Broadway is the Somerville-side branch, not the Mass Ave East Arlington corridor.','broadway'),
      c('Which road remains the through-town east–west reference?',['Mass Ave','Broadway only','Pleasant Street'],'Mass Ave',['mass'],'Broadway branches; Mass Ave remains the spine.','mass'),
      chain('Which road takes you from Arlington Center toward Somerville / Teele?',['Broadway east','Somerville / Teele direction'],['Somerville / Teele direction','Mass Ave east','Broadway east'],['center','broadway','somerville'],'Broadway is the direct high-level branch from the Center.','broadway'),
      chain('Which roads take you from Arlington Heights toward Somerville / Teele?',['Mass Ave','Arlington Center','Broadway east','Somerville / Teele direction'],['Broadway east','Mass Ave','Somerville / Teele direction','Arlington Center'],['heights','mass','center','broadway','somerville'],'Use Mass Ave to the Center, then take Broadway east.','broadway'),
      chain('Which roads bring you home from the Somerville / Teele direction to Arlington Center?',['Broadway west','Arlington Center'],['Arlington Center','Mass Ave west','Broadway west'],['somerville','broadway','center'],'Reverse the Broadway anchor back to the Center.','broadway')
    ]},
    {id:'u1c',title:'North and south anchors',icon:'◆',subtitle:'Mystic Lakes and Belmont Center',checkpoint:true,newConcepts:['pleasant','mystic','mysticLakes','belmont'],questions:[
      c('Which corridor runs south from Mass Ave toward Belmont Center?',['Pleasant Street / Route 60','Mystic Street','Broadway'],'Pleasant Street / Route 60',['pleasant','belmont'],'Route 60 continues through the Belmont line to Belmont Center.','pleasant'),
      c('Which corridor runs north toward the Mystic Lakes and Winchester line?',['Mystic Street','Broadway','Pleasant Street'],'Mystic Street',['mystic','mysticLakes'],'Mystic Street is the northern anchor from the Center.','mystic'),
      c('Mystic Street runs between Mass Ave and which town edge?',['The Winchester line','The Belmont line','The Cambridge line'],'The Winchester line',['mystic','mysticLakes'],'Its northern endpoint is the Winchester direction.'),
      c('Route 60 continues beyond Pleasant Street toward which center?',['Belmont Center','Davis Square','Arlington Heights'],'Belmont Center',['pleasant','belmont'],'Pleasant Street / Route 60 is the Belmont corridor.'),
      chain('Which road takes you from Arlington Center to Belmont Center?',['Pleasant Street / Route 60','Belmont Center'],['Belmont Center','Mystic Street','Pleasant Street / Route 60'],['center','pleasant','belmont'],'Follow the Route 60 corridor south.','pleasant'),
      chain('Which road brings you from Belmont Center to Arlington Center?',['Route 60 / Pleasant Street north','Arlington Center'],['Arlington Center','Route 60 / Pleasant Street north','Broadway west'],['belmont','pleasant','center'],'Reverse the same Route 60 corridor north.','pleasant'),
      chain('Which road takes you from Arlington Center to Mystic Lakes?',['Mystic Street north','Mystic Lakes'],['Mystic Lakes','Broadway east','Mystic Street north'],['center','mystic','mysticLakes'],'Mystic Street is the northbound route anchor.','mystic'),
      chain('Which road brings you from Mystic Lakes to Arlington Center?',['Mystic Street south','Arlington Center'],['Arlington Center','Mystic Street south','Pleasant Street north'],['mysticLakes','mystic','center'],'Reverse Mystic Street south to the Center.','mystic')
    ]}
  ]},
  {id:2,title:'Cross-town connectors',subtitle:'Connect neighborhoods to local destinations',color:'#b9dc59',ink:'#253407',lessons:[
    {id:'u2l1',title:'Summer and the west side',icon:'↖',subtitle:'High School, Ed Burns Arena, Reservoir, Lexington line',newConcepts:['summer','highArena','reservoir','park'],questions:[
      c('From the Mystic/Mill and Arlington High area, which way does Summer Street run?',['West / northwest','Northeast from Arlington Center','South to Belmont'],'West / northwest',['summer','highArena'],'Summer Street runs west/northwest; it does not branch northeast from the Center.','summer'),
      c('Which destinations anchor the Summer Street corridor?',['Arlington High, Ed Burns Arena, and Arlington Reservoir','Belmont Center and Fenway','Teele Square and Logan'],'Arlington High, Ed Burns Arena, and Arlington Reservoir',['summer','highArena','reservoir'],'Use the school, arena, and reservoir as the corridor’s sequence.','summer'),
      c('Where is Arlington Reservoir relative to Mass Ave and Summer Street?',['Between them near the Lexington line','East of Broadway','South of Route 2'],'Between them near the Lexington line',['reservoir','summer','mass'],'The Reservoir is a western landmark between the two corridors.'),
      c('Which road links Arlington Heights south toward Route 2?',['Park Avenue','Broadway','Mystic Street'],'Park Avenue',['park','heights'],'Park Avenue is the useful southbound Heights connector.','park'),
      chain('Which high-level anchors take you from Arlington Heights toward Arlington Reservoir?',['Arlington Heights / Mass Ave','western local connection','Summer Street corridor','Arlington Reservoir'],['Arlington Reservoir','Summer Street corridor','Arlington Heights / Mass Ave','western local connection'],['heights','mass','summer','reservoir'],'This is an anchor sequence, not a claim about one direct turn.','summer'),
      chain('Which corridor takes you from Arlington High past Ed Burns Arena toward the Reservoir?',['Arlington High area','Summer Street west / northwest','Ed Burns Arena','Arlington Reservoir'],['Arlington Reservoir','Summer Street west / northwest','Arlington High area','Ed Burns Arena'],['highArena','summer','reservoir'],'The landmarks rise westward along the Summer corridor.','summer'),
      chain('Which roads take you from Arlington Heights to Route 2?',['Park Avenue south','Route 2'],['Route 2','Mass Ave east','Park Avenue south'],['heights','park','r2'],'Park Avenue is the western connector to Route 2.','park')
    ]},
    {id:'u2l2',title:'East side anchors',icon:'◒',subtitle:'Lake Street, Alewife, and Spy Pond',newConcepts:['lake','spy','east'],questions:[
      c('Which road runs south from East Arlington toward Route 2, Alewife, and Cambridge?',['Lake Street','Mystic Street','Summer Street'],'Lake Street',['lake','east','cambridge'],'Lake Street is the east-side southbound connector.','lake'),
      c('Which water landmark sits south of Mass Ave?',['Spy Pond','Mystic Lakes','Boston Harbor'],'Spy Pond',['spy'],'Spy Pond is a strong local visual anchor.'),
      c('Which connector serves Arlington Heights on the west side?',['Park Avenue','Lake Street','Broadway'],'Park Avenue',['park','heights'],'Park Avenue is the western counterpart to Lake Street.','park'),
      chain('Which road takes you from East Arlington to Alewife?',['Lake Street south','Alewife'],['Alewife','Mass Ave west','Lake Street south'],['east','lake','alewife'],'Lake Street is the concrete east-side gateway to Alewife.','lake'),
      chain('Which road brings you from Alewife toward East Arlington?',['Lake Street north','East Arlington / Mass Ave'],['East Arlington / Mass Ave','Route 2 west','Lake Street north'],['alewife','lake','east','mass'],'Reverse Lake Street north to the Mass Ave area.','lake'),
      chain('Which roads give an alternate Arlington Heights-to-Alewife mental model?',['Mass Ave east','East Arlington','Lake Street south','Alewife'],['Alewife','Lake Street south','Mass Ave east','East Arlington'],['heights','mass','east','lake','alewife'],'Mass Ave to Lake Street is a useful learned-road alternative.','lake')
    ]},
    {id:'u2c',title:'Connector checkpoint',icon:'◆',subtitle:'Choose the right corridor for the destination',checkpoint:true,newConcepts:['crossTown'],questions:[
      c('For Ed Burns Arena or the Reservoir, which corridor should come to mind?',['Summer Street','Lake Street','Pleasant Street'],'Summer Street',['summer','highArena','reservoir'],'Summer Street ties the west/northwest anchors together.','summer'),
      c('For Route 2 from Arlington Heights, which connector should come to mind?',['Park Avenue','Broadway','Mystic Street'],'Park Avenue',['park','heights','r2'],'Park Avenue heads south from the Heights.','park'),
      c('For Alewife from East Arlington, which connector should come to mind?',['Lake Street','Summer Street','Pleasant Street'],'Lake Street',['lake','east','alewife'],'Lake Street heads south to the Alewife-side gateway.','lake'),
      chain('Which roads take you from Arlington Heights to Alewife via Route 2?',['Park Avenue south','Route 2 east','Alewife-side gateway'],['Alewife-side gateway','Route 2 east','Mass Ave','Park Avenue south'],['heights','park','r2','alewife'],'Park Avenue reaches Route 2; Route 2 east reaches the Alewife side.','r2'),
      chain('Which roads bring you from the Alewife-side gateway toward Arlington Heights?',['Route 2 west','Park Avenue north','Arlington Heights'],['Arlington Heights','Park Avenue north','Route 2 west'],['alewife','r2','park','heights'],'Reverse Route 2 and Park Avenue for the homeward model.','r2'),
      chain('Which anchors connect Arlington Center to Arlington Reservoir at a safe high level?',['Mass Ave west','Arlington Heights area','local connection to Summer corridor','Arlington Reservoir'],['Arlington Reservoir','Mass Ave west','local connection to Summer corridor','Arlington Heights area'],['center','mass','heights','summer','reservoir'],'The final local connection is deliberately high-level.','summer')
    ]}
  ]},
  {id:3,title:'Regional gateways',subtitle:'Use local roads to reach the regional network',color:'#75a8ff',ink:'#0c2855',lessons:[
    {id:'u3l1',title:'Route 2 and Alewife',icon:'═',subtitle:'East to Cambridge; west to Lexington / Route 128',newConcepts:['r2','alewife'],questions:[
      c('Which highway runs east–west along southern Arlington?',['Route 2','Route 16','Route 60'],'Route 2',['r2'],'Route 2 is the southern highway gateway.','r2'),
      c('Which way does Route 2 lead toward Alewife and Cambridge?',['East','West','North'],'East',['r2','alewife','cambridge'],'Alewife anchors Route 2’s eastern side.','r2'),
      c('Which way does Route 2 lead toward Lexington and Route 128?',['West','East','South'],'West',['r2','lexingtonLocal'],'Route 2 west is the outer-region direction.','r2'),
      chain('Which roads take you from Arlington Heights to Alewife?',['Park Avenue south','Route 2 east','Alewife'],['Alewife','Route 2 east','Park Avenue south','Mass Ave west'],['heights','park','r2','alewife'],'Use Park Avenue to reach Route 2, then head east.','r2'),
      chain('Which roads bring you from Alewife toward Arlington Heights?',['Route 2 west','Park Avenue north','Arlington Heights'],['Arlington Heights','Park Avenue north','Route 2 west','Lake Street north'],['alewife','r2','park','heights'],'Reverse the gateway chain west, then north.','r2'),
      chain('Which road takes you from East Arlington to the Alewife gateway?',['Lake Street south','Alewife'],['Alewife','Lake Street south','Route 2 west'],['east','lake','alewife'],'Lake Street is the concise local beginning.','lake')
    ]},
    {id:'u3l2',title:'The parkway arc',icon:'⌒',subtitle:'Mystic Valley and Medford direction',newConcepts:['r16','gatewayNames','medford'],questions:[
      c('Which route arcs from Alewife Brook Parkway into Mystic Valley Parkway?',['Route 16','Route 2','Route 60'],'Route 16',['r16'],'One route number ties the parkway names together.','r16'),
      c('What outward direction does Mystic Valley Parkway reinforce?',['Mystic Valley / Medford','Belmont Center','Lexington Center'],'Mystic Valley / Medford',['r16','medford'],'Route 16 is the northern/eastern regional arc.','r16'),
      c('Which gateway is the straight east–west highway south of Arlington?',['Route 2','Route 16','Broadway'],'Route 2',['r2'],'Keep Route 2’s line distinct from Route 16’s arc.','r2'),
      chain('Which route takes you from Alewife toward the Mystic Valley?',['Alewife','Alewife Brook Parkway / Route 16','Mystic Valley Parkway / Route 16'],['Mystic Valley Parkway / Route 16','Alewife','Route 2','Alewife Brook Parkway / Route 16'],['alewife','r16','gatewayNames'],'The local name changes while Route 16 continues.','r16'),
      chain('Which regional chain points from Arlington toward Medford?',['Arlington network','Route 16 / Mystic Valley Parkway','Medford direction'],['Medford direction','Route 2 west','Arlington network','Route 16 / Mystic Valley Parkway'],['r16','medford','gateways'],'Route 16 is the major Medford-side cue.','r16'),
      chain('Which route brings you from the Mystic Valley toward Alewife?',['Mystic Valley Parkway / Route 16','Alewife Brook Parkway / Route 16','Alewife'],['Alewife','Mystic Valley Parkway / Route 16','Route 2 west','Alewife Brook Parkway / Route 16'],['r16','gatewayNames','alewife'],'Reverse the same Route 16 arc.','r16')
    ]},
    {id:'u3c',title:'Gateway checkpoint',icon:'◆',subtitle:'Lexington, Cambridge, Somerville, and Medford',checkpoint:true,newConcepts:['fresh','lexington','wilson','davis','gateways'],questions:[
      c('Which familiar road continues west toward Lexington?',['Mass Ave','Broadway','Lake Street'],'Mass Ave',['mass','lexington'],'Mass Ave remains the western local gateway.','mass'),
      c('Which Cambridge landmark lies south of Alewife?',['Fresh Pond','Spy Pond','Mystic Lakes'],'Fresh Pond',['fresh','alewife'],'Fresh Pond strengthens Cambridge-side orientation.'),
      c('Which landmark reinforces the Lexington-side approach?',['Wilson Farm','Fenway Park','TD Garden'],'Wilson Farm',['wilson','lexington'],'Wilson Farm is a memorable western landmark.'),
      chain('Which roads take you from Arlington Center toward Somerville / Teele?',['Broadway east','Somerville / Teele direction'],['Somerville / Teele direction','Mass Ave east','Broadway east'],['center','broadway','somerville'],'Broadway is the learned-road beginning.','broadway'),
      chain('Which roads take you from East Arlington toward Cambridge via Alewife?',['Lake Street south','Alewife','Cambridge network'],['Cambridge network','Mass Ave west','Lake Street south','Alewife'],['east','lake','alewife','cambridge'],'Lake Street supplies the concrete Arlington beginning.','lake'),
      chain('Which anchors run west-to-southeast across the region?',['Lexington / Wilson Farm','Mass Ave','Arlington Center','Alewife / Cambridge side'],['Alewife / Cambridge side','Arlington Center','Lexington / Wilson Farm','Mass Ave'],['wilson','lexington','mass','center','alewife'],'This is orientation, not a turn-by-turn route.','mass'),
      chain('Which high-level roads take you from Arlington toward Davis Square?',['Broadway east','Somerville network','Davis Square'],['Davis Square','Route 2','Broadway east','Somerville network'],['broadway','davis','gateways'],'Broadway provides a concrete first road toward Somerville.','broadway')
    ]}
  ]},
  {id:4,title:'Destination journeys',subtitle:'Start long trips with a road you actually know',color:'#b392ef',ink:'#28124c',lessons:[
    {id:'u4l1',title:'Journey to Fenway',icon:'⚾',subtitle:'Concrete Arlington beginnings, gateways, and homeward structure',newConcepts:['fenway','fenwayRoute'],destination:true,questions:[
      c('What should begin a Fenway chain from Arlington Heights?',['A learned local road to Route 2 / Alewife','An airport tunnel','Mystic Street north'],'A learned local road to Route 2 / Alewife',['fenwayRoute','park','r2'],'Start concretely before the city-level gateway.','park'),
      c('Why keep an alternate gateway in mind?',['Traffic and closures can change the city approach','The study map is exact','It eliminates GPS'],'Traffic and closures can change the city approach',['fenwayRoute'],'The mental map supports live routing rather than replacing it.'),
      chain('Which high-level roads take you from Arlington Heights to Fenway?',['Park Avenue south','Route 2 / Alewife gateway','Cambridge / Boston approach','Fenway'],['Fenway','Park Avenue south','Cambridge / Boston approach','Route 2 / Alewife gateway'],['heights','park','r2','alewife','fenway'],'The chain starts with a defensible learned local road.','r2'),
      chain('Which high-level roads take you from East Arlington to Fenway?',['Lake Street south','Alewife / Cambridge gateway','Boston approach','Fenway'],['Fenway','Lake Street south','Boston approach','Alewife / Cambridge gateway'],['east','lake','alewife','fenway'],'Lake Street gives the east-side trip a concrete beginning.','lake'),
      chain('Which high-level roads bring you home from Fenway to Arlington Heights?',['Fenway','Cambridge / Alewife-side gateway','Route 2 west','Park Avenue north','Arlington Heights'],['Arlington Heights','Fenway','Route 2 west','Park Avenue north','Cambridge / Alewife-side gateway'],['fenway','alewife','r2','park','heights'],'Reverse the gateway and local connector.','r2'),
      chain('Which high-level roads bring you home from Fenway to East Arlington?',['Fenway','Cambridge / Alewife-side gateway','Lake Street north','East Arlington'],['East Arlington','Fenway','Lake Street north','Cambridge / Alewife-side gateway'],['fenway','alewife','lake','east'],'Lake Street is the concrete final Arlington leg.','lake')
    ]},
    {id:'u4c',title:'Downtown checkpoint',icon:'★',subtitle:'Downtown + TD Garden, outbound and home',checkpoint:true,destination:true,newConcepts:['downtown','garden','downtownRoute'],questions:[
      c('TD Garden sits on which side of the downtown mental map?',['The north edge of downtown','West of Lexington','South of Fresh Pond'],'The north edge of downtown',['garden','downtown'],'Garden is a northern downtown anchor.'),
      c('For downtown, the high-level choice is mainly between…',['Cambridge and Somerville gateways','Park Ave and Mystic Street only','Wilson Farm and Spy Pond'],'Cambridge and Somerville gateways',['downtownRoute','gateways'],'Choose the regional gateway before city streets.'),
      chain('Which high-level roads take you from Arlington Center toward TD Garden via Somerville?',['Broadway east','Somerville gateway','Boston crossing / approach','TD Garden'],['TD Garden','Broadway east','Boston crossing / approach','Somerville gateway'],['center','broadway','somerville','garden'],'Broadway is a concrete learned-road beginning.','broadway'),
      chain('Which high-level roads take you from East Arlington toward downtown via Cambridge?',['Lake Street south','Alewife / Cambridge gateway','Boston approach','Downtown'],['Downtown','Lake Street south','Boston approach','Alewife / Cambridge gateway'],['east','lake','alewife','downtown'],'Lake Street supplies the local beginning.','lake'),
      chain('Which high-level roads bring you home from TD Garden to Arlington Center?',['TD Garden','Somerville gateway','Broadway west','Arlington Center'],['Arlington Center','TD Garden','Broadway west','Somerville gateway'],['garden','somerville','broadway','center'],'Reverse the Somerville/Broadway anchor.','broadway'),
      chain('Which high-level roads bring you home from downtown to East Arlington?',['Downtown','Cambridge / Alewife gateway','Lake Street north','East Arlington'],['East Arlington','Downtown','Lake Street north','Cambridge / Alewife gateway'],['downtown','alewife','lake','east'],'Use live navigation for the city approach, then the learned local connector.','lake')
    ]}
  ]},
  {id:5,title:'Airport journey',subtitle:'A resilient map for the far side of Boston',color:'#4fc1b0',ink:'#083c34',lessons:[
    {id:'u5c',title:'Journey to Logan',icon:'✈',subtitle:'Concrete first roads, gateways, tunnels, and home',checkpoint:true,destination:true,newConcepts:['logan','loganRoute'],questions:[
      c('What should your mental map do for a Logan trip?',['Organize gateways and decision points','Replace live navigation at airport ramps','Guarantee the fastest tunnel'],'Organize gateways and decision points',['loganRoute','logan'],'The course teaches structure, not live routing.'),
      c('Which details still warrant GPS near Logan?',['Tunnels, ramps, traffic, and terminal approach','Whether Mass Ave exists','Where Arlington Center is'],'Tunnels, ramps, traffic, and terminal approach',['logan','loganRoute'],'Airport approaches change with conditions.'),
      chain('Which high-level roads take you from Arlington Center to Logan via Somerville?',['Broadway east','Somerville gateway','Boston tunnel / harbor crossing','Logan terminal area'],['Logan terminal area','Broadway east','Boston tunnel / harbor crossing','Somerville gateway'],['center','broadway','somerville','logan'],'Broadway gives the chain a concrete Arlington beginning.','broadway'),
      chain('Which high-level roads take you from East Arlington to Logan via Cambridge?',['Lake Street south','Alewife / Cambridge gateway','Boston tunnel / harbor crossing','Logan terminal area'],['Logan terminal area','Lake Street south','Boston tunnel / harbor crossing','Alewife / Cambridge gateway'],['east','lake','alewife','logan'],'Lake Street gives the east-side chain a concrete beginning.','lake'),
      chain('Which high-level roads bring you home from Logan to Arlington Center?',['Logan terminal area','Boston / Somerville gateway','Broadway west','Arlington Center'],['Arlington Center','Logan terminal area','Broadway west','Boston / Somerville gateway'],['logan','somerville','broadway','center'],'Use current navigation to the gateway, then the known Broadway anchor.','broadway'),
      chain('Which high-level roads bring you home from Logan to Arlington Heights?',['Logan terminal area','Cambridge / Alewife gateway','Route 2 west','Park Avenue north','Arlington Heights'],['Arlington Heights','Logan terminal area','Route 2 west','Park Avenue north','Cambridge / Alewife gateway'],['logan','alewife','r2','park','heights'],'The home chain ends with the learned Park Avenue connector.','r2')
    ]}
  ]}
];

return {
  schemaVersion:1,
  id:'arlington-ma',
  slug:'arlington-ma',
  title:'Roadwise Arlington',
  region:'Arlington, Massachusetts, USA',
  status:'reviewed',
  center:{lat:42.4154,lon:-71.1565},
  bounds:{south:42.36,west:-71.28,north:42.47,east:-71.05},
  attribution:{text:'Course geometry and curriculum hand-authored from local knowledge; OpenStreetMap contributors where search is used.',url:'https://www.openstreetmap.org/copyright'},
  description:'Build your mental map from Arlington’s backbone to regional gateways.',
  pathTitle:'Arlington outward',
  heroTitle:'Build your mental map.',
  concepts,
  map:{viewBox:[0,0,760,500],regionalRoads,landmarks},
  units,
  generator:{kind:'seed',version:1,generatedAt:null,reviewed:true,source:'Hand-authored Arlington seed preserved from b2b1d9b'}
};
});
