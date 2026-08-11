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
import { addDays, formatDate, formatTimeOfDay, hhmmToDate, startOfDay, timeToHHMM, today } from '@/lib/date';
import type { GoalKind } from '@/lib/types';

const REMINDER_MIN = 0;
const REMINDER_MAX = 30;
const DEFAULT_REMINDER_TIME = '09:00';

export default function GoalFormScreen() {
  const { colors, spacing, radius } = useAppTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { goals, addGoal, updateGoal } = useGoals();

  const editingGoal = useMemo(() => goals.find((g) => g.id === id), [goals, id]);
  const isEditing = !!editingGoal;
  const minDate = useMemo(() => addDays(today(), 1), []);

  const [kind, setKind] = useState<GoalKind>('onetime');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(1);
  const [reminderTime, setReminderTime] = useState(DEFAULT_REMINDER_TIME);
  const [showIosDatePicker, setShowIosDatePicker] = useState(false);
  const [showIosTimePicker, setShowIosTimePicker] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [deadlineError, setDeadlineError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editingGoal) return;
    setKind(editingGoal.kind);
    setTitle(editingGoal.title);
    setDescription(editingGoal.description ?? '');
    if (editingGoal.kind === 'onetime') {
      setDeadline(new Date(editingGoal.deadline));
      setReminderDaysBefore(editingGoal.reminderDaysBefore);
    } else {
      setReminderTime(editingGoal.reminderTime);
    }
  }, [editingGoal]);

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

  function openTimePicker() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: hhmmToDate(reminderTime),
        mode: 'time',
        onChange: (_event, selected) => {
          if (selected) setReminderTime(timeToHHMM(selected));
        },
      });
    } else {
      setShowIosTimePicker((v) => !v);
    }
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
    return ok;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const input =
        kind === 'onetime'
          ? {
              kind: 'onetime' as const,
              title: title.trim(),
              description: description.trim() || undefined,
              deadline: startOfDay(deadline!).toISOString(),
              reminderDaysBefore,
            }
          : {
              kind: 'recurring' as const,
              title: title.trim(),
              description: description.trim() || undefined,
              reminderTime,
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
              Tür: {kind === 'onetime' ? 'Tek Seferlik (bitiş tarihli)' : 'Tekrarlayan (her gün)'}
            </Text>
          )}

          <Text style={[styles.label, { color: colors.textMuted }]}>Başlık</Text>
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
            </>
          ) : (
            <>
              <Text style={[styles.label, { color: colors.textMuted, marginTop: spacing.md }]}>
                Her Gün Hatırlatma Saati
              </Text>
              <Pressable
                onPress={openTimePicker}
                style={[
                  styles.dateButton,
                  { backgroundColor: colors.surface, borderRadius: radius.sm, borderColor: colors.border },
                ]}
              >
                <Text style={{ color: colors.text }}>{formatTimeOfDay(reminderTime)}</Text>
              </Pressable>
              {Platform.OS === 'ios' && showIosTimePicker && (
                <DateTimePicker
                  value={hhmmToDate(reminderTime)}
                  mode="time"
                  display="spinner"
                  onChange={(_event, selected) => {
                    if (selected) setReminderTime(timeToHHMM(selected));
                  }}
                />
              )}
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                Bitiş tarihi yok; bu hedef her gün belirtilen saatte hatırlatılır ve o gün tamamlandığında
                seriye (streak) sayılır.
              </Text>
            </>
          )}
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
