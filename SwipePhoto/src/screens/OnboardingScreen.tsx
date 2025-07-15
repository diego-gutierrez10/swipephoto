import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Dimensions, Image, TouchableOpacity, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieAnimation from '../components/common/LottieAnimation';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    key: '1',
    title: 'Welcome to SwipePhoto',
    text: 'Effortlessly organize your photo gallery with simple swipes.',
    animation: require('../assets/animations/onboarding.json'),
    color: '#007AFF',
    speed: 0.5,
  },
  {
    key: '2',
    title: 'Swipe Right to Keep',
    text: 'Keep the photos you love.',
    animation: require('../assets/animations/right.json'),
    color: '#39FF14',
  },
  {
    key: '3',
    title: 'Swipe Left to Discard',
    text: 'Quickly mark photos for deletion.',
    animation: require('../assets/animations/left.json'),
    color: '#FF3131',
  },
  {
    key: '4',
    title: 'Tap to Undo',
    text: 'Made a mistake? Just tap the photo to undo.',
    animation: require('../assets/animations/touchundo.json'),
    color: '#8A2BE2',
  },
  {
    key: '5',
    title: 'Ready to Start?',
    text: "Let's get your photo library organized.",
    animation: require('../assets/animations/rocket.json'),
    color: '#DFFF00',
  },
];

type OnboardingNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

const OnboardingScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const navigation = useNavigation<OnboardingNavigationProp>();

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollToNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };
  
  const handleGetStarted = async () => {
    try {
      if (dontShowAgain) {
        await AsyncStorage.setItem('@hasOnboarded', 'true');
      }
      navigation.replace('PrePermissionRationale');
    } catch (e) {
      console.error('Failed to save onboarding status', e);
      // Still navigate, but log the error
      navigation.replace('PrePermissionRationale');
    }
  };

  const renderItem = ({ item }: { item: typeof slides[0] }) => (
    <View style={styles.slide}>
      <LottieAnimation
        source={item.animation}
        color={item.color}
        speed={item.speed}
      />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.text}>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />
      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index ? styles.dotActive : null,
              ]}
            />
          ))}
        </View>
        <View style={styles.buttonContainer}>
          {currentIndex === slides.length - 1 ? (
            <>
              <TouchableOpacity style={[styles.button, styles.getStartedButton]} onPress={handleGetStarted}>
                <Text style={styles.buttonText}>Get Started</Text>
              </TouchableOpacity>
              <View style={styles.dontShowAgainContainer}>
                <Switch
                  trackColor={{ false: '#767577', true: '#007AFF' }}
                  thumbColor={dontShowAgain ? '#f4f3f4' : '#f4f3f4'}
                  ios_backgroundColor="#3e3e3e"
                  onValueChange={setDontShowAgain}
                  value={dontShowAgain}
                />
                <Text style={styles.dontShowAgainText}>Don't show this again</Text>
              </View>
            </>
          ) : (
            <TouchableOpacity style={styles.button} onPress={scrollToNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 100, // Make space for footer
  },
  image: {
    width: width * 0.7,
    height: width * 0.7,
    resizeMode: 'contain',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#555',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#fff',
  },
  buttonContainer: {
    width: '80%',
  },
  button: {
    backgroundColor: '#333',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  getStartedButton: {
    backgroundColor: '#007AFF', // A more prominent color for the final action
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dontShowAgainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  dontShowAgainText: {
    color: '#ccc',
    marginLeft: 10,
    fontSize: 14,
  },
});

export default OnboardingScreen; 