import { useEffect, useMemo, useState } from 'react';
import { AppState, Meal, RecommendationResult } from '../types';
import { recommendMeal } from '../core/engine';
import { useAppStore } from '../store';
import rawMenusData from '../data/menus.json';

const menusData = rawMenusData as unknown as Meal[];

export function useRecommendation(state: AppState) {
  const { user, mealLogs, recommendationSession } = useAppStore();
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);

  const availableMeals = useMemo(
    () => menusData.filter((meal) => !user.dislikes.includes(meal.name)),
    [user.dislikes]
  );

  useEffect(() => {
    if (!recommendationSession.condition || recommendationSession.completedForTime === state.time) {
      setRecommendation(null);
      return;
    }

    const rec = recommendMeal(availableMeals, state, mealLogs, recommendationSession.recommendedMealIds);
    setRecommendation(rec);
  }, [
    availableMeals,
    mealLogs,
    recommendationSession.condition,
    recommendationSession.completedForTime,
    recommendationSession.recommendedMealIds,
    state,
  ]);

  const regenerate = () => {
    if (recommendationSession.completedForTime === state.time) {
      setRecommendation(null);
      return;
    }
    const rec = recommendMeal(availableMeals, state, mealLogs, recommendationSession.recommendedMealIds);
    setRecommendation(rec);
  };

  return { recommendation, regenerate, menus: availableMeals };
}
