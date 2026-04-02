import { Meal, AppState } from '../types';

export interface MealLogEntry {
  mealId: string;
  eatenAt: Date;
  time?: string;
}

// ─── 점수 구성요소 ───────────────────────────────────────
interface ScoreBreakdown {
  time: number;
  goal: number;
  weather: number;
  dining: number;
  intent: number;
  recentPattern: number;
  repetitionPenalty: number;
  formDiversityBonus: number;
  tempDiversityBonus: number;
}

// ─── 공개 API ────────────────────────────────────────────
export function recommendMeal(
  meals: Meal[],
  state: AppState,
  mealLogs: MealLogEntry[] = []
): { meal: Meal; reason: string } {
  if (meals.length === 0) {
    return {
      meal: {
        id: 'none', name: '추천 없음', tags: [], temperature: 'normal',
        weight: 'medium', form: 'other', soloFriendly: true,
        dietFriendly: false, stimulation: 'mild', priceLevel: 'medium',
      },
      reason: '선택 가능한 메뉴가 없어요',
    };
  }

  const recentForms = getRecentForms(mealLogs, meals);
  const recentTemps = getRecentTemps(mealLogs, meals);

  const scored = meals.map(meal => {
    const bd = breakdown(meal, state, mealLogs, recentForms, recentTemps);
    return { meal, score: sum(bd), bd };
  });

  scored.sort((a, b) => b.score - a.score);

  // 상위 6개 중 지수 가중 랜덤 (1위 확률 ~45%, 2위 ~25%, ...)
  const topN = Math.min(6, scored.length);
  const pick = weightedRandom(scored.slice(0, topN));

  return {
    meal: pick.meal,
    reason: buildReason(pick.meal, state, mealLogs, pick.bd),
  };
}

// ─── 점수 계산 ────────────────────────────────────────────
function breakdown(
  meal: Meal,
  state: AppState,
  logs: MealLogEntry[],
  recentForms: string[],
  recentTemps: string[]
): ScoreBreakdown {
  return {
    time:               scoreTime(meal, state.time),
    goal:               scoreGoal(meal, state.goal),
    weather:            scoreWeather(meal, state.weather),
    dining:             scoreDining(meal, state.diningType),
    intent:             state.intent ? scoreIntent(meal, state.intent) : 0,
    recentPattern:      scoreRecentPattern(meal, state.recentMeals),
    repetitionPenalty:  penaltyRepetition(meal, logs),
    formDiversityBonus: bonusFormDiversity(meal, recentForms),
    tempDiversityBonus: bonusTempDiversity(meal, recentTemps),
  };
}

function sum(bd: ScoreBreakdown): number {
  return Object.values(bd).reduce((a, b) => a + b, 0);
}

// ─── 시간대 ──────────────────────────────────────────────
function scoreTime(meal: Meal, time: string): number {
  switch (time) {
    case 'breakfast':
      if (meal.weight === 'heavy') return -10;
      if (meal.tags.includes('quick') || meal.tags.includes('convenient')) return 12;
      if (meal.weight === 'light') return 10;
      return 3;

    case 'lunch':
      if (meal.weight === 'medium') return 10;
      if (meal.form === 'rice') return 8;
      if (meal.form === 'soup' && meal.weight !== 'heavy') return 7;
      if (meal.weight === 'heavy') return 4;
      return 5;

    case 'dinner':
      if (meal.tags.includes('protein')) return 10;
      if (meal.weight === 'heavy') return 8;
      if (meal.weight === 'medium') return 7;
      return 4;

    case 'late':
      if (meal.weight === 'heavy') return -14;
      if (meal.weight === 'light') return 14;
      if (meal.tags.includes('comfort')) return 6;
      return 3;

    default:
      return 4;
  }
}

// ─── 목표 ────────────────────────────────────────────────
function scoreGoal(meal: Meal, goal: string): number {
  switch (goal) {
    case 'diet':
      if (!meal.dietFriendly) return -12;
      if (meal.weight === 'light' && meal.tags.includes('healthy')) return 15;
      if (meal.weight === 'light') return 12;
      if (meal.dietFriendly) return 8;
      return 0;

    case 'balance':
      if (meal.tags.includes('balanced')) return 12;
      if (meal.tags.includes('healthy')) return 8;
      if (meal.weight === 'medium') return 6;
      if (meal.weight === 'heavy' && !meal.tags.includes('protein')) return -3;
      return 3;

    case 'free':
      return 4;

    default:
      return 3;
  }
}

