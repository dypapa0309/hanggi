import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppState,
  LocationContext,
  NotificationPermissionState,
  NotificationPreferences,
  Meal,
  MealLog,
  PostChoiceFlow,
  RecommendationHistory,
  RecommendationSession,
  RestaurantRecommendation,
  RestaurantSearchDiagnostics,
  SelectedMenu,
  ShoppingIngredient,
  ShoppingListState,
  User,
  UserCondition,
} from './types';

const TRIAL_DAYS = 7;

interface AppStore {
  user: User;
  currentState: AppState;
  mealLogs: MealLog[];
  recommendations: RecommendationHistory[];
  recommendationSession: RecommendationSession;
  selectedMenu: SelectedMenu | null;
  notificationPreferences: NotificationPreferences;
  locationContext: LocationContext;
  trialStartDate: string | null;
  isPurchased: boolean;
  setUser: (user: Partial<User>) => void;
  toggleSavedRestaurant: (restaurantId: string) => void;
  setCurrentState: (state: Partial<AppState>) => void;
  startRecommendationSession: (condition: UserCondition) => void;
  registerRecommendation: (mealId: string) => void;
  markSwapUsed: () => void;
  chooseMeal: (meal: Meal) => void;
  completeRecommendationForCurrentTime: () => void;
  setPostChoiceFlow: (flow: PostChoiceFlow | null) => void;
  setLocationContext: (context: Partial<LocationContext>) => void;
  setRestaurantRecommendations: (items: RestaurantRecommendation[]) => void;
  setRestaurantSearchDiagnostics: (diagnostics: RestaurantSearchDiagnostics | null) => void;
  clearRestaurantRecommendations: () => void;
  resetRecommendationSession: () => void;
  addMealLog: (log: MealLog) => void;
  addRecommendation: (rec: RecommendationHistory) => void;
  setNotificationPreferences: (updates: Partial<NotificationPreferences>) => void;
  setNotificationPermissionStatus: (status: NotificationPermissionState) => void;
  setPurchased: (value: boolean) => void;
  initTrialIfNeeded: () => void;
  isTrialActive: () => boolean;
  hasAccess: () => boolean;
  trialDaysLeft: () => number;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

const defaultSession: RecommendationSession = {
  condition: null,
  recommendedMealIds: [],
  recommendationCount: 0,
  swapUsed: false,
  finalChoiceMade: false,
  completedForTime: null,
  postChoiceFlow: null,
  shoppingList: null,
  restaurantRecommendations: [],
  restaurantSearchDiagnostics: null,
};

const defaultLocationContext: LocationContext = {
  permissionStatus: 'undetermined',
  source: 'fallback',
  coords: null,
  label: '위치를 아직 확인하지 않았어요',
  updatedAt: null,
};

function buildShoppingList(meal: Meal, goalMode: User['goalMode']): ShoppingListState {
  const ingredients: ShoppingIngredient[] = meal.shoppingList.map((ingredient) => ({
    ...ingredient,
    note: ingredient.note,
  }));

  const alternativeNotes = ingredients
    .filter((ingredient) => ingredient.gogodangAlternative && ingredient.gogodangAlternative !== '생략')
    .slice(0, 3)
    .map((ingredient) => `${ingredient.name} 대신 ${ingredient.gogodangAlternative} 쪽이 덜 부담돼요.`);

  const gogodangNotes = goalMode === 'gogodang'
    ? [
        '단맛이 강한 소스와 짠 양념은 먼저 덜어내는 쪽으로 잡았어요.',
        '가공 재료가 보이면 무가당·저염 대안을 먼저 확인해주세요.',
        ...alternativeNotes,
      ]
    : [];

  return {
    selectedMenu: {
      mealId: meal.id,
      name: meal.name,
      goalMode,
      decidedAt: new Date().toISOString(),
    },
    ingredients,
    gogodangNotes,
    title: `${meal.name} 준비하기`,
    description: '장보실 때 참고할 수 있게 필요한 재료를 정리했어요. 집에 있는 재료부터 먼저 확인해보세요.',
    tip: goalMode === 'gogodang'
      ? '개인 상태에 따라 피해야 하는 재료가 있다면 이 목록보다 의료진 안내를 먼저 따라주세요.'
      : '가장 기본 재료부터 담고, 소스나 곁들임은 마지막에 고르면 부담이 줄어요.',
  };
}

export const useAppStore = create<AppStore>((set, get) => ({
  user: {
    goalMode: 'balance',
    defaultDiningType: 'solo',
    dislikes: [],
    savedRestaurantIds: [],
  },
  currentState: {
    time: 'lunch',
    diningType: 'solo',
    goal: 'balance',
    recentMeals: [],
    weather: 'normal',
    condition: 'quick',
  },
  mealLogs: [],
  recommendations: [],
  recommendationSession: defaultSession,
  selectedMenu: null,
  notificationPreferences: {
    lunchEnabled: true,
    lunchTime: '11:30',
    dinnerEnabled: true,
    dinnerTime: '18:00',
    permissionStatus: 'unknown',
  },
  locationContext: defaultLocationContext,
  trialStartDate: null,
  isPurchased: false,
  setUser: (updates) => {
    set((state) => ({ user: { ...state.user, ...updates } }));
    get().saveToStorage();
  },
  toggleSavedRestaurant: (restaurantId) => {
    set((state) => {
      const exists = state.user.savedRestaurantIds.includes(restaurantId);
      return {
        user: {
          ...state.user,
          savedRestaurantIds: exists
            ? state.user.savedRestaurantIds.filter((id) => id !== restaurantId)
            : [...state.user.savedRestaurantIds, restaurantId],
        },
      };
    });
    get().saveToStorage();
  },
  setCurrentState: (updates) => {
    set((state) => ({ currentState: { ...state.currentState, ...updates } }));
    get().saveToStorage();
  },
  startRecommendationSession: (condition) => {
    set({
      recommendationSession: {
        ...defaultSession,
        condition,
      },
      selectedMenu: null,
    });
    get().saveToStorage();
  },
  registerRecommendation: (mealId) => {
    set((state) => ({
      recommendationSession: {
        ...state.recommendationSession,
        recommendedMealIds: [...state.recommendationSession.recommendedMealIds, mealId],
        recommendationCount: state.recommendationSession.recommendationCount + 1,
      },
    }));
    get().saveToStorage();
  },
  markSwapUsed: () => {
    set((state) => ({
      recommendationSession: {
        ...state.recommendationSession,
        swapUsed: true,
      },
    }));
    get().saveToStorage();
  },
  chooseMeal: (meal) => {
    const goalMode = get().currentState.goal;
    const shoppingList = buildShoppingList(meal, goalMode);

    set((state) => ({
      selectedMenu: shoppingList.selectedMenu,
      recommendationSession: {
        ...state.recommendationSession,
        finalChoiceMade: true,
        postChoiceFlow: null,
        shoppingList,
      },
    }));
    get().saveToStorage();
  },
  completeRecommendationForCurrentTime: () => {
    set((state) => ({
      recommendationSession: {
        ...state.recommendationSession,
        finalChoiceMade: true,
        completedForTime: state.currentState.time,
      },
    }));
    get().saveToStorage();
  },
  setPostChoiceFlow: (flow) => {
    set((state) => ({
      recommendationSession: {
        ...state.recommendationSession,
        postChoiceFlow: flow,
      },
    }));
    get().saveToStorage();
  },
  setLocationContext: (context) => {
    set((state) => ({
      locationContext: {
        ...state.locationContext,
        ...context,
      },
    }));
    get().saveToStorage();
  },
  setRestaurantRecommendations: (items) => {
    set((state) => ({
      recommendationSession: {
        ...state.recommendationSession,
        restaurantRecommendations: items,
      },
    }));
    get().saveToStorage();
  },
  setRestaurantSearchDiagnostics: (diagnostics) => {
    set((state) => ({
      recommendationSession: {
        ...state.recommendationSession,
        restaurantSearchDiagnostics: diagnostics,
      },
    }));
    get().saveToStorage();
  },
  clearRestaurantRecommendations: () => {
    set((state) => ({
      recommendationSession: {
        ...state.recommendationSession,
        restaurantRecommendations: [],
        restaurantSearchDiagnostics: null,
      },
    }));
    get().saveToStorage();
  },
  resetRecommendationSession: () => {
    set({
      recommendationSession: defaultSession,
      selectedMenu: null,
    });
    get().saveToStorage();
  },
  addMealLog: (log) => {
    set((state) => ({ mealLogs: [...state.mealLogs, log] }));
    get().saveToStorage();
  },
  addRecommendation: (rec) => {
    set((state) => ({ recommendations: [...state.recommendations, rec] }));
    get().saveToStorage();
  },
  setNotificationPreferences: (updates) => {
    set((state) => ({
      notificationPreferences: {
        ...state.notificationPreferences,
        ...updates,
      },
    }));
    get().saveToStorage();
  },
  setNotificationPermissionStatus: (status) => {
    set((state) => ({
      notificationPreferences: {
        ...state.notificationPreferences,
        permissionStatus: status,
      },
    }));
    get().saveToStorage();
  },
  setPurchased: (value) => {
    set({ isPurchased: value });
    get().saveToStorage();
  },
  initTrialIfNeeded: () => {
    if (!get().trialStartDate) {
      set({ trialStartDate: new Date().toISOString() });
      get().saveToStorage();
    }
  },
  isTrialActive: () => {
    const { trialStartDate } = get();
    if (!trialStartDate) return false;
    const elapsed = Date.now() - new Date(trialStartDate).getTime();
    return elapsed < TRIAL_DAYS * 24 * 60 * 60 * 1000;
  },
  hasAccess: () => get().isPurchased || get().isTrialActive(),
  trialDaysLeft: () => {
    const { trialStartDate } = get();
    if (!trialStartDate) return TRIAL_DAYS;
    const elapsed = Date.now() - new Date(trialStartDate).getTime();
    const remaining = TRIAL_DAYS - Math.floor(elapsed / (24 * 60 * 60 * 1000));
    return Math.max(0, remaining);
  },
  loadFromStorage: async () => {
    try {
      const data = await AsyncStorage.getItem('hanggi-storage');
      if (!data) return;
      const parsed = JSON.parse(data);
      set({
        ...parsed,
        mealLogs: Array.isArray(parsed.mealLogs)
          ? parsed.mealLogs.map((log: MealLog) => ({ ...log, eatenAt: new Date(log.eatenAt) }))
          : [],
        notificationPreferences: {
          lunchEnabled: parsed.notificationPreferences?.lunchEnabled ?? true,
          lunchTime: parsed.notificationPreferences?.lunchTime ?? '11:30',
          dinnerEnabled: parsed.notificationPreferences?.dinnerEnabled ?? true,
          dinnerTime: parsed.notificationPreferences?.dinnerTime ?? '18:00',
          permissionStatus: parsed.notificationPreferences?.permissionStatus ?? 'unknown',
        },
        locationContext: {
          permissionStatus: parsed.locationContext?.permissionStatus ?? 'undetermined',
          source: parsed.locationContext?.source ?? 'fallback',
          coords: parsed.locationContext?.coords ?? null,
          label: parsed.locationContext?.label ?? '위치를 아직 확인하지 않았어요',
          updatedAt: parsed.locationContext?.updatedAt ?? null,
        },
        user: {
          goalMode: parsed.user?.goalMode ?? 'balance',
          defaultDiningType: parsed.user?.defaultDiningType ?? 'solo',
          dislikes: Array.isArray(parsed.user?.dislikes) ? parsed.user.dislikes : [],
          savedRestaurantIds: Array.isArray(parsed.user?.savedRestaurantIds) ? parsed.user.savedRestaurantIds : [],
        },
      });
    } catch (error) {
      console.error('Failed to load from storage:', error);
    }
  },
  saveToStorage: async () => {
    try {
      const state = get();
      const {
        loadFromStorage,
        saveToStorage,
        setUser,
        toggleSavedRestaurant,
        setCurrentState,
        startRecommendationSession,
        registerRecommendation,
        markSwapUsed,
        chooseMeal,
        completeRecommendationForCurrentTime,
        setLocationContext,
        setRestaurantRecommendations,
        setRestaurantSearchDiagnostics,
        clearRestaurantRecommendations,
        resetRecommendationSession,
        addMealLog,
        addRecommendation,
        setNotificationPreferences,
        setNotificationPermissionStatus,
        setPurchased,
        initTrialIfNeeded,
        isTrialActive,
        hasAccess,
        trialDaysLeft,
        ...toSave
      } = state;
      await AsyncStorage.setItem('hanggi-storage', JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save to storage:', error);
    }
  },
}));
