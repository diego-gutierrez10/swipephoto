/**
 * SwipeTestScreen.tsx
 * 
 * Test screen to demonstrate swipe gesture functionality
 */

import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SwipeTestCard } from '../components/swipe/SwipeTestCard';
import { SwipePhotoCard } from '../components/swipe/SwipePhotoCard';

export const SwipeTestScreen: React.FC = () => {
  const [showPhotoCard, setShowPhotoCard] = useState(false);

  const handlePhotoDelete = () => {
    console.log('Photo deleted!');
  };

  const handlePhotoKeep = () => {
    console.log('Photo kept!');
  };

  const handleImagePress = () => {
    console.log('Image pressed - could open full screen view');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.header}>
            SwipePhoto Gesture Test
          </Text>
          <Text style={styles.subtitle}>
            Test the core swipe mechanics
          </Text>
          
          {/* Toggle Button */}
          <TouchableOpacity 
            style={styles.toggleButton}
            onPress={() => setShowPhotoCard(!showPhotoCard)}
          >
            <Text style={styles.toggleButtonText}>
              {showPhotoCard ? '🧪 Show Debug Card' : '📷 Show Photo Card'}
            </Text>
          </TouchableOpacity>
          
          {/* Conditional Card Display */}
          {showPhotoCard ? (
            <SwipePhotoCard
              imageSource={{
                uri: 'https://picsum.photos/800/600?random=2'
              }}
              altText="Test photo for SwipePhotoCard"
              metadata={{
                date: new Date().toLocaleDateString(),
                fileSize: '3.2 MB',
                location: 'Mountain View, CA',
                sourceApp: 'SwipePhoto Demo'
              }}
              onDelete={handlePhotoDelete}
              onKeep={handlePhotoKeep}
              onImagePress={handleImagePress}
              showMetadata={true}
              showDebugInfo={true}
            />
          ) : (
            <SwipeTestCard title="Swipe Me!" />
          )}
          
          <Text style={styles.instructions}>
            Use your finger to swipe the card{'\n'}
            Left = Delete | Right = Keep
            {showPhotoCard && '\n\nTap image to open full view (Task 6.1)'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
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
    marginBottom: 20,
  },
  toggleButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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