// ─── 날씨 ────────────────────────────────────────────────
function scoreWeather(meal: Meal, weather: string): number {
  switch (weather) {
    case 'rain':
      if (meal.form === 'soup' && meal.temperature === 'hot') return 16;
      if (meal.temperature === 'hot') return 8;
      if (meal.tags.includes('comfort')) return 6;
      if (meal.temperature === 'cold') return -8;
      return 3;

    case 'cold':
      if (meal.temperature === 'hot' && meal.form === 'soup') return 14;
      if (meal.temperature === 'hot') return 10;
      if (meal.temperature === 'cold') return -12;
      return 4;

    case 'hot':
      if (meal.temperature === 'cold') return 14;
      if (meal.weight === 'light' && meal.temperature !== 'hot') return 10;
      if (meal.temperature === 'hot' && meal.weight === 'heavy') return -12;
      if (meal.temperature === 'hot') return -4;
      return 4;

    default: // normal
      return 4;
  }
}

// ─── 식사 상황 ───────────────────────────────────────────
function scoreDining(meal: Meal, type: string): number {
  switch (type) {
    case 'solo':
      return meal.soloFriendly ? 10 : -10;
    case 'group':
      return !meal.soloFriendly ? 12 : 3;
    case 'pair':
      // 혼밥 불가 메뉴 살짝 선호, 혼밥 가능은 중립
      return !meal.soloFriendly ? 8 : 4;
    default:
      return 4;
  }
}

// ─── 의도 ────────────────────────────────────────────────
function scoreIntent(meal: Meal, intent: string): number {
  switch (intent) {
    case 'light':
      if (meal.weight === 'light') return 18;
      if (meal.weight === 'heavy') return -15;
      return 0;
    case 'heavy':
      if (meal.weight === 'heavy') return 18;
      if (meal.weight === 'light') return -10;
      return 0;
    case 'cheap':
      if (meal.priceLevel === 'cheap') return 18;
      if (meal.priceLevel === 'expensive') return -15;
      return 0;
    case 'no_soup':
      return meal.form !== 'soup' ? 18 : -18;
    case 'random':
      return (Math.random() - 0.3) * 25;
    default:
      return 0;
  }
}

// ─── 최근 패턴 ───────────────────────────────────────────
function scoreRecentPattern(meal: Meal, recent: string[]): number {
  let score = 0;
  if (recent.includes('heavy_recent')) {
    score += meal.weight === 'heavy' ? -12 : meal.weight === 'light' ? 12 : 5;
  }
  if (recent.includes('carb_recent')) {
    score += (meal.form === 'rice' || meal.form === 'noodle') ? -8 : 8;
  }
  if (recent.includes('spicy_recent')) {
    score += meal.stimulation === 'spicy' ? -10 : meal.stimulation === 'mild' ? 10 : 3;
  }
  if (recent.includes('balanced')) {
    score += meal.tags.includes('balanced') ? -4 : 0; // 균형식 연속 약간 감점
  }
  return score;
}

// ─── 반복 패널티 (최근 7끼 기준) ────────────────────────
function penaltyRepetition(meal: Meal, logs: MealLogEntry[]): number {
  const recent = logs
    .slice()
    .sort((a, b) => new Date(b.eatenAt).getTime() - new Date(a.eatenAt).getTime())
    .slice(0, 7)
    .map(l => l.mealId);

  if (recent[0] === meal.id || recent[1] === meal.id) return -30; // 직전 2끼 동일 강하게 억제
  const occurrences = recent.filter(id => id === meal.id).length;
  if (occurrences >= 2) return -18;
  if (occurrences === 1) return -8;
  return 0;
}

// ─── 다양성 보너스: form ─────────────────────────────────
function bonusFormDiversity(meal: Meal, recentForms: string[]): number {
  if (recentForms.length === 0) return 0;
  const sameCount = recentForms.filter(f => f === meal.form).length;
  if (sameCount >= 3) return -10;
  if (sameCount === 0) return 8;
  if (sameCount === 1) return 4;
  return 0;
}

// ─── 다양성 보너스: temperature ─────────────────────────
function bonusTempDiversity(meal: Meal, recentTemps: string[]): number {
  if (recentTemps.length === 0) return 0;
  const sameCount = recentTemps.filter(t => t === meal.temperature).length;
  if (sameCount >= 3) return -8;
  if (sameCount === 0) return 6;
  return 0;
}

