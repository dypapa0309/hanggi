import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store';
import { useWeather } from '../hooks/useWeather';
import { useRecommendation } from '../hooks/useRecommendation';
import SwapScreen from './SwapScreen';
import { getTimeLabel, getDiningTypeLabel, getGoalLabel, getWeatherLabel } from '../utils/translateKor';

function detectCurrentTime(): 'breakfast' | 'lunch' | 'dinner' | 'late' {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 16 && hour < 22) return 'dinner';
  return 'late';
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { currentState, user, setCurrentState } = useAppStore();
  const { weather } = useWeather();
  const [showSwap, setShowSwap] = useState(false);

  useEffect(() => {
    setCurrentState({
      time: detectCurrentTime(),
      diningType: user.defaultDiningType,
      goal: user.goalMode,
    });
  }, []);
  const { recommendation, regenerate } = useRecommendation({
    ...currentState,
    weather: weather?.condition || 'normal'
  });

  const { addMealLog } = useAppStore();

  const handleAccept = () => {
    if (recommendation) {
      addMealLog({ 
        mealId: recommendation.meal.id, 
        eatenAt: new Date(),
        time: currentState.time as any
      });
      alert(`${recommendation.meal.name} 기록 완료!`);
    }
  };

  const handleSwap = () => {
    setShowSwap(true);
  };

  const handleSelectIntent = (intent: 'light' | 'heavy' | 'cheap' | 'no_soup' | 'random') => {
    setCurrentState({ intent });
    setShowSwap(false);
    // Re-trigger recommendation
    regenerate();
  };

  if (showSwap) {
    return <SwapScreen onSelectIntent={handleSelectIntent} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Log')}>
          <Text style={styles.navButton}>먹었던 음식</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.navButton}>설정</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.status}>
        <Text style={styles.statusText}>오늘 {getTimeLabel(currentState.time)} · {getDiningTypeLabel(currentState.diningType)} · {getGoalLabel(user.goalMode)} · {getWeatherLabel(weather?.condition || 'normal')}</Text>
      </View>

      {recommendation && (
        <View style={styles.recommendation}>
          <Text style={styles.menu}>{recommendation.meal.name}</Text>
          <Text style={styles.reason}>{recommendation.reason}</Text>
        </View>
      )}

      <View style={styles.buttons}>
        <TouchableOpacity style={[styles.button, styles.eatButton]} onPress={handleAccept}>
          <Text style={styles.buttonText}>먹을래</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.swapButton]} onPress={handleSwap}>
          <Text style={styles.buttonText}>바꿔줘</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.logButton}
        onPress={() => navigation.navigate('Calendar')}
      >
        <Text style={styles.logButtonText}>먹었던 달력</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F7F8FC'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 12
  },
  navButton: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600'
  },
  status: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2
  },
  statusText: {
    color: '#666',
    fontSize: 14
  },
  recommendation: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 26,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  menu: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 12,
    color: '#222'
  },
  reason: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center'
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center'
  },
  eatButton: {
    backgroundColor: '#ff6b6b'
  },
  swapButton: {
    backgroundColor: '#4f6dff'
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700'
  },
  logButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  logButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666'
  }
});