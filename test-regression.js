'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const Core=require('./core.js');
const arlingtonGeodata=require('./courses/arlington-geodata.js');
const arlington=require('./courses/arlington-ma.js');
const app=require('./app.js');

let seed=0x5eed1234;Math.random=()=>((seed=(1664525*seed+1013904223)>>>0)/0x100000000);
class MemoryStorage{constructor(values={}){this.values={...values};}getItem(k){return Object.hasOwn(this.values,k)?this.values[k]:null;}setItem(k,v){this.values[k]=String(v);}removeItem(k){delete this.values[k];}}
class FullStorage extends MemoryStorage{setItem(){throw new Error('quota exceeded');}}
const builtIns={'arlington-ma':arlington};

// Schema and portable Arlington seed.
assert.equal(Core.validateCourse(arlington).ok,true,Core.validateCourse(arlington).errors.join('\n'));
assert.equal(arlington.schemaVersion,1);assert.equal(arlington.id,'arlington-ma');assert.equal(arlington.units.length,5);assert.ok(Object.keys(arlington.concepts).length>=40);
assert.equal(arlington.generator.source.includes('b2b1d9b'),true,'Arlington seed must name preserved source commit');

// Exact-once migration from the old single-course key.
const legacy={version:2,xp:17,streak:3,answered:9,completedLessons:['u1l1'],conceptMastery:{mass:40}};
const storage=new MemoryStorage({[Core.LEGACY_KEY]:JSON.stringify(legacy)});
let loaded=Core.readStore(storage,builtIns);
assert.equal(loaded.state.legacyMigrated,true);assert.equal(loaded.state.progress['arlington-ma'].xp,17);assert.deepEqual(loaded.state.progress['arlington-ma'].completedLessons,['u1l1']);
storage.setItem(Core.LEGACY_KEY,JSON.stringify({...legacy,xp:999}));
loaded=Core.readStore(storage,builtIns);assert.equal(loaded.state.progress['arlington-ma'].xp,17,'legacy progress migrated more than once');

const place={name:'Testville',displayName:'Testville, Example',lat:12.3,lon:45.6};
const inputs={id:'testville',title:'Roadwise Testville',existingIds:['arlington-ma'],roads:[
  {id:'road-1',name:'Main Road',direction:'east–west'},
  {id:'road-2',name:'River Road',direction:'north'},
  {id:'road-3',name:'Hill Street',direction:'south'}
],anchors:[
  {id:'anchor-1',name:'Library',type:'landmark',roadId:'road-1',direction:'west'},
  {id:'anchor-2',name:'Station',type:'gateway',roadId:'road-1',direction:'east'},
  {id:'anchor-3',name:'Market',type:'store',roadId:'road-2',direction:'north'}
]};
const generated=Core.generateCourse(place,inputs),valid=Core.validateCourse(generated);
assert.equal(valid.ok,true,valid.errors.join('\n'));assert.equal(generated.status,'draft');assert.equal(generated.units.length,3);assert.equal(generated.generator.kind,'static-manual-draft');
assert.equal(generated.generator.reviewed,false);assert.equal(Object.values(generated.concepts).filter(c=>c.type==='road').length,3);

// Generator can only turn confirmed same-road relationships into routes, and always adds reverse A→B.
const chains=Core.allQuestions(generated).filter(q=>q.type==='chain');
assert.equal(chains.length,2,'only one submitted same-road anchor pair should create forward + reverse routes');
assert.deepEqual(chains[0].answer,['Library','Main Road','Station']);assert.deepEqual(chains[1].answer,['Station','Main Road','Library']);
assert.ok(chains.every(q=>!q.answer.includes('River Road')&&!q.answer.includes('Hill Street')),'generator invented an unconfirmed cross-road route');
assert.throws(()=>Core.generateCourse(place,{...inputs,anchors:inputs.anchors.map((a,i)=>({...a,roadId:`road-${i+1}`}))}),/same road/);

