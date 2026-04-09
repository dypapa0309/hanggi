import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { theme } from '../theme';
import { MealIllustrationKey } from '../config/mealMeta';

export default function MealIllustration({
  kind,
  size = 88,
}: {
  kind: MealIllustrationKey;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.36,
        backgroundColor: theme.colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={size * 0.78} height={size * 0.78} viewBox="0 0 88 88">
        {renderIllustration(kind)}
      </Svg>
    </View>
  );
}

function BowlBase() {
  return (
    <>
      <Ellipse cx="44" cy="50" rx="28" ry="12" fill="#FFF1DE" />
      <Path d="M20 48C22 62 31 72 44 72C57 72 66 62 68 48Z" fill="#FFFCF7" />
      <Path d="M22 49H66" stroke="#D8C7B3" strokeWidth="2.5" strokeLinecap="round" />
    </>
  );
}

function renderIllustration(kind: MealIllustrationKey) {
  switch (kind) {
    case 'tofu_stew':
      return (
        <>
          <BowlBase />
          <Ellipse cx="44" cy="44" rx="23" ry="9.5" fill="#FF8D5C" />
          <Rect x="29" y="37" width="11" height="8" rx="2.5" fill="#FFF3E4" />
          <Rect x="46" y="39" width="10" height="7" rx="2.5" fill="#FFF3E4" />
          <Circle cx="41" cy="43" r="3" fill="#FFD67D" />
        </>
      );
    case 'bibimbap':
      return (
        <>
          <BowlBase />
          <Ellipse cx="44" cy="44" rx="23" ry="9.5" fill="#F7F1D5" />
          <Rect x="25" y="39" width="11" height="4" rx="2" fill="#F28F4B" />
          <Rect x="37" y="38" width="10" height="4" rx="2" fill="#B88A62" />
          <Rect x="49" y="39" width="12" height="4" rx="2" fill="#F2C94C" />
          <Circle cx="44" cy="45" r="5" fill="#FFF7E0" />
          <Circle cx="44" cy="45" r="2.5" fill="#FFC85E" />
        </>
      );
    case 'salad':
      return (
        <>
          <BowlBase />
          <Ellipse cx="44" cy="44" rx="23" ry="9.5" fill="#F6D7B8" />
          <Circle cx="34" cy="43" r="5" fill="#D89B5E" />
          <Circle cx="47" cy="40" r="5" fill="#B6744C" />
          <Circle cx="55" cy="45" r="4.5" fill="#F29B65" />
          <Rect x="27" y="48" width="24" height="3" rx="1.5" fill="#FFF3E4" transform="rotate(-12 27 48)" />
        </>
      );
    case 'rice_noodle':
      return (
        <>
          <BowlBase />
          <Ellipse cx="44" cy="44" rx="23" ry="9.5" fill="#F6EBD3" />
          <Path d="M28 42C34 38 41 38 48 42C54 46 60 45 61 42" stroke="#F1D8A8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <Path d="M27 47C33 43 41 43 47 47C54 51 59 50 61 47" stroke="#F1D8A8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <Rect x="51" y="36" width="8" height="3" rx="1.5" fill="#B97A52" />
          <Rect x="31" y="37" width="8" height="3" rx="1.5" fill="#D39A63" />
        </>
      );
    case 'kimbap':
      return (
        <>
          <Rect x="19" y="34" width="50" height="18" rx="9" fill="#1F2A2A" />
          <Rect x="24" y="38" width="12" height="10" rx="5" fill="#FFF6E1" />
          <Rect x="39" y="38" width="12" height="10" rx="5" fill="#FFF6E1" />
          <Rect x="54" y="38" width="10" height="10" rx="5" fill="#FFF6E1" />
          <Circle cx="30" cy="43" r="2" fill="#F2C94C" />
          <Circle cx="45" cy="43" r="2" fill="#B97A52" />
          <Circle cx="59" cy="43" r="2" fill="#F28F4B" />
        </>
      );
    case 'bulgogi':
      return (
        <>
          <BowlBase />
          <Ellipse cx="44" cy="44" rx="23" ry="9.5" fill="#F6D6B8" />
          <Path d="M28 44C30 38 35 37 40 41C44 45 50 45 54 40C58 36 61 39 61 44" stroke="#9B5A39" strokeWidth="4" strokeLinecap="round" fill="none" />
          <Rect x="31" y="38" width="8" height="3" rx="1.5" fill="#B97A52" />
          <Rect x="50" y="46" width="8" height="3" rx="1.5" fill="#D39A63" />
        </>
      );
    case 'samgyetang':
      return (
        <>
          <BowlBase />
          <Ellipse cx="44" cy="44" rx="23" ry="9.5" fill="#F4E4B5" />
          <Ellipse cx="44" cy="44" rx="10" ry="6.5" fill="#FFF6E2" />
          <Rect x="32" y="42" width="5" height="2.5" rx="1.25" fill="#D8C07B" />
          <Rect x="52" y="42" width="5" height="2.5" rx="1.25" fill="#D8C07B" />
          <Circle cx="44" cy="38" r="2.2" fill="#C56B47" />
        </>
      );
    case 'rice_soup':
      return (
        <>
          <BowlBase />
          <Ellipse cx="44" cy="44" rx="23" ry="9.5" fill="#E9D9C6" />
          <Rect x="29" y="40" width="12" height="4" rx="2" fill="#FFF2E6" />
          <Rect x="43" y="43" width="16" height="4" rx="2" fill="#FFF2E6" />
          <Rect x="46" y="36" width="3" height="9" rx="1.5" fill="#B97A52" />
        </>
      );
    case 'kalguksu':
      return (
        <>
          <BowlBase />
          <Ellipse cx="44" cy="44" rx="23" ry="9.5" fill="#F6E6C1" />
          <Path d="M28 42C33 39 38 39 43 42C48 45 53 45 59 42" stroke="#E6C87A" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <Path d="M28 47C33 44 38 44 43 47C48 50 53 50 59 47" stroke="#E6C87A" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <Rect x="31" y="37" width="7" height="3" rx="1.5" fill="#B97A52" />
          <Rect x="51" y="38" width="7" height="3" rx="1.5" fill="#B97A52" />
        </>
      );
    default:
      return (
        <>
          <Rect x="20" y="26" width="48" height="30" rx="12" fill="#FFF4E4" />
          <Rect x="28" y="34" width="32" height="14" rx="7" fill="#F3A957" opacity="0.65" />
          <Circle cx="35" cy="41" r="3" fill="#FFFFFF" />
          <Circle cx="44" cy="41" r="3" fill="#FFFFFF" />
          <Circle cx="53" cy="41" r="3" fill="#FFFFFF" />
        </>
      );
  }
}
