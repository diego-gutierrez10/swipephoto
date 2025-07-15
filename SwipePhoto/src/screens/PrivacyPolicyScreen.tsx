import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/theme/colors';

export const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleContactPress = () => {
    Linking.openURL('mailto:diegoalejandrogutierrezrios@gmail.com');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.title}>SwipeAI Privacy Policy</Text>
          <Text style={styles.lastUpdated}>Last Updated: January 2025</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Privacy Commitment</Text>
          <Text style={styles.paragraph}>
            At SwipeAI, your privacy is our top priority. We believe your photos and personal data should remain exactly where they belong - on your device, under your control.
          </Text>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightText}>
              🔒 SwipeAI operates with ZERO data collection. All photo processing happens locally on your device. We never upload, transmit, or access your photos through external servers.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information We Access</Text>
          <Text style={styles.paragraph}>
            SwipeAI requires access to your photo library to provide its core functionality. Here's exactly what we access and why:
          </Text>
          
          <Text style={styles.subTitle}>Photo Library Access:</Text>
          <Text style={styles.bulletPoint}>• Photo files: To display photos for organization</Text>
          <Text style={styles.bulletPoint}>• Creation dates: To enable chronological sorting</Text>
          <Text style={styles.bulletPoint}>• File sizes: To display storage information</Text>
          <Text style={styles.bulletPoint}>• File names: To detect photo sources (Camera, WhatsApp, etc.)</Text>
          <Text style={styles.bulletPoint}>• Image dimensions: For proper display and processing</Text>
          
          <Text style={styles.subTitle}>Optional Metadata (Only if present in photos):</Text>
          <Text style={styles.bulletPoint}>• GPS location data: For location-based organization (never transmitted)</Text>
          <Text style={styles.bulletPoint}>• Camera settings (EXIF): For technical information display</Text>
          <Text style={styles.bulletPoint}>• Device information: For app optimization</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How We Use This Information</Text>
          <Text style={styles.paragraph}>
            All data processing occurs exclusively on your device for these purposes:
          </Text>
          <Text style={styles.bulletPoint}>• Organizing photos into categories you create</Text>
          <Text style={styles.bulletPoint}>• Detecting photo sources (Camera, social apps) for smart categorization</Text>
          <Text style={styles.bulletPoint}>• Displaying photo information (date, size) in the interface</Text>
          <Text style={styles.bulletPoint}>• Enabling undo functionality and session recovery</Text>
          <Text style={styles.bulletPoint}>• Optimizing app performance through local caching</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Storage</Text>
          <Text style={styles.paragraph}>
            SwipeAI stores temporary organizational data locally on your device using:
          </Text>
          <Text style={styles.bulletPoint}>• Device local storage (AsyncStorage)</Text>
          <Text style={styles.bulletPoint}>• Temporary memory cache for app performance</Text>
          <Text style={styles.bulletPoint}>• User preferences and app settings</Text>
          
          <Text style={styles.paragraph}>
            Important: This data is stored only in your app's private sandbox and is automatically deleted when you uninstall SwipeAI.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What We DON'T Do</Text>
          <View style={styles.dontBox}>
            <Text style={styles.dontTitle}>We NEVER:</Text>
            <Text style={styles.bulletPoint}>❌ Upload your photos to external servers</Text>
            <Text style={styles.bulletPoint}>❌ Collect personal information or identifiers</Text>
            <Text style={styles.bulletPoint}>❌ Track your usage with analytics services</Text>
            <Text style={styles.bulletPoint}>❌ Share data with third parties</Text>
            <Text style={styles.bulletPoint}>❌ Use cookies or tracking technologies</Text>
            <Text style={styles.bulletPoint}>❌ Access your contacts, messages, or other apps</Text>
            <Text style={styles.bulletPoint}>❌ Require account creation or login</Text>
            <Text style={styles.bulletPoint}>❌ Store data in the cloud</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Third-Party Services</Text>
          <Text style={styles.paragraph}>
            SwipeAI operates independently without relying on third-party analytics, advertising, or data processing services. The app uses only Apple's native iOS frameworks for photo access and display.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>iOS Permissions</Text>
          <Text style={styles.paragraph}>
            SwipeAI requests these iOS permissions:
          </Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Photo Library Access</Text>: Required to display and organize your photos</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Camera Access</Text>: Optional, only if you want to take new photos within the app</Text>
          
          <Text style={styles.paragraph}>
            You can modify these permissions anytime in iOS Settings → Privacy & Security → Photos.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Security</Text>
          <Text style={styles.paragraph}>
            Since all processing happens locally on your device, your photos benefit from iOS's built-in security features:
          </Text>
          <Text style={styles.bulletPoint}>• App sandboxing prevents access by other apps</Text>
          <Text style={styles.bulletPoint}>• iOS encryption protects data at rest</Text>
          <Text style={styles.bulletPoint}>• No network transmission means no interception risk</Text>
          <Text style={styles.bulletPoint}>• Face ID/Touch ID protection (if enabled on your device)</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Children's Privacy</Text>
          <Text style={styles.paragraph}>
            SwipeAI is safe for users of all ages. Since we don't collect any personal information, there are no special considerations for users under 13. Parents can confidently allow children to use SwipeAI knowing their photos remain completely private.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>International Users</Text>
          <Text style={styles.paragraph}>
            SwipeAI complies with international privacy regulations including GDPR, CCPA, and other regional privacy laws through our "privacy by design" approach - we simply don't collect data that would be subject to these regulations.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Changes to This Policy</Text>
          <Text style={styles.paragraph}>
            While our commitment to privacy will never change, we may update this policy to reflect new features or legal requirements. Any changes will be posted in the app and on our website. Continued use of the app after changes constitutes acceptance of the updated policy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have questions about this Privacy Policy or SwipeAI's privacy practices, please contact us:
          </Text>
          <TouchableOpacity onPress={handleContactPress}>
            <Text style={styles.contactLink}>diegoalejandrogutierrezrios@gmail.com</Text>
          </TouchableOpacity>
          <Text style={styles.paragraph}>
            We're committed to addressing any privacy concerns promptly and transparently.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.finalBox}>
            <Text style={styles.finalText}>
              SwipeAI: Organizing your photos with complete privacy, as it should be.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.paragraph}>
            You can also view our Privacy Policy on the web at:
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://diego-gutierrez10.github.io/swipeai-privacy/')}>
            <Text style={styles.contactLink}>https://diego-gutierrez10.github.io/swipeai-privacy/</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    paddingVertical: 5,
    paddingRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginRight: 60, // Compensate for back button
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  lastUpdated: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    marginBottom: 6,
    marginLeft: 12,
  },
  bold: {
    fontWeight: '600',
  },
  highlightBox: {
    backgroundColor: colors.success + '15',
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  highlightText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    fontWeight: '500',
  },
  dontBox: {
    backgroundColor: colors.error + '10',
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  dontTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginBottom: 8,
  },
  contactLink: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
    textDecorationLine: 'underline',
    marginBottom: 12,
  },
  finalBox: {
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary + '30',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  finalText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default PrivacyPolicyScreen; 