// Custom manifests and progress remain isolated while switching.
const state=loaded.state;assert.equal(Core.saveCustomCourse(storage,state,generated).ok,true);loaded=Core.readStore(storage,builtIns);
assert.equal(loaded.state.activeCourseId,'testville');loaded.state.progress.testville.completedLessons=['roads'];loaded.state.progress.testville.xp=25;Core.writeStore(storage,loaded.state);
assert.equal(Core.switchCourse(storage,loaded.state,'arlington-ma',loaded.courses),true);assert.equal(loaded.state.activeCourseId,'arlington-ma');assert.equal(loaded.state.progress['arlington-ma'].xp,17);assert.deepEqual(loaded.state.progress.testville.completedLessons,['roads']);
assert.equal(Core.resetCourse(storage,loaded.state,'testville',generated),true);assert.equal(loaded.state.progress.testville.xp,0);assert.equal(loaded.state.progress['arlington-ma'].xp,17,'reset leaked across courses');
assert.equal(Core.removeCourse(storage,loaded.state,'arlington-ma'),false,'built-in seed must not be removable');
assert.equal(Core.archiveCourse(storage,loaded.state,'testville',true),true);assert.ok(loaded.state.archivedCourseIds.includes('testville'));assert.equal(Core.archiveCourse(storage,loaded.state,'testville',false),true);

// Route practice is isolated to completed lessons in the active course.
const customProgress={...Core.defaultProgress(),completedLessons:['roads','anchors']};
assert.equal(app.routePool(generated,customProgress).length,0,'custom route practice unlocked before its route lesson');
customProgress.completedLessons.push('routes');assert.equal(app.routePool(generated,customProgress).length,2);
const arlingtonProgress={...Core.defaultProgress(),completedLessons:['u1l1','u1stores']};
const arlingtonPool=app.routePool(arlington,arlingtonProgress);assert.ok(arlingtonPool.length>=4);assert.ok(arlingtonPool.every(q=>['u1l1','u1stores'].includes(q.lessonId)));assert.ok(arlingtonPool.every(q=>!q.prompt.includes('Testville')));

// Imports validate version and shape without evaluating user content.
assert.equal(Core.parseCourseJSON(JSON.stringify(generated)).ok,true);
assert.equal(Core.parseCourseJSON('{bad').ok,false);
assert.equal(Core.parseCourseJSON(JSON.stringify({...generated,schemaVersion:99})).ok,false);
assert.equal(Core.parseCourseJSON(JSON.stringify({...generated,id:'__proto__'})).ok,false);
assert.equal(Core.parseCourseJSON(JSON.stringify({...generated,units:[]})).ok,false);
const brokenQuestion=Core.clone(generated);brokenQuestion.units[0].lessons[0].questions[0]=null;assert.doesNotThrow(()=>Core.validateCourse(brokenQuestion));assert.equal(Core.validateCourse(brokenQuestion).ok,false);
const unknownConcept=Core.clone(generated);unknownConcept.units[0].lessons[0].questions[0].concepts=['missing'];assert.equal(Core.validateCourse(unknownConcept).ok,false);
const duplicateLesson=Core.clone(generated);duplicateLesson.units[1].lessons[0].id=duplicateLesson.units[0].lessons[0].id;assert.equal(Core.validateCourse(duplicateLesson).ok,false);
const duplicateChoice=Core.clone(generated);duplicateChoice.units[0].lessons[0].questions[0].choices=['Main Road','Main Road'];assert.equal(Core.validateCourse(duplicateChoice).ok,false);
const fullState=Core.emptyStore();assert.equal(Core.saveCustomCourse(new FullStorage(),fullState,generated).ok,false);assert.equal(fullState.customCourses.testville,undefined,'failed storage write leaked into in-memory library');
const polar=Core.generateCourse({name:'North Edge',displayName:'North Edge',lat:90,lon:180},{...inputs,id:'north-edge',existingIds:[]});assert.equal(Core.validateCourse(polar).ok,true);assert.ok(polar.bounds.north<=90&&polar.bounds.east<=180);
const textOnly=Core.clone(generated);textOnly.title='<img src=x onerror=alert(1)>';assert.equal(Core.validateCourse(textOnly).ok,true,'HTML-like user text should remain inert text, not require execution or sanitizing markup');
const appSource=fs.readFileSync('app.js','utf8');assert.doesNotMatch(appSource,/\.innerHTML\s*=/,'custom UI must not render with innerHTML');assert.match(appSource,/course\.map\?\.viewBox/,'generic player must honor manifest viewBox');assert.match(appSource,/clearSelectedPlace/,'manual edits must clear stale provider metadata');

