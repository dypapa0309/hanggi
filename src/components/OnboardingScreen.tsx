import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../store';
import { GoalMode } from '../types';
import { theme } from '../theme';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const GOAL_OPTIONS: { value: GoalMode; label: string; desc: string }[] = [
  { value: 'free', label: '자유식', desc: '제한 없이 먹고 싶은 걸로' },
  { value: 'balance', label: '균형식', desc: '적당히 건강하게' },
  { value: 'diet', label: '다이어트', desc: '가볍고 칼로리 낮은 쪽으로' },
  { value: 'gogodang', label: '고고당', desc: '당·짠 양념·가공 재료를 보수적으로 피하기' },
];

const DINING_OPTIONS: { value: 'solo' | 'pair' | 'group'; label: string }[] = [
  { value: 'solo', label: '혼밥' },
  { value: 'pair', label: '둘이서' },
  { value: 'group', label: '단체' },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { setUser } = useAppStore();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<GoalMode>('balance');
  const [diningType, setDiningType] = useState<'solo' | 'pair' | 'group'>('solo');

  const handleNext = async () => {
    if (step === 0) {
      setStep(1);
      return;
    }
    // step 1: 완료
    setUser({ goalMode: goal, defaultDiningType: diningType, dislikes: [] });
    await AsyncStorage.setItem('is-onboarded', 'true');
    await new Promise((resolve) => setTimeout(resolve, 100));
    onComplete();
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      style={styles.container}
    >
      {step === 0 ? (
        // 철학 소개 페이지
        <View style={styles.card}>
          <Text style={styles.eyebrow}>HAN-GGI</Text>
          <Text style={styles.title}>오늘 뭐 먹을지{'\n'}두 번 안에 끝내요</Text>
          <Text style={styles.desc}>
            추천이 아니에요.{'\n'}선택을 끝내주는 앱이에요.
          </Text>

          <View style={styles.featureList}>
            <FeatureRow icon="①" text="상태 고르면 1개만 딱 나와요" />
            <FeatureRow icon="②" text="마음에 안 들면 바꿀래 1번" />
            <FeatureRow icon="③" text="귀찮으면 근처 가게로 바로 이어줘요" />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>시작하기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // 기본값 설정 페이지
        <View style={styles.card}>
          <Text style={styles.eyebrow}>SETUP</Text>
          <Text style={styles.title}>기본값만{'\n'}가볍게 설정해요</Text>
          <Text style={styles.desc}>나중에 설정에서 언제든 바꿀 수 있어요.</Text>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>목표 모드</Text>
            {GOAL_OPTIONS.map((g) => (
              <TouchableOpacity
                key={g.value}
                style={[styles.option, goal === g.value && styles.optionSelected]}
                onPress={() => setGoal(g.value)}
              >
                <Text style={[styles.optionLabel, goal === g.value && styles.optionLabelSelected]}>
                  {g.label}
                </Text>
                <Text style={[styles.optionDesc, goal === g.value && styles.optionDescSelected]}>
                  {g.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>주로 누구랑</Text>
            <View style={styles.chipRow}>
              {DINING_OPTIONS.map((d) => (
                <TouchableOpacity
                  key={d.value}
                  style={[styles.chip, diningType === d.value && styles.chipSelected]}
                  onPress={() => setDiningType(d.value)}
                >
                  <Text style={[styles.chipText, diningType === d.value && styles.chipTextSelected]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>완료</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: theme.colors.primary,
    marginBottom: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.text,
    lineHeight: 42,
    marginBottom: 14,
  },
  desc: {
    fontSize: 16,
    color: theme.colors.muted,
    lineHeight: 24,
    marginBottom: 32,
  },
  featureList: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: theme.colors.line,
    gap: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureIcon: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.primary,
    width: 20,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.muted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  option: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  optionSelected: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  optionLabelSelected: {
    color: theme.colors.deep,
  },
  optionDesc: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 2,
  },
  optionDescSelected: {
    color: theme.colors.deep,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  chipTextSelected: {
    color: theme.colors.deep,
  },
  button: {
    backgroundColor: theme.colors.deep,
    paddingVertical: 16,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 17,
    fontWeight: '800',
  },
});
