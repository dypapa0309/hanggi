import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppStore } from '../store';

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
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30
  },
  option: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center'
  },
  optionText: {
    fontSize: 18
  }
});