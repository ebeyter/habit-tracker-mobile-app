import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGoals } from '@/context/GoalsContext';
import { useAppTheme } from '@/hooks/use-app-theme';
import { buildReport, type ReportRange } from '@/lib/reports';

export default function ReportsScreen() {
  const { colors, spacing, radius } = useAppTheme();
  const { goals, streak, categories } = useGoals();
  const [range, setRange] = useState<ReportRange>('week');

  const report = useMemo(() => buildReport(goals, categories, range), [goals, categories, range]);
  const maxCount = Math.max(1, ...report.days.map((d) => d.count));
  const consistency = Math.round((report.activeDays / report.totalDays) * 100);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        <Text style={[styles.title, { color: colors.text }]}>Rapor</Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.segmented, { backgroundColor: colors.border, borderRadius: radius.pill }]}>
          {(['week', 'month'] as ReportRange[]).map((r) => {
            const active = range === r;
            return (
              <Pressable
                key={r}
                onPress={() => setRange(r)}
                style={[
                  styles.segment,
                  { borderRadius: radius.pill, backgroundColor: active ? colors.surface : 'transparent' },
                ]}
              >
                <Text style={[styles.segmentText, { color: active ? colors.text : colors.textMuted }]}>
                  {r === 'week' ? 'Haftalık' : 'Aylık'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.statRow, { marginTop: spacing.lg, gap: spacing.sm }]}>
          <StatTile label="Aktif Gün" value={`${report.activeDays}/${report.totalDays}`} color={colors.tint} />
          <StatTile label="Tamamlama" value={String(report.totalCompletions)} color={colors.success} />
          <StatTile label="Tutarlılık" value={`%${consistency}`} color={colors.streak} />
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>Günlük Aktivite</Text>
          <View style={styles.chart}>
            {report.days.map((d) => (
              <View key={d.key} style={styles.barCol}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${Math.max(4, (d.count / maxCount) * 100)}%`,
                      backgroundColor: d.count > 0 ? colors.tint : colors.border,
                    },
                  ]}
                />
                {range === 'week' && (
                  <Text style={[styles.barLabel, { color: colors.textMuted }]}>{d.label}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>Seri</Text>
          <Text style={[styles.streakLine, { color: colors.textMuted }]}>
            Güncel: <Text style={{ color: colors.streak, fontWeight: '800' }}>{streak.currentStreak}</Text> gün ·
            En iyi: <Text style={{ color: colors.tint, fontWeight: '800' }}>{streak.bestStreak}</Text> gün
          </Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>Kategori Dağılımı</Text>
          {report.byCategory.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              Bu dönemde henüz tamamlama yok.
            </Text>
          ) : (
            report.byCategory.map((c) => {
              const share = c.count / report.totalCompletions;
              return (
                <View key={c.category} style={styles.categoryRow}>
                  <Text style={[styles.categoryLabel, { color: colors.text }]}>
                    {c.emoji} {c.label}
                  </Text>
                  <View style={[styles.categoryTrack, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.categoryFill,
                        { width: `${share * 100}%`, backgroundColor: colors.tint },
                      ]}
                    />
                  </View>
                  <Text style={[styles.categoryCount, { color: colors.textMuted }]}>{c.count}</Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({ label, value, color }: { label: string; value: string; color: string }) {
  const { colors, radius, spacing } = useAppTheme();
  return (
    <View
      style={[
        styles.statTile,
        { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
      ]}
    >
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  segmented: {
    flexDirection: 'row',
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statRow: {
    flexDirection: 'row',
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  card: {},
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 4,
  },
  barCol: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
  },
  bar: {
    width: '100%',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 9,
  },
  streakLine: {
    fontSize: 14,
  },
  empty: {
    fontSize: 13,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    width: 90,
  },
  categoryTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: '700',
    width: 24,
    textAlign: 'right',
  },
});
