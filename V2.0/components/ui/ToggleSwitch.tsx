import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../theme';

interface ToggleSwitchProps {
  value: boolean;
  onToggle: () => void;
}

const TRACK_WIDTH = 44;
const TRACK_HEIGHT = 24;
const KNOB_SIZE = 20;
const KNOB_MARGIN = 2;
const KNOB_TRAVEL = TRACK_WIDTH - KNOB_SIZE - KNOB_MARGIN * 2;

export function ToggleSwitch({ value, onToggle }: ToggleSwitchProps) {
  const translateX = useRef(new Animated.Value(value ? KNOB_TRAVEL : 0)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: value ? KNOB_TRAVEL : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [value, translateX]);

  const trackBg = value ? 'rgba(0,217,217,0.3)' : colors.bgTertiary;
  const knobColor = value ? colors.primary : colors.textTertiary;

  return (
    <Pressable
      onPress={onToggle}
      style={[styles.track, { backgroundColor: trackBg }]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <Animated.View
        style={[
          styles.knob,
          { backgroundColor: knobColor, transform: [{ translateX }] },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: 'center',
    paddingHorizontal: KNOB_MARGIN,
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
  },
});
