import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useAppStore } from '../store';
import rawMenusData from '../data/menus.json';

const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토'];

const TIME_COLORS: Record<string, string> = {
  breakfast: '#FFD166',
  lunch: '#FF9A3C',
  dinner: '#E066A0',
  late: '#6B5CE7',
};

const TIME_LABELS: Record<string, string> = {
  breakfast: '아침',
  lunch: '점심',
  dinner: '저녁',
  late: '야식',
};

function toLocalDateStr(date: Date | string): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const { width } = Dimensions.get('window');
const CELL_SIZE = Math.floor((width - 32) / 7);

export default function LogScreen() {
  const { mealLogs } = useAppStore();
  const menus = rawMenusData as { id: string; name: string }[];

  const today = new Date();
  const todayStr = toLocalDateStr(today);

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const mealsByDate = useMemo(() => {
    const map: Record<string, { time: string; name: string }[]> = {};
    mealLogs.forEach(log => {
      const key = toLocalDateStr(log.eatenAt);
      if (!map[key]) map[key] = [];
      const meal = menus.find(m => m.id === log.mealId);
      const name = meal?.name ?? log.mealId;
      const time = log.time ?? 'lunch';
      if (!map[key].some(m => m.name === name && m.time === time)) {
        map[key].push({ time, name });
      }
    });
    return map;
  }, [mealLogs]);

  const calendarWeeks = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const cells: (string | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) {
      const m = String(month + 1).padStart(2, '0');
      const day = String(d).padStart(2, '0');
      cells.push(`${year}-${m}-${day}`);
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: (string | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  }, [year, month]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const selectedMeals = mealsByDate[selectedDate] ?? [];
  const selDateObj = new Date(selectedDate + 'T00:00:00');

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* 월 네비게이션 */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{year}년 {month + 1}월</Text>
        <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 달력 */}
      <View style={styles.calendar}>
        {/* 요일 헤더 */}
        <View style={styles.weekRow}>
          {DAYS_OF_WEEK.map((d, i) => (
            <View key={d} style={[styles.headerCell, { width: CELL_SIZE }]}>
              <Text style={[styles.headerText, i === 0 && styles.sunText, i === 6 && styles.satText]}>
                {d}
              </Text>
            </View>
          ))}
        </View>

        {/* 날짜 그리드 */}
        {calendarWeeks.map((week, wi) => (
          <View key={wi} style={styles.weekRow}>
            {week.map((date, di) => {
              const isToday = date === todayStr;
              const isSelected = date === selectedDate;
              const meals = date ? (mealsByDate[date] ?? []) : [];
              const uniqueTimes = [...new Set(meals.map(m => m.time))];

              return (
                <TouchableOpacity
                  key={di}
                  style={[
                    styles.dayCell,
                    { width: CELL_SIZE, height: CELL_SIZE + 14 },
                    isSelected && styles.selectedCell,
                  ]}
                  onPress={() => date && setSelectedDate(date)}
                  disabled={!date}
                  activeOpacity={0.7}
                >
                  {date && (
                    <>
                      <Text style={[
                        styles.dayNum,
                        isToday && !isSelected && styles.todayNum,
                        isSelected && styles.selectedNum,
                        di === 0 && !isSelected && styles.sunText,
                        di === 6 && !isSelected && styles.satText,
                      ]}>
                        {parseInt(date.slice(8), 10)}
                      </Text>
                      <View style={styles.dotRow}>
                        {uniqueTimes.slice(0, 4).map(t => (
                          <View
                            key={t}
                            style={[styles.dot, { backgroundColor: TIME_COLORS[t] ?? '#ccc' }]}
                          />
                        ))}
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* 선택된 날 상세 */}
      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>
          {selDateObj.getMonth() + 1}월 {selDateObj.getDate()}일
          {selectedDate === todayStr ? ' (오늘)' : ''}
        </Text>
        {selectedMeals.length === 0 ? (
          <Text style={styles.noMeal}>기록된 음식이 없어요</Text>
        ) : (
          ['breakfast', 'lunch', 'dinner', 'late'].map(t => {
            const items = selectedMeals.filter(m => m.time === t);
            if (items.length === 0) return null;
            return (
              <View key={t} style={styles.mealTimeRow}>
                <View style={[styles.badge, { backgroundColor: TIME_COLORS[t] }]}>
                  <Text style={styles.badgeText}>{TIME_LABELS[t]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  {items.map((m, i) => (
                    <Text key={i} style={styles.mealText}>• {m.name}</Text>
                  ))}
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* 범례 */}
      <View style={styles.legend}>
        {Object.entries(TIME_LABELS).map(([t, label]) => (
          <View key={t} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: TIME_COLORS[t] }]} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FC',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  navArrow: {
    fontSize: 32,
    color: '#4f6dff',
    lineHeight: 36,
    fontWeight: '300',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  calendar: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  weekRow: {
    flexDirection: 'row',
  },
  headerCell: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#f8f9ff',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  sunText: {
    color: '#ff5e5e',
  },
  satText: {
    color: '#4f6dff',
  },
  dayCell: {
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#f0f0f0',
  },
  selectedCell: {
    backgroundColor: '#4f6dff',
  },
  dayNum: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    marginBottom: 3,
  },
  todayNum: {
    fontWeight: '800',
    color: '#4f6dff',
  },
  selectedNum: {
    color: '#fff',
    fontWeight: '700',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 12,
  },
  noMeal: {
    fontSize: 14,
    color: '#aaa',
    fontStyle: 'italic',
  },
  mealTimeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    minWidth: 44,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  mealText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});
