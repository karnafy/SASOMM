import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../../theme';

interface CategorySeries {
  key: 'projects' | 'personal' | 'other';
  values: number[];
}

interface CategoryTrendChartProps {
  series: CategorySeries[];
  width?: number;
  height?: number;
}

const CATEGORY_COLORS: Record<CategorySeries['key'], string> = {
  projects: '#00D9D9',
  personal: '#FFB020',
  other: '#FF4D6A',
};

function buildSmoothPath(values: number[], width: number, height: number, padding: number): string {
  if (values.length === 0) return '';
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const range = max - min || 1;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const points = values.map((v, i) => {
    const x = padding + (i / Math.max(values.length - 1, 1)) * innerW;
    const y = padding + innerH - ((v - min) / range) * innerH;
    return { x, y };
  });

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  // Smooth Catmull-Rom-ish curve via cubic Béziers between adjacent points
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export function CategoryTrendChart({
  series,
  width = 140,
  height = 80,
}: CategoryTrendChartProps): React.ReactElement {
  const padding = 4;
  const hasData = series.some((s) => s.values.some((v) => v !== 0));

  return (
    <View style={[styles.wrap, { width, height }]} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          {series.map((s) => (
            <LinearGradient
              key={`grad-${s.key}`}
              id={`grad-${s.key}`}
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <Stop offset="0" stopColor={CATEGORY_COLORS[s.key]} stopOpacity="0.15" />
              <Stop offset="1" stopColor={CATEGORY_COLORS[s.key]} stopOpacity="0.85" />
            </LinearGradient>
          ))}
        </Defs>
        {hasData &&
          series.map((s) => {
            const d = buildSmoothPath(s.values, width, height, padding);
            if (!d) return null;
            return (
              <Path
                key={s.key}
                d={d}
                stroke={`url(#grad-${s.key})`}
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity={0.85}
              />
            );
          })}
        {!hasData && (
          <Path
            d={`M ${padding} ${height / 2} L ${width - padding} ${height / 2}`}
            stroke={colors.textTertiary}
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.4}
          />
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
});
