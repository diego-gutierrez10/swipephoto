import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import LottieAnimation from './common/LottieAnimation';

interface RecoveryDialogProps {
  isVisible: boolean;
  onAttemptRecovery: () => void;
  onStartNewSession: () => void;
}

const RecoveryDialog: React.FC<RecoveryDialogProps> = ({
  isVisible,
  onAttemptRecovery,
  onStartNewSession,
}) => {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={isVisible}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.dialog}>
          <LottieAnimation
            source={require('../assets/animations/rocket.json')}
            width={150}
            height={150}
          />
          <Text style={styles.title}>Something Went Wrong</Text>
          <Text style={styles.description}>
            It looks like the app didn't shut down correctly. We can try to recover your last session, or you can start fresh.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={onAttemptRecovery}>
            <Text style={styles.primaryButtonText}>Attempt to Recover Session</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={onStartNewSession}>
            <Text style={styles.secondaryButtonText}>Start a New Session</Text>
            </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  dialog: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    padding: 10,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 15,
  },
}); 

export default RecoveryDialog; 