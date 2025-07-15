import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface MainSwipeHeaderProps {
  navigation?: any;
  sessionTitle?: string;
  onBackPress?: () => void;
  onSettingsPress?: () => void;
  showSettingsButton?: boolean;
  currentPhoto?: number;
  totalPhotos?: number;
}

export const MainSwipeHeader: React.FC<MainSwipeHeaderProps> = ({
  navigation,
  sessionTitle = "Organize Photos",
  onBackPress,
  onSettingsPress,
  showSettingsButton = true,
  currentPhoto,
  totalPhotos,
}) => {
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation) {
      navigation.goBack();
    }
  };

  const handleSettingsPress = () => {
    if (onSettingsPress) {
      onSettingsPress();
    } else {
      // Default settings action - could open a settings modal
      console.log('Settings pressed');
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBackPress}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>

      {/* Session Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.sessionTitle} numberOfLines={1}>
          {sessionTitle}
        </Text>
        {currentPhoto && totalPhotos && (
          <Text style={styles.subtitle}>
            Photo {currentPhoto} of {totalPhotos}
          </Text>
        )}
      </View>

      {/* Settings Button or Placeholder */}
      {showSettingsButton ? (
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={handleSettingsPress}
        accessibilityRole="button"
        accessibilityLabel="Open settings"
      >
        <Text style={styles.settingsIcon}>⚙️</Text>
      </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent to not distract
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%', // Ensure it takes full width
    zIndex: 10, // Ensure header is above the content
  },
  backButton: {
    width: 44, // Minimum touch target
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  backIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8, // Minimum spacing
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  settingsButton: {
    width: 44, // Minimum touch target
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  settingsIcon: {
    fontSize: 20,
    color: '#fff',
  },
  placeholder: {
    width: 44,
    height: 44,
  },
});

export default MainSwipeHeader; 