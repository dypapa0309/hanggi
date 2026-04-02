// 영문 상수를 한글로 매핑하는 유틸리티

export const timeLabels: Record<string, string> = {
  breakfast: '아침',
  lunch: '점심',
  dinner: '저녁',
  late: '야식'
};

export const weightLabels: Record<string, string> = {
  light: '가볍게',
  medium: '보통',
  heavy: '든든하게'
};

export const diningTypeLabels: Record<string, string> = {
  solo: '혼밥',
  pair: '둘이서',
  group: '단체'
};

export const goalLabels: Record<string, string> = {
  free: '자유식',
  balance: '균형식',
  diet: '감량식'
};

export const weatherLabels: Record<string, string> = {
  rain: '비',
  cold: '추움',
  hot: '더움',
  normal: '맑음'
};

export const formLabels: Record<string, string> = {
  soup: '국물',
  rice: '밥',
  noodle: '면',
  salad: '샐러드',
  other: '기타'
};

export const stimulationLabels: Record<string, string> = {
  mild: '순한',
  medium: '중간',
  spicy: '매운'
};

export const priceLevelLabels: Record<string, string> = {
  cheap: '저렴',
  medium: '중간',
  expensive: '비싼'
};

export const temperatureLabels: Record<string, string> = {
  hot: '따뜻함',
  cold: '차가움',
  normal: '실온'
};

// 편의 함수
export function getTimeLabel(time: string | undefined | null): string {
  if (!time) return '';
  return timeLabels[time] || time;
}

export function getWeightLabel(weight: string | undefined | null): string {
  if (!weight) return '';
  return weightLabels[weight] || weight;
}

export function getDiningTypeLabel(type: string | undefined | null): string {
  if (!type) return '';
  return diningTypeLabels[type] || type;
}

export function getGoalLabel(goal: string | undefined | null): string {
  if (!goal) return '';
  return goalLabels[goal] || goal;
}

export function getWeatherLabel(weather: string | undefined | null): string {
  if (!weather) return '';
  return weatherLabels[weather] || weather;
}

export function getFormLabel(form: string | undefined | null): string {
  if (!form) return '';
  return formLabels[form] || form;
}

export function getStimulationLabel(stimulation: string | undefined | null): string {
  if (!stimulation) return '';
  return stimulationLabels[stimulation] || stimulation;
}

export function getPriceLevelLabel(priceLevel: string | undefined | null): string {
  if (!priceLevel) return '';
  return priceLevelLabels[priceLevel] || priceLevel;
}

export function getTemperatureLabel(temperature: string | undefined | null): string {
  if (!temperature) return '';
  return temperatureLabels[temperature] || temperature;
}
