import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#FF4F2E', // Brand Coral
  '#FFC857', // Amber Gold
  '#34C759', // Lime Emerald
  '#FF375F', // Rose Pink
  '#5856D6', // Electric Indigo
  '#007AFF', // Azure Blue
  '#AF52DE', // Royal Purple
  '#30D158', // Spring Green
  '#FFD60A', // Sunshine Yellow
  '#FFFFFF', // Sparkle White
];

interface Particle {
  id: number;
  color: string;
  width: number;
  height: number;
  borderRadius: number;
  targetX: number;
  targetY: number;
  rotation: string;
  delay: number;
  wobbleX: number;
}

const PARTICLE_COUNT = 65;

const generateParticles = (): Particle[] => {
  const particles: Particle[] = [];
  const startX = SCREEN_WIDTH / 2;
  const startY = SCREEN_HEIGHT * 0.42;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Random angle with bias outward and upward
    const angle = Math.random() * Math.PI * 2;
    const velocity = 80 + Math.random() * 220;
    const spreadX = Math.cos(angle) * velocity * 1.3;
    const initialY = Math.sin(angle) * velocity;
    // Gravity pulls down
    const gravity = 200 + Math.random() * 320;
    const targetY = initialY + gravity;

    const isCircle = Math.random() > 0.65;
    const isRibbon = !isCircle && Math.random() > 0.5;
    const pWidth = isRibbon ? 6 : isCircle ? 8 : 9;
    const pHeight = isRibbon ? 16 : isCircle ? 8 : 10;
    const borderRadius = isCircle ? 4 : 2;

    const spins = (Math.random() > 0.5 ? 1 : -1) * (2 + Math.floor(Math.random() * 4));

    particles.push({
      id: i,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      width: pWidth,
      height: pHeight,
      borderRadius,
      targetX: spreadX,
      targetY,
      rotation: `${spins * 360}deg`,
      delay: Math.random() * 250,
      wobbleX: (Math.random() - 0.5) * 40,
    });
  }

  return particles;
};

export const ConfettiBurst: React.FC = () => {
  const particles = useRef(generateParticles()).current;
  const animValues = useRef(
    particles.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = animValues.map((anim, index) => {
      const p = particles[index];
      return Animated.sequence([
        Animated.delay(p.delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 2400 + Math.random() * 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start();
  }, [animValues, particles]);

  const originX = SCREEN_WIDTH / 2;
  const originY = SCREEN_HEIGHT * 0.42;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, index) => {
        const anim = animValues[index];

        const translateX = anim.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [originX, originX + p.targetX * 0.6 + p.wobbleX, originX + p.targetX],
        });

        const translateY = anim.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [originY, originY - 60 + p.targetY * 0.3, originY + p.targetY],
        });

        const rotate = anim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', p.rotation],
        });

        const scale = anim.interpolate({
          inputRange: [0, 0.15, 0.8, 1],
          outputRange: [0.2, 1.2, 0.9, 0.4],
        });

        const opacity = anim.interpolate({
          inputRange: [0, 0.1, 0.75, 1],
          outputRange: [0, 1, 0.9, 0],
        });

        return (
          <Animated.View
            key={p.id}
            style={[
              styles.particle,
              {
                width: p.width,
                height: p.height,
                borderRadius: p.borderRadius,
                backgroundColor: p.color,
                transform: [
                  { translateX },
                  { translateY },
                  { rotate },
                  { scale },
                ],
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
