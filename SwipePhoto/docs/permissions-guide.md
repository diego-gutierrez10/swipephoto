# SwipePhoto Permissions Guide

## Overview
SwipePhoto requires photo library access to function properly. This document outlines the permission configurations for both iOS and Android platforms.

## Privacy Philosophy
- **100% Local Processing**: All photo organization happens locally on the user's device
- **Zero Data Collection**: No photos, metadata, or user data is transmitted to external servers
- **Transparent Communication**: Clear explanation of why permissions are needed

## iOS Configuration

### Info.plist Keys
- `NSPhotoLibraryUsageDescription`: Explains why photo library access is needed
- `NSCameraUsageDescription`: Explains camera access for taking new photos
- `NSPhotoLibraryAddUsageDescription`: Explains saving organized photos back (optional)
- `PHPhotoLibraryPreventAutomaticLimitedAccessAlert`: Prevents automatic limited access alerts on iOS 14+

### iOS 14+ Limited Access Support
The app supports iOS 14's limited photo access feature, allowing users to select only specific photos for organization.

## Android Configuration

### Permissions
- `READ_MEDIA_IMAGES`: Primary permission for Android 13+ (API 33+)
- `READ_EXTERNAL_STORAGE`: Fallback for older Android versions
- `CAMERA`: For taking new photos to organize

### SDK Versions
- `compileSdkVersion`: 34 (Android 14)
- `targetSdkVersion`: 34 (Latest features and security)

### Android Photo Picker
For Android 13+, the app will prefer using the system Photo Picker when possible, which doesn't require runtime permissions and provides better privacy.

## Permission Flow
1. User opens SwipePhoto
2. When they try to access photos, permission request is shown
3. Clear explanation of local-only processing
4. User grants permission (full or limited)
5. App can access photos according to granted permissions

## Testing Checklist
- [ ] App builds successfully with permission configuration
- [ ] Permission strings display correctly in app store listings
- [ ] Limited access works properly on iOS 14+
- [ ] Android Photo Picker is used when available
- [ ] Graceful handling when permissions are denied
- [ ] No data is transmitted externally during photo processing 