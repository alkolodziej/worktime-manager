import React from 'react';
import { StatusBar } from 'expo-status-bar';
import RootNavigation from './src/navigation/BottomTabs';

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <RootNavigation />
    </>
  );
}