// Map render model: lesson focus is question-scoped and hierarchy is explicit.
const allArlingtonIds=Object.keys(arlington.concepts),lessonFocus=Core.buildMapModel(arlington,{mode:'lesson',view:'local',concepts:['mass','wholeFoods'],highlight:'mass',learnedIds:allArlingtonIds,labels:true});
assert.deepEqual(lessonFocus.anchors.map(a=>a.id),['wholeFoods'],'lesson map leaked unrelated learned landmarks');
assert.equal(lessonFocus.roads.find(r=>r.id==='mass').state,'active');
assert.equal(lessonFocus.roads.find(r=>r.id==='broadway').state,'context');
assert.equal(lessonFocus.roads.find(r=>r.id==='broadway').label.state,'context','dim road label did not track its dim road');
assert.match(Core.renderMapSvg(lessonFocus),/class="road-label context"/);
assert.ok(lessonFocus.focusNames.includes('Mass Ave')&&lessonFocus.focusNames.includes('Whole Foods Market'));
assert.match(appSource,/concepts:q\.concepts/,'current question concepts must be passed into drawMap');

function assertBoxesDoNotOverlap(items,message){for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){const a=items[i].label,b=items[j].label;const overlap=a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;assert.equal(overlap,false,`${message}: ${items[i].id} overlaps ${items[j].id}`);}}
const denseIds=['center','heights','wholeFoods','stopShop','traderJoes','east'];
const denseModel=Core.buildMapModel(arlington,{mode:'lesson',view:'local',concepts:['mass',...denseIds],highlight:'mass',learnedIds:['mass'],labels:true});
assert.deepEqual(new Set(denseModel.anchors.map(a=>a.id)),new Set(denseIds));assertBoxesDoNotOverlap(denseModel.anchors,'Arlington dense callouts');
const exploreDense=Core.buildMapModel(arlington,{mode:'explore',view:'local',learnedIds:['mass',...denseIds],labels:true});assert.deepEqual(new Set(exploreDense.anchors.map(a=>a.id)),new Set(denseIds));assertBoxesDoNotOverlap(exploreDense.anchors,'Arlington Explore callouts');
const fullExplore=Core.buildMapModel(arlington,{mode:'explore',view:'local',learnedIds:allArlingtonIds,labels:true});assertBoxesDoNotOverlap([...fullExplore.roads,...fullExplore.anchors].filter(item=>item.label),'full Arlington Explore labels');
const denseSvg=Core.renderMapSvg(denseModel);assert.match(denseSvg,/class="road active"/);assert.match(denseSvg,/class="callout-leader"/);assert.match(denseSvg,/Whole Foods Market/);assert.doesNotMatch(denseSvg,/Spy Pond/,'SVG snapshot included an unrelated landmark');

const storeRoute=Core.allQuestions(arlington).find(q=>q.type==='chain'&&q.answer.includes('Arlington Heights / Trader Joe’s')),routeModel=Core.buildMapModel(arlington,{mode:'lesson',view:'local',concepts:storeRoute.concepts,highlight:storeRoute.map,learnedIds:['mass'],labels:true});
const routePointIds=storeRoute.concepts.filter(id=>arlington.concepts[id]?.point&&(arlington.concepts[id].view||'local')==='local'),routeRoadIds=storeRoute.concepts.filter(id=>arlington.concepts[id]?.type==='road');
assert.deepEqual(new Set(routeModel.anchors.map(a=>a.id)),new Set(routePointIds),'route map omitted a referenced anchor');assert.ok(routeRoadIds.every(id=>routeModel.roads.some(r=>r.id===id&&r.state==='active')),'route map omitted a referenced road');

// Unauthored custom-course callouts use the same deterministic, measurement-free fallback.
const customCluster=Core.clone(generated),customAnchorIds=Object.keys(customCluster.concepts).filter(id=>customCluster.concepts[id].point);
customAnchorIds.forEach((id,i)=>{customCluster.concepts[id].point=[330+(i%2)*7,230+Math.floor(i/2)*7];delete customCluster.concepts[id].labelOffset;delete customCluster.concepts[id].labelAlign;});
const customModelA=Core.buildMapModel(customCluster,{mode:'lesson',view:'local',concepts:['road-1',...customAnchorIds],highlight:'road-1',learnedIds:['road-1'],labels:true}),customModelB=Core.buildMapModel(customCluster,{mode:'lesson',view:'local',concepts:['road-1',...customAnchorIds],highlight:'road-1',learnedIds:['road-1'],labels:true});
assertBoxesDoNotOverlap(customModelA.anchors,'custom fallback callouts');assert.deepEqual(customModelA,customModelB,'fallback callout layout must be deterministic');
assert.equal(customModelA.backgrounds.length,0,'custom course fabricated decorative water');assert.equal(Object.hasOwn(generated.map,'backgroundPaths'),false,'generator should not fabricate background geography');

// Optional decorative geography is bounded inert manifest data.
const withBackground=Core.clone(generated);withBackground.map.backgroundPaths=[{view:'local',kind:'water',opacity:.4,d:'M10 10 L20 20Z'}];assert.equal(Core.validateCourse(withBackground).ok,true);
for(const badPath of [{view:'local',kind:'water',opacity:2,d:'M0 0Z'},{view:'local',kind:'script',d:'M0 0Z'},{view:'elsewhere',kind:'terrain',d:'M0 0Z'},{view:'local',kind:'water',d:''}]){const bad=Core.clone(generated);bad.map.backgroundPaths=[badPath];assert.equal(Core.validateCourse(bad).ok,false,`unsafe background path validated: ${JSON.stringify(badPath)}`);}
const badOffset=Core.clone(generated);badOffset.concepts['anchor-1'].labelOffset=['far',10];assert.equal(Core.validateCourse(badOffset).ok,false);const badAlign=Core.clone(generated);badAlign.concepts['anchor-1'].labelAlign='diagonal';assert.equal(Core.validateCourse(badAlign).ok,false);

// Optional geospatial schema accepts only bounded road lines and valid anchor coordinates.
assert.equal(Core.validateGeometry({type:'LineString',coordinates:[[-71.2,42.4],[-71.1,42.41]]}),true);
assert.equal(Core.validateGeometry({type:'MultiLineString',coordinates:[[[-71.2,42.4],[-71.1,42.41]],[[-71.1,42.41],[-71.09,42.42]]]}),true);
assert.equal(Core.validateGeometry([[-71.2,42.4],[-71.1,42.41]]),true,'coordinate-array shorthand should validate');
for(const geometry of [{type:'Polygon',coordinates:[]},{type:'LineString',coordinates:[[-71.2,42.4]]},{type:'LineString',coordinates:[[-181,42.4],[-71.1,42.41]]},{type:'MultiLineString',coordinates:[]}])assert.equal(Core.validateGeometry(geometry),false,`invalid geometry validated: ${JSON.stringify(geometry)}`);
const tooLarge={type:'LineString',coordinates:Array.from({length:Core.MAX_GEOMETRY_COORDINATES+1},(_,i)=>[-71+i/1e7,42.4])};assert.equal(Core.validateGeometry(tooLarge),false,'oversized geometry validated');
const badGeo=Core.clone(generated);badGeo.concepts['road-1'].geometry={type:'Polygon',coordinates:[]};assert.equal(Core.validateCourse(badGeo).ok,false);
const badLocation=Core.clone(generated);badLocation.concepts['anchor-1'].location={lat:91,lon:0};assert.equal(Core.validateCourse(badLocation).ok,false);

