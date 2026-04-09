export const theme = {
  colors: {
    primary: '#F3A957',
    primarySoft: 'rgba(243, 169, 87, 0.16)',
    deep: '#3F372F',
    surface: '#FFF7EE',
    surfaceMuted: 'rgba(63, 55, 47, 0.06)',
    white: '#FFFCF7',
    text: '#3F372F',
    muted: 'rgba(63, 55, 47, 0.68)',
    line: 'rgba(63, 55, 47, 0.12)',
    mint: 'rgba(63, 55, 47, 0.06)',
    butter: 'rgba(243, 169, 87, 0.12)',
    peach: 'rgba(243, 169, 87, 0.16)',
    danger: '#F3A957',
  },
  radius: {
    sm: 16,
    md: 24,
    lg: 32,
    pill: 999,
  },
  shadow: {
    card: {
      shadowColor: '#3F372F',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 8,
    },
  },
};

export const appRoutes = [
  { key: 'Home', label: '추천' },
  { key: 'Calendar', label: '달력' },
  { key: 'Settings', label: '설정' },
] as const;

export type AppRouteName = typeof appRoutes[number]['key'];
