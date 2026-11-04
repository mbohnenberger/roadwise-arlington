(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.RoadwiseCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

const COURSE_SCHEMA_VERSION=1;
const STORE_VERSION=1;
const STORE_KEY='roadwise-platform-v1';
const LEGACY_KEY='roadwise-progress';
const COURSE_TYPES=new Set(['road','landmark','store','gateway','destination','connection']);
const QUESTION_TYPES=new Set(['choice','chain']);
const MAX_TEXT=500;
const isObject=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v,max=MAX_TEXT)=>typeof v==='string'&&v.trim()&&v.length<=max;
const clone=v=>JSON.parse(JSON.stringify(v));
const finite=(v,min=-Infinity,max=Infinity)=>Number.isFinite(Number(v))&&Number(v)>=min&&Number(v)<=max;
const safeId=v=>typeof v==='string'&&/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(v)&&!['__proto__','prototype','constructor'].includes(v);

function defaultProgress(){
  return {version:2,xp:0,streak:0,lastActive:null,currentUnit:1,completedLessons:[],conceptMastery:{},reviewDue:{},answered:0,mistakes:0};
}
function sanitizeProgress(raw,course){
  const out=defaultProgress();
  if(!isObject(raw)) return out;
  out.xp=nonnegative(raw.xp??raw.points); out.streak=nonnegative(raw.streak); out.answered=nonnegative(raw.answered); out.mistakes=nonnegative(raw.mistakes);
  out.lastActive=typeof raw.lastActive==='string'?raw.lastActive:null;
  const lessonIds=new Set(flatLessons(course).map(l=>l.id));
  out.completedLessons=Array.isArray(raw.completedLessons)?[...new Set(raw.completedLessons.filter(id=>lessonIds.has(id)))]:[];
  for(const [key,val] of Object.entries(isObject(raw.conceptMastery)?raw.conceptMastery:{})) if(course.concepts[key]&&finite(val,0,100)) out.conceptMastery[key]=Math.round(Number(val));
  for(const [key,val] of Object.entries(isObject(raw.reviewDue)?raw.reviewDue:{})) if(course.concepts[key]&&finite(val,0,Number.MAX_SAFE_INTEGER)) out.reviewDue[key]=Math.floor(Number(val));
  out.currentUnit=Math.max(1,Math.min(course.units.length,nonnegative(raw.currentUnit)||1));
  return out;
}
function nonnegative(v){const n=Number(v);return Number.isFinite(n)&&n>=0?Math.floor(n):0;}
function flatLessons(course){return course.units.flatMap(unit=>unit.lessons.map(lesson=>({...lesson,unit:unit.id})));}
function allQuestions(course){return flatLessons(course).flatMap(lesson=>lesson.questions.map(question=>({...question,lessonId:lesson.id})));}

