import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { usePhotoPermissions } from '../../hooks';
import PermissionRequestScreen from './PermissionRequestScreen';
import PermissionModal from './PermissionModal';
import PermissionIcon from '../ui/PermissionIcon';

/**
 * Test screen to demonstrate permission components
 * This is for development and testing purposes
 */
export const PermissionTestScreen: React.FC = () => {
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContext, setModalContext] = useState<'photo-picker' | 'organize' | 'camera' | 'general'>('general');
  
  const {
    status,
    isLoading,
    hasPermission,
    canRequest,
    needsSettings,
    clearCache,
    getRequestHistory,
  } = usePhotoPermissions();

  const handlePermissionGranted = (status: string) => {
    console.log('Permission granted:', status);
    setShowFullScreen(false);
    setShowModal(false);
  };

  const handlePermissionDenied = (status: string) => {
    console.log('Permission denied:', status);
  };

  const requestHistory = getRequestHistory();

  if (showFullScreen) {
    return (
      <PermissionRequestScreen
        onPermissionGranted={handlePermissionGranted}
        onPermissionDenied={handlePermissionDenied}
        onSkip={() => setShowFullScreen(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Permission Components Test</Text>
        
        {/* Current Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Permission Status</Text>
          <View style={styles.statusContainer}>
            <PermissionIcon status={status} size={48} />
            <View style={styles.statusInfo}>
              <Text style={styles.statusText}>Status: {status}</Text>
              <Text style={styles.statusSubtext}>
                {hasPermission ? '✅ Has Permission' : '❌ No Permission'}
              </Text>
              <Text style={styles.statusSubtext}>
                {canRequest ? '🔄 Can Request' : '⏹️ Cannot Request'}
              </Text>
              <Text style={styles.statusSubtext}>
                {needsSettings ? '⚙️ Needs Settings' : '✨ Normal Flow'}
              </Text>
            </View>
          </View>
          {isLoading && (
            <Text style={styles.loadingText}>⏳ Loading...</Text>
          )}
        </View>

        {/* Request History */}
        {requestHistory && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Request History</Text>
            <View style={styles.historyContainer}>
              <Text style={styles.historyText}>
                Requests: {requestHistory.requestCount}
              </Text>
              <Text style={styles.historyText}>
                Last Checked: {requestHistory.lastChecked.toLocaleTimeString()}
              </Text>
              {requestHistory.lastRequested && (
                <Text style={styles.historyText}>
                  Last Requested: {requestHistory.lastRequested.toLocaleTimeString()}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Test Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Components</Text>
          
          <Pressable
            style={styles.testButton}
            onPress={() => setShowFullScreen(true)}
          >
            <Ionicons name="phone-portrait" size={20} color={colors.background} />
            <Text style={styles.testButtonText}>Show Full Screen Request</Text>
          </Pressable>

          <Text style={styles.modalTitle}>Modal Contexts:</Text>
          
          <Pressable
            style={styles.testButton}
            onPress={() => {
              setModalContext('photo-picker');
              setShowModal(true);
            }}
          >
            <Ionicons name="images" size={20} color={colors.background} />
            <Text style={styles.testButtonText}>Photo Picker Context</Text>
          </Pressable>

          <Pressable
            style={styles.testButton}
            onPress={() => {
              setModalContext('organize');
              setShowModal(true);
            }}
          >
            <Ionicons name="albums" size={20} color={colors.background} />
            <Text style={styles.testButtonText}>Organize Context</Text>
          </Pressable>

          <Pressable
            style={styles.testButton}
            onPress={() => {
              setModalContext('camera');
              setShowModal(true);
            }}
          >
            <Ionicons name="camera" size={20} color={colors.background} />
            <Text style={styles.testButtonText}>Camera Context</Text>
          </Pressable>

          <Pressable
            style={styles.testButton}
            onPress={() => {
              setModalContext('general');
              setShowModal(true);
            }}
          >
            <Ionicons name="settings" size={20} color={colors.background} />
            <Text style={styles.testButtonText}>General Context</Text>
          </Pressable>
        </View>

        {/* Utility Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Utility Actions</Text>
          
          <Pressable
            style={[styles.testButton, styles.secondaryButton]}
            onPress={clearCache}
          >
            <Ionicons name="refresh" size={20} color={colors.primary} />
            <Text style={[styles.testButtonText, styles.secondaryButtonText]}>
              Clear Cache
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Modal */}
      <PermissionModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onPermissionGranted={handlePermissionGranted}
        onPermissionDenied={handlePermissionDenied}
        context={modalContext}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  statusInfo: {
    marginLeft: 16,
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  loadingText: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
    marginTop: 10,
  },
  historyContainer: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  historyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 12,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
});

export default PermissionTestScreen; 