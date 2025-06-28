import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppSelector, useAppDispatch } from '../../store';
import UsageStatsService from '../../services/UsageStatsService';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';
import { clearLastFreedSpace } from '../../store/slices/organizationSlice';
import ProgressBar from './ProgressBar';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const MB = 1024 * 1024;
const GOALS = [100 * MB, 500 * MB, 1024 * MB, 2 * 1024 * MB, 5 * 1024 * MB];

const getCurrentGoal = (savedSpace: number) => {
  return GOALS.find(goal => savedSpace < goal) || GOALS[GOALS.length - 1];
};

export const UsageStats: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { lastFreedSpace, accumulatedFreedSpace } = useAppSelector((state) => state.organization);
  
  const [showFreedSpaceMessage, setShowFreedSpaceMessage] = useState(false);

  useEffect(() => {
    if (lastFreedSpace > 0) {
      setShowFreedSpaceMessage(true);
      const timer = setTimeout(() => {
        setShowFreedSpaceMessage(false);
        dispatch(clearLastFreedSpace()); 
      }, 4000); 

      return () => clearTimeout(timer);
    }
  }, [lastFreedSpace, dispatch]);

  const currentGoal = getCurrentGoal(accumulatedFreedSpace);

  return (
    <View style={styles.container}>
      {showFreedSpaceMessage && lastFreedSpace > 0 && (
        <View style={styles.freedSpaceContainer}>
          <Text style={styles.freedSpaceText}>
            🎉 You just freed up {UsageStatsService.formatBytes(lastFreedSpace)}!
          </Text>
        </View>
      )}

      <Text style={styles.title}>Total Space Saved</Text>
      
      <ProgressBar 
        current={accumulatedFreedSpace} 
        total={currentGoal}
        textFormat="fraction"
        fillColor={['#39FF14', '#00e676']}
      />
      
      <Text style={styles.goalText}>
        Next Goal: {UsageStatsService.formatBytes(currentGoal)}
      </Text>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginVertical: 10,
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  goalText: {
    color: '#AEAEB2',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  freedSpaceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  freedSpaceText: {
    color: '#39FF14',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 10,
  },
}); 