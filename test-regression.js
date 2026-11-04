'use strict';

const assert = require('node:assert/strict');
let seed = 0x5eed1234;
Math.random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 0x100000000);

const roadwise = require('./app.js');
const {lessons, allQuestions, concepts} = roadwise;
const promptKey = question => question.prompt.trim().toLowerCase();

const migrated = roadwise.migrateProgress({points:17, streak:3, answered:9});
assert.equal(migrated.version, 2);
assert.equal(migrated.xp, 17);
assert.equal(migrated.streak, 3);
assert.equal(migrated.answered, 9);

for (let pass = 0; pass < 50; pass++) {
  for (const lesson of lessons) {
    const round = roadwise.makeRound(lesson);
    assert.equal(new Set(round.map(promptKey)).size, round.length, `${lesson.id} generated duplicate prompts`);
    const [min, max] = lesson.checkpoint ? [5, 6] : [4, 5];
    assert.ok(round.length >= min && round.length <= max, `${lesson.id} round length ${round.length} is outside ${min}-${max}`);
  }
}

roadwise.setProgress(roadwise.defaultProgress());
assert.equal(roadwise.makeRouteLesson(), null, 'route quiz must stay locked before four learned routes exist');
const learnedIds = ['u1l1', 'u1stores'];
roadwise.setProgress({...roadwise.defaultProgress(), version:2, completedLessons:learnedIds});
const routeQuiz = roadwise.makeRouteLesson();
assert.ok(routeQuiz && routeQuiz.questions.length >= 4 && routeQuiz.questions.length <= 5, 'route quiz must contain 4-5 questions');
assert.ok(routeQuiz.questions.every(question => question.type === 'chain'), 'route quiz must contain only route chains');
assert.ok(routeQuiz.questions.every(question => learnedIds.includes(question.lessonId)), 'route quiz included content from an uncompleted lesson');
assert.equal(new Set(routeQuiz.questions.map(promptKey)).size, routeQuiz.questions.length, 'route quiz generated duplicate prompts');

assert.ok(!/northeast|from (the )?center/i.test(concepts.summer.description), 'Summer description still makes the old northeast/Center claim');
assert.ok(concepts.summer.d.startsWith('M346 181') && concepts.summer.label[0] < concepts.center.point[0], 'Summer geometry must run west/northwest from the Mystic/Mill area');
assert.match(concepts.broadway.description, /north of Mass Ave/i);
assert.equal(concepts.broadway.d, 'M321 231 C370 214 430 205 500 204 S625 209 700 214', 'corrected Broadway geometry changed');

for (const id of ['mysticLakes','belmont','highArena','reservoir','somerville','cambridge','lexingtonLocal','wholeFoods','stopShop','traderJoes']) {
  assert.ok(concepts[id], `missing destination anchor concept: ${id}`);
}
assert.equal(concepts.wholeFoods.point[1] > 220 && concepts.wholeFoods.point[1] < 250, true, 'Whole Foods should sit on the Mass Ave study line');
assert.ok(concepts.traderJoes.point[0] < concepts.stopShop.point[0] && concepts.stopShop.point[0] < concepts.wholeFoods.point[0], 'store anchors must run west-to-east as Trader Joe’s, Stop & Shop, Whole Foods');
const storeLesson = lessons.find(lesson => lesson.id === 'u1stores');
assert.ok(storeLesson, 'missing store-anchor lesson');
assert.equal(storeLesson.newConcepts.length, 3, 'store lesson must introduce exactly three recognizable anchors');
assert.deepEqual(lessons[0].newConcepts, ['mass','center'], 'opening lesson should remain sparse');
const routeText = allQuestions.filter(question => question.type === 'chain').map(question => question.prompt).join('\n');
for (const pattern of [
  /Arlington Center to Belmont Center/i,
  /Belmont Center to Arlington Center/i,
  /Arlington Center to Mystic Lakes/i,
  /Mystic Lakes to Arlington Center/i,
  /Arlington Center toward Somerville \/ Teele/i,
  /Arlington Heights toward Arlington Reservoir/i,
  /Arlington Heights to Alewife/i,
  /East Arlington to Alewife/i,
  /Arlington Center \/ Whole Foods to Trader Joe’s/i,
  /Trader Joe’s to Whole Foods/i,
  /Whole Foods to Stop & Shop/i,
  /Fenway/i,
  /downtown/i,
  /Logan/i
]) assert.match(routeText, pattern);

console.log(`Roadwise regression checks passed: ${lessons.length} lessons, ${allQuestions.length} questions, ${allQuestions.filter(q => q.type === 'chain').length} route chains.`);
