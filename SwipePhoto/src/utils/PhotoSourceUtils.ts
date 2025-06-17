import { PhotoAsset } from '../types/photo';
import { PhotoSourceType } from '../types/organization';

/**
 * Detect the source application/type based on photo metadata and file path
 * @param photo PhotoAsset to analyze
 * @returns PhotoSourceType indicating the detected source
 */
export const detectPhotoSource = (photo: PhotoAsset): PhotoSourceType => {
  const filename = photo.fileName?.toLowerCase() || '';
  const uri = photo.uri?.toLowerCase() || '';
  
  // WhatsApp detection patterns
  if (isWhatsAppPhoto(filename, uri)) {
    return PhotoSourceType.WHATSAPP;
  }
  
  // Instagram detection patterns
  if (isInstagramPhoto(filename, uri)) {
    return PhotoSourceType.INSTAGRAM;
  }
  
  // Telegram detection patterns
  if (isTelegramPhoto(filename, uri)) {
    return PhotoSourceType.TELEGRAM;
  }
  
  // Screenshot detection patterns
  if (isScreenshot(filename, uri)) {
    return PhotoSourceType.SCREENSHOTS;
  }
  
  // Camera detection patterns
  if (isCameraPhoto(filename, uri)) {
    return PhotoSourceType.CAMERA_ROLL;
  }
  
  // Default to other apps if no specific pattern matches
  return PhotoSourceType.OTHER_APPS;
};

/**
 * Check if photo is from WhatsApp
 */
const isWhatsAppPhoto = (filename: string, uri: string): boolean => {
  // WhatsApp filename patterns
  const whatsappPatterns = [
    /img-\d{8}-wa\d{4}/i, // IMG-20231201-WA0001
    /vid-\d{8}-wa\d{4}/i, // VID-20231201-WA0001
    /aud-\d{8}-wa\d{4}/i, // AUD-20231201-WA0001
    /whatsapp/i,
    /wa\d{4}/i
  ];
  
  // WhatsApp path patterns
  const whatsappPaths = [
    /whatsapp.*images/i,
    /whatsapp.*media/i,
    /com\.whatsapp/i
  ];
  
  return whatsappPatterns.some(pattern => pattern.test(filename)) ||
         whatsappPaths.some(pattern => pattern.test(uri));
};

/**
 * Check if photo is from Instagram
 */
const isInstagramPhoto = (filename: string, uri: string): boolean => {
  const instagramPatterns = [
    /instagram/i,
    /ig_\d+/i,
    /com\.instagram/i
  ];
  
  return instagramPatterns.some(pattern => pattern.test(filename) || pattern.test(uri));
};

/**
 * Check if photo is from Telegram
 */
const isTelegramPhoto = (filename: string, uri: string): boolean => {
  const telegramPatterns = [
    /telegram/i,
    /org\.telegram/i,
    /photo_\d+@/i, // Telegram photo pattern
    /document_\d+/i
  ];
  
  return telegramPatterns.some(pattern => pattern.test(filename) || pattern.test(uri));
};

/**
 * Check if photo is a screenshot
 */
const isScreenshot = (filename: string, uri: string): boolean => {
  const screenshotPatterns = [
    /screenshot/i,
    /screen_?shot/i,
    /capture/i,
    /img_\d{8}_\d{6}/i, // Android screenshot pattern
    /screenshot_\d{8}/i,
    /screen.*\d{4}-\d{2}-\d{2}/i
  ];
  
  return screenshotPatterns.some(pattern => pattern.test(filename) || pattern.test(uri));
};

/**
 * Check if photo is from camera
 */
const isCameraPhoto = (filename: string, uri: string): boolean => {
  const cameraPatterns = [
    /img_\d{8}_\d{6}/i, // Standard camera format IMG_20231201_123456
    /dsc\d{4}/i, // Camera DSC format
    /dcim/i, // Camera folder
    /camera/i,
    /photo_\d+/i,
    /^img_\d+/i
  ];
  
  // Additional checks for typical camera file patterns
  const isLikelyCameraFile = /^(img|dsc)_?\d+\.(jpg|jpeg|png|heic)$/i.test(filename);
  
  return cameraPatterns.some(pattern => pattern.test(filename) || pattern.test(uri)) ||
         isLikelyCameraFile;
};

