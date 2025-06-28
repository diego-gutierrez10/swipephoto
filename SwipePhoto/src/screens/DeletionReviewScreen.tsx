import React, { useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  SafeAreaView, 
  Button,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../store';
import { 
  clearDeletionQueue,
  setLastFreedSpace 
} from '../store/slices/organizationSlice';
import { removePhotosByIds } from '../store/slices/photoSlice';
import { useNavigation } from '@react-navigation/native';
import { Photo } from '../types';
import { PhotoLibraryService } from '../services/PhotoLibraryService';
import UsageStatsService from '../services/UsageStatsService';
import { selectPhotosById } from '../store/selectors/photoSelectors';

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const ITEM_MARGIN = 4;
const ITEM_SIZE = (width - (NUM_COLUMNS + 1) * ITEM_MARGIN) / NUM_COLUMNS;

export const DeletionReviewScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const { deletionQueue } = useAppSelector((state) => state.organization);
  const photosById = useAppSelector(selectPhotosById);

  const [rescuedPhotoIds, setRescuedPhotoIds] = useState<Set<string>>(new Set());

  const photosForReview = useMemo(() => {
    return deletionQueue.map(id => photosById[id]).filter(Boolean) as Photo[];
  }, [deletionQueue, photosById]);

  const toggleRescue = (photoId: string) => {
    setRescuedPhotoIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const handleFinalDelete = () => {
    const finalDeletionIds = deletionQueue.filter(id => !rescuedPhotoIds.has(id));
    if (finalDeletionIds.length === 0) {
      Alert.alert("No photos selected", "You have rescued all photos. Nothing to delete.");
      return;
    }

    Alert.alert(
      `Delete ${finalDeletionIds.length} Photos?`,
      "The selected photos will be moved to the 'Recently Deleted' album, where they will be permanently deleted after 30 days.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          onPress: async () => {
            // First, calculate the space to be freed
            const freedSpace = await UsageStatsService.calculateDeletableSpace(finalDeletionIds);

            // Then, delete the photos from the library
            const result = await PhotoLibraryService.getInstance().deletePhotosFromLibrary(finalDeletionIds);
            
            if (result.success) {
              // Now, update the app state
              dispatch(setLastFreedSpace(freedSpace));
              dispatch(removePhotosByIds(finalDeletionIds));
              dispatch(clearDeletionQueue());
              Alert.alert(
                'Deletion Successful',
                `${finalDeletionIds.length} photo(s) moved to 'Recently Deleted'. You can permanently delete them there.`,
                [
                  { text: 'OK', onPress: () => navigation.goBack(), style: 'cancel' },
                  { text: 'Open Photos App', onPress: () => Linking.openURL('photos-redirect://') }
                ]
              );
            } else {
              Alert.alert('Deletion Failed', result.error || 'An unknown error occurred.');
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const photosToDeleteCount = photosForReview.length - rescuedPhotoIds.size;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button title="Back" onPress={() => navigation.goBack()} />
        <Text style={styles.title}>Review ({photosForReview.length})</Text>
        <View style={{ width: 50 }} /> 
      </View>
      <FlatList
        data={photosForReview}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        renderItem={({ item }) => {
          const isRescued = rescuedPhotoIds.has(item.id);
          return (
            <TouchableOpacity onPress={() => toggleRescue(item.id)}>
              <View style={styles.itemContainer}>
                <Image source={{ uri: item.uri }} style={styles.image} />
                { !isRescued && <View style={styles.overlay} /> }
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>No photos marked for deletion.</Text>}
        contentContainerStyle={{ ...styles.listContainer, paddingBottom: 100 }}
      />
      {photosToDeleteCount > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleFinalDelete}
          >
            <Text style={styles.deleteButtonText}>
              Delete {photosToDeleteCount} Photo{photosToDeleteCount > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: ITEM_MARGIN / 2,
  },
  itemContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: ITEM_MARGIN / 2,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 59, 48, 0.4)',
    borderRadius: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    color: 'gray',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
}); 