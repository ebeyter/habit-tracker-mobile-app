import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGoals } from '@/context/GoalsContext';
import { useAppTheme } from '@/hooks/use-app-theme';
import {
  dayKey,
  formatTimeOfDay,
  hhmmToDate,
  isSameDay,
  timeToHHMM,
  today,
} from '@/lib/date';
import { isDueOn } from '@/lib/recurrence';

const WEEKDAY_HEADER = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

/** Days to render for a month grid, padded so the first row starts on Monday. */
function monthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // getDay(): 0=Sun … 6=Sat — shift so Monday is index 0
  const leading = (first.getDay() + 6) % 7;

  const cells: (Date | null)[] = Array.from({ length: leading }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarScreen() {
  const { colors, spacing, radius } = useAppTheme();
  const { goals, events, addEvent, deleteEvent } = useGoals();

  const [cursor, setCursor] = useState(() => {
    const t = today();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [selected, setSelected] = useState(() => today());
  const [composerOpen, setComposerOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState<string | undefined>(undefined);
  const [showIosTimePicker, setShowIosTimePicker] = useState(false);

  const cells = useMemo(() => monthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);

  /** day key -> what exists that day, used to draw the dots under each cell */
  const marks = useMemo(() => {
    const map = new Map<string, { habit: boolean; deadline: boolean; event: boolean }>();
    const mark = (key: string, field: 'habit' | 'deadline' | 'event') => {
      const entry = map.get(key) ?? { habit: false, deadline: false, event: false };
      entry[field] = true;
      map.set(key, entry);
    };

    for (const cell of cells) {
      if (!cell) continue;
      const key = dayKey(cell);
      for (const goal of goals) {
        if (goal.kind === 'recurring') {
          if (isDueOn(goal, cell)) mark(key, 'habit');
        } else if (isSameDay(new Date(goal.deadline), cell)) {
          mark(key, 'deadline');
        }
      }
    }
    for (const event of events) mark(event.date, 'event');
    return map;
  }, [cells, goals, events]);

  const selectedKey = dayKey(selected);
  const dayEvents = useMemo(
    () => events.filter((e) => e.date === selectedKey).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? '')),
    [events, selectedKey]
  );
  const dayHabitCount = useMemo(
    () => goals.filter((g) => g.kind === 'recurring' && isDueOn(g, selected)).length,
    [goals, selected]
  );
  const dayDeadlines = useMemo(
    () => goals.filter((g) => g.kind === 'onetime' && isSameDay(new Date(g.deadline), selected)),
    [goals, selected]
  );

  function shiftMonth(delta: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }

  function openTimePicker() {
    const current = hhmmToDate(eventTime ?? '09:00');
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'time',
        onChange: (_e, selectedTime) => {
          if (selectedTime) setEventTime(timeToHHMM(selectedTime));
        },
      });
    } else {
      setShowIosTimePicker((v) => !v);
    }
  }

  async function saveEvent() {
    const title = eventTitle.trim();
    if (!title) return;
    await addEvent({ title, date: selectedKey, time: eventTime });
    setEventTitle('');
    setEventTime(undefined);
    setShowIosTimePicker(false);
    setComposerOpen(false);
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.monthNav}>
            <Pressable onPress={() => shiftMonth(-1)} hitSlop={12}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <Text style={[styles.monthLabel, { color: colors.text }]}>
              {cursor.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
            </Text>
            <Pressable onPress={() => shiftMonth(1)} hitSlop={12}>
              <Ionicons name="chevron-forward" size={22} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.weekHeader}>
            {WEEKDAY_HEADER.map((w) => (
              <Text key={w} style={[styles.weekHeaderText, { color: colors.textMuted }]}>
                {w}
              </Text>
            ))}
          </View>

          <View style={[styles.grid, { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.sm }]}>
            {cells.map((cell, i) => {
              if (!cell) return <View key={`pad-${i}`} style={styles.cell} />;
              const key = dayKey(cell);
              const isSelected = key === selectedKey;
              const isToday = isSameDay(cell, today());
              const mark = marks.get(key);
              return (
                <Pressable key={key} onPress={() => setSelected(cell)} style={styles.cell}>
                  <View
                    style={[
                      styles.cellInner,
                      {
                        backgroundColor: isSelected ? colors.tint : 'transparent',
                        borderColor: isToday && !isSelected ? colors.tint : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.cellText,
                        { color: isSelected ? '#fff' : colors.text, fontWeight: isToday ? '800' : '500' },
                      ]}
                    >
                      {cell.getDate()}
                    </Text>
                  </View>
                  <View style={styles.dots}>
                    {mark?.habit && <View style={[styles.dot, { backgroundColor: colors.success }]} />}
                    {mark?.deadline && <View style={[styles.dot, { backgroundColor: colors.warning }]} />}
                    {mark?.event && <View style={[styles.dot, { backgroundColor: colors.tint }]} />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.legend, { marginTop: spacing.sm }]}>
            <Legend color={colors.success} label="Alışkanlık" />
            <Legend color={colors.warning} label="Hedef bitişi" />
            <Legend color={colors.tint} label="Etkinlik" />
          </View>

          <View style={[styles.dayHeader, { marginTop: spacing.lg }]}>
            <Text style={[styles.dayTitle, { color: colors.text }]}>
              {selected.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}
            </Text>
            <Pressable
              onPress={() => setComposerOpen((v) => !v)}
              style={[styles.smallButton, { backgroundColor: colors.tint, borderRadius: radius.pill }]}
            >
              <Text style={styles.smallButtonText}>{composerOpen ? 'Kapat' : '+ Etkinlik'}</Text>
            </Pressable>
          </View>

          {composerOpen && (
            <View
              style={[
                styles.composer,
                { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderColor: colors.border },
              ]}
            >
              <TextInput
                value={eventTitle}
                onChangeText={setEventTitle}
                placeholder="Etkinlik başlığı (örn. Sınav)"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  { backgroundColor: colors.background, color: colors.text, borderRadius: radius.sm, borderColor: colors.border },
                ]}
              />
              <View style={[styles.composerRow, { marginTop: spacing.sm }]}>
                <Pressable
                  onPress={openTimePicker}
                  style={[
                    styles.timeButton,
                    { backgroundColor: colors.background, borderRadius: radius.sm, borderColor: colors.border },
                  ]}
                >
                  <Text style={{ color: eventTime ? colors.text : colors.textMuted }}>
                    {eventTime ? formatTimeOfDay(eventTime) : 'Saat seç (opsiyonel)'}
                  </Text>
                </Pressable>
                {!!eventTime && (
                  <Pressable onPress={() => setEventTime(undefined)} hitSlop={8}>
                    <Text style={{ color: colors.danger, fontSize: 13, fontWeight: '700' }}>Temizle</Text>
                  </Pressable>
                )}
              </View>
              {Platform.OS === 'ios' && showIosTimePicker && (
                <DateTimePicker
                  value={hhmmToDate(eventTime ?? '09:00')}
                  mode="time"
                  display="spinner"
                  onChange={(_e, selectedTime) => {
                    if (selectedTime) setEventTime(timeToHHMM(selectedTime));
                  }}
                />
              )}
              <Pressable
                onPress={saveEvent}
                style={[styles.saveButton, { backgroundColor: colors.tint, borderRadius: radius.sm, marginTop: spacing.sm }]}
              >
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </Pressable>
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                Saat seçersen o saatte bir hatırlatma bildirimi kurulur.
              </Text>
            </View>
          )}

          {dayEvents.map((event) => (
            <View
              key={event.id}
              style={[
                styles.eventRow,
                { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
              ]}
            >
              <View style={[styles.eventStripe, { backgroundColor: colors.tint }]} />
              <View style={styles.flex}>
                <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
                <Text style={[styles.eventMeta, { color: colors.textMuted }]}>
                  {event.time ? formatTimeOfDay(event.time) : 'Tüm gün'}
                </Text>
              </View>
              <Pressable onPress={() => deleteEvent(event.id)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            </View>
          ))}

          <View
            style={[
              styles.summary,
              { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
            ]}
          >
            <Text style={[styles.summaryText, { color: colors.textMuted }]}>
              {dayHabitCount} alışkanlık planlı · {dayDeadlines.length} hedef bitiyor
              {dayEvents.length === 0 ? ' · etkinlik yok' : ''}
            </Text>
            <Pressable onPress={() => router.push('/day')}>
              <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 13 }}>Gün Gün&apos;e git →</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.legendText, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthLabel: {
    fontSize: 20,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 4,
  },
  cellInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 14,
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
    height: 8,
    marginTop: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendText: {
    fontSize: 11,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  smallButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  composer: {
    borderWidth: 1,
    marginTop: 12,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  timeButton: {
    flex: 1,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  saveButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  hint: {
    fontSize: 11,
    marginTop: 8,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventStripe: {
    width: 4,
    height: 34,
    borderRadius: 2,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  eventMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryText: {
    flex: 1,
    fontSize: 12,
  },
});