// ─── 유틸: 최근 로그에서 form/temp 추출 ─────────────────
function getRecentForms(logs: MealLogEntry[], meals: Meal[]): string[] {
  return logs
    .slice()
    .sort((a, b) => new Date(b.eatenAt).getTime() - new Date(a.eatenAt).getTime())
    .slice(0, 5)
    .reduce<string[]>((acc, log) => {
      const form = meals.find(m => m.id === log.mealId)?.form;
      if (form) acc.push(form);
      return acc;
    }, []);
}

function getRecentTemps(logs: MealLogEntry[], meals: Meal[]): string[] {
  return logs
    .slice()
    .sort((a, b) => new Date(b.eatenAt).getTime() - new Date(a.eatenAt).getTime())
    .slice(0, 5)
    .reduce<string[]>((acc, log) => {
      const temp = meals.find(m => m.id === log.mealId)?.temperature;
      if (temp) acc.push(temp);
      return acc;
    }, []);
}

// ─── 가중 랜덤 ───────────────────────────────────────────
function weightedRandom<T extends { score: number }>(candidates: T[]): T {
  const min = candidates[candidates.length - 1].score;
  const weights = candidates.map(c => Math.pow(2.8, (c.score - min) / 10));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i];
  }
  return candidates[0];
}

// ─── 이유 생성 ────────────────────────────────────────────
function buildReason(
  meal: Meal,
  state: AppState,
  logs: MealLogEntry[],
  bd: ScoreBreakdown
): string {
  const n = meal.name;
  const pool: string[] = [];

  // 날씨 + 메뉴 형태
  if (state.weather === 'rain' && meal.form === 'soup') {
    pool.push(`비 오는 날엔 역시 국물이지, ${n} 한 그릇 딱이야`);
    pool.push(`빗소리 들으면서 ${n} 먹으면 진짜 좋아`);
  }
  if (state.weather === 'rain' && meal.temperature === 'hot' && meal.form !== 'soup') {
    pool.push(`비 오는 날엔 따뜻한 게 당기잖아, ${n} 어때`);
  }
  if (state.weather === 'cold' && meal.temperature === 'hot' && meal.form === 'soup') {
    pool.push(`이 추위엔 뜨끈한 ${n} 한 그릇으로 몸 녹여`);
    pool.push(`추운 날 ${n}만큼 속 따뜻하게 해주는 게 없어`);
  }
  if (state.weather === 'cold' && meal.temperature === 'hot' && meal.form !== 'soup') {
    pool.push(`추울수록 따뜻한 게 최고야, ${n} 어때`);
  }
  if (state.weather === 'hot' && meal.temperature === 'cold') {
    pool.push(`더운 날엔 시원한 ${n}이 딱이야`);
    pool.push(`이 더위에 ${n} 한 입 하면 살 것 같아`);
  }
  if (state.weather === 'hot' && meal.weight === 'light') {
    pool.push(`더울 때는 무거운 거 먹으면 힘들어, ${n}으로 가볍게 가자`);
  }

  // 시간대
  if (state.time === 'late' && meal.weight === 'light') {
    pool.push(`야식은 ${n}처럼 가볍게 가야 다음 날 후회 없어`);
    pool.push(`이 시간엔 부담 없는 ${n}이 최고야`);
  }
  if (state.time === 'late' && meal.tags.includes('comfort')) {
    pool.push(`늦은 밤에 ${n}이면 기분도 풀리잖아`);
  }
  if (state.time === 'breakfast' && meal.weight === 'light') {
    pool.push(`아침엔 ${n}처럼 가볍게 시작하는 게 오히려 하루가 더 잘 돌아가`);
  }
  if (state.time === 'breakfast' && meal.tags.includes('quick')) {
    pool.push(`아침에 빠르게 해결하려면 ${n}이 딱이야`);
  }
  if (state.time === 'dinner' && meal.tags.includes('protein')) {
    pool.push(`저녁엔 ${n}으로 단백질 챙겨, 하루 마무리가 달라`);
  }
  if (state.time === 'dinner' && meal.weight === 'heavy') {
    pool.push(`저녁이니까 ${n}으로 든든하게 채워도 돼`);
  }
  if (state.time === 'lunch' && meal.form === 'rice') {
    pool.push(`점심엔 밥심이지, ${n}으로 오후 버텨`);
  }
  if (state.time === 'lunch' && meal.form === 'soup') {
    pool.push(`점심에 국물 한 그릇이면 오후가 달라, ${n} 어때`);
  }

  // 목표
  if (state.goal === 'diet' && meal.dietFriendly && meal.weight === 'light') {
    pool.push(`감량 중이잖아, ${n}은 칼로리 걱정 없이 먹을 수 있어`);
    pool.push(`다이어트 중에도 ${n}이라면 죄책감 없어`);
  }
  if (state.goal === 'diet' && meal.dietFriendly && meal.weight !== 'light') {
    pool.push(`식단 관리 중이어도 ${n}은 크게 무리 없어`);
  }
  if (state.goal === 'balance' && meal.tags.includes('balanced')) {
    pool.push(`균형 잡힌 식사 원한다면 ${n}이 딱 맞아, 영양도 고루 들어있어`);
  }
  if (state.goal === 'balance' && meal.tags.includes('healthy')) {
    pool.push(`건강하게 먹고 싶다면 ${n} 추천해`);
  }

  // 의도
  if (state.intent === 'cheap' && meal.priceLevel === 'cheap') {
    pool.push(`가성비로 따지면 ${n}이 최고야, 싸고 맛있잖아`);
    pool.push(`${n} 가격도 착하고 배도 채워줘, 손해 없어`);
  }
  if (state.intent === 'light' && meal.weight === 'light') {
    pool.push(`가볍게 가고 싶다고 했지, ${n}이면 딱이야`);
  }
  if (state.intent === 'heavy' && meal.weight === 'heavy') {
    pool.push(`든든하게 먹겠다면 ${n} 먹으면 배 안 꺼져`);
  }
  if (state.intent === 'no_soup' && meal.form !== 'soup') {
    pool.push(`국물 없이 간다면 ${n} 어때`);
  }

  // 최근 패턴 반영
  if (state.recentMeals.includes('heavy_recent') && meal.weight !== 'heavy') {
    pool.push(`요즘 기름진 거 많이 먹었으니 ${n}으로 좀 털어내자`);
    pool.push(`무거운 게 연속됐으니까 오늘은 ${n}으로 쉬어가`);
  }
  if (state.recentMeals.includes('spicy_recent') && meal.stimulation === 'mild') {
    pool.push(`자극적인 게 많았으니 오늘은 ${n}으로 위장 좀 달래줘`);
  }
  if (state.recentMeals.includes('carb_recent') && meal.form !== 'rice' && meal.form !== 'noodle') {
    pool.push(`탄수화물 너무 많이 먹었으니 ${n}으로 밸런스 잡아봐`);
  }

  // form 다양성
  if (bd.formDiversityBonus >= 6) {
    if (meal.form === 'salad') pool.push(`요즘 국물이나 면류만 먹었잖아, ${n}으로 기분 전환해봐`);
    if (meal.form === 'noodle') pool.push(`밥류 연속됐으니 ${n}으로 변화 줘봐`);
    if (meal.form === 'soup') pool.push(`국물 없이 먹다 보면 질리잖아, ${n} 한 그릇 어때`);
    if (meal.form === 'rice') pool.push(`면이나 국물만 먹었으니 ${n}으로 밥심 좀 채워봐`);
  }

  // 메뉴 자체 특성 폴백
  if (meal.stimulation === 'spicy' && state.weather !== 'hot') {
    pool.push(`${n} 먹으면 속이 확 뚫릴 거야, 개운해`);
  }
  if (meal.priceLevel === 'cheap' && pool.length < 2) {
    pool.push(`${n} 맛도 좋고 부담도 없어, 가성비 끝판왕`);
  }
  if (meal.priceLevel === 'expensive' && pool.length < 2) {
    pool.push(`오늘은 ${n}으로 좀 특별하게 먹어봐, 그럴 날도 있어야지`);
  }
  if (meal.tags.includes('comfort') && pool.length < 2) {
    pool.push(`지금 기분에 ${n}이 딱 떠올랐어`);
  }

  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // 최후 폴백
  const fallbacks = [
    `지금 상황이랑 ${n}이 제일 잘 맞아 보여`,
    `오늘은 ${n} 어때, 생각보다 좋을 거야`,
    `${n} 한번 먹어봐, 후회 없을 거야`,
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
