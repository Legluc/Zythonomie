import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ImageSourcePropType,
} from 'react-native';
import { Colors, Fonts } from '../constants/theme';

interface Props {
  name: string;
  bgColor: string;
  image: ImageSourcePropType;
}

const CARD_W = 130;
const BOTTLE_W = 65;
const BOTTLE_H = 120;
const OVERFLOW = 40; // px que la bouteille dépasse en haut de la card

export function BeerCard({ name, bgColor, image }: Props) {
  const isDark = bgColor === Colors.bleu || bgColor === Colors.orange;
  const textColor = isDark ? Colors.blanc : Colors.noir;

  return (
    <TouchableOpacity style={styles.wrapper} activeOpacity={1}>
      {/* Fond coloré, commence SOUS la partie overflow de la bouteille */}
      <View style={[styles.card, { backgroundColor: bgColor }]}>
        <View style={styles.info}>
          <Text style={[styles.name, { color: textColor }]}>{name}</Text>
        </View>
      </View>
      {/* Bouteille absolue : top:0 = haut du wrapper => dépasse la card de OVERFLOW px */}
      <Image source={image} style={styles.bottle} resizeMode="contain" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: CARD_W,
    marginRight: 12,
    paddingTop: OVERFLOW, // espace réservé au-dessus de la card pour l'overflow
  },
  card: {
    borderRadius: 20,
    height: 140,
    paddingTop: BOTTLE_H - OVERFLOW + 8, // place pour la bouteille dans la card + marge
    paddingBottom: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  bottle: {
    position: 'absolute',
    top: 0,                          // haut du wrapper => dépasse la card de OVERFLOW px
    left: (CARD_W - BOTTLE_W) / 2,  // centré horizontalement
    width: BOTTLE_W,
    height: BOTTLE_H,
  },
  info: {
    width: '100%',
    alignItems: 'center',
  },
  name: {
    fontFamily: Fonts.title,
    fontSize: 15,
    lineHeight: 18,
    textAlign: 'center',
  },
});
