import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useAppStore } from '../store';
import { getGoalLabel, getDiningTypeLabel } from '../utils/translateKor';

export default function SettingsScreen() {
  const { user, setUser } = useAppStore();
  const [dislike, setDislike] = useState('');

  const handleGoalChange = (goal: 'free' | 'balance' | 'diet') => {
    setUser({ goalMode: goal });
  };

  const handleDiningChange = (type: 'solo' | 'pair' | 'group') => {
    setUser({ defaultDiningType: type });
  };

  const addDislike = () => {
    if (dislike && !user.dislikes.includes(dislike)) {
      setUser({ dislikes: [...user.dislikes, dislike] });
      setDislike('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>설정</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>목표 모드</Text>
        {['free', 'balance', 'diet'].map((goal) => (
          <TouchableOpacity
            key={goal}
            style={[styles.option, user.goalMode === goal && styles.selected]}
            onPress={() => handleGoalChange(goal as any)}
          >
            <Text>{getGoalLabel(goal)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>식사 상황</Text>
        {['solo', 'pair', 'group'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.option, user.defaultDiningType === type && styles.selected]}
            onPress={() => handleDiningChange(type as any)}
          >
            <Text>{getDiningTypeLabel(type)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>싫어하는 메뉴</Text>
        <TextInput
          style={styles.input}
          value={dislike}
          onChangeText={setDislike}
          placeholder="메뉴 이름 입력"
        />
        <TouchableOpacity style={styles.button} onPress={addDislike}>
          <Text style={styles.buttonText}>추가</Text>
        </TouchableOpacity>
        {user.dislikes.map((item, index) => (
          <Text key={index} style={styles.dislike}>{item}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  section: {
    marginBottom: 30
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  option: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 5
  },
  selected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10
  },
  buttonText: {
    color: '#fff'
  },
  dislike: {
    padding: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 5
  }
});