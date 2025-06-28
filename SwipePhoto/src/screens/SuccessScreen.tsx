import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import LottieAnimation from '../components/common/LottieAnimation';

const SuccessScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Success!</Text>
      <LottieAnimation source={require('../assets/animations/success.json')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    marginBottom: 20,
  },
});

export default SuccessScreen; 