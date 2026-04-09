import {
  AppState,
  GogodangSuitability,
  Meal,
  MealLog,
  RecommendationResult,
  Restaurant,
  RestaurantRecommendation,
  SelectedMenu,
} from '../types';
import { withParticle } from '../utils/korean';

const LATE_NIGHT_PRIORITY_IDS = new Set([
  'kimbap',
  'tuna_kimbap',
  'gimbap_combo',
  'ramyeon',
  'udon',
  'fishcake_udon',
  'mandu_soup',
  'egg_soup_rice',
  'vegetable_porridge',
  'abalone_porridge',
  'beef_porridge',
  'juk',
  'sandwich',
  'egg_sandwich',
  'toast',
  'cup_salad_combo',
  'yogurt_bowl',
  'oatmeal',
  'fried_rice',
  'toast_sand_combo',
  'tuna_rice_ball',
]);

const LATE_NIGHT_DEPRIORITY_IDS = new Set([
  'kalguksu',
  'rice_soup',
  'suyuk_gukbap',
  'meat_noodle',
  'bulgogi',
  'samgyetang',
  'simple_bowl',
]);

const GOGODANG_BLOCKED_IDS = new Set([
  'ramyeon',
  'pork_cutlet',
  'rose_pasta',
  'jajang_rice',
  'convenience_store_kimbap_set',
]);

const GOGODANG_CAUTION_IDS = new Set([
  'rice_soup',
  'kalguksu',
  'udon',
  'fishcake_udon',
  'kimchi_stew',
  'soybean_paste_stew',
  'suyuk_gukbap',
  'cold_soba',
  'naengmyeon',
  'spicy_pork_bowl',
  'bulgogi',
  'dakgalbi',
  'curry_rice',
  'omurice',
  'fried_rice',
  'steak_bowl',
  'deopbap',
  'donburi',
  'mandu_soup',
  'banquet_noodles',
  'meat_noodle',
]);

const BLOCKED_KEYWORDS = ['설탕', '시럽', '연유', '쨈', '잼', '꿀', '햄', '소시지', '베이컨', '어묵', '쯔유'];
const CAUTION_KEYWORDS = ['간장', '된장', '고추장', '쌈장', '사골육수', '멸치육수', '가쓰오 육수', '소금', '드레싱', '찹쌀'];

export function recommendMeal(
  meals: Meal[],
  state: AppState,
  mealLogs: MealLog[] = [],
  excludedMealIds: string[] = []
): RecommendationResult {
  const availableMeals = meals.filter((meal) => !excludedMealIds.includes(meal.id));
  const gogodangPools = state.goal === 'gogodang' ? getGogodangCandidatePools(availableMeals) : null;
  const candidateMeals = gogodangPools
    ? gogodangPools.allowed.length >= 3
      ? gogodangPools.allowed
      : [...gogodangPools.allowed, ...gogodangPools.caution]
    : availableMeals;

  if (candidateMeals.length === 0) {
    const fallback = meals[0];
    return {
      meal: fallback,
      reason: '지금은 이 메뉴로 바로 결정하는 게 제일 빨라요.',
      modeHint: '후보를 다 썼어요. 이 메뉴로 마무리할 수 있게 준비했어요.',
    };
  }

  const recentMealIds = mealLogs
    .slice()
    .sort((a, b) => new Date(b.eatenAt).getTime() - new Date(a.eatenAt).getTime())
    .slice(0, 5)
    .map((log) => log.mealId);

  const scored = candidateMeals
    .map((meal) => {
      let score = 0;
      const suitability = state.goal === 'gogodang' ? getGogodangSuitability(meal) : null;

      if (meal.suitableTimes.includes(state.time)) {
        score += 18;
      } else {
        score -= 8;
      }

      if (state.time === 'late') {
        if (LATE_NIGHT_PRIORITY_IDS.has(meal.id)) score += 18;
        if (LATE_NIGHT_DEPRIORITY_IDS.has(meal.id)) score -= 28;
        if (meal.weight === 'light') score += 10;
        if (meal.tags.includes('convenient')) score += 8;
        if (meal.tags.includes('quick')) score += 6;
        if (meal.weight === 'heavy' && meal.form === 'soup') score -= 24;
        if (meal.weight === 'heavy') score -= 14;
      }

      if (meal.goalFit.includes(state.goal)) score += 30;
      if (meal.conditions.includes(state.condition)) score += 16;
      if (state.diningType === 'solo' && meal.soloFriendly) score += 10;
      if (state.weather === 'cold' && meal.temperature === 'hot') score += 6;
      if (state.weather === 'hot' && meal.temperature !== 'hot') score += 6;
      if (state.goal === 'gogodang') {
        if (suitability === 'allowed') score += 22;
        if (suitability === 'caution') score -= 10;
        if (meal.lowSugar) score += 6;
        if (meal.lowSodium) score += 6;
        if (meal.lowFat) score += 4;
        if (meal.proteinFocused) score += 8;
      }

      if (recentMealIds.includes(meal.id)) score -= 16;
      if (state.condition === 'quick' && meal.tags.includes('quick')) score += 8;
      if (state.condition === 'cozy' && meal.form === 'soup') score += 8;
      if (state.condition === 'fresh' && meal.temperature !== 'hot') score += 6;
      if (state.condition === 'protein' && meal.proteinFocused) score += 8;

      return { meal, score };
    })
    .sort((a, b) => b.score - a.score);

  const picked = scored[0];
  return {
    meal: picked.meal,
    reason: buildMealReason(picked.meal, state),
    modeHint: buildModeHint(picked.meal, state),
  };
}

