import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, MapPin, Swords, Shield, User } from 'lucide-react-native';
import { FeedScreen } from '../screens/FeedScreen';
import { MapsScreen } from '../screens/MapsScreen';
import { BattleScreen } from '../screens/BattleScreen';
import { ClanScreen } from '../screens/ClanScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

export type MainTabParamList = {
  Anasayfa: undefined;
  Haritalar: undefined;
  Savaş: undefined;
  Clan: undefined;
  Profil: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#F43F5E',
        tabBarInactiveTintColor: '#71717A',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Anasayfa"
        component={FeedScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home size={size || 22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Haritalar"
        component={MapsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MapPin size={size || 22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Savaş"
        component={BattleScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Swords size={size || 22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Clan"
        component={ClanScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Shield size={size || 22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <User size={size || 22} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#121215',
    borderTopWidth: 1,
    borderTopColor: '#27272A',
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
