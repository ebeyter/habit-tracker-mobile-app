import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { categoryEmoji } from '@/lib/categories';
import { addDays, formatDate, formatTimeOfDay, hhmmToDate, startOfDay, timeToHHMM, today } from '@/lib/date';
import { generateId } from '@/lib/id';
import { WEEKDAY_LABELS } from '@/lib/recurrence';
import { suggestPlan } from '@/lib/smart-plan';
import {
  PRIORITIES,
  type GoalCategory,
  type GoalKind,
  type Priority,
  type Recurrence,
  type Subtask,
  type Weekday,
} from '@/lib/types';

const REMINDER_MIN = 0;
const REMINDER_MAX = 30;
const DEFAULT_REMINDER_TIME = '09:00';
const CATEGORY_EMOJI_CHOICES = ['🎯', '💡', '🎨', '🎵', '🏃', '🍳', '💰', '✈️', '🐾', '🧘'];

const PRESET_RECURRING: { title: string; category: GoalCategory }[] = [
  { title: 'Su iç', category: 'saglik' },
  { title: 'Kitap oku', category: 'egitim' },
  { title: 'Egzersiz yap', category: 'saglik' },
  { title: 'Meditasyon yap', category: 'kisisel' },
  { title: 'Erken uyu', category: 'saglik' },
];

