import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAppStore } from '../store';
import rawMenusData from '../data/menus.json';
import AppShell from './AppShell';
import { theme } from '../theme';

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
    <AppShell activeRoute="Calendar" title="먹은 기록">
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {logData.map(dayData => (
            <View key={dayData.day} style={styles.dayRow}>
              <Text style={styles.dayLabel}>{dayData.day}</Text>
              {dayData.timeGroups.length > 0 ? (
                <View style={styles.timeSlotsWrap}>
                  {dayData.timeGroups.map(timeGroup => (
                    <View key={`${dayData.day}-${timeGroup.time}`} style={styles.timeCard}>
                      <View style={[styles.timeBadge, getTimeBadgeStyle()]}>
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
    </AppShell>
  );
}

function getTimeBadgeStyle() {
  return { backgroundColor: theme.colors.primarySoft };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: 18,
  },
  dayRow: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    ...theme.shadow.card,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    color: theme.colors.text,
  },
  timeSlotsWrap: {
    marginTop: -8,
  },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
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
    color: theme.colors.deep,
  },
  mealsInTime: {
    flex: 1,
    marginLeft: 10,
  },
  meal: {
    fontSize: 14,
    color: theme.colors.muted,
    lineHeight: 20,
  },
  noMeal: {
    fontSize: 14,
    color: theme.colors.muted,
    fontStyle: 'italic',
  },
});
