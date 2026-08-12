import { useMemo } from 'react';
import { Image, ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ScreenHeader';
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
const MEADOW = require('@/assets/plants/forest-bg.png');
const BUSH = require('@/assets/plants/bush.png');
const ROCK = require('@/assets/plants/rock.png');

const SCENE_HEIGHT = 420;
/** Where the ground starts in the backdrop — trees are planted below this line. */
const HORIZON = 0.46;

/**
 * Deterministic scatter: trees planted later stand nearer the camera, so each row sits
 * lower, larger and more saturated than the one behind it. Keyed off the index so a
 * given tree keeps its spot between renders.
 */
function placement(index: number, total: number) {
  const perRow = 3;
  const row = Math.floor(index / perRow);
  const rows = Math.max(1, Math.ceil(total / perRow));
  const posInRow = index % perRow;

  // depth: 0 = furthest row, 1 = closest
  const depth = rows === 1 ? 0.65 : row / (rows - 1);

  const jitterX = ((index * 37) % 11) / 11 - 0.5; // stable pseudo-random nudge
  const jitterY = ((index * 53) % 7) / 7 - 0.5;

  const left = (posInRow + 0.5) / perRow + jitterX * 0.12;
  const bottomRatio = 0.04 + depth * 0.34 + jitterY * 0.03;
  const size = 58 + depth * 52;

  return {
    left: `${Math.min(88, Math.max(4, left * 100))}%` as const,
    bottom: (1 - HORIZON) * SCENE_HEIGHT * bottomRatio,
    size,
    opacity: 0.72 + depth * 0.28,
  };
}

export default function ForestScreen() {
  const { colors, spacing, radius } = useAppTheme();
  const { goals } = useGoals();

  const trees = useMemo(() => forestTrees(goals), [goals]);
  const state = useMemo(() => saplingState(goals), [goals]);
  const earned = trees.length - STARTER_TREES.length;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader
        title="Ormanım"
        subtitle={
          earned === 0
            ? `İlk ağacına ${COMPLETIONS_PER_TREE - state.progress} tamamlama kaldı`
            : `${earned} ağaç diktin · ormanda ${trees.length} ağaç`
        }
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground
          source={MEADOW}
          resizeMode="cover"
          style={[styles.scene, { borderRadius: radius.lg }]}
          imageStyle={{ borderRadius: radius.lg }}
        >
          {/* Props first so trees always overlap them */}
          <Image source={ROCK} style={[styles.prop, { left: '8%', bottom: 18, width: 34, height: 34 }]} />
          <Image source={BUSH} style={[styles.prop, { right: '10%', bottom: 12, width: 44, height: 44 }]} />
          <Image source={BUSH} style={[styles.prop, { left: '46%', bottom: 92, width: 28, height: 28, opacity: 0.8 }]} />

          {trees.map((species, index) => {
            const p = placement(index, trees.length);
            return (
              <Image
                key={`${species}-${index}`}
                source={TREE_ART[species]}
                resizeMode="contain"
                style={[
                  styles.tree,
                  { left: p.left, bottom: p.bottom, width: p.size, height: p.size, opacity: p.opacity },
                ]}
              />
            );
          })}
        </ImageBackground>

        <View
          style={[
            styles.progressCard,
            { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md },
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
          Hedeflerini tamamladıkça fidanın büyür; olgunlaşınca bu ormana dikilir ve yerine yeni bir
          fidan gelir. Ağaçların öne doğru sıralanır — en yenisi en önde.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scene: {
    height: SCENE_HEIGHT,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  tree: {
    position: 'absolute',
  },
  prop: {
    position: 'absolute',
    resizeMode: 'contain',
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
