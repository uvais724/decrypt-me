import { supabase } from './supabaseClient';

const buildPairFilter = (uid1, uid2) =>
  `and(user_one.eq.${uid1},user_two.eq.${uid2}),and(user_one.eq.${uid2},user_two.eq.${uid1})`;

export async function fetchPairCurrentScore(uid1, uid2) {
  const { data, error } = await supabase
    .from('user_pair_scores')
    .select('current_score')
    .or(buildPairFilter(uid1, uid2))
    .limit(1)
    .maybeSingle();

  if (!error) {
    const rawScore = data?.current_score ?? data?.current_scores ?? 0;
    const numericScore = Number(rawScore);
    return Number.isFinite(numericScore) ? numericScore : 0;
  }

  return 0;
}

export async function incrementPairScoreWithPrevious(uid1, uid2, inc = 1) {
  const previousScore = await fetchPairCurrentScore(uid1, uid2);

  const { error } = await supabase.rpc('increment_pair_score', {
    uid1,
    uid2,
    inc
  });

  if (error) throw error;

  return {
    previousScore,
    currentScore: previousScore + inc,
    incrementBy: inc
  };
}
