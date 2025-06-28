import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Category } from '../../types';
import { RootStackParamList } from '../../types/navigation';
import { useDebouncedPress } from '../../hooks/useDebouncedPress';

const neonColors = [
  '#39FF14', '#FF3131', '#007AFF', '#DFFF00', '#FF00FF', '#00FFFF'
];

interface CategoryListItemProps {
  item: Category;
  index: number;
}

export const CategoryListItem: React.FC<CategoryListItemProps> = ({ item, index }) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const color = neonColors[index % neonColors.length];

  const handlePress = useDebouncedPress(() => {
    navigation.navigate('MainSwipe', { categoryId: item.id });
  }, 1000);

  return (
    <TouchableOpacity
      style={[styles.itemContainer, { backgroundColor: color, shadowColor: color }]}
      onPress={handlePress}
    >
      {item.thumbnail && <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />}
      <View style={styles.textContainer}>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <Text style={styles.itemSubtitle}>{item.count} photos</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    borderRadius: 10,
    marginHorizontal: 15,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowRadius: 15,
    shadowOpacity: 0.7,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  textContainer: {
    padding: 15,
  },
  itemTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  itemSubtitle: {
    fontSize: 16,
    color: '#333',
    marginTop: 4,
  },
}); 