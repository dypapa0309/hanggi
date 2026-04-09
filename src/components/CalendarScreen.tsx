import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useAppStore } from '../store';
import rawMenusData from '../data/menus.json';
import AppShell from './AppShell';
import { theme } from '../theme';

// --- 기록 뷰 ---
function LogView() {
  const { mealLogs } = useAppStore();
  const menus = rawMenusData as { id: string; name: string }[];

  const logData = useMemo(() => {
    const days = 14;
    const today = new Date();
    const map: Record<string, { time: string; timeLabel: string; meals: { name: string }[] }[]> = {};

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
      const name = meal ? meal.name : log.mealId;
      const slot = map[key].find(t => t.time === (log.time ?? 'lunch'));
      if (slot && !slot.meals.find(m => m.name === name)) slot.meals.push({ name });
    });

    return Object.entries(map).map(([day, slots]) => ({
      day,
      slots: slots.filter(s => s.meals.length > 0),
    }));
  }, [mealLogs]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
      {logData.map(d => (
        <View key={d.day} style={logStyles.dayRow}>
          <Text style={logStyles.dayLabel}>{d.day}</Text>
          {d.slots.length === 0
            ? <Text style={logStyles.empty}>기록 없음</Text>
            : d.slots.map(s => (
              <View key={s.time} style={logStyles.slotRow}>
                <View style={logStyles.badge}>
                  <Text style={logStyles.badgeText}>{s.timeLabel}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  {s.meals.map(m => (
                    <Text key={m.name} style={logStyles.meal}>• {m.name}</Text>
                  ))}
                </View>
              </View>
            ))
          }
        </View>
      ))}
    </ScrollView>
  );
}

const logStyles = StyleSheet.create({
  dayRow: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  dayLabel: { fontSize: 15, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
  empty: { fontSize: 13, color: theme.colors.muted, fontStyle: 'italic' },
  slotRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6, minWidth: 40, alignItems: 'center' },
  badgeText: { fontSize: 11, fontWeight: '700', color: theme.colors.deep },
  meal: { fontSize: 14, color: theme.colors.muted, lineHeight: 20, marginLeft: 10 },
});

const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토'];

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

  const [showLog, setShowLog] = useState(false);
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
    <AppShell activeRoute="Calendar" title={showLog ? '기록' : '달력'}>
      {/* 토글 */}
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, !showLog && styles.toggleBtnActive]}
          onPress={() => setShowLog(false)}
        >
          <Text style={[styles.toggleText, !showLog && styles.toggleTextActive]}>달력</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, showLog && styles.toggleBtnActive]}
          onPress={() => setShowLog(true)}
        >
          <Text style={[styles.toggleText, showLog && styles.toggleTextActive]}>기록</Text>
        </TouchableOpacity>
      </View>

      {showLog ? <LogView /> : (
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 18 }}
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
                            style={styles.dot}
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
                <View style={styles.badge}>
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
            <View style={styles.dot} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
      </View>
      </ScrollView>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.pill,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignSelf: 'flex-start',
  },
  toggleBtn: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
  },
  toggleBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.muted,
  },
  toggleTextActive: {
    color: theme.colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
    color: theme.colors.primary,
    lineHeight: 36,
    fontWeight: '300',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  calendar: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
    ...theme.shadow.card,
  },
  weekRow: {
    flexDirection: 'row',
  },
  headerCell: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.muted,
  },
  sunText: {
    color: theme.colors.primary,
  },
  satText: {
    color: theme.colors.deep,
  },
  dayCell: {
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.line,
  },
  selectedCell: {
    backgroundColor: theme.colors.primary,
  },
  dayNum: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 3,
  },
  todayNum: {
    fontWeight: '800',
    color: theme.colors.primary,
  },
  selectedNum: {
    color: theme.colors.white,
    fontWeight: '700',
  },
  dotRow: {
    flexDirection: 'row',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginHorizontal: 1,
    backgroundColor: theme.colors.primary,
  },
  detailCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
    ...theme.shadow.card,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  noMeal: {
    fontSize: 14,
    color: theme.colors.muted,
    fontStyle: 'italic',
  },
  mealTimeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: theme.colors.primarySoft,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    minWidth: 44,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.deep,
  },
  mealText: {
    fontSize: 14,
    color: theme.colors.muted,
    lineHeight: 20,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  legendText: {
    fontSize: 12,
    color: theme.colors.muted,
    marginLeft: 5,
  },
});