export default function GoalFormScreen() {
  const { colors, spacing, radius } = useAppTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { goals, addGoal, updateGoal, categories, addCategory, deleteCategory } = useGoals();

  const editingGoal = useMemo(() => goals.find((g) => g.id === id), [goals, id]);
  const isEditing = !!editingGoal;
  const minDate = useMemo(() => addDays(today(), 1), []);

  const [kind, setKind] = useState<GoalKind>('onetime');
  const [category, setCategory] = useState<GoalCategory>('genel');
  const [priority, setPriority] = useState<Priority>('normal');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<Recurrence['type']>('daily');
  const [weekdays, setWeekdays] = useState<Weekday[]>([1, 3, 5]);
  const [everyN, setEveryN] = useState(2);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(1);
  const [targetAmount, setTargetAmount] = useState('');
  const [targetUnit, setTargetUnit] = useState('');
  const [onceReminderTime, setOnceReminderTime] = useState(DEFAULT_REMINDER_TIME);
  const [showIosOnceTimePicker, setShowIosOnceTimePicker] = useState(false);
  const [reminderTimes, setReminderTimes] = useState<string[]>([DEFAULT_REMINDER_TIME]);
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);
  const [showIosDatePicker, setShowIosDatePicker] = useState(false);
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [newCategoryEmoji, setNewCategoryEmoji] = useState(CATEGORY_EMOJI_CHOICES[0]);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [deadlineError, setDeadlineError] = useState<string | null>(null);
  const [recurrenceError, setRecurrenceError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editingGoal) return;
    setKind(editingGoal.kind);
    setCategory(editingGoal.category);
    setPriority(editingGoal.priority);
    setSubtasks(editingGoal.subtasks);
    setTitle(editingGoal.title);
    setDescription(editingGoal.description ?? '');
    if (editingGoal.kind === 'onetime') {
      setDeadline(new Date(editingGoal.deadline));
      setReminderDaysBefore(editingGoal.reminderDaysBefore);
      setOnceReminderTime(editingGoal.reminderTime);
      setTargetAmount(editingGoal.targetAmount ? String(editingGoal.targetAmount) : '');
      setTargetUnit(editingGoal.targetUnit ?? '');
    } else {
      setReminderTimes(editingGoal.reminderTimes);
      setRecurrenceType(editingGoal.recurrence.type);
      if (editingGoal.recurrence.type === 'weekdays') setWeekdays(editingGoal.recurrence.days);
      if (editingGoal.recurrence.type === 'everyN') setEveryN(editingGoal.recurrence.n);
    }
  }, [editingGoal]);

  function applyPreset(preset: { title: string; category: GoalCategory }) {
    setTitle(preset.title);
    setCategory(preset.category);
  }

  function buildRecurrence(): Recurrence {
    if (recurrenceType === 'weekdays') return { type: 'weekdays', days: weekdays };
    if (recurrenceType === 'everyN') return { type: 'everyN', n: everyN };
    return { type: 'daily' };
  }

  function toggleWeekday(day: Weekday) {
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function addSubtask() {
    const trimmed = subtaskDraft.trim();
    if (!trimmed) return;
    setSubtasks((prev) => [...prev, { id: generateId(), title: trimmed, done: false }]);
    setSubtaskDraft('');
  }

  function openDatePicker() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: deadline ?? minDate,
        mode: 'date',
        minimumDate: minDate,
        onChange: (_event, selected) => {
          if (selected) {
            setDeadline(startOfDay(selected));
            setDeadlineError(null);
          }
        },
      });
    } else {
      setShowIosDatePicker((v) => !v);
    }
  }

  function setTimeAt(index: number, value: string) {
    setReminderTimes((prev) => {
      const next = [...prev];
      next[index] = value;
      return [...new Set(next)].sort();
    });
  }

  function openTimePicker(index: number) {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: hhmmToDate(reminderTimes[index]),
        mode: 'time',
        onChange: (_event, selected) => {
          if (selected) setTimeAt(index, timeToHHMM(selected));
        },
      });
    } else {
      setEditingTimeIndex((v) => (v === index ? null : index));
    }
  }

  function addReminderTime() {
    setReminderTimes((prev) => {
      // offer the next free hour so the new row is not a duplicate of an existing one
      const used = new Set(prev);
      for (let h = 7; h <= 23; h++) {
        const candidate = `${String(h).padStart(2, '0')}:00`;
        if (!used.has(candidate)) return [...prev, candidate].sort();
      }
      return prev;
    });
  }

  async function handleAddCategory() {
    const label = newCategoryLabel.trim();
    if (!label) return;
    const created = await addCategory(label, newCategoryEmoji);
    setCategory(created.id);
    setNewCategoryLabel('');
    setNewCategoryOpen(false);
  }

  function confirmDeleteCategory(id: string, label: string) {
    Alert.alert('Kategoriyi sil', `"${label}" silinsin mi? Bu kategorideki hedefler Genel'e taşınır.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await deleteCategory(id);
          if (category === id) setCategory('genel');
        },
      },
    ]);
  }

  function adjustReminder(delta: number) {
    setReminderDaysBefore((v) => Math.min(REMINDER_MAX, Math.max(REMINDER_MIN, v + delta)));
  }

  function validate(): boolean {
    let ok = true;
    if (!title.trim()) {
      setTitleError('Başlık zorunlu.');
      ok = false;
    } else {
      setTitleError(null);
    }
    if (kind === 'onetime' && !deadline) {
      setDeadlineError('Bitiş tarihi zorunlu.');
      ok = false;
    } else {
      setDeadlineError(null);
    }
    if (kind === 'recurring' && recurrenceType === 'weekdays' && weekdays.length === 0) {
      setRecurrenceError('En az bir gün seç.');
      ok = false;
    } else {
      setRecurrenceError(null);
    }
    return ok;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const parsedAmount = Number(targetAmount);
      const shared = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        subtasks,
      };
      const input =
        kind === 'onetime'
          ? {
              ...shared,
              kind: 'onetime' as const,
              deadline: startOfDay(deadline!).toISOString(),
              reminderDaysBefore,
              reminderTime: onceReminderTime,
              targetAmount: targetAmount.trim() && parsedAmount > 0 ? parsedAmount : undefined,
              targetUnit: targetUnit.trim() || undefined,
            }
          : {
              ...shared,
              kind: 'recurring' as const,
              recurrence: buildRecurrence(),
              reminderTimes,
            };

      const result = isEditing ? await updateGoal(editingGoal!.id, input) : await addGoal(input);

      if (result.scheduleReason === 'past') {
        Alert.alert(
          'Hatırlatma planlanmadı',
          'Hesaplanan hatırlatma zamanı geçmişte kaldığı için bildirim kurulamadı. Hedef yine de kaydedildi.'
        );
      } else if (result.scheduleReason === 'permission') {
        Alert.alert(
          'Bildirim izni yok',
          'Bildirim izni verilmediği için hatırlatma planlanamadı. Ayarlar\'dan izin verip hedefi tekrar düzenleyebilirsin.'
        );
      }

      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={[styles.headerAction, { color: colors.textMuted }]}>İptal</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isEditing ? 'Hedefi Düzenle' : 'Yeni Hedef'}
        </Text>
        <Pressable onPress={handleSave} disabled={saving} hitSlop={12}>
          <Text style={[styles.headerAction, { color: colors.tint, fontWeight: '700' }]}>
            {saving ? '...' : 'Kaydet'}
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={12}
      >
        <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
          {!isEditing && (
            <View style={[styles.segmented, { backgroundColor: colors.border, borderRadius: radius.pill }]}>
              <SegmentButton
                label="Tek Seferlik"
                active={kind === 'onetime'}
                onPress={() => setKind('onetime')}
                colors={colors}
                radius={radius}
              />
              <SegmentButton
                label="Tekrarlayan"
                active={kind === 'recurring'}
                onPress={() => setKind('recurring')}
                colors={colors}
                radius={radius}
              />
            </View>
          )}
          {isEditing && (
            <Text style={[styles.kindLabel, { color: colors.textMuted, marginBottom: spacing.md }]}>
              Tür: {kind === 'onetime' ? 'Tek Seferlik (bitiş tarihli)' : 'Tekrarlayan'}
            </Text>
          )}

          {kind === 'recurring' && !isEditing && (
            <>
              <Text style={[styles.label, { color: colors.textMuted }]}>Hızlı Şablonlar</Text>
              <View style={styles.chipRow}>
                {PRESET_RECURRING.map((preset) => (
                  <Pressable
                    key={preset.title}
                    onPress={() => applyPreset(preset)}
                    style={[styles.chip, { backgroundColor: colors.border, borderRadius: radius.pill }]}
                  >
                    <Text style={[styles.chipText, { color: colors.text }]}>
                      {categoryEmoji(categories, preset.category)} {preset.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <Text style={[styles.label, { color: colors.textMuted, marginTop: kind === 'recurring' && !isEditing ? 16 : 0 }]}>
            Kategori
          </Text>
          <View style={styles.chipRow}>
            {categories.map((c) => {
              const active = category === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCategory(c.id)}
                  onLongPress={() => c.custom && confirmDeleteCategory(c.id, c.label)}
                  style={[
                    styles.chip,
                    {
                      borderRadius: radius.pill,
                      backgroundColor: active ? colors.tint : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? '#fff' : colors.text }]}>
                    {c.emoji} {c.label}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setNewCategoryOpen((v) => !v)}
              style={[styles.chip, { borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.tint }]}
            >
              <Text style={[styles.chipText, { color: colors.tint }]}>+ Yeni</Text>
            </Pressable>
          </View>
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Kendi kategorini eklemek için &quot;+ Yeni&quot;ye, silmek için üzerine basılı tut.
          </Text>

          {newCategoryOpen && (
            <View
              style={[
                styles.newCategoryBox,
                { backgroundColor: colors.surface, borderRadius: radius.md, borderColor: colors.border },
              ]}
            >
              <View style={styles.chipRow}>
                {CATEGORY_EMOJI_CHOICES.map((e) => (
                  <Pressable
                    key={e}
                    onPress={() => setNewCategoryEmoji(e)}
                    style={[
                      styles.emojiChoice,
                      {
                        borderRadius: radius.pill,
                        backgroundColor: newCategoryEmoji === e ? colors.tint : colors.border,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 18 }}>{e}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={[styles.row, { gap: spacing.sm, marginTop: spacing.sm }]}>
                <TextInput
                  value={newCategoryLabel}
                  onChangeText={setNewCategoryLabel}
                  placeholder="Kategori adı"
                  placeholderTextColor={colors.textMuted}
                  onSubmitEditing={handleAddCategory}
                  style={[
                    styles.input,
                    { flex: 1, backgroundColor: colors.background, color: colors.text, borderRadius: radius.sm, borderColor: colors.border },
                  ]}
                />
                <Pressable
                  onPress={handleAddCategory}
                  style={[styles.addSubtaskButton, { backgroundColor: colors.tint, borderRadius: radius.sm }]}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Ekle</Text>
                </Pressable>
              </View>
            </View>
          )}

          <Text style={[styles.label, { color: colors.textMuted, marginTop: spacing.md }]}>Öncelik</Text>
          <View style={styles.chipRow}>
            {PRIORITIES.map((p) => {
              const active = priority === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setPriority(p.id)}
                  style={[
                    styles.chip,
                    { borderRadius: radius.pill, backgroundColor: active ? colors.tint : colors.border },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? '#fff' : colors.text }]}>
                    {p.symbol} {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, { color: colors.textMuted, marginTop: spacing.md }]}>Başlık</Text>
          <TextInput
            value={title}
            onChangeText={(t) => {
              setTitle(t);
              if (t.trim()) setTitleError(null);
            }}
            placeholder={kind === 'onetime' ? 'Örn: Kitap bitir' : 'Örn: 15 sayfa kitap oku'}
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderRadius: radius.sm,
                borderColor: titleError ? colors.danger : colors.border,
              },
            ]}
          />
          {!!titleError && <Text style={[styles.error, { color: colors.danger }]}>{titleError}</Text>}

          <Text style={[styles.label, { color: colors.textMuted, marginTop: spacing.md }]}>
            Açıklama (opsiyonel)
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Detay ekle"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            style={[
              styles.input,
              styles.multiline,
              { backgroundColor: colors.surface, color: colors.text, borderRadius: radius.sm, borderColor: colors.border },
            ]}
          />

          {kind === 'onetime' ? (
            <>
              <Text style={[styles.label, { color: colors.textMuted, marginTop: spacing.md }]}>Bitiş Tarihi</Text>
              <Pressable
                onPress={openDatePicker}
                style={[
                  styles.dateButton,
                  {
                    backgroundColor: colors.surface,
                    borderRadius: radius.sm,
                    borderColor: deadlineError ? colors.danger : colors.border,
                  },
                ]}
              >
                <Text style={{ color: deadline ? colors.text : colors.textMuted }}>
                  {deadline ? formatDate(deadline.toISOString()) : 'Tarih seç'}
                </Text>
              </Pressable>
              {!!deadlineError && <Text style={[styles.error, { color: colors.danger }]}>{deadlineError}</Text>}
              {Platform.OS === 'ios' && showIosDatePicker && (
                <DateTimePicker
                  value={deadline ?? minDate}
                  mode="date"
                  display="inline"
                  minimumDate={minDate}
                  onChange={(_event, selected) => {
                    if (selected) {
                      setDeadline(startOfDay(selected));
                      setDeadlineError(null);
                    }
                  }}
                />
              )}

              <Text style={[styles.label, { color: colors.textMuted, marginTop: spacing.md }]}>
                Kaç gün önce hatırlat?
              </Text>
              <View style={styles.stepperRow}>
                <StepperButton label="−" onPress={() => adjustReminder(-1)} colors={colors} radius={radius} />
                <Text style={[styles.stepperValue, { color: colors.text }]}>
                  {reminderDaysBefore === 0 ? 'Bitiş günü' : `${reminderDaysBefore} gün`}
                </Text>
                <StepperButton label="+" onPress={() => adjustReminder(1)} colors={colors} radius={radius} />
              </View>

              <Text style={[styles.label, { color: colors.textMuted, marginTop: spacing.md }]}>
                Hatırlatma Saati
              </Text>
              <Pressable
                onPress={() => {
                  if (Platform.OS === 'android') {
                    DateTimePickerAndroid.open({
                      value: hhmmToDate(onceReminderTime),
                      mode: 'time',
                      onChange: (_e, selected) => {
                        if (selected) setOnceReminderTime(timeToHHMM(selected));
                      },
                    });
                  } else {
                    setShowIosOnceTimePicker((v) => !v);
                  }
                }}
                style={[
                  styles.dateButton,
                  { backgroundColor: colors.surface, borderRadius: radius.sm, borderColor: colors.border },
                ]}
              >
                <Text style={{ color: colors.text }}>{formatTimeOfDay(onceReminderTime)}</Text>
              </Pressable>
              {Platform.OS === 'ios' && showIosOnceTimePicker && (
                <DateTimePicker
                  value={hhmmToDate(onceReminderTime)}
                  mode="time"
                  display="spinner"
                  onChange={(_e, selected) => {
                    if (selected) setOnceReminderTime(timeToHHMM(selected));
                  }}
                />
              )}

              <Text style={[styles.label, { color: colors.textMuted, marginTop: spacing.md }]}>
                Hedef Miktar (opsiyonel — Akıllı Plan için)
              </Text>
              <View style={[styles.row, { gap: spacing.sm }]}>
                <TextInput
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  placeholder="Örn: 300"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  style={[
                    styles.input,
                    styles.amountInput,
                    { backgroundColor: colors.surface, color: colors.text, borderRadius: radius.sm, borderColor: colors.border },
                  ]}
                />
                <TextInput
                  value={targetUnit}
                  onChangeText={setTargetUnit}
                  placeholder="Birim (örn: sayfa)"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.input,
                    styles.unitInput,
                    { backgroundColor: colors.surface, color: colors.text, borderRadius: radius.sm, borderColor: colors.border },
                  ]}
                />
              </View>
              {deadline && (
                <Text style={[styles.hint, { color: colors.tint }]}>
                  💡 {suggestPlan(
                    deadline.toISOString(),
                    Number(targetAmount) > 0 ? Number(targetAmount) : undefined,
                    targetUnit
                  )}
                </Text>
              )}
            </>
          ) : (
            <>
              <Text style={[styles.label, { color: colors.textMuted, marginTop: spacing.md }]}>
                Ne Sıklıkla Tekrarlansın?
              </Text>
              <View style={styles.chipRow}>
                {([
                  { id: 'daily' as const, label: 'Her gün' },
                  { id: 'weekdays' as const, label: 'Haftanın günleri' },
                  { id: 'everyN' as const, label: 'N günde bir' },
                ]).map((r) => {
                  const active = recurrenceType === r.id;
                  return (
                    <Pressable
                      key={r.id}
                      onPress={() => setRecurrenceType(r.id)}
                      style={[
                        styles.chip,
                        { borderRadius: radius.pill, backgroundColor: active ? colors.tint : colors.border },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: active ? '#fff' : colors.text }]}>{r.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {recurrenceType === 'weekdays' && (
                <View style={[styles.chipRow, { marginTop: spacing.sm }]}>
                  {WEEKDAY_LABELS.map((w) => {
                    const active = weekdays.includes(w.day);
                    return (
                      <Pressable
                        key={w.day}
                        onPress={() => toggleWeekday(w.day)}
                        style={[
                          styles.dayChip,
                          { borderRadius: radius.pill, backgroundColor: active ? colors.tint : colors.border },
                        ]}
                      >
                        <Text style={[styles.chipText, { color: active ? '#fff' : colors.text }]}>
                          {w.short}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {recurrenceType === 'everyN' && (
                <View style={[styles.stepperRow, { marginTop: spacing.sm }]}>
                  <StepperButton
                    label="−"
                    onPress={() => setEveryN((v) => Math.max(2, v - 1))}
                    colors={colors}
                    radius={radius}
                  />
                  <Text style={[styles.stepperValue, { color: colors.text }]}>{everyN} günde bir</Text>
                  <StepperButton
                    label="+"
                    onPress={() => setEveryN((v) => Math.min(30, v + 1))}
                    colors={colors}
                    radius={radius}
                  />
                </View>
              )}
              {!!recurrenceError && (
                <Text style={[styles.error, { color: colors.danger }]}>{recurrenceError}</Text>
              )}

              <Text style={[styles.label, { color: colors.textMuted, marginTop: spacing.md }]}>
                Hatırlatma Saatleri ({reminderTimes.length} kez/gün)
              </Text>
              {reminderTimes.map((time, index) => (
                <View key={time} style={[styles.row, { gap: spacing.sm, marginBottom: spacing.sm }]}>
                  <Pressable
                    onPress={() => openTimePicker(index)}
                    style={[
                      styles.dateButton,
                      { flex: 1, backgroundColor: colors.surface, borderRadius: radius.sm, borderColor: colors.border },
                    ]}
                  >
                    <Text style={{ color: colors.text }}>{formatTimeOfDay(time)}</Text>
                  </Pressable>
                  {reminderTimes.length > 1 && (
                    <Pressable
                      onPress={() => setReminderTimes((prev) => prev.filter((_, i) => i !== index))}
                      style={[styles.addSubtaskButton, { backgroundColor: colors.dangerMuted, borderRadius: radius.sm }]}
                    >
                      <Text style={{ color: colors.danger, fontWeight: '700' }}>Sil</Text>
                    </Pressable>
                  )}
                </View>
              ))}
              {Platform.OS === 'ios' && editingTimeIndex !== null && (
                <DateTimePicker
                  value={hhmmToDate(reminderTimes[editingTimeIndex])}
                  mode="time"
                  display="spinner"
                  onChange={(_event, selected) => {
                    if (selected) setTimeAt(editingTimeIndex, timeToHHMM(selected));
                  }}
                />
              )}
              <Pressable
                onPress={addReminderTime}
                style={[styles.chip, { alignSelf: 'flex-start', borderRadius: radius.pill, backgroundColor: colors.border }]}
              >
                <Text style={[styles.chipText, { color: colors.text }]}>+ Saat Ekle</Text>
              </Pressable>
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                Bitiş tarihi yok; bu hedef seçtiğin sıklıkta ve saatlerde hatırlatılır, tamamlandığı gün
                seriye (streak) sayılır.
              </Text>
            </>
          )}

          <Text style={[styles.label, { color: colors.textMuted, marginTop: spacing.md }]}>
            Alt Görevler (opsiyonel)
          </Text>
          {subtasks.map((s) => (
            <View key={s.id} style={[styles.subtaskRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.subtaskTitle, { color: colors.text }]}>{s.title}</Text>
              <Pressable
                onPress={() => setSubtasks((prev) => prev.filter((x) => x.id !== s.id))}
                hitSlop={10}
              >
                <Text style={{ color: colors.danger, fontSize: 13, fontWeight: '700' }}>Sil</Text>
              </Pressable>
            </View>
          ))}
          <View style={[styles.row, { gap: spacing.sm, marginTop: spacing.sm }]}>
            <TextInput
              value={subtaskDraft}
              onChangeText={setSubtaskDraft}
              placeholder="Adım ekle"
              placeholderTextColor={colors.textMuted}
              onSubmitEditing={addSubtask}
              style={[
                styles.input,
                { flex: 1, backgroundColor: colors.surface, color: colors.text, borderRadius: radius.sm, borderColor: colors.border },
              ]}
            />
            <Pressable
              onPress={addSubtask}
              style={[styles.addSubtaskButton, { backgroundColor: colors.tint, borderRadius: radius.sm }]}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Ekle</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SegmentButton({
  label,
  active,
  onPress,
  colors,
  radius,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
  radius: ReturnType<typeof useAppTheme>['radius'];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.segmentButton,
        { borderRadius: radius.pill, backgroundColor: active ? colors.surface : 'transparent' },
      ]}
    >
      <Text style={[styles.segmentText, { color: active ? colors.text : colors.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

function StepperButton({
  label,
  onPress,
  colors,
  radius,
}: {
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
  radius: ReturnType<typeof useAppTheme>['radius'];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.stepperButton,
        { backgroundColor: colors.border, borderRadius: radius.pill, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={[styles.stepperButtonText, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerAction: {
    fontSize: 15,
  },
  segmented: {
    flexDirection: 'row',
    padding: 4,
    marginBottom: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
  },
  amountInput: {
    flex: 1,
  },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  newCategoryBox: {
    borderWidth: 1,
    padding: 12,
    marginTop: 8,
  },
  emojiChoice: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  subtaskTitle: {
    flex: 1,
    fontSize: 14,
  },
  addSubtaskButton: {
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  unitInput: {
    flex: 1.4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
  },
  kindLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    marginTop: 10,
    lineHeight: 17,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepperButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    fontSize: 20,
    fontWeight: '700',
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 90,
    textAlign: 'center',
  },
});
