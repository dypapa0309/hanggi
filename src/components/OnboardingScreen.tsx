import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../store';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { setUser } = useAppStore();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<'free' | 'balance' | 'diet'>('balance');
  const [diningType, setDiningType] = useState<'solo' | 'pair' | 'group'>('solo');
  const [dislike, setDislike] = useState('');

  const steps = [
    {
      title: '목표를 선택하세요',
      content: (
        <View>
          {['free', 'balance', 'diet'].map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.option, goal === g && styles.selected]}
              onPress={() => setGoal(g as any)}
            >
              <Text>{g === 'free' ? '자유식' : g === 'balance' ? '균형식' : '감량식'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )
    },
    {
      title: '식사 스타일을 선택하세요',
      content: (
        <View>
          {['solo', 'pair', 'group'].map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.option, diningType === d && styles.selected]}
              onPress={() => setDiningType(d as any)}
            >
              <Text>{d === 'solo' ? '혼밥' : d === 'pair' ? '둘이서' : '단체'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )
    },
    {
      title: '싫어하는 메뉴를 입력하세요 (선택)',
      content: (
        <View>
          <TextInput
            style={styles.input}
            value={dislike}
            onChangeText={setDislike}
            placeholder="예: 매운 음식"
          />
          <Text style={styles.hint}>쉼표로 구분하여 여러 개 입력 가능</Text>
        </View>
      )
    }
  ];

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      const dislikes = dislike.trim() ? dislike.split(',').map(d => d.trim()).filter(d => d) : [];
      setUser({ goalMode: goal, defaultDiningType: diningType, dislikes });
      // Save onboarding flag
      await AsyncStorage.setItem('is-onboarded', 'true');
      onComplete();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>한끼비서</Text>
      <Text style={styles.subtitle}>맞춤 메뉴 추천을 위해 몇 가지 질문이에요</Text>

      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>{steps[step].title}</Text>
        {steps[step].content}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>{step < steps.length - 1 ? '다음' : '시작하기'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40
  },
  stepContainer: {
    marginBottom: 40
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20
  },
  option: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center'
  },
  selected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 15,
    borderRadius: 10,
    fontSize: 16
  },
  hint: {
    fontSize: 14,
    color: '#666',
    marginTop: 5
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontSize: 18
  }
});