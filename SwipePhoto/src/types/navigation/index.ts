import type { StackNavigationProp } from '@react-navigation/stack';
import { NavigatorScreenParams } from '@react-navigation/native';
import { Photo } from '../models/Photo';
import { Category } from '../models';
import { PhotoAsset } from '../photo';

export type RootStackParamList = {
  Onboarding: undefined;
  PrePermissionRationale: undefined;
  PermissionDenied: undefined;
  CategoryList: undefined;
  MainSwipe: { categoryId: string };
  SwipeTest: undefined;
  DeletionReview: { categoryId: string };
  Success: undefined;
  Upgrade: { limitReached?: boolean };
  Settings: undefined;
  About: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  PermissionRequest: undefined;
}; 

export type MainStackNavigationProp = StackNavigationProp<RootStackParamList>; 