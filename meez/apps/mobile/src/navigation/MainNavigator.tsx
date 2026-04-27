import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/home/HomeScreen';
import MeetingsScreen from '../screens/meetings/MeetingsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#000', tabBarInactiveTintColor: '#999', tabBarStyle: { borderTopWidth: 0.5, borderTopColor: '#e5e5e5', paddingTop: 8, height: 88 } }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Meetings" component={MeetingsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
