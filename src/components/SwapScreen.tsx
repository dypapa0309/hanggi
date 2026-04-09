import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface SwapScreenProps {
  onSelectIntent: (intent: 'light' | 'heavy' | 'cheap' | 'no_soup' | 'random') => void;
}

export default function SwapScreen({ onSelectIntent }: SwapScreenProps) {
  const options = [
    { label: '더 가볍게', intent: 'light' as const },
    { label: '더 든든하게', intent: 'heavy' as const },
    { label: '더 저렴하게', intent: 'cheap' as const },
    { label: '국물 빼고', intent: 'no_soup' as const },
    { label: '그냥 다른 거', intent: 'random' as const }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>어떻게 바꿔줄까?</Text>
      {options.map((option) => (
        <TouchableOpacity
          key={option.intent}
          style={styles.option}
          onPress={() => onSelectIntent(option.intent)}
        >
          <Text style={styles.optionText}>{option.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 30,
    color: theme.colors.text,
  },
  option: {
    backgroundColor: theme.colors.white,
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  optionText: {
    fontSize: 18,
    color: theme.colors.text,
    fontWeight: '700',
  },
});