function buildMealReason(meal: Meal, state: AppState) {
  const mealWithTopic = withParticle(meal.name, 'topic');

  if (state.goal === 'gogodang') {
    return `${mealWithTopic} 당류와 짠 양념 부담을 비교적 덜 걱정해도 되는 쪽이라 먼저 골라봤어요.`;
  }
  if (state.condition === 'quick') {
    return `${mealWithTopic} 오래 고민하지 않고 바로 고르기 좋은 메뉴예요.`;
  }
  if (state.condition === 'cozy') {
    return `${mealWithTopic} 지금처럼 편하게 마무리하고 싶을 때 잘 맞아요.`;
  }
  if (state.condition === 'protein') {
    return `${mealWithTopic} 단백질 중심으로 한 끼를 정리하기 좋아요.`;
  }
  return `${meal.name}으로 오늘 한 끼를 끝내기 좋게 골라봤어요.`;
}

function buildModeHint(meal: Meal, state: AppState) {
  if (state.goal === 'gogodang') {
    return '당류·나트륨이 강한 재료와 양념은 보수적으로 덜어낸 쪽으로 보여드릴게요.';
  }
  if (meal.shoppingList.length > 0) {
    return '결정하면 바로 장보기 리스트까지 이어서 볼 수 있어요.';
  }
  return '후보를 늘리지 않고 바로 결정할 수 있게 준비했어요.';
}

function containsAnyKeyword(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

function getMealSearchBlob(meal: Meal) {
  const parts = [
    meal.name,
    ...meal.tags,
    ...meal.restaurantSearchTerms,
    ...meal.shoppingList.flatMap((item) => [
      item.name,
      item.note ?? '',
      item.gogodangAlternative ?? '',
    ]),
  ];

  return parts.join(' ').toLowerCase();
}

function getGogodangSuitability(meal: Meal): GogodangSuitability {
  if (meal.gogodangSuitability) {
    return meal.gogodangSuitability;
  }

  if (GOGODANG_BLOCKED_IDS.has(meal.id)) {
    return 'blocked';
  }

  const searchBlob = getMealSearchBlob(meal);

  if (containsAnyKeyword(searchBlob, BLOCKED_KEYWORDS)) {
    return 'blocked';
  }

  if (GOGODANG_CAUTION_IDS.has(meal.id)) {
    return 'caution';
  }

  if (containsAnyKeyword(searchBlob, CAUTION_KEYWORDS)) {
    return 'caution';
  }

  if (!meal.lowSugar || !meal.lowSodium || !meal.lowFat) {
    return 'caution';
  }

  return 'allowed';
}

function getGogodangCandidatePools(meals: Meal[]) {
  return meals.reduce(
    (acc, meal) => {
      const suitability = getGogodangSuitability(meal);

      if (suitability === 'allowed') {
        acc.allowed.push(meal);
      } else if (suitability === 'caution') {
        acc.caution.push(meal);
      }

      return acc;
    },
    { allowed: [] as Meal[], caution: [] as Meal[] },
  );
}

function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

export function recommendRestaurants(
  restaurants: Restaurant[],
  selectedMenu: SelectedMenu,
  coords: { latitude: number; longitude: number }
): RestaurantRecommendation[] {
  const candidates: Array<RestaurantRecommendation | null> = restaurants
    .filter((restaurant) => restaurant.merchantStatus === 'active')
    .map((restaurant) => {
      const matchedMenu = restaurant.menus.find(
        (menu) => menu.mealId === selectedMenu.mealId && menu.available
      );

      if (!matchedMenu) return null;

      const distanceKm = calculateDistanceKm(coords.latitude, coords.longitude, restaurant.lat, restaurant.lng);
      let score = 0;
      if (restaurant.isSubscribed) score += 100;
      score += 60;
      score += Math.max(0, 30 - distanceKm * 10);
      score += restaurant.rating * 2;

      return {
        restaurant: {
          ...restaurant,
          distanceKm,
        },
        matchedMenu,
        source: 'db',
        score,
        distanceKm,
        why: restaurant.isSubscribed
          ? '가입 매장 우선 조건과 메뉴 일치가 함께 반영됐어요.'
          : '선택한 메뉴와 일치하고 현재 위치에서도 가까운 편이에요.',
      };
    })
    ;

  return candidates
    .filter((item): item is RestaurantRecommendation => item !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
