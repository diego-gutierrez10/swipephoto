import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, SafeAreaView, ActivityIndicator, DevSettings } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { loadAndCategorizePhotos } from '../store/slices/categorySlice';
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
  const { categories, loading, error } = useAppSelector((state) => state.categories);

  useEffect(() => {
    if (categories.length === 0 && !loading) {
      dispatch(loadAndCategorizePhotos());
    }
  }, [dispatch, categories.length, loading]);

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

  const handleResetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('@hasOnboarded');
      DevSettings.reload();
    } catch (e) {
      console.error('Failed to reset onboarding status', e);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading Photos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => dispatch(loadAndCategorizePhotos())}>
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
      {__DEV__ && (
        <TouchableOpacity style={styles.devButton} onPress={handleResetOnboarding}>
          <Text style={styles.devButtonText}>Reset Onboarding</Text>
        </TouchableOpacity>
      )}
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
  devButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#555',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  devButtonText: {
    color: '#fff',
    fontSize: 12,
  },
}); 