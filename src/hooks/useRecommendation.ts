import { useState, useEffect } from 'react';
import { Meal, AppState } from '../types';
import { recommendMeal } from '../core/engine';
import { useAppStore } from '../store';
import rawMenusData from '../data/menus.json';

const menusData = rawMenusData as unknown as Meal[];

export function useRecommendation(state: AppState) {
  const { user, mealLogs } = useAppStore();
  const [recommendation, setRecommendation] = useState<{ meal: Meal; reason: string } | null>(null);

  useEffect(() => {
    const availableMeals = menusData.filter((meal: Meal) => !user.dislikes.includes(meal.name));
    const rec = recommendMeal(availableMeals, state, mealLogs);
    setRecommendation(rec);
  }, [JSON.stringify(state), user.dislikes.join(','), JSON.stringify(mealLogs)]);

  const regenerate = () => {
    const availableMeals = menusData.filter((meal: Meal) => !user.dislikes.includes(meal.name));
    const randomState = { ...state, intent: 'random' as const };
    const rec = recommendMeal(availableMeals, randomState, mealLogs);
    setRecommendation(rec);
  };

  return { recommendation, regenerate };
}