/**
 * Generate a standardized source category ID
 * @param sourceType PhotoSourceType
 * @returns String ID for the source category
 */
export const generateSourceCategoryId = (sourceType: PhotoSourceType): string => {
  return `source_${sourceType}`;
};

/**
 * Get display name for source category
 * @param sourceType PhotoSourceType
 * @param locale Locale for localization
 * @returns Human-readable display name
 */
export const getSourceDisplayName = (sourceType: PhotoSourceType, locale = 'en-US'): string => {
  const sourceNames: Record<PhotoSourceType, string> = {
    [PhotoSourceType.CAMERA_ROLL]: 'Camera Roll',
    [PhotoSourceType.WHATSAPP]: 'WhatsApp',
    [PhotoSourceType.INSTAGRAM]: 'Instagram',
    [PhotoSourceType.TELEGRAM]: 'Telegram',
    [PhotoSourceType.SCREENSHOTS]: 'Screenshots',
    [PhotoSourceType.OTHER_APPS]: 'Other Apps',
    [PhotoSourceType.UNKNOWN]: 'Unknown Source'
  };
  
  return sourceNames[sourceType] || sourceNames[PhotoSourceType.UNKNOWN];
};

/**
 * Get icon name for source category
 * @param sourceType PhotoSourceType
 * @returns Icon name for UI display
 */
export const getSourceIcon = (sourceType: PhotoSourceType): string => {
  const sourceIcons: Record<PhotoSourceType, string> = {
    [PhotoSourceType.CAMERA_ROLL]: 'camera',
    [PhotoSourceType.WHATSAPP]: 'message-circle',
    [PhotoSourceType.INSTAGRAM]: 'instagram',
    [PhotoSourceType.TELEGRAM]: 'send',
    [PhotoSourceType.SCREENSHOTS]: 'monitor',
    [PhotoSourceType.OTHER_APPS]: 'folder',
    [PhotoSourceType.UNKNOWN]: 'help-circle'
  };
  
  return sourceIcons[sourceType] || sourceIcons[PhotoSourceType.UNKNOWN];
};

/**
 * Get description for source category
 * @param sourceType PhotoSourceType
 * @returns Description text for the source
 */
export const getSourceDescription = (sourceType: PhotoSourceType): string => {
  const descriptions: Record<PhotoSourceType, string> = {
    [PhotoSourceType.CAMERA_ROLL]: 'Photos taken with your camera',
    [PhotoSourceType.WHATSAPP]: 'Images shared via WhatsApp',
    [PhotoSourceType.INSTAGRAM]: 'Photos from Instagram',
    [PhotoSourceType.TELEGRAM]: 'Images from Telegram chats',
    [PhotoSourceType.SCREENSHOTS]: 'Screen captures and screenshots',
    [PhotoSourceType.OTHER_APPS]: 'Photos from various other applications',
    [PhotoSourceType.UNKNOWN]: 'Photos from unidentified sources'
  };
  
  return descriptions[sourceType] || descriptions[PhotoSourceType.UNKNOWN];
};

/**
 * Sort source categories by priority/importance
 * @param sourceTypes Array of PhotoSourceType to sort
 * @returns Sorted array with most important sources first
 */
export const sortSourcesByPriority = (sourceTypes: PhotoSourceType[]): PhotoSourceType[] => {
  const priorityOrder = [
    PhotoSourceType.CAMERA_ROLL,
    PhotoSourceType.SCREENSHOTS,
    PhotoSourceType.WHATSAPP,
    PhotoSourceType.INSTAGRAM,
    PhotoSourceType.TELEGRAM,
    PhotoSourceType.OTHER_APPS,
    PhotoSourceType.UNKNOWN
  ];
  
  return sourceTypes.sort((a, b) => {
    const indexA = priorityOrder.indexOf(a);
    const indexB = priorityOrder.indexOf(b);
    return indexA - indexB;
  });
}; 