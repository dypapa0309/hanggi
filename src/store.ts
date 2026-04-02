import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AppState, MealLog, Recommendation } from './types';

const TRIAL_DAYS = 7;

interface AppStore {
  user: User;
  currentState: AppState;
  mealLogs: MealLog[];
  recommendations: Recommendation[];
  trialStartDate: string | null; // ISO string
  isPurchased: boolean;
  setUser: (user: Partial<User>) => void;
  setCurrentState: (state: Partial<AppState>) => void;
  addMealLog: (log: MealLog) => void;
  addRecommendation: (rec: Recommendation) => void;
  setPurchased: (value: boolean) => void;
  initTrialIfNeeded: () => void;
  isTrialActive: () => boolean;
  hasAccess: () => boolean;
  trialDaysLeft: () => number;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  user: {
    goalMode: 'balance',
    defaultDiningType: 'solo',
    dislikes: []
  },
  currentState: {
    time: 'lunch',
    diningType: 'solo',
    goal: 'balance',
    recentMeals: [],
    weather: 'normal'
  },
  mealLogs: [],
  recommendations: [],
  trialStartDate: null,
  isPurchased: false,
  setUser: (updates) => {
    set((state) => ({ user: { ...state.user, ...updates } }));
    get().saveToStorage();
  },
  setCurrentState: (updates) => set((state) => ({ currentState: { ...state.currentState, ...updates } })),
  addMealLog: (log) => {
    set((state) => ({ mealLogs: [...state.mealLogs, log] }));
    get().saveToStorage();
  },
  addRecommendation: (rec) => set((state) => ({ recommendations: [...state.recommendations, rec] })),
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
  hasAccess: () => {
    return get().isPurchased || get().isTrialActive();
  },
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
      if (data) {
        const parsed = JSON.parse(data);
        set(parsed);
      }
    } catch (error) {
      console.error('Failed to load from storage:', error);
    }
  },
  saveToStorage: async () => {
    try {
      const state = get();
      const { loadFromStorage, saveToStorage, setUser, setCurrentState, addMealLog, addRecommendation, setPurchased, initTrialIfNeeded, isTrialActive, hasAccess, trialDaysLeft, ...toSave } = state;
      await AsyncStorage.setItem('hanggi-storage', JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save to storage:', error);
    }
  }
}));