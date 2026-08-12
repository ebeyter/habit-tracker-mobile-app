import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { categoryColor } from '@/lib/categories';
import { plantStateFor, STAGE_LABEL, type GrowthStage } from '@/lib/garden';
import type { Goal } from '@/lib/types';

// Generated via scripts/generate-plant-art.mjs (fal.ai, dev-time only — no runtime API calls).
const PLANT_ART: Record<GrowthStage, ImageSourcePropType> = {
  seed: require('@/assets/plants/seed.png'),
  sprout: require('@/assets/plants/sprout.png'),
  seedling: require('@/assets/plants/seedling.png'),
  budding: require('@/assets/plants/budding.png'),
  blooming: require('@/assets/plants/blooming.png'),
  wilted: require('@/assets/plants/wilted.png'),
};

type Props = {
  goal: Goal;
  onPress: () => void;
  onLongPress: () => void;
};

export function PlantTile({ goal, onPress, onLongPress }: Props) {
  const { colors, radius } = useAppTheme();
  const state = plantStateFor(goal);
  const accent = categoryColor(goal.category);

  const grow = useRef(new Animated.Value(0)).current;
  const previousGrowth = useRef(state.growth);

  // A small pop whenever the plant gains growth, so watering it feels physical.
  useEffect(() => {
    if (state.growth > previousGrowth.current) {
      grow.setValue(0);
      Animated.sequence([
        Animated.spring(grow, { toValue: 1, useNativeDriver: true, friction: 3 }),
        Animated.spring(grow, { toValue: 0, useNativeDriver: true, friction: 4 }),
      ]).start();
    }
    previousGrowth.current = state.growth;
  }, [state.growth, grow]);

  const scale = grow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });
  const needsAttention = state.dueToday && !state.doneToday;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderColor: needsAttention ? accent : 'transparent',
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {/* The generated art sits on a white plate, so the tile gives it a light "pot shelf"
          to sit on rather than letting a white square float on the dark background. */}
      <View style={[styles.plantWrap, { borderRadius: radius.md }]}>
        <Animated.Image
          source={PLANT_ART[state.stage]}
          style={[styles.plant, { transform: [{ scale }] }]}
          resizeMode="contain"
        />
        {state.doneToday && (
          <View style={[styles.tick, { backgroundColor: colors.success }]}>
            <Text style={styles.tickText}>✓</Text>
          </View>
        )}
      </View>

      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {goal.title}
      </Text>

      <Text style={[styles.stage, { color: state.stage === 'wilted' ? colors.warning : accent }]}>
        {STAGE_LABEL[state.stage]}
        {state.nextAt !== null && state.stage !== 'wilted' ? ` · ${state.growth}/${state.nextAt}` : ''}
      </Text>

      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.fill,
            { width: `${Math.min(100, Math.max(4, state.progress * 100))}%`, backgroundColor: accent },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    padding: 12,
    borderWidth: 2,
    gap: 8,
  },
  plantWrap: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#FBFAFF',
  },
  plant: {
    width: '104%',
    height: '104%',
  },
  tick: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  stage: {
    fontSize: 11,
    fontWeight: '700',
  },
  track: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
