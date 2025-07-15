import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../store';
import { Category } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { loadAndCategorizePhotos, loadCategoryCounts } from '../store/slices/categorySlice';
import { Ionicons } from '@expo/vector-icons';
import { CategoryListItem } from '../components/ui/CategoryListItem';

const neonColors = [
  '#39FF14', // Green
  '#FF3131', // Red
  '#007AFF', // Blue
  '#DFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
];

interface CategorySection {
  title: string;
  data: Category[];
}

export const CategoryListScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const { categories, loading, countingLoading, error, categoryCounts } = useAppSelector((state) => state.categories);

  useEffect(() => {
    if (categories.length === 0 && !countingLoading && !loading) {
      // Use fast counting instead of loading all photos
      dispatch(loadCategoryCounts());
    }
  }, [dispatch, categories.length, countingLoading, loading]);

  const sections = useMemo(() => {
    const pending: Category[] = [];
    const cleaned: Category[] = [];

    categories.forEach(cat => {
      if (cat.isCleaned) {
        cleaned.push(cat);
      } else {
        pending.push(cat);
      }
    });

    const result: CategorySection[] = [];
    if (pending.length > 0) {
      result.push({ title: 'To Do', data: pending });
    }
    if (cleaned.length > 0) {
      result.push({ title: 'Completed', data: cleaned });
    }
    return result;
  }, [categories]);

  const renderItem = ({ item, index }: { item: Category; index: number }) => (
    <CategoryListItem item={item} index={index} />
  );

  const renderSectionHeader = ({ section }: { section: CategorySection }) => (
    <Text style={styles.sectionHeader}>{section.title}</Text>
  );

  if (countingLoading || loading) {
    const loadingMessage = countingLoading 
      ? categoryCounts?.totalPhotos 
        ? `Organizing ${categoryCounts.totalPhotos.toLocaleString()} photos...`
        : 'Analyzing your photo library...'
      : 'Loading Photos...';

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>{loadingMessage}</Text>
          {countingLoading && (
            <Text style={styles.subLoadingText}>
              This will be much faster on subsequent launches
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => dispatch(loadCategoryCounts())}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={24} color="gray" />
        </TouchableOpacity>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListEmptyComponent={<Text style={styles.emptyText}>No categories found.</Text>}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionHeader: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  emptyText: {
    color: 'gray',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 16,
  },
  subLoadingText: {
    marginTop: 8,
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 