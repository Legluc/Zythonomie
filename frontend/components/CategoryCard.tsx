import React from 'react';
import {
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ImageSourcePropType,
} from 'react-native';
import { Fonts } from '../constants/theme';

interface Props {
  label: string;
  bgColor: string;
  textColor: string;
  image: ImageSourcePropType;
}

export function CategoryCard({ label, bgColor, textColor, image }: Props) {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: bgColor }]}
      activeOpacity={1}
    >
      <Text style={[styles.label, { color: textColor }]}>
        {label}
      </Text>
      <Image source={image} style={styles.icon} resizeMode="contain" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 174,
    height: 174,
    borderRadius: 16,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  icon: {
    width: 100,
    height: 100,
    marginTop: 4,
  },
  label: {
    fontFamily: Fonts.body,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
});
