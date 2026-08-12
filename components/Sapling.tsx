import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { STAGE_LABEL, type GrowthStage, type SaplingState } from '@/lib/garden';

// Generated via scripts/generate-plant-art.mjs (fal.ai, dev-time only — no runtime API calls).
const STAGE_ART: Record<GrowthStage, ImageSourcePropType> = {
  seed: require('@/assets/plants/seed.png'),
  sprout: require('@/assets/plants/sprout.png'),
  seedling: require('@/assets/plants/seedling.png'),
  budding: require('@/assets/plants/budding.png'),
  blooming: require('@/assets/plants/blooming.png'),
};

export function Sapling({ state }: { state: SaplingState }) {
  const { colors, spacing } = useAppTheme();

  const pop = useRef(new Animated.Value(0)).current;
  const previous = useRef(state.progress);

  // A small pop each time the sapling gains growth, so progress feels physical.
  useEffect(() => {
    if (state.progress !== previous.current) {
      pop.setValue(0);
      Animated.sequence([
        Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 3 }),
        Animated.spring(pop, { toValue: 0, useNativeDriver: true, friction: 4 }),
      ]).start();
    }
    previous.current = state.progress;
  }, [state.progress, pop]);

  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  const caption =
    state.toNextStage === null
      ? 'Ağaç olmaya hazır — bir tamamlama daha ve ormana taşınıyor 🌳'
      : `Bir sonraki aşamaya ${state.toNextStage} tamamlama`;

  return (
    <View style={[styles.wrap, { paddingTop: spacing.sm }]}>
      <Animated.Image
        source={STAGE_ART[state.stage]}
        style={[styles.art, { transform: [{ scale }] }]}
        resizeMode="contain"
      />

      <Text style={[styles.stage, { color: colors.text }]}>{STAGE_LABEL[state.stage]}</Text>
      <Text style={[styles.caption, { color: colors.textMuted }]}>{caption}</Text>

      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.fill,
            { width: `${Math.max(3, state.ratio * 100)}%`, backgroundColor: colors.tint },
          ]}
        />
      </View>
      <Text style={[styles.counter, { color: colors.textMuted }]}>
        {state.progress}/{state.goal} · ormanda {state.trees} ağacın var
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  art: {
    width: 150,
    height: 150,
  },
  stage: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  caption: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  track: {
    alignSelf: 'stretch',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 12,
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  counter: {
    fontSize: 11,
    marginTop: 6,
  },
});
