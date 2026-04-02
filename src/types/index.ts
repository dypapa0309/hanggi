// Data models for 한끼비서 app

export interface User {
  goalMode: 'free' | 'balance' | 'diet';
  defaultDiningType: 'solo' | 'pair' | 'group';
  dislikes: string[]; // menu names
}

export interface Meal {
  id: string;
  name: string;
  tags: string[]; // e.g., ['warm', 'spicy', 'light', 'heavy', 'comfort']
  temperature: 'hot' | 'cold' | 'normal';
  weight: 'light' | 'medium' | 'heavy';
  form: 'soup' | 'rice' | 'noodle' | 'salad' | 'other';
  soloFriendly: boolean;
  dietFriendly: boolean;
  stimulation: 'mild' | 'medium' | 'spicy';
  priceLevel: 'cheap' | 'medium' | 'expensive';
}

export interface MealLog {
  mealId: string;
  eatenAt: Date;
  time?: 'breakfast' | 'lunch' | 'dinner' | 'late'; // 시간대
}

export interface Recommendation {
  mealId: string;
  state: AppState;
  accepted: boolean;
  swapReason?: string;
}

export interface AppState {
  time: 'breakfast' | 'lunch' | 'dinner' | 'late';
  diningType: 'solo' | 'pair' | 'group';
  goal: 'free' | 'balance' | 'diet';
  recentMeals: ('heavy_recent' | 'carb_recent' | 'spicy_recent' | 'balanced')[];
  weather: 'rain' | 'cold' | 'hot' | 'normal';
  intent?: 'light' | 'heavy' | 'cheap' | 'no_soup' | 'random';
}

export interface WeatherData {
  temp: number;
  condition: 'rain' | 'cold' | 'hot' | 'normal';
  lastUpdated: Date;
}