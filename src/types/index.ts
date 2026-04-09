export type GoalMode = 'free' | 'balance' | 'diet' | 'gogodang';
export type DiningType = 'solo' | 'pair' | 'group';
export type MealTime = 'breakfast' | 'lunch' | 'dinner' | 'late';
export type WeatherCondition = 'rain' | 'cold' | 'hot' | 'normal';
export type UserCondition = 'quick' | 'cozy' | 'fresh' | 'protein' | 'soup';
export type PostChoiceFlow = 'cook' | 'eat_out';
export type RecommendationSource = 'db' | 'external';
export type NotificationPermissionState = 'unknown' | 'granted' | 'denied';
export type GogodangSuitability = 'allowed' | 'caution' | 'blocked';
export type LocationPermissionState = 'undetermined' | 'granted' | 'denied';
export type LocationSource = 'current' | 'manual' | 'fallback';
export type RestaurantSearchFailureReason =
  | 'location_permission_denied'
  | 'location_lookup_failed'
  | 'db_empty'
  | 'kakao_empty'
  | 'seed_empty'
  | 'missing_kakao_key'
  | 'missing_supabase_config'
  | 'db_error'
  | 'kakao_request_failed';
export type MerchantStatus = 'pending_review' | 'awaiting_payment_check' | 'active' | 'inactive';
export type MerchantOnboardingStatus =
  | 'lead_created'
  | 'contract_viewed'
  | 'payment_pending'
  | 'payment_verified'
  | 'store_approved'
  | 'store_live';

export interface User {
  goalMode: GoalMode;
  defaultDiningType: DiningType;
  dislikes: string[];
  savedRestaurantIds: string[];
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationContext {
  permissionStatus: LocationPermissionState;
  source: LocationSource;
  coords: Coordinates | null;
  label: string;
  updatedAt: string | null;
}

export interface ShoppingIngredient {
  name: string;
  note?: string;
  gogodangAlternative?: string;
  lowSodium?: boolean;
}

export interface Meal {
  id: string;
  name: string;
  suitableTimes: MealTime[];
  tags: string[];
  temperature: 'hot' | 'cold' | 'normal';
  weight: 'light' | 'medium' | 'heavy';
  form: 'soup' | 'rice' | 'noodle' | 'salad' | 'other';
  soloFriendly: boolean;
  dietFriendly: boolean;
  stimulation: 'mild' | 'medium' | 'spicy';
  priceLevel: 'cheap' | 'medium' | 'expensive';
  goalFit: GoalMode[];
  conditions: UserCondition[];
  shoppingList: ShoppingIngredient[];
  restaurantSearchTerms: string[];
  lowSugar: boolean;
  lowSodium: boolean;
  lowFat: boolean;
  proteinFocused: boolean;
  gogodangSuitability?: GogodangSuitability;
}

export interface MealLog {
  mealId: string;
  eatenAt: Date;
  time?: MealTime;
}

export interface RecommendationHistory {
  mealId: string;
  accepted: boolean;
  createdAt: string;
}

export interface AppState {
  time: MealTime;
  diningType: DiningType;
  goal: GoalMode;
  recentMeals: ('heavy_recent' | 'carb_recent' | 'spicy_recent' | 'balanced')[];
  weather: WeatherCondition;
  condition: UserCondition;
}

export interface RecommendationResult {
  meal: Meal;
  reason: string;
  modeHint: string;
}

export interface SelectedMenu {
  mealId: string;
  name: string;
  goalMode: GoalMode;
  decidedAt: string;
}

export interface RestaurantMenu {
  mealId: string;
  mealName: string;
  price: number | null;
  available: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  merchantStatus: MerchantStatus;
  onboardingStatus: MerchantOnboardingStatus;
  lat: number;
  lng: number;
  address: string;
  menus: RestaurantMenu[];
  isSubscribed: boolean;
  rating: number;
  reviewCount: number;
  phone?: string | null;
  placeUrl?: string | null;
  distanceKm?: number;
}

export interface RestaurantRecommendation {
  restaurant: Restaurant;
  matchedMenu: RestaurantMenu;
  score: number;
  distanceKm: number;
  source: RecommendationSource;
  why: string;
}

export interface RestaurantSearchDiagnostics {
  locationSource: LocationSource;
  usedCoords: Coordinates;
  dbCount: number;
  kakaoCount: number;
  seedCount: number;
  failureReason: RestaurantSearchFailureReason | null;
}

export interface RestaurantSearchResult {
  items: RestaurantRecommendation[];
  diagnostics: RestaurantSearchDiagnostics;
}

export interface ShoppingListState {
  selectedMenu: SelectedMenu;
  ingredients: ShoppingIngredient[];
  gogodangNotes: string[];
  title: string;
  description: string;
  tip: string;
}

export interface RecommendationSession {
  condition: UserCondition | null;
  recommendedMealIds: string[];
  recommendationCount: number;
  swapUsed: boolean;
  finalChoiceMade: boolean;
  completedForTime: MealTime | null;
  postChoiceFlow: PostChoiceFlow | null;
  shoppingList: ShoppingListState | null;
  restaurantRecommendations: RestaurantRecommendation[];
  restaurantSearchDiagnostics: RestaurantSearchDiagnostics | null;
}

export interface WeatherData {
  temp: number;
  condition: WeatherCondition;
  lastUpdated: Date;
}

export interface NotificationPreferences {
  lunchEnabled: boolean;
  lunchTime: string;
  dinnerEnabled: boolean;
  dinnerTime: string;
  permissionStatus: NotificationPermissionState;
}

export interface InsightSummary {
  title: string;
  body: string;
}
