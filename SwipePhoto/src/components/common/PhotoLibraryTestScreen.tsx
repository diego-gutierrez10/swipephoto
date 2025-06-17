/**
 * PhotoLibraryTestScreen - Testing interface for photo library functionality
 * This component provides a comprehensive test interface for all photo library features
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePhotoPermissions } from '../../hooks/usePhotoPermissions';
import { usePhotoLibrary } from '../../hooks/usePhotoLibrary';
import { PhotoAsset, ProcessedImage } from '../../types/photo';

const { width } = Dimensions.get('window');

export default function PhotoLibraryTestScreen() {
  const permissions = usePhotoPermissions();
  const photoLibrary = usePhotoLibrary();
  // const metadata = usePhotoMetadata(); // TODO: Enable when metadata types are resolved
  
  const [selectedPhotos, setSelectedPhotos] = useState<PhotoAsset[]>([]);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [recentPhotos, setRecentPhotos] = useState<PhotoAsset[]>([]);

  // Test single photo picker
  const testSinglePhotoPicker = async () => {
    console.log('Testing single photo picker...');
    const photo = await photoLibrary.pickSinglePhoto({
      quality: 0.8,
      allowsEditing: false,
    });
    
    if (photo) {
      setSelectedPhotos([photo]);
      console.log('Selected photo:', photo);
      Alert.alert('Success', `Selected photo: ${photo.fileName || 'Unknown'}`);
    } else {
      console.log('No photo selected or error occurred');
      Alert.alert('Info', 'No photo selected');
    }
  };

  // Test multiple photo picker
  const testMultiplePhotoPicker = async () => {
    console.log('Testing multiple photo picker...');
    const photos = await photoLibrary.pickPhotos({
      allowsMultipleSelection: true,
      maxSelection: 5,
      quality: 0.8,
    });
    
    if (photos && photos.length > 0) {
      setSelectedPhotos(photos);
      console.log('Selected photos:', photos);
      Alert.alert('Success', `Selected ${photos.length} photos`);
    } else {
      console.log('No photos selected or error occurred');
      Alert.alert('Info', 'No photos selected');
    }
  };

  // Test get recent photos
  const testGetRecentPhotos = async () => {
    console.log('Testing get recent photos...');
    const photos = await photoLibrary.getRecentPhotos({
      limit: 10,
      mediaType: 'photo',
    });
    
    if (photos && photos.length > 0) {
      setRecentPhotos(photos);
      console.log('Recent photos:', photos);
      Alert.alert('Success', `Found ${photos.length} recent photos`);
    } else {
      console.log('No recent photos found or error occurred');
      Alert.alert('Info', 'No recent photos found');
    }
  };

  // Test image processing
  const testImageProcessing = async () => {
    if (selectedPhotos.length === 0) {
      Alert.alert('Error', 'Please select photos first');
      return;
    }

    console.log('Testing image processing...');
    const processed = await photoLibrary.processImages(selectedPhotos, {
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.7,
      format: 'jpeg',
    });
    
    if (processed && processed.length > 0) {
      setProcessedImages(processed);
      console.log('Processed images:', processed);
      Alert.alert('Success', `Processed ${processed.length} images`);
    } else {
      console.log('Failed to process images');
      Alert.alert('Error', 'Failed to process images');
    }
  };

  // Test thumbnail creation
  const testThumbnails = async () => {
    if (selectedPhotos.length === 0) {
      Alert.alert('Error', 'Please select photos first');
      return;
    }

    console.log('Testing thumbnail creation...');
    const firstPhoto = selectedPhotos[0];
    const thumbnail = await photoLibrary.createThumbnail(firstPhoto.uri, 150, 0.6);
    
    if (thumbnail) {
      setProcessedImages([thumbnail]);
      console.log('Created thumbnail:', thumbnail);
      Alert.alert('Success', 'Thumbnail created successfully');
    } else {
      console.log('Failed to create thumbnail');
      Alert.alert('Error', 'Failed to create thumbnail');
    }
  };

  // Test combined operation
  const testPickAndProcess = async () => {
    console.log('Testing pick and process combined operation...');
    const processed = await photoLibrary.pickAndProcessPhotos(
      {
        allowsMultipleSelection: true,
        maxSelection: 3,
        quality: 0.8,
      },
      {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.7,
        format: 'jpeg',
      }
    );
    
    if (processed && processed.length > 0) {
      setProcessedImages(processed);
      console.log('Pick and processed images:', processed);
      Alert.alert('Success', `Pick and processed ${processed.length} images`);
    } else {
      console.log('No images were picked and processed');
      Alert.alert('Info', 'Operation cancelled or failed');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Photo Library Test Screen</Text>
        
        {/* Permission Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permission Status</Text>
          <Text style={styles.statusText}>
            Status: {permissions.status}
          </Text>
          <Text style={styles.statusText}>
            Has Permission: {permissions.hasPermission ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.statusText}>
            Can Request: {permissions.canRequest ? 'Yes' : 'No'}
          </Text>
          
          {!permissions.hasPermission && (
            <TouchableOpacity
              style={styles.button}
              onPress={() => permissions.requestPermissions()}
              disabled={permissions.isLoading}
            >
              <Text style={styles.buttonText}>
                {permissions.isLoading ? 'Requesting...' : 'Request Permissions'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Photo Picker Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photo Picker Tests</Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={testSinglePhotoPicker}
            disabled={photoLibrary.loading || !permissions.hasPermission}
          >
            <Text style={styles.buttonText}>
              {photoLibrary.loading ? 'Loading...' : 'Pick Single Photo'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={testMultiplePhotoPicker}
            disabled={photoLibrary.loading || !permissions.hasPermission}
          >
            <Text style={styles.buttonText}>
              {photoLibrary.loading ? 'Loading...' : 'Pick Multiple Photos'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={testGetRecentPhotos}
            disabled={photoLibrary.loading || !permissions.hasPermission}
          >
            <Text style={styles.buttonText}>
              {photoLibrary.loading ? 'Loading...' : 'Get Recent Photos'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Image Processing Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Image Processing Tests</Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={testImageProcessing}
            disabled={photoLibrary.loading || selectedPhotos.length === 0}
          >
            <Text style={styles.buttonText}>
              {photoLibrary.loading ? 'Processing...' : 'Process Selected Images'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={testThumbnails}
            disabled={photoLibrary.loading || selectedPhotos.length === 0}
          >
            <Text style={styles.buttonText}>
              {photoLibrary.loading ? 'Creating...' : 'Create Thumbnail'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={testPickAndProcess}
            disabled={photoLibrary.loading}
          >
            <Text style={styles.buttonText}>
              {photoLibrary.loading ? 'Processing...' : 'Pick & Process Combined'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Display */}
        {photoLibrary.error && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Error</Text>
            <Text style={styles.errorText}>Photo Library Error: {photoLibrary.error}</Text>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                photoLibrary.clearError();
              }}
            >
              <Text style={styles.buttonText}>Clear Error</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Permission Result Display */}
        {permissions.lastRequestResult && permissions.lastRequestResult.status !== 'granted' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Last Permission Request</Text>
            <Text style={styles.statusText}>
              Status: {permissions.lastRequestResult.status}
            </Text>
            <Text style={styles.statusText}>
              Message: {permissions.lastRequestResult.message}
            </Text>
            <Text style={styles.statusText}>
              Can Ask Again: {permissions.lastRequestResult.canAskAgain ? 'Yes' : 'No'}
            </Text>
            {permissions.needsSettings && (
              <TouchableOpacity
                style={styles.button}
                onPress={permissions.openSettings}
              >
                <Text style={styles.buttonText}>Open Settings</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Selected Photos Display */}
        {selectedPhotos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selected Photos ({selectedPhotos.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedPhotos.map((photo, index) => (
                <View key={photo.id} style={styles.photoContainer}>
                  <Image source={{ uri: photo.uri }} style={styles.photo} />
                  <Text style={styles.photoInfo} numberOfLines={2}>
                    {photo.fileName || `Photo ${index + 1}`}
                  </Text>
                  <Text style={styles.photoInfo}>
                    {photo.width}x{photo.height}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recent Photos Display */}
        {recentPhotos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Photos ({recentPhotos.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recentPhotos.map((photo, index) => (
                <View key={photo.id} style={styles.photoContainer}>
                  <Image source={{ uri: photo.uri }} style={styles.photo} />
                  <Text style={styles.photoInfo} numberOfLines={2}>
                    {photo.fileName || `Photo ${index + 1}`}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Processed Images Display */}
        {processedImages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Processed Images ({processedImages.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {processedImages.map((image, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image source={{ uri: image.uri }} style={styles.photo} />
                  <Text style={styles.photoInfo}>
                    {image.width}x{image.height}
                  </Text>
                  <Text style={styles.photoInfo}>
                    {(image.size / 1024).toFixed(1)}KB
                  </Text>
                  <Text style={styles.photoInfo}>
                    {image.format}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00FF41',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00FF41',
    marginBottom: 15,
  },
  statusText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#00FF41',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    marginBottom: 10,
  },
  photoContainer: {
    width: 120,
    marginRight: 15,
    alignItems: 'center',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#333333',
  },
  photoInfo: {
    color: '#CCCCCC',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
}); 