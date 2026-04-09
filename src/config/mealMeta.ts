import { MealTime } from '../types';
import rawMenusData from '../data/menus.json';

type MealRecord = {
  id: string;
  name: string;
  restaurantSearchTerms?: string[];
};

const menusData = rawMenusData as MealRecord[];

export type MealIllustrationKey =
  | 'tofu_stew'
  | 'bibimbap'
  | 'salad'
  | 'rice_noodle'
  | 'kimbap'
  | 'bulgogi'
  | 'samgyetang'
  | 'rice_soup'
  | 'kalguksu'
  | 'fallback';

const mealNameMap = new Map(menusData.map((meal) => [meal.id, meal.name]));
const mealSearchTermsMap = new Map(
  menusData.map((meal) => [meal.id, meal.restaurantSearchTerms ?? [meal.name]])
);

const mealIllustrationMap: Record<string, MealIllustrationKey> = {
  tofu_stew: 'tofu_stew',
  bibimbap: 'bibimbap',
  salad: 'salad',
  rice_noodle: 'rice_noodle',
  kimbap: 'kimbap',
  bulgogi: 'bulgogi',
  samgyetang: 'samgyetang',
  rice_soup: 'rice_soup',
  kalguksu: 'kalguksu',
};

const timeBubbleMap: Record<MealTime, string[]> = {
  breakfast: [
    '가볍게 하루를 시작해볼 시간이에요.',
    '아침부터 너무 복잡하지 않게 골라볼까요.',
    '속을 깨우는 한 끼가 생각날 시간이에요.',
    '부담 없이 시작하기 좋은 메뉴를 챙겨볼게요.',
    '오늘 첫 끼를 상냥하게 정해볼까요.',
    '바쁜 아침에도 바로 고를 수 있게 준비했어요.',
  ],
  lunch: [
    '점심 메뉴를 고르기 좋은 시간이에요.',
    '슬슬 배고파질 시간이네요.',
    '후다닥 정해야 덜 바빠요.',
    '간식이 생각나기 전에 한 끼부터 정해볼까요.',
    '딱 점심 고민이 시작될 시간이에요.',
    '오늘 점심은 가볍게 결정해도 괜찮아요.',
    '지금 고르면 점심 시간이 한결 편해져요.',
  ],
  dinner: [
    '저녁 준비를 슬슬 시작할 시간이에요.',
    '장보기 전에 메뉴부터 정해볼까요.',
    '오늘 하루 마무리 한 끼를 골라볼까요.',
    '집에 가기 전에 저녁 그림을 먼저 잡아봐요.',
    '조금만 미리 정하면 저녁이 더 편해져요.',
    '오늘 저녁은 따뜻하게 마무리해볼까요.',
    '퇴근길에 메뉴를 정해두면 마음이 가벼워져요.',
  ],
  late: [
    '가볍게 마무리하기 좋은 시간이에요.',
    '야식이 생각날 수도 있는 시간이네요.',
    '늦은 시간엔 부담 없는 선택이 더 좋아요.',
    '지금은 편하게 한 끼를 정리해도 괜찮아요.',
    '늦었지만 든든함은 챙기고 싶을 때예요.',
    '간식이 생각날 시간이라 더 가볍게 골라볼게요.',
    '오늘을 차분하게 마무리할 메뉴를 찾아볼까요.',
  ],
};

export function getStandardMealName(mealId: string, fallback?: string) {
  return mealNameMap.get(mealId) ?? fallback ?? '오늘의 메뉴';
}

export function getMealIllustrationKey(mealId?: string | null): MealIllustrationKey {
  if (!mealId) return 'fallback';
  return mealIllustrationMap[mealId] ?? 'fallback';
}

export function getRandomTimeBubble(time: MealTime) {
  const items = timeBubbleMap[time];
  return items[Math.floor(Math.random() * items.length)];
}

function normalizeMealText(value: string) {
  return value.replace(/\s+/g, '').toLowerCase();
}

export function getMealSearchTerms(mealId: string) {
  return mealSearchTermsMap.get(mealId) ?? [getStandardMealName(mealId)];
}

export function isMealLabelConsistent(mealId: string, label?: string | null) {
  if (!label) return false;

  const normalizedLabel = normalizeMealText(label);
  const candidates = [getStandardMealName(mealId), ...getMealSearchTerms(mealId)];

  return candidates.some((candidate) => normalizedLabel.includes(normalizeMealText(candidate)));
}

export function sanitizeMealLabel(mealId: string, label?: string | null) {
  if (isMealLabelConsistent(mealId, label)) {
    return label ?? getStandardMealName(mealId);
  }

  return getStandardMealName(mealId);
}
