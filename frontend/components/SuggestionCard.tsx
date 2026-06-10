import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ImageSourcePropType,
  Dimensions,
} from 'react-native';
import { Colors, Fonts } from '../constants/theme';

const SCREEN_W = Dimensions.get('window').width;
const CARD_W = Math.floor(SCREEN_W * 0.85);
const BOTTLE_W = 100;
const BOTTLE_H = 240;
const BOTTLE_OVERFLOW = 60; // px que la bouteille dépasse en haut de la card
const CARD_HEIGHT = 220;    // hauteur fixe = toutes les cards identiques
const CARD_PAD = 16;
const TEXT_OFFSET_LEFT = CARD_PAD + BOTTLE_W + 10; // texte commence après la bouteille

interface Props {
  name: string;
  abv: string;
  description: string;
  bgColor: string;
  image: ImageSourcePropType;
}

export function SuggestionCard({ name, abv, description, bgColor, image }: Props) {
  const isLight = bgColor === Colors.jaune || bgColor === Colors.rose;
  const textPrimary = isLight ? Colors.noir : Colors.blanc;
  const textSecondary = isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.75)';
  const iconTint = isLight ? Colors.noir : Colors.blanc;

  return (
    <View style={styles.outerWrapper}>
      {/* Card colorée, commence SOUS la partie overflow de la bouteille */}
      <View style={[styles.card, { backgroundColor: bgColor }]}>
        <View style={styles.textBlock}>
          <Text style={[styles.name, { color: textPrimary }]}>{name}</Text>
          <Text style={[styles.abv, { color: textSecondary }]}>{abv}</Text>
          <Text style={[styles.description, { color: textSecondary }]}>
            {description}
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity activeOpacity={1} style={[styles.iconBtn]}>
            <Image
              // eslint-disable-next-line @typescript-eslint/no-require-imports
              source={require('../assets/etoile blanche.png')}
              style={[styles.icon, { tintColor: iconTint }]}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={1} style={[styles.iconBtn]}>
            <Image
              // eslint-disable-next-line @typescript-eslint/no-require-imports
              source={require('../assets/coeur blanc.png')}
              style={[styles.icon, { tintColor: iconTint }]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
      {/* Bouteille absolue : top:0 = haut du wrapper => dépasse la card de BOTTLE_OVERFLOW px */}
      <Image source={image} style={styles.bottle} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    width: CARD_W,
    height: CARD_HEIGHT + BOTTLE_OVERFLOW, // hauteur fixe → toutes les cards égales
    marginRight: 12,
    paddingTop: BOTTLE_OVERFLOW,
  },
  card: {
    flex: 1,                   // s'étire pour remplir le wrapper (effet stretch)
    borderRadius: 20,
    paddingTop: CARD_PAD,
    paddingBottom: CARD_PAD,
    paddingLeft: TEXT_OFFSET_LEFT,
    paddingRight: CARD_PAD,
    justifyContent: 'space-between',
  },
  textBlock: {
    flex: 1,
    flexShrink: 1,
  },
  name: {
    fontFamily: Fonts.title,
    fontSize: 20,
    lineHeight: 23,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  abv: {
    fontFamily: Fonts.body,
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  description: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 17,
    flexWrap: 'wrap',
  },
  bottle: {
    position: 'absolute',
    top: 0,         // haut du wrapper → dépasse la card de BOTTLE_OVERFLOW px
    left: CARD_PAD, // aligné avec le bord interne gauche de la card
    width: BOTTLE_W,
    height: BOTTLE_H,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
});
