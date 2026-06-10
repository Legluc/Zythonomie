import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Colors, Fonts } from '../constants/theme';

const TABS = [
  {
    key: 'accueil',
    label: 'Accueil',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    icon: require('../assets/accueil.png'),
  },
  {
    key: 'glossaire',
    label: 'Glossaire',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    icon: require('../assets/glossaire.png'),
  },
  {
    key: 'zythotheque',
    label: 'Zythothèque',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    icon: require('../assets/chope.png'),
  },
  {
    key: 'scan',
    label: 'Scan',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    icon: require('../assets/scan.png'),
  },
  {
    key: 'profil',
    label: 'Profil',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    icon: require('../assets/profile.png'),
  },
];

export function TabBar() {
  const [active, setActive] = useState('accueil');

  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => setActive(tab.key)}
            activeOpacity={0.8}
          >
            <Image
              source={tab.icon}
              style={[styles.icon, { tintColor: isActive ? Colors.vert : '#000000' }]}
              resizeMode="contain"
            />
            <Text style={[styles.label, { color: isActive ? Colors.vert : '#000000' }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.blanc,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,

  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  icon: {
    width: 24,
    height: 24,
  },
  label: {
    fontFamily: Fonts.body,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});
