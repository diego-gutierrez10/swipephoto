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

export const TermsOfServiceScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleContactPress = () => {
    Linking.openURL('mailto:diegoalejandrogutierrezrios@gmail.com');
  };

  const handleWebTermsPress = () => {
    Linking.openURL('https://diego-gutierrez10.github.io/swipeai-privacy/terms');
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
        <Text style={styles.headerTitle}>Terms of Service</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.title}>SwipeAI Terms of Service</Text>
          <Text style={styles.lastUpdated}>Last Updated: January 2025</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agreement to Terms</Text>
          <Text style={styles.paragraph}>
            By downloading, installing, or using SwipeAI ("the App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App.
          </Text>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightText}>
              📱 These Terms constitute a legally binding agreement between you and SwipeAI regarding your use of our photo organization application.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description of Service</Text>
          <Text style={styles.paragraph}>
            SwipeAI is a local photo organization application that helps you organize your device's photo library through an intuitive swipe-based interface.
          </Text>
          
          <Text style={styles.subTitle}>Core Features:</Text>
          <Text style={styles.bulletPoint}>• Local photo organization and categorization</Text>
          <Text style={styles.bulletPoint}>• Swipe-based photo sorting interface</Text>
          <Text style={styles.bulletPoint}>• Batch photo deletion capabilities</Text>
          <Text style={styles.bulletPoint}>• Smart categorization by source, date, and metadata</Text>
          <Text style={styles.bulletPoint}>• Session recovery and undo functionality</Text>
          
          <Text style={styles.subTitle}>Important Notice:</Text>
          <Text style={styles.paragraph}>
            SwipeAI operates entirely on your device. We do not store, upload, or access your photos through external servers.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Eligibility and Account Requirements</Text>
          <Text style={styles.paragraph}>
            To use SwipeAI, you must:
          </Text>
          <Text style={styles.bulletPoint}>• Be at least 13 years of age (or the minimum age in your jurisdiction)</Text>
          <Text style={styles.bulletPoint}>• Have legal capacity to enter into binding agreements</Text>
          <Text style={styles.bulletPoint}>• Own or have authorized access to the iOS device</Text>
          <Text style={styles.bulletPoint}>• Comply with all applicable laws and regulations</Text>
          
          <Text style={styles.paragraph}>
            SwipeAI does not require account creation. All data remains on your device.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acceptable Use Policy</Text>
          <Text style={styles.paragraph}>
            You agree to use SwipeAI only for lawful purposes and in accordance with these Terms.
          </Text>
          
          <Text style={styles.subTitle}>You agree NOT to:</Text>
          <Text style={styles.bulletPoint}>• Use the App to organize illegal content</Text>
          <Text style={styles.bulletPoint}>• Attempt to reverse engineer or modify the App</Text>
          <Text style={styles.bulletPoint}>• Use the App in ways that could damage or impair its functionality</Text>
          <Text style={styles.bulletPoint}>• Violate any applicable laws or regulations</Text>
          <Text style={styles.bulletPoint}>• Use the App for commercial redistribution without permission</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SwipeAI Pro Subscription</Text>
          <Text style={styles.paragraph}>
            SwipeAI offers a premium subscription ("SwipeAI Pro") with enhanced features and unlimited usage.
          </Text>
          
          <Text style={styles.subTitle}>Subscription Terms:</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Free Version</Text>: Limited to 50 photo swipes per day</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>SwipeAI Pro</Text>: Unlimited photo organization</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Billing</Text>: Subscriptions are managed through Apple's App Store</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Auto-Renewal</Text>: Subscriptions automatically renew unless cancelled</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Cancellation</Text>: Cancel anytime through App Store settings</Text>
          
          <Text style={styles.subTitle}>Payment and Billing:</Text>
          <Text style={styles.paragraph}>
            All subscription purchases are processed through Apple's App Store. Payment will be charged to your Apple ID account upon confirmation of purchase.
          </Text>
          
          <Text style={styles.paragraph}>
            Subscriptions automatically renew at the end of each billing period unless auto-renewal is turned off at least 24 hours before the end of the current period.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Refunds and Cancellations</Text>
          <Text style={styles.paragraph}>
            All refunds are processed according to Apple's App Store refund policy. To request a refund:
          </Text>
          <Text style={styles.bulletPoint}>• Visit reportaproblem.apple.com</Text>
          <Text style={styles.bulletPoint}>• Sign in with your Apple ID</Text>
          <Text style={styles.bulletPoint}>• Find your SwipeAI purchase and request a refund</Text>
          
          <Text style={styles.paragraph}>
            SwipeAI cannot directly process refunds as all transactions are handled by Apple.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Intellectual Property Rights</Text>
          <Text style={styles.paragraph}>
            SwipeAI and all related content, features, and functionality are owned by SwipeAI and are protected by copyright, trademark, and other intellectual property laws.
          </Text>
          
          <Text style={styles.subTitle}>Your Content:</Text>
          <Text style={styles.paragraph}>
            You retain all rights to your photos and personal content. SwipeAI does not claim any ownership rights to your photos or data.
          </Text>
          
          <Text style={styles.subTitle}>License to Use:</Text>
          <Text style={styles.paragraph}>
            We grant you a limited, non-exclusive, non-transferable license to use SwipeAI for personal, non-commercial purposes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy and Data Protection</Text>
          <Text style={styles.paragraph}>
            Your privacy is paramount to us. Please review our Privacy Policy to understand how we handle your information.
          </Text>
          
          <View style={styles.privacyBox}>
            <Text style={styles.privacyTitle}>Key Privacy Points:</Text>
            <Text style={styles.bulletPoint}>🔒 All processing happens locally on your device</Text>
            <Text style={styles.bulletPoint}>🚫 No data is uploaded to external servers</Text>
            <Text style={styles.bulletPoint}>🛡️ Your photos never leave your device</Text>
            <Text style={styles.bulletPoint}>📱 No account creation required</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disclaimers and Limitations</Text>
          <Text style={styles.paragraph}>
            SwipeAI is provided "as is" and "as available" without warranties of any kind.
          </Text>
          
          <Text style={styles.subTitle}>Important Disclaimers:</Text>
          <Text style={styles.bulletPoint}>• We cannot guarantee uninterrupted or error-free operation</Text>
          <Text style={styles.bulletPoint}>• Photo deletion actions are permanent and cannot be undone by us</Text>
          <Text style={styles.bulletPoint}>• We recommend backing up important photos before use</Text>
          <Text style={styles.bulletPoint}>• Results may vary based on device performance and photo library size</Text>
          
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠️ Important Warning:</Text>
            <Text style={styles.warningText}>
              Always back up important photos before using SwipeAI's deletion features. Deleted photos are moved to your device's "Recently Deleted" album and will be permanently removed after 30 days.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            To the maximum extent permitted by law, SwipeAI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of data or photos.
          </Text>
          
          <Text style={styles.paragraph}>
            Our total liability to you for all damages shall not exceed the amount you paid for SwipeAI Pro (if any) in the 12 months preceding the claim.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apple App Store Terms</Text>
          <Text style={styles.paragraph}>
            Additional terms apply when you download SwipeAI from the Apple App Store:
          </Text>
          <Text style={styles.bulletPoint}>• Apple's standard App Store terms and conditions apply</Text>
          <Text style={styles.bulletPoint}>• Apple is not responsible for the App or any claims related to it</Text>
          <Text style={styles.bulletPoint}>• All maintenance and support is provided by SwipeAI</Text>
          <Text style={styles.bulletPoint}>• Apple may terminate these Terms if you violate App Store guidelines</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Updates and Modifications</Text>
          <Text style={styles.paragraph}>
            We may update SwipeAI from time to time to improve functionality, fix bugs, or comply with legal requirements.
          </Text>
          
          <Text style={styles.paragraph}>
            We reserve the right to modify these Terms at any time. Material changes will be communicated through the App or our website. Continued use after changes constitutes acceptance of the new Terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Termination</Text>
          <Text style={styles.paragraph}>
            These Terms remain in effect until terminated by either you or SwipeAI.
          </Text>
          
          <Text style={styles.subTitle}>You may terminate by:</Text>
          <Text style={styles.bulletPoint}>• Deleting the App from your device</Text>
          <Text style={styles.bulletPoint}>• Cancelling any active subscriptions</Text>
          
          <Text style={styles.subTitle}>We may terminate if you:</Text>
          <Text style={styles.bulletPoint}>• Violate these Terms</Text>
          <Text style={styles.bulletPoint}>• Engage in prohibited use</Text>
          <Text style={styles.bulletPoint}>• Violate applicable laws</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Governing Law and Disputes</Text>
          <Text style={styles.paragraph}>
            These Terms are governed by the laws of [Your Jurisdiction] without regard to conflict of law principles.
          </Text>
          
          <Text style={styles.paragraph}>
            Any disputes arising from these Terms or your use of SwipeAI will be resolved through binding arbitration, except where prohibited by law.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have questions about these Terms of Service, please contact us:
          </Text>
          <TouchableOpacity onPress={handleContactPress}>
            <Text style={styles.contactLink}>diegoalejandrogutierrezrios@gmail.com</Text>
          </TouchableOpacity>
          <Text style={styles.paragraph}>
            We will respond to legal inquiries promptly and professionally.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.paragraph}>
            You can also view our Terms of Service on the web at:
          </Text>
          <TouchableOpacity onPress={handleWebTermsPress}>
            <Text style={styles.contactLink}>https://diego-gutierrez10.github.io/swipeai-privacy/terms-of-service.html</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.finalBox}>
            <Text style={styles.finalText}>
              Thank you for choosing SwipeAI. These Terms ensure a safe and legal experience for all users.
            </Text>
          </View>
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
    backgroundColor: colors.primary + '15',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
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
  privacyBox: {
    backgroundColor: colors.success + '15',
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
    marginBottom: 8,
  },
  warningBox: {
    backgroundColor: colors.warning + '15',
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    fontWeight: '500',
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

export default TermsOfServiceScreen; 