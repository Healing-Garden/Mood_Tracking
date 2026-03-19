import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DashboardScreen({ route }) {
  const user = route.params?.user || {};
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {user.email || 'User'}!</Text>
      <Text style={styles.subtitle}>This is your dashboard (sample).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
  },
});
