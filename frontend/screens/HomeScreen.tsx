import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { Colors, Fonts } from '../constants/theme';
import { INCONTOURNABLES, SUGGESTIONS, CATEGORIES } from '../constants/data';
import { BeerCard } from '../components/BeerCard';
import { SuggestionCard } from '../components/SuggestionCard';
import { CategoryCard } from '../components/CategoryCard';

export function HomeScreen() {
  const statusBarHeight =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      bounces
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: statusBarHeight + 20 }]}>
        <Text style={styles.headerGreeting}>Salut l'explorateur</Text>
        <Text style={styles.headerTitle}>
          {'Explore des\nbières faites\npour toi'}
        </Text>
        <Image
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          source={require('../assets/main1.png')}
          style={styles.headerIllustration}
          resizeMode="contain"
        />
      </View>

      {/* ── Les incontournables ────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Les incontournables du moment</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.slider}
        >
          {INCONTOURNABLES.map((beer) => (
            <BeerCard key={beer.id} {...beer} />
          ))}
        </ScrollView>
      </View>

      {/* ── Nos suggestions personnalisées ─────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nos suggestions personnalisées</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.slider}
        >
          {SUGGESTIONS.map((beer) => (
            <SuggestionCard key={beer.id} {...beer} />
          ))}
        </ScrollView>
      </View>

      {/* ── Bannière Sans alcool ───────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sansAlcoolCard}>
          <View style={styles.sansAlcoolTop}>
            <Text style={styles.sansAlcoolTitle}>
              {'Sans alcool,\n100 % plaisir'}
            </Text>
            <Text style={styles.sansAlcoolDesc}>
              {'Des bières sans alcool pleines de saveurs, parfaites pour les SAM, les femmes enceintes et tous les zythos qui veulent garder le goût sans les degrés.'}
            </Text>
          </View>
          <View style={styles.sansAlcoolBottom}>
            <Image
              // eslint-disable-next-line @typescript-eslint/no-require-imports
              source={require('../assets/main2.png')}
              style={styles.sansAlcoolImg}
              resizeMode="contain"
            />
            <TouchableOpacity style={styles.sansAlcoolBtn} activeOpacity={1}>
              <Text style={styles.sansAlcoolBtnText}>Voir les bières</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Explore ton palais ─────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Explore ton palais</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.slider}
        >
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat.id} {...cat} />
          ))}
        </ScrollView>
      </View>

      {/* ── Newsletter ─────────────────────────────────────────── */}
      <View style={styles.newsletter}>
        <View style={styles.newsletterContent}>
          <Text style={styles.newsletterTitle}>
            {'La newsletter\ndes zythos'}
          </Text>
          <Text style={styles.newsletterSub}>
            Abonne toi pour ne rater aucune nouveauté ni recommandation houblonnée.
          </Text>
          <TouchableOpacity style={styles.newsletterBtn} activeOpacity={1}>
            <Text style={styles.newsletterBtnText}>Je me zyth'abonne</Text>
          </TouchableOpacity>
        </View>
        <Image
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          source={require('../assets/main3.png')}
          style={styles.newsletterIllustration}
          resizeMode="contain"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.blanc,
  },
  contentContainer: {
    paddingBottom: 90,
  },

  /* Header */
  header: {
    backgroundColor: Colors.blanc,
    paddingHorizontal: 20,
    paddingBottom: 24,
    position: 'relative'
  },
  headerGreeting: {
    fontFamily: Fonts.body,
    fontSize: 17,
    fontWeight: '500',
    color: Colors.noir,
    marginBottom: 6,
  },
  headerTitle: {
    fontFamily: Fonts.title,
    fontSize: 25,
    lineHeight: 30,
    color: Colors.vert,
  },
  headerIllustration: {
    position: 'absolute',
    right: 0,
    top: '50%'
  },

  /* Sections communes */
  section: {
    paddingTop: 24,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontFamily: Fonts.body,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.noir,
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  slider: {
    paddingLeft: 20,
    paddingRight: 8,
    paddingBottom: 8,
  },

  /* Bannière sans alcool */
  sansAlcoolCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    backgroundColor: Colors.blanc,
    borderWidth: 4,
    borderColor: Colors.jaune,
    overflow: 'hidden',
  },
  sansAlcoolTop: {
    padding: 20,
    paddingBottom: 12,
  },
  sansAlcoolTitle: {
    fontFamily: Fonts.title,
    fontSize: 20,
    lineHeight: 24,
    color: Colors.noir,
    marginBottom: 10,
  },
  sansAlcoolDesc: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.noir,
  },
  sansAlcoolBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingRight: 20,
  },
  sansAlcoolImg: {
    width: 110,
    height: 100,
  },
  sansAlcoolBtn: {
    alignSelf: 'center',
    backgroundColor: Colors.jaune,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 50,
    marginBottom: 16,
  },
  sansAlcoolBtnText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.noir,
  },

  /* Newsletter */
  newsletter: {
    backgroundColor: Colors.blanc,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 28,
    paddingLeft: 20,
    overflow: 'hidden',
  },
  newsletterContent: {
    flex: 1,
    paddingRight: 12,
    paddingBottom: 32,
  },
  newsletterTitle: {
    fontFamily: Fonts.title,
    fontSize: 20,
    lineHeight: 24,
    color: Colors.noir,
    marginBottom: 10,
  },
  newsletterSub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.noir,
    marginBottom: 20,
  },
  newsletterBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.vert,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 50,
  },
  newsletterBtnText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.blanc,
  },
  newsletterIllustration: {
    width: 130,
    height: 180,
  },
});
