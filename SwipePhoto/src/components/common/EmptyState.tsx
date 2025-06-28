import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LottieAnimation from './LottieAnimation';

type LottieSource = string | { uri: string } | number;

interface EmptyStateProps {
  title: string;
  description: string;
  lottieSource: LottieSource;
  buttonText?: string;
  onButtonPress?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  lottieSource,
  buttonText,
  onButtonPress,
}) => {
  return (
    <View style={styles.container}>
      <LottieAnimation
        source={lottieSource}
        width={200}
        height={200}
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {buttonText && onButtonPress && (
        <TouchableOpacity style={styles.button} onPress={onButtonPress}>
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EmptyState; 