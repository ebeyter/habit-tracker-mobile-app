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
import { addDays, formatDate, startOfDay, today } from '@/lib/date';

const REMINDER_MIN = 0;
const REMINDER_MAX = 30;

export default function GoalFormScreen() {
  const { colors, spacing, radius } = useAppTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { goals, addGoal, updateGoal } = useGoals();

  const editingGoal = useMemo(() => goals.find((g) => g.id === id), [goals, id]);
  const isEditing = !!editingGoal;
  const minDate = useMemo(() => addDays(today(), 1), []);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(1);
  const [showIosPicker, setShowIosPicker] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [deadlineError, setDeadlineError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingGoal) {
      setTitle(editingGoal.title);
      setDescription(editingGoal.description ?? '');
      setDeadline(new Date(editingGoal.deadline));
      setReminderDaysBefore(editingGoal.reminderDaysBefore);
    }
  }, [editingGoal]);

  function openPicker() {
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
      setShowIosPicker((v) => !v);
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
    if (!deadline) {
      setDeadlineError('Bitiş tarihi zorunlu.');
      ok = false;
    } else {
      setDeadlineError(null);
    }
    return ok;
  }

  async function handleSave() {
    if (!validate() || !deadline) return;
    setSaving(true);
    try {
      const input = {
        title: title.trim(),
        description: description.trim() || undefined,
        deadline: startOfDay(deadline).toISOString(),
        reminderDaysBefore,
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
          <Text style={[styles.label, { color: colors.textMuted }]}>Başlık</Text>
          <TextInput
            value={title}
            onChangeText={(t) => {
              setTitle(t);
              if (t.trim()) setTitleError(null);
            }}
            placeholder="Örn: Kitap bitir"
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

          <Text style={[styles.label, { color: colors.textMuted, marginTop: spacing.md }]}>Bitiş Tarihi</Text>
          <Pressable
            onPress={openPicker}
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
          {Platform.OS === 'ios' && showIosPicker && (
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
