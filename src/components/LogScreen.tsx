import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAppStore } from '../store';
import rawMenusData from '../data/menus.json';

interface MealByTime {
  time: string;
  timeLabel: string;
  meals: { name: string; id: string }[];
}

function toLocalDateStr(date: Date | string): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function LogScreen() {
  const { mealLogs } = useAppStore();
  const menus = rawMenusData as { id: string; name: string }[];

  const logData = useMemo(() => {
    const days = 14;
    const today = new Date();
    const map: Record<string, MealByTime[]> = {};

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const key = toLocalDateStr(date);
      map[key] = [
        { time: 'breakfast', timeLabel: '아침', meals: [] },
        { time: 'lunch', timeLabel: '점심', meals: [] },
        { time: 'dinner', timeLabel: '저녁', meals: [] },
        { time: 'late', timeLabel: '야식', meals: [] },
      ];
    }

    mealLogs.forEach(log => {
      const key = toLocalDateStr(log.eatenAt);
      if (!map[key]) return;
      const meal = menus.find(m => m.id === log.mealId);
      const mealName = meal ? meal.name : log.mealId;
      const timeSlot = log.time ?? 'lunch';
      const timeGroup = map[key].find(t => t.time === timeSlot);
      if (timeGroup && !timeGroup.meals.find(m => m.name === mealName)) {
        timeGroup.meals.push({ name: mealName, id: log.mealId });
      }
    });

    return Object.entries(map).map(([day, timeGroups]) => ({
      day,
      timeGroups: timeGroups.filter(tg => tg.meals.length > 0),
    }));
  }, [mealLogs]);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {logData.map(dayData => (
          <View key={dayData.day} style={styles.dayRow}>
            <Text style={styles.dayLabel}>{dayData.day}</Text>
            {dayData.timeGroups.length > 0 ? (
              <View style={styles.timeSlotsWrap}>
                {dayData.timeGroups.map(timeGroup => (
                  <View key={`${dayData.day}-${timeGroup.time}`} style={styles.timeCard}>
                    <View style={[styles.timeBadge, getTimeBadgeStyle(timeGroup.time)]}>
                      <Text style={styles.timeBadgeLabel}>{timeGroup.timeLabel}</Text>
                    </View>
                    <View style={styles.mealsInTime}>
                      {timeGroup.meals.map(meal => (
                        <Text key={`${meal.id}-${dayData.day}`} style={styles.meal}>
                          • {meal.name}
                        </Text>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noMeal}>기록 없음</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function getTimeBadgeStyle(time: string) {
  const map: Record<string, { backgroundColor: string }> = {
    breakfast: { backgroundColor: '#FFE5B4' },
    lunch: { backgroundColor: '#FFD4A3' },
    dinner: { backgroundColor: '#E8B0C9' },
    late: { backgroundColor: '#6B5CE7' },
  };
  return map[time] ?? map.lunch;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F7F8FC',
  },
  dayRow: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    color: '#222',
  },
  timeSlotsWrap: {
    gap: 8,
  },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  timeBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    minWidth: 44,
    alignItems: 'center',
  },
  timeBadgeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  mealsInTime: {
    flex: 1,
  },
  meal: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  noMeal: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});