// Arlington uses committed OSM-derived data; lesson and Explore selection stay question-scoped.
for(const id of ['mass','broadway','pleasant','mystic','summer','park','lake','r2','r16'])assert.equal(Core.validateGeometry(arlington.concepts[id].geometry),true,`missing Arlington road geometry: ${id}`);
for(const id of ['center','heights','wholeFoods','stopShop','traderJoes','alewife'])assert.ok(arlington.concepts[id].location,`missing Arlington anchor location: ${id}`);
assert.equal(arlington.map.tileProvider,'osm-standard');assert.equal(arlington.map.featureProvenance.license,'ODbL 1.0');assert.equal(arlingtonGeodata.provenance.source,'OpenStreetMap contributors');assert.ok(arlingtonGeodata.osmWayIds.mass.length>0);
const geoLesson=Core.planMap(arlington,{mode:'lesson',view:'local',concepts:['mass','wholeFoods'],highlight:'mass',learnedIds:['mass','broadway','spy']});
assert.equal(geoLesson.renderer,'leaflet');assert.equal(geoLesson.features.find(f=>f.id==='mass').state,'active');assert.equal(geoLesson.features.find(f=>f.id==='broadway').state,'context');assert.ok(geoLesson.features.some(f=>f.id==='wholeFoods'&&f.location));assert.ok(!geoLesson.features.some(f=>f.id==='spy'),'unrelated learned anchor leaked onto lesson map');
assert.ok(geoLesson.bounds.east-geoLesson.bounds.west>.02,'lesson bounds must include the active road as well as its anchor');
const geoRoute=Core.planMap(arlington,{mode:'lesson',view:'local',concepts:storeRoute.concepts,highlight:storeRoute.map,learnedIds:['mass']});for(const id of routePointIds)assert.ok(geoRoute.features.some(f=>f.id===id&&f.location),`route geodata omitted ${id}`);
for(const q of Core.allQuestions(arlington).filter(question=>question.type==='chain')){const view=q.map&&arlington.concepts[q.map]?.view==='regional'?'regional':'local',plan=Core.planMap(arlington,{mode:'lesson',view,concepts:q.concepts,highlight:q.map,learnedIds:Object.keys(arlington.concepts)});for(const id of q.concepts){const concept=arlington.concepts[id];if(concept?.geometry||concept?.location)assert.ok(plan.features.some(feature=>feature.id===id),`route feature selection omitted ${id}: ${q.prompt}`);}}
const geoExplore=Core.selectGeoFeatures(arlington,{mode:'explore',view:'local',learnedIds:['mass','center','wholeFoods']});assert.deepEqual(new Set(geoExplore.map(f=>f.id)),new Set(['mass','center','wholeFoods']));
const customPlan=Core.planMap(generated,{mode:'lesson',view:'local',concepts:['road-1','anchor-1'],highlight:'road-1',learnedIds:['road-1']});assert.equal(customPlan.renderer,'svg','manual custom draft fabricated geospatial features');
assert.equal(Core.TILE_PROVIDER.url,'https://tile.openstreetmap.org/{z}/{x}/{y}.png');assert.equal(Core.TILE_PROVIDER.options.attribution,'© OpenStreetMap contributors');assert.match(Core.TILE_PROVIDER.options.attributionUrl,/^https:\/\/www\.openstreetmap\.org\/copyright$/);assert.equal(Core.validTileProvider(Core.TILE_PROVIDER),true);assert.equal(Core.validTileProvider({...Core.TILE_PROVIDER,url:'http://tiles.example/{z}/{x}/{y}.png'}),false);assert.equal(Core.validTileProvider({...Core.TILE_PROVIDER,options:{...Core.TILE_PROVIDER.options,attribution:'<script>'}}),false);
const indexSource=fs.readFileSync('index.html','utf8');assert.match(indexSource,/vendor\/leaflet\/leaflet\.js/);assert.match(indexSource,/courses\/arlington-geodata\.js/);assert.doesNotMatch(indexSource,/unpkg|cdn\.jsdelivr|cdnjs/,'runtime CDN dependency remains');assert.doesNotMatch(indexSource,/referrer-policy|name=["']referrer/i,'restrictive Referrer-Policy added');
assert.ok(fs.statSync('vendor/leaflet/leaflet.js').size>100000&&fs.statSync('vendor/leaflet/leaflet.css').size>10000,'Leaflet was not vendored locally');assert.match(appSource,/L\.tileLayer/);assert.match(appSource,/tileerror/);assert.match(appSource,/preferCanvas:false/,'Leaflet overlays must use SVG; canvas rendering caused destructive paint blocks');assert.match(appSource,/Show map clue/,'lesson maps must be optional clues after visible controls');assert.match(appSource,/Starting point:/,'route questions must display a fixed starting point');assert.match(appSource,/Tap only what comes next/,'route instructions must say the origin is not selectable');assert.match(appSource,/q\.answer\.slice\(1\)/,'grading must omit an origin that legacy route data included as the first step');assert.ok(appSource.indexOf("renderChoices(section,q)")<appSource.indexOf("class:'map-clue'"),'answer controls must render before the optional map clue');assert.match(appSource,/activeCount<=3/,'dense active feature sets should not receive overlapping permanent tooltips');assert.doesNotMatch(appSource,/prefetch|Cache-Control|Pragma/,'map renderer enables prohibited tile behavior');

// Preserve Arlington geography/content regressions from b2b1d9b.
const concepts=arlington.concepts,lessons=Core.flatLessons(arlington),allQuestions=Core.allQuestions(arlington);
const learnerPrompts=allQuestions.map(q=>q.prompt).join('\n');assert.doesNotMatch(learnerPrompts,/roads and anchors|route chain|high-level anchors/i,'learner prompts expose internal curriculum jargon');assert.ok(allQuestions.filter(q=>q.type==='chain').every(q=>/^(How|What)\b/.test(q.prompt)),'route prompts should read as natural questions');
assert.ok(!/northeast|from (the )?center/i.test(concepts.summer.description));assert.ok(concepts.summer.d.startsWith('M346 181')&&concepts.summer.label[0]<concepts.center.point[0]);
assert.match(concepts.broadway.description,/north of Mass Ave/i);assert.equal(concepts.broadway.d,'M321 231 C370 214 430 205 500 204 S625 209 700 214');
for(const id of ['mysticLakes','belmont','highArena','reservoir','somerville','cambridge','lexingtonLocal','wholeFoods','stopShop','traderJoes'])assert.ok(concepts[id],`missing Arlington anchor ${id}`);
assert.ok(concepts.traderJoes.point[0]<concepts.stopShop.point[0]&&concepts.stopShop.point[0]<concepts.wholeFoods.point[0]);assert.deepEqual(lessons[0].newConcepts,['mass','center']);
const routeText=allQuestions.filter(q=>q.type==='chain').map(q=>q.prompt).join('\n');for(const pattern of [/Arlington Center to Belmont Center/i,/Belmont Center to Arlington Center/i,/Arlington Center to Mystic Lakes/i,/Mystic Lakes to Arlington Center/i,/Arlington Heights to Alewife/i,/East Arlington to Alewife/i,/Fenway/i,/downtown/i,/Logan/i])assert.match(routeText,pattern);

// Mobile/footer behavior remains present.
const css=fs.readFileSync('styles.css','utf8');assert.match(css,/--footer-space/);assert.match(css,/svg\.study-fallback/);assert.match(css,/\.map-clue/);assert.match(css,/\.lesson-map-card \{height:320px\}|\.lesson-map-card \.map-viewport\{height:320px/,'lesson clue map must have a bounded viewport');assert.doesNotMatch(css,/\.map-card svg\{/,'generic SVG rules must not resize Leaflet overlay SVGs');assert.match(css,/env\(safe-area-inset-bottom\)/);assert.match(css,/@media\(max-width:600px\)/);assert.match(appSource,/ResizeObserver/);assert.match(appSource,/reserveFooter/);

Core.locationProvider.cache.clear();Core.locationProvider.lastRequestAt=0;let geocoderCalls=0;
const fakeFetch=async(url,options)=>{geocoderCalls++;assert.match(url,/format=jsonv2/);assert.match(url,/limit=5/);assert.equal(options.referrerPolicy,'origin');return{ok:true,json:async()=>[{name:'Testville',display_name:'Testville, Example',lat:'12.3',lon:'45.6',type:'town'}]};};
Core.locationProvider.search('Testville',fakeFetch).then(async first=>{assert.equal(first.length,1);const second=await Core.locationProvider.search('testville',fakeFetch);assert.deepEqual(second,first);assert.equal(geocoderCalls,1,'identical explicit searches should use the in-memory cache');console.log(`Roadwise platform checks passed: Arlington ${lessons.length} lessons/${allQuestions.length} questions; generated draft ${Core.flatLessons(generated).length} lessons/${chains.length} confirmed route chains.`);}).catch(error=>{console.error(error);process.exitCode=1;});
