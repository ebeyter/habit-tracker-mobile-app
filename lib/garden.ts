import { dayKey } from './date';
import type { Goal } from './types';

export type GrowthStage = 'seed' | 'sprout' | 'seedling' | 'budding' | 'blooming';
export type TreeSpecies = 'oak' | 'pine' | 'blossom';

export const STAGE_LABEL: Record<GrowthStage, string> = {
  seed: 'Tohum',
  sprout: 'Filiz',
  seedling: 'Fidan',
  budding: 'Tomurcuk',
  blooming: 'Çiçekte',
};

/** Completions banked at each stage; the last entry is also the cost of one full tree. */
const STAGES: { stage: GrowthStage; at: number }[] = [
  { stage: 'seed', at: 0 },
  { stage: 'sprout', at: 1 },
  { stage: 'seedling', at: 3 },
  { stage: 'budding', at: 6 },
  { stage: 'blooming', at: 10 },
];

/** Completions needed for one sapling to mature into a tree and move to the forest. */
export const COMPLETIONS_PER_TREE = STAGES[STAGES.length - 1].at;

/** Every completion the user has ever logged, across habits and one-time goals. */
export function totalCompletions(goals: Goal[]): number {
  let total = 0;
  for (const goal of goals) {
    if (goal.kind === 'recurring') total += goal.completedDates.length;
    else if (goal.status === 'completed') total += 1;
  }
  return total;
}

export type SaplingState = {
  stage: GrowthStage;
  /** Completions banked toward the current tree */
  progress: number;
  /** Completions needed to finish the current tree */
  goal: number;
  /** 0..1 toward the next tree */
  ratio: number;
  /** Completions still needed for the next stage, or null when the tree is ready */
  toNextStage: number | null;
  /** How many completed trees the forest holds */
  trees: number;
};

export function saplingState(goals: Goal[]): SaplingState {
  const total = totalCompletions(goals);
  const trees = Math.floor(total / COMPLETIONS_PER_TREE);
  const progress = total % COMPLETIONS_PER_TREE;

  let stage: GrowthStage = 'seed';
  for (const s of STAGES) if (progress >= s.at) stage = s.stage;

  const next = STAGES.find((s) => s.at > progress);

  return {
    stage,
    progress,
    goal: COMPLETIONS_PER_TREE,
    ratio: progress / COMPLETIONS_PER_TREE,
    toNextStage: next ? next.at - progress : null,
    trees,
  };
}

/** Trees the user planted, plus the starter grove the forest opens with. */
export const STARTER_TREES: TreeSpecies[] = ['oak', 'pine'];

const SPECIES_CYCLE: TreeSpecies[] = ['blossom', 'oak', 'pine'];

export function forestTrees(goals: Goal[]): TreeSpecies[] {
  const earned = saplingState(goals).trees;
  const grown = Array.from({ length: earned }, (_, i) => SPECIES_CYCLE[i % SPECIES_CYCLE.length]);
  return [...STARTER_TREES, ...grown];
}

export function didCompleteToday(goal: Goal): boolean {
  return goal.kind === 'recurring'
    ? goal.completedDates.includes(dayKey(new Date()))
    : goal.status === 'completed';
}
