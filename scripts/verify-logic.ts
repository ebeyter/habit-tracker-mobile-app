// Dev-time check of the pure logic behind the brief's success criteria.
// Run: npx tsx scripts/verify-logic.ts

import { addDays, dayKey, today } from '../lib/date';
import { saplingState } from '../lib/garden';
import { isDueOn } from '../lib/recurrence';
import { computeStreak } from '../lib/streak';
import type { Goal, RecurringGoal } from '../lib/types';

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`${ok ? '✅' : '❌'} ${label}${ok ? '' : `\n     beklenen ${JSON.stringify(expected)}, gelen ${JSON.stringify(expected === actual ? actual : actual)}`}`);
}

const base = {
  id: 'x',
  title: 'test',
  category: 'genel',
  priority: 'normal' as const,
  subtasks: [],
  notificationIds: [],
  createdAt: addDays(today(), -60).toISOString(),
};

function habit(completedDates: string[], recurrence: RecurringGoal['recurrence'] = { type: 'daily' }): RecurringGoal {
  return { ...base, kind: 'recurring', recurrence, reminderTimes: ['09:00'], completedDates };
}

function daysAgo(n: number): string {
  return dayKey(addDays(today(), -n));
}

console.log('\n— Streak —');

check('boş geçmiş → 0', computeStreak([habit([])]).currentStreak, 0);

check('bugün tamamlandı → 1', computeStreak([habit([daysAgo(0)])]).currentStreak, 1);

check(
  'dün + bugün → 2',
  computeStreak([habit([daysAgo(1), daysAgo(0)])]).currentStreak,
  2
);

check(
  'aynı gün iki farklı hedef → yine 1 (duplicate artmıyor)',
  computeStreak([habit([daysAgo(0)]), { ...habit([daysAgo(0)]), id: 'y' }]).currentStreak,
  1
);

check(
  'arada boş gün → seri bozuluyor, yeni seri 1',
  computeStreak([habit([daysAgo(3), daysAgo(2), daysAgo(0)])]).currentStreak,
  1
);

check(
  'boşluğa rağmen en iyi seri korunuyor',
  computeStreak([habit([daysAgo(3), daysAgo(2), daysAgo(0)])]).bestStreak,
  2
);

check(
  'son tamamlama 2 gün önce → güncel seri 0',
  computeStreak([habit([daysAgo(2)])]).currentStreak,
  0
);

check(
  'tek seferlik hedef de seriye sayılıyor',
  computeStreak([
    {
      ...base,
      kind: 'onetime',
      deadline: today().toISOString(),
      reminderDaysBefore: 0,
      reminderTime: '09:00',
      status: 'completed',
      completedAt: new Date().toISOString(),
    } as Goal,
  ]).currentStreak,
  1
);

console.log('\n— Tekrar kuralları —');

const start = addDays(today(), -10);
const g = (recurrence: RecurringGoal['recurrence']) => ({ recurrence, createdAt: start.toISOString() });

check('her gün → bugün planlı', isDueOn(g({ type: 'daily' }), today()), true);

const monday = (() => {
  const d = new Date(today());
  while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
  return d;
})();
const tuesday = addDays(monday, 1);

check('haftanın günleri (Pzt) → pazartesi planlı', isDueOn(g({ type: 'weekdays', days: [1] }), monday), true);
check('haftanın günleri (Pzt) → salı planlı değil', isDueOn(g({ type: 'weekdays', days: [1] }), tuesday), false);

check('2 günde bir → başlangıç günü planlı', isDueOn(g({ type: 'everyN', n: 2 }), start), true);
check('2 günde bir → ertesi gün planlı değil', isDueOn(g({ type: 'everyN', n: 2 }), addDays(start, 1)), false);
check('2 günde bir → iki gün sonra planlı', isDueOn(g({ type: 'everyN', n: 2 }), addDays(start, 2)), true);
check('oluşturulmadan önceki gün planlı değil', isDueOn(g({ type: 'daily' }), addDays(start, -1)), false);

console.log('\n— Fidan / Orman —');

const withCompletions = (n: number) => [habit(Array.from({ length: n }, (_, i) => daysAgo(i)))];

check('0 tamamlama → tohum', saplingState(withCompletions(0)).stage, 'seed');
check('1 tamamlama → filiz', saplingState(withCompletions(1)).stage, 'sprout');
check('4 tamamlama → fidan', saplingState(withCompletions(4)).stage, 'seedling');
check('7 tamamlama → tomurcuk', saplingState(withCompletions(7)).stage, 'budding');
check('10 tamamlama → 1 ağaç, sayaç sıfırlanır', saplingState(withCompletions(10)).trees, 1);
check('10 tamamlama → ilerleme 0', saplingState(withCompletions(10)).progress, 0);
check('23 tamamlama → 2 ağaç + 3 ilerleme', [saplingState(withCompletions(23)).trees, saplingState(withCompletions(23)).progress], [2, 3]);

console.log(`\n${failures === 0 ? '✅ Tüm kontroller geçti.' : `❌ ${failures} kontrol başarısız.`}\n`);
process.exit(failures === 0 ? 0 : 1);
