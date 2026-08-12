import { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGoals } from '@/context/GoalsContext';
import { useAppTheme } from '@/hooks/use-app-theme';
import {
  COMPLETIONS_PER_TREE,
  forestTrees,
  saplingState,
  STARTER_TREES,
  type TreeSpecies,
} from '@/lib/garden';

// Generated via scripts/generate-plant-art.mjs (fal.ai, dev-time only — no runtime API calls).
const TREE_ART: Record<TreeSpecies, ImageSourcePropType> = {
  oak: require('@/assets/plants/tree-oak.png'),
  pine: require('@/assets/plants/tree-pine.png'),
  blossom: require('@/assets/plants/tree-blossom.png'),
};

export default function ForestScreen() {
  const { colors, spacing, radius } = useAppTheme();
  const { goals } = useGoals();

  const trees = useMemo(() => forestTrees(goals), [goals]);
  const state = useMemo(() => saplingState(goals), [goals]);
  const earned = trees.length - STARTER_TREES.length;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        <Text style={[styles.title, { color: colors.text }]}>Ormanım</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {earned === 0
            ? `İlk ağacına ${COMPLETIONS_PER_TREE - state.progress} tamamlama kaldı`
            : `${earned} ağaç diktin · toplam ${trees.length} ağaç`}
        </Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.grove,
            { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md },
          ]}
        >
          {trees.map((species, index) => {
            const isStarter = index < STARTER_TREES.length;
            return (
              <View key={`${species}-${index}`} style={styles.treeCell}>
                <Image
                  source={TREE_ART[species]}
                  style={[styles.tree, isStarter && styles.starterTree]}
                  resizeMode="contain"
                />
                <Text style={[styles.treeLabel, { color: colors.textMuted }]}>
                  {isStarter ? 'Başlangıç' : `${index - STARTER_TREES.length + 1}. ağacın`}
                </Text>
              </View>
            );
          })}
        </View>

        <View
          style={[
            styles.progressCard,
            { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md },
          ]}
        >
          <Text style={[styles.progressTitle, { color: colors.text }]}>Büyüyen fidanın</Text>
          <View style={[styles.track, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.fill,
                { width: `${Math.max(3, state.ratio * 100)}%`, backgroundColor: colors.tint },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textMuted }]}>
            {state.progress}/{state.goal} tamamlama · her {COMPLETIONS_PER_TREE} tamamlama bir ağaç
          </Text>
        </View>

        <Text style={[styles.note, { color: colors.textMuted }]}>
          Hedeflerini tamamladıkça bahçendeki fidan büyür; olgunlaşınca buraya taşınır ve yerine yeni
          bir fidan diker.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  grove: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  treeCell: {
    width: '33%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tree: {
    width: 88,
    height: 88,
  },
  // Starter trees are the grove the user is handed, dimmed so earned ones stand out.
  starterTree: {
    opacity: 0.55,
  },
  treeLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  progressCard: {
    gap: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
  },
  note: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 16,
    textAlign: 'center',
  },
});
