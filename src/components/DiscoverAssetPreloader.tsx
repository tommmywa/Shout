import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';

export const DISCOVER_ASSETS = [
  require('../../assets/images/hero_card_bg.png'),
  require('../../assets/images/hero_at_crystal.png'),
  require('../../assets/images/crystal_mic.png'),
  require('../../assets/images/crystal_vinyl.png'),
];

export const preloadDiscoverAssets = () => {
  try {
    DISCOVER_ASSETS.forEach((asset) => {
      const resolved = Image.resolveAssetSource(asset);
      if (resolved?.uri) {
        Image.prefetch(resolved.uri);
      }
    });
  } catch {
    // Non-blocking fallback
  }
};

export const DiscoverAssetPreloader: React.FC = () => {
  useEffect(() => {
    preloadDiscoverAssets();
  }, []);

  return (
    <View style={styles.hiddenContainer} pointerEvents="none">
      {DISCOVER_ASSETS.map((asset, index) => (
        <Image key={index} source={asset} style={styles.hiddenImage} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    top: -9999,
    left: -9999,
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
  hiddenImage: {
    width: 1,
    height: 1,
  },
});
