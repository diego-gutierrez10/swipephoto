/**
 * SwipeTestScreen.tsx
 * 
 * Test screen to demonstrate swipe gesture functionality
 */

import React from 'react';
import { View, StyleSheet, SafeAreaView, Text } from 'react-native';
import { SwipeTestCard } from '../components/swipe/SwipeTestCard';

export const SwipeTestScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>
          SwipePhoto Gesture Test
        </Text>
        <Text style={styles.subtitle}>
          Test the core swipe mechanics
        </Text>
        
        <SwipeTestCard title="Swipe Me!" />
        
        <Text style={styles.instructions}>
          Use your finger to swipe the card{'\n'}
          Left = Delete | Right = Keep
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00FF41',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 40,
  },
  instructions: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 20,
  },
});

export default SwipeTestScreen; 