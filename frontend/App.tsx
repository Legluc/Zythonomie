import React from 'react';
import { View, StatusBar, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import { Colors } from './constants/theme';
import { HomeScreen } from './screens/HomeScreen';
import { TabBar } from './components/TabBar';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Asphalt-Black': require('./assets/fonnts.com-Asphalt_Black.otf'),
    DMSans: require('./assets/DM_Sans/DMSans-VariableFont_opsz,wght.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.blanc} />
      <HomeScreen />
      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.blanc,
  },
});