function validateCourse(input){
  const errors=[];
  if(!isObject(input)) return {ok:false,errors:['Manifest must be an object.']};
  if(input.schemaVersion!==COURSE_SCHEMA_VERSION) errors.push(`schemaVersion must be ${COURSE_SCHEMA_VERSION}.`);
  if(!safeId(input.id)) errors.push('id must be a safe 1–64 character identifier.');
  for(const key of ['title','region']) if(!text(input[key],120)) errors.push(`${key} is required and must be 120 characters or fewer.`);
  if(!isObject(input.center)||!finite(input.center.lat,-90,90)||!finite(input.center.lon,-180,180)) errors.push('center must contain valid lat/lon coordinates.');
  if(!isObject(input.bounds)||!finite(input.bounds.south,-90,90)||!finite(input.bounds.north,-90,90)||!finite(input.bounds.west,-180,180)||!finite(input.bounds.east,-180,180)||Number(input.bounds.south)>=Number(input.bounds.north)||Number(input.bounds.west)>=Number(input.bounds.east)) errors.push('bounds must contain ordered south/west/north/east coordinates.');
  if(!isObject(input.attribution)||!text(input.attribution.text,300)) errors.push('attribution.text is required.');
  if(input.attribution?.url!==undefined&&input.attribution.url!==''&&(!text(input.attribution.url,500)||!/^https:\/\//i.test(input.attribution.url))) errors.push('attribution.url must be empty or HTTPS.');
  if(!isObject(input.map)||!Array.isArray(input.map.viewBox)||input.map.viewBox.length!==4||!input.map.viewBox.every(n=>finite(n,-100000,100000))) errors.push('map.viewBox must contain four finite values.');
  if(!isObject(input.generator)||!text(input.generator.kind,80)) errors.push('generator metadata is required.');
  if(!isObject(input.concepts)||!Object.keys(input.concepts).length) errors.push('concepts must be a non-empty object.');
  else for(const [id,c] of Object.entries(input.concepts)){
    if(!safeId(id)||!isObject(c)||!text(c.name,120)||!COURSE_TYPES.has(c.type)) errors.push(`concept ${id} is invalid.`);
    if(c.description!==undefined&&!text(c.description,MAX_TEXT)) errors.push(`concept ${id} has an invalid description.`);
    if(c.point!==undefined&&(!Array.isArray(c.point)||c.point.length!==2||!c.point.every(n=>finite(n,-100000,100000)))) errors.push(`concept ${id} has an invalid point.`);
    if(c.d!==undefined&&!text(c.d,1000)) errors.push(`concept ${id} has invalid geometry.`);
  }
  const conceptIds=new Set(isObject(input.concepts)?Object.keys(input.concepts):[]),unitIds=new Set(),lessonIds=new Set();
  if(!Array.isArray(input.units)||!input.units.length) errors.push('units must be a non-empty array.');
  else input.units.forEach((unit,ui)=>{
    if(!isObject(unit)||!safeId(String(unit.id))||!text(unit.title,120)||!Array.isArray(unit.lessons)||!unit.lessons.length){errors.push(`unit ${ui+1} is invalid.`);return;}
    const unitId=String(unit.id);if(unitIds.has(unitId))errors.push(`unit id ${unitId} is duplicated.`);else unitIds.add(unitId);
    unit.lessons.forEach((lesson,li)=>{
      if(!isObject(lesson)||!safeId(lesson.id)||!text(lesson.title,120)||!Array.isArray(lesson.questions)||!lesson.questions.length){errors.push(`lesson ${ui+1}.${li+1} is invalid.`);return;}
      if(lessonIds.has(lesson.id))errors.push(`lesson id ${lesson.id} is duplicated.`);else lessonIds.add(lesson.id);
      if(Array.isArray(lesson.newConcepts)&&lesson.newConcepts.some(id=>!conceptIds.has(id))) errors.push(`lesson ${ui+1}.${li+1} references an unknown concept.`);
      lesson.questions.forEach((q,qi)=>{
        if(!isObject(q)){errors.push(`question ${ui+1}.${li+1}.${qi+1} is invalid.`);return;}
        if(!QUESTION_TYPES.has(q.type)||!text(q.prompt,300)||!Array.isArray(q.choices)||q.choices.length<2||!q.choices.every(x=>text(x,200))||!Array.isArray(q.concepts)) errors.push(`question ${ui+1}.${li+1}.${qi+1} is invalid.`);
        if(Array.isArray(q.choices)&&new Set(q.choices).size!==q.choices.length) errors.push(`question ${ui+1}.${li+1}.${qi+1} has duplicate choices.`);
        if(Array.isArray(q.concepts)&&q.concepts.some(id=>!conceptIds.has(id))) errors.push(`question ${ui+1}.${li+1}.${qi+1} references an unknown concept.`);
        if(q.type==='choice'&&(!text(q.answer,200)||!Array.isArray(q.choices)||!q.choices.includes(q.answer))) errors.push(`choice answer ${ui+1}.${li+1}.${qi+1} is invalid.`);
        if(q.type==='chain'&&(!Array.isArray(q.answer)||q.answer.length<2||!q.answer.every(x=>text(x,200))||!Array.isArray(q.choices)||q.answer.some(x=>!q.choices.includes(x))||new Set(q.answer).size!==q.answer.length)) errors.push(`chain answer ${ui+1}.${li+1}.${qi+1} is invalid.`);
      });
    });
  });
  return {ok:errors.length===0,errors};
}
function parseCourseJSON(json){
  if(typeof json!=='string'||json.length>1_000_000) return {ok:false,errors:['Import must be JSON under 1 MB.']};
  let value; try{value=JSON.parse(json);}catch(e){return {ok:false,errors:['Import is not valid JSON.']};}
  const result=validateCourse(value); return result.ok?{ok:true,course:clone(value),errors:[]}:{...result,course:null};
}

function emptyStore(){return {version:STORE_VERSION,activeCourseId:'arlington-ma',customCourses:{},progress:{},archivedCourseIds:[],legacyMigrated:false};}
function readStore(storage,builtIns){
  let state=emptyStore();
  try{const parsed=JSON.parse(storage.getItem(STORE_KEY));if(isObject(parsed)&&parsed.version===STORE_VERSION) state={...state,...parsed};}catch(e){}
  if(!isObject(state.customCourses)) state.customCourses={}; if(!isObject(state.progress)) state.progress={}; if(!Array.isArray(state.archivedCourseIds)) state.archivedCourseIds=[];
  if(!state.legacyMigrated){
    try{const legacy=JSON.parse(storage.getItem(LEGACY_KEY));if(legacy) state.progress['arlington-ma']=sanitizeProgress(legacy,builtIns['arlington-ma']);}catch(e){}
    state.legacyMigrated=true; writeStore(storage,state);
  }
  const courses={...builtIns};
  for(const [id,c] of Object.entries(state.customCourses)){const valid=validateCourse(c);if(valid.ok&&id===c.id) courses[id]=c;}
  if(!courses[state.activeCourseId]) state.activeCourseId='arlington-ma';
  for(const [id,course] of Object.entries(courses)) state.progress[id]=sanitizeProgress(state.progress[id],course);
  writeStore(storage,state); return {state,courses};
}
function writeStore(storage,state){try{storage.setItem(STORE_KEY,JSON.stringify(state));return true;}catch(e){return false;}}
function saveCustomCourse(storage,state,course){
  const valid=validateCourse(course); if(!valid.ok) return valid;
  const before={course:state.customCourses[course.id],progress:state.progress[course.id],activeCourseId:state.activeCourseId,archivedCourseIds:[...state.archivedCourseIds]};
  state.customCourses[course.id]=clone(course); state.progress[course.id]=sanitizeProgress(state.progress[course.id],course); state.activeCourseId=course.id;
  state.archivedCourseIds=state.archivedCourseIds.filter(id=>id!==course.id);
  if(!writeStore(storage,state)){if(before.course===undefined)delete state.customCourses[course.id];else state.customCourses[course.id]=before.course;if(before.progress===undefined)delete state.progress[course.id];else state.progress[course.id]=before.progress;state.activeCourseId=before.activeCourseId;state.archivedCourseIds=before.archivedCourseIds;return {ok:false,errors:['Browser storage is unavailable or full. Export another course or free space, then try again.']};}
  return {ok:true,errors:[]};
}
function switchCourse(storage,state,id,courses){if(!courses[id]) return false;state.activeCourseId=id;writeStore(storage,state);return true;}
function archiveCourse(storage,state,id,archived=true){if(id==='arlington-ma'||!state.customCourses[id]) return false;state.archivedCourseIds=state.archivedCourseIds.filter(x=>x!==id);if(archived)state.archivedCourseIds.push(id);writeStore(storage,state);return true;}
function removeCourse(storage,state,id){if(id==='arlington-ma'||!state.customCourses[id]) return false;delete state.customCourses[id];delete state.progress[id];state.archivedCourseIds=state.archivedCourseIds.filter(x=>x!==id);if(state.activeCourseId===id)state.activeCourseId='arlington-ma';writeStore(storage,state);return true;}
function resetCourse(storage,state,id,course){if(!course)return false;state.progress[id]=defaultProgress();writeStore(storage,state);return true;}

function slugify(value){return String(value||'course').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'course';}
function uniqueId(base,existing=[]){const used=new Set(existing);let id=slugify(base),n=2;while(used.has(id))id=`${slugify(base)}-${n++}`;return id;}
function generateCourse(place,options={}){
  const roads=(options.roads||[]).slice(0,8).map((r,i)=>({id:safeId(r.id)?r.id:`road-${i+1}`,name:String(r.name||'').trim(),description:String(r.description||'').trim(),direction:String(r.direction||'').trim()})).filter(r=>text(r.name,120));
  const anchors=(options.anchors||[]).slice(0,12).map((a,i)=>({id:safeId(a.id)?a.id:`anchor-${i+1}`,name:String(a.name||'').trim(),type:COURSE_TYPES.has(a.type)&&a.type!=='road'&&a.type!=='connection'?a.type:'landmark',roadId:a.roadId||'',direction:String(a.direction||'').trim()})).filter(a=>text(a.name,120));
  if(!place||!text(place.name,120)||!finite(place.lat,-90,90)||!finite(place.lon,-180,180)) throw new Error('Choose a named place with valid coordinates.');
  if(roads.length<3||anchors.length<3) throw new Error('Add at least 3 roads and 3 anchors.');
  if(new Set(roads.map(r=>r.id)).size!==roads.length||new Set(roads.map(r=>r.name.toLowerCase())).size!==roads.length) throw new Error('Road names and identifiers must be unique.');
  if(new Set(anchors.map(a=>a.id)).size!==anchors.length||new Set(anchors.map(a=>a.name.toLowerCase())).size!==anchors.length) throw new Error('Anchor names and identifiers must be unique.');
  const roadById=Object.fromEntries(roads.map(r=>[r.id,r]));
  const confirmed=anchors.filter(a=>roadById[a.roadId]);
  if(confirmed.length<2) throw new Error('Associate at least 2 anchors with submitted roads.');
  const id=uniqueId(options.id||place.name||'course',options.existingIds||[]);
  const center={lat:Number(place.lat),lon:Number(place.lon)};
  const concepts={};
  roads.forEach((r,i)=>{const y=90+i*45;concepts[r.id]={name:r.name,type:'road',icon:'↔',description:r.description||`${r.name}${r.direction?` — ${r.direction}`:''}.`,view:'local',d:`M60 ${y} C220 ${y-12} 460 ${y+12} 700 ${y}`,label:[80,y-10]};});
  anchors.forEach((a,i)=>{concepts[a.id]={name:a.name,type:a.type,icon:a.type==='store'?'●':'◆',description:`Confirmed anchor${a.roadId&&roadById[a.roadId]?` on ${roadById[a.roadId].name}`:''}${a.direction?` (${a.direction})`:''}.`,view:'local',point:[150+(i%4)*145,105+Math.floor(i/4)*110]};});
  const choice=(prompt,choices,answer,ids,why,map)=>({type:'choice',prompt,choices,answer,concepts:ids,why,map});
  const chain=(prompt,answer,choices,ids,why,map)=>({type:'chain',prompt,answer,choices,concepts:ids,why,map});
  const roadQs=roads.map((r,i)=>choice(`Which road belongs in your ${place.name} draft?`,[r.name,...roads.filter(x=>x.id!==r.id).slice(0,2).map(x=>x.name)],r.name,[r.id],`You added ${r.name} during setup.`,r.id));
  const relationshipQs=confirmed.map(a=>{const r=roadById[a.roadId];return choice(`Which road did you associate with ${a.name}?`,[r.name,...roads.filter(x=>x.id!==r.id).slice(0,2).map(x=>x.name)],r.name,[r.id,a.id],`This relationship was confirmed during setup.`,r.id);});
  const routeQs=[];
  for(const r of roads){const on=confirmed.filter(a=>a.roadId===r.id);for(let i=0;i<on.length;i++)for(let j=i+1;j<on.length;j++){
    const a=on[i],b=on[j],forward=[a.name,r.name,b.name],reverse=[b.name,r.name,a.name],choices=[a.name,b.name,r.name];
    routeQs.push(chain(`Which confirmed route connects ${a.name} to ${b.name}?`,forward,choices,[a.id,r.id,b.id],`Both anchors were associated with ${r.name}.`,r.id));
    routeQs.push(chain(`Which confirmed reverse route connects ${b.name} to ${a.name}?`,reverse,choices,[b.id,r.id,a.id],`This reverses only the relationship you confirmed.`,r.id));
  }}
  if(!routeQs.length) throw new Error('Put at least 2 anchors on the same road to create A→B practice.');
  const units=[
    {id:'1',title:'Recognize the roads',subtitle:'Your submitted local backbone',color:'#ff8a72',ink:'#45170e',lessons:[{id:'roads',title:'Major roads',icon:'↔',subtitle:'Recognize the roads you entered',newConcepts:roads.map(r=>r.id),questions:roadQs}]},
    {id:'2',title:'Place the anchors',subtitle:'Only confirmed road relationships',color:'#b9dc59',ink:'#253407',lessons:[{id:'anchors',title:'Road to anchor',icon:'◆',subtitle:'Connect anchors to their submitted roads',newConcepts:anchors.map(a=>a.id),questions:relationshipQs}]},
    {id:'3',title:'Practice routes',subtitle:'Outbound and reverse chains',color:'#75a8ff',ink:'#0c2855',lessons:[{id:'routes',title:'A to B',icon:'⇢',subtitle:'Practice confirmed relationships in both directions',newConcepts:[],checkpoint:true,questions:routeQs}]}
  ];
  const bounds={south:Math.max(-90,center.lat-0.08),west:Math.max(-180,center.lon-0.1),north:Math.min(90,center.lat+0.08),east:Math.min(180,center.lon+0.1)};
  if(bounds.south===bounds.north){bounds.south=Math.max(-90,bounds.south-0.01);bounds.north=Math.min(90,bounds.north+0.01);}if(bounds.west===bounds.east){bounds.west=Math.max(-180,bounds.west-0.01);bounds.east=Math.min(180,bounds.east+0.01);}
  const generated={schemaVersion:COURSE_SCHEMA_VERSION,id,slug:id,title:options.title||`Roadwise ${place.name}`,region:place.displayName||place.name,status:'draft',center,bounds,attribution:{text:place.attribution||'Location entered or selected by the user. Relationships are user-confirmed.',url:place.attributionUrl||''},description:`A customizable draft mental-map course for ${place.name}. Review every relationship before relying on it.`,pathTitle:`${place.name} starter path`,heroTitle:'Build your local mental map.',concepts,map:{viewBox:[0,0,760,500],regionalRoads:{},landmarks:{}},units,generator:{kind:'static-manual-draft',version:1,generatedAt:new Date().toISOString(),reviewed:false,place:clone(place),inputs:{roads:clone(roads),anchors:clone(anchors)},relationshipPolicy:'Routes use only anchors explicitly associated with the same submitted road.'}};
  const valid=validateCourse(generated);if(!valid.ok)throw new Error(`Generated draft is invalid: ${valid.errors[0]}`);return generated;
}

const locationProvider={
  endpoint:'https://nominatim.openstreetmap.org/search',cache:new Map(),lastRequestAt:0,
  async search(query,fetchImpl){
    const q=String(query||'').trim();if(q.length<2||q.length>160)throw new Error('Enter a place name between 2 and 160 characters.');const cacheKey=q.toLowerCase();if(this.cache.has(cacheKey))return clone(this.cache.get(cacheKey));
    const now=Date.now();if(now-this.lastRequestAt<1000)throw new Error('Please wait a moment before searching again.');
    const fetcher=fetchImpl||globalThis.fetch;if(!fetcher)throw new Error('Search is unavailable; use the map and manual fallback.');
    const url=`${this.endpoint}?format=jsonv2&limit=5&addressdetails=1&q=${encodeURIComponent(q)}`;this.lastRequestAt=now;
    const response=await fetcher(url,{headers:{Accept:'application/json'},referrerPolicy:'origin'});if(!response.ok)throw new Error(`Place search failed (${response.status}).`);
    const rows=await response.json();if(!Array.isArray(rows))throw new Error('Place search returned an invalid response.');const places=rows.slice(0,5).map(row=>({name:row.name||String(row.display_name||'').split(',')[0],displayName:row.display_name,lat:Number(row.lat),lon:Number(row.lon),type:row.type,providerId:row.osm_type&&row.osm_id?`${row.osm_type}/${row.osm_id}`:'',attribution:'Search © OpenStreetMap contributors',attributionUrl:'https://www.openstreetmap.org/copyright'})).filter(p=>text(p.name,120)&&text(p.displayName,500)&&finite(p.lat,-90,90)&&finite(p.lon,-180,180));this.cache.set(cacheKey,places);return clone(places);
  }
};
const courseGenerator={
  endpoint:'/api/courses/generate',
  async generate(place,options,fetchImpl){
    if(options&&options.useProductionApi){const f=fetchImpl||globalThis.fetch;if(!f)throw new Error('Production generator is unavailable.');const res=await f(this.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({schemaVersion:1,place,options})});const body=await res.json().catch(()=>({}));if(!res.ok)throw new Error(body.error?.message||`Generation failed (${res.status}).`);const valid=validateCourse(body.course);if(!valid.ok)throw new Error('Generator returned an invalid course.');return body.course;}
    return generateCourse(place,options);
  }
};

return {COURSE_SCHEMA_VERSION,STORE_VERSION,STORE_KEY,LEGACY_KEY,defaultProgress,sanitizeProgress,flatLessons,allQuestions,validateCourse,parseCourseJSON,emptyStore,readStore,writeStore,saveCustomCourse,switchCourse,archiveCourse,removeCourse,resetCourse,generateCourse,locationProvider,courseGenerator,uniqueId,clone};
});
