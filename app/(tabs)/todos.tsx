import Ionicons from '@expo/vector-icons/Ionicons';
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

import { ScreenHeader } from '@/components/ScreenHeader';
import { useGoals } from '@/context/GoalsContext';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { TodoItem } from '@/lib/types';

export default function TodosScreen() {
  const { colors, spacing, radius } = useAppTheme();
  const { todos, addTodo, toggleTodo, deleteTodo, clearDoneTodos } = useGoals();
  const [draft, setDraft] = useState('');

  const { open, done } = useMemo(() => {
    const open: TodoItem[] = [];
    const done: TodoItem[] = [];
    for (const t of todos) (t.done ? done : open).push(t);
    open.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    done.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { open, done };
  }, [todos]);

  async function submit() {
    const title = draft.trim();
    if (!title) return;
    setDraft('');
    await addTodo(title);
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader
        title="Yapılacaklar"
        action={
          done.length > 0 ? (
            <Pressable onPress={clearDoneTodos} hitSlop={10}>
              <Text style={{ color: colors.danger, fontSize: 13, fontWeight: '700' }}>Temizle</Text>
            </Pressable>
          ) : undefined
        }
      />

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
          {todos.length === 0 && (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Liste boş</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Hızlı işlerini buraya ekle. Bunlar seriyi (streak) etkilemez.
              </Text>
            </View>
          )}

          {open.map((todo) => (
            <TodoRow
              key={todo.id}
              todo={todo}
              onToggle={() => toggleTodo(todo.id)}
              onDelete={() => deleteTodo(todo.id)}
            />
          ))}

          {done.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: spacing.lg }]}>
                Tamamlandı ({done.length})
              </Text>
              {done.map((todo) => (
                <TodoRow
                  key={todo.id}
                  todo={todo}
                  onToggle={() => toggleTodo(todo.id)}
                  onDelete={() => deleteTodo(todo.id)}
                />
              ))}
            </>
          )}
        </ScrollView>

        <View
          style={[
            styles.composer,
            { backgroundColor: colors.surface, borderTopColor: colors.border, padding: spacing.md },
          ]}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Yeni görev ekle"
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={submit}
            returnKeyType="done"
            style={[
              styles.input,
              { backgroundColor: colors.background, color: colors.text, borderRadius: radius.sm, borderColor: colors.border },
            ]}
          />
          <Pressable
            onPress={submit}
            style={[styles.addButton, { backgroundColor: colors.tint, borderRadius: radius.sm }]}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TodoRow({
  todo,
  onToggle,
  onDelete,
}: {
  todo: TodoItem;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { colors, spacing, radius } = useAppTheme();
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          padding: spacing.md,
          marginBottom: spacing.sm,
          opacity: todo.done ? 0.65 : 1,
        },
      ]}
    >
      <Pressable onPress={onToggle} hitSlop={8}>
        <View
          style={[
            styles.checkbox,
            {
              borderColor: todo.done ? colors.success : colors.border,
              backgroundColor: todo.done ? colors.success : 'transparent',
            },
          ]}
        >
          {todo.done && <Ionicons name="checkmark" size={15} color="#fff" />}
        </View>
      </Pressable>
      <Pressable onPress={onToggle} style={styles.flex}>
        <Text
          style={[
            styles.todoTitle,
            { color: colors.text, textDecorationLine: todo.done ? 'line-through' : 'none' },
          ]}
        >
          {todo.title}
        </Text>
      </Pressable>
      <Pressable onPress={onDelete} hitSlop={8}>
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  composer: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  addButton: {
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 44,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
