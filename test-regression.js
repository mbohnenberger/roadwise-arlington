'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const Core=require('./core.js');
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

// Preserve Arlington geography/content regressions from b2b1d9b.
const concepts=arlington.concepts,lessons=Core.flatLessons(arlington),allQuestions=Core.allQuestions(arlington);
assert.ok(!/northeast|from (the )?center/i.test(concepts.summer.description));assert.ok(concepts.summer.d.startsWith('M346 181')&&concepts.summer.label[0]<concepts.center.point[0]);
assert.match(concepts.broadway.description,/north of Mass Ave/i);assert.equal(concepts.broadway.d,'M321 231 C370 214 430 205 500 204 S625 209 700 214');
for(const id of ['mysticLakes','belmont','highArena','reservoir','somerville','cambridge','lexingtonLocal','wholeFoods','stopShop','traderJoes'])assert.ok(concepts[id],`missing Arlington anchor ${id}`);
assert.ok(concepts.traderJoes.point[0]<concepts.stopShop.point[0]&&concepts.stopShop.point[0]<concepts.wholeFoods.point[0]);assert.deepEqual(lessons[0].newConcepts,['mass','center']);
const routeText=allQuestions.filter(q=>q.type==='chain').map(q=>q.prompt).join('\n');for(const pattern of [/Arlington Center to Belmont Center/i,/Belmont Center to Arlington Center/i,/Arlington Center to Mystic Lakes/i,/Mystic Lakes to Arlington Center/i,/Arlington Heights to Alewife/i,/East Arlington to Alewife/i,/Fenway/i,/downtown/i,/Logan/i])assert.match(routeText,pattern);

// Mobile/footer behavior remains present.
const css=fs.readFileSync('styles.css','utf8');assert.match(css,/--footer-space/);assert.match(css,/env\(safe-area-inset-bottom\)/);assert.match(css,/@media\(max-width:600px\)/);assert.match(appSource,/ResizeObserver/);assert.match(appSource,/reserveFooter/);

Core.locationProvider.cache.clear();Core.locationProvider.lastRequestAt=0;let geocoderCalls=0;
const fakeFetch=async(url,options)=>{geocoderCalls++;assert.match(url,/format=jsonv2/);assert.match(url,/limit=5/);assert.equal(options.referrerPolicy,'origin');return{ok:true,json:async()=>[{name:'Testville',display_name:'Testville, Example',lat:'12.3',lon:'45.6',type:'town'}]};};
Core.locationProvider.search('Testville',fakeFetch).then(async first=>{assert.equal(first.length,1);const second=await Core.locationProvider.search('testville',fakeFetch);assert.deepEqual(second,first);assert.equal(geocoderCalls,1,'identical explicit searches should use the in-memory cache');console.log(`Roadwise platform checks passed: Arlington ${lessons.length} lessons/${allQuestions.length} questions; generated draft ${Core.flatLessons(generated).length} lessons/${chains.length} confirmed route chains.`);}).catch(error=>{console.error(error);process.exitCode=1;});
