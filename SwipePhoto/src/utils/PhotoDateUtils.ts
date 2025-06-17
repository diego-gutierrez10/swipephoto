import { MonthCategory } from '../types/organization';

/**
 * Extract month and year from a timestamp
 * @param timestamp Unix timestamp in milliseconds
 * @returns Object with month (0-11) and year
 */
export const extractMonthYear = (timestamp: number): { month: number; year: number } => {
  const date = new Date(timestamp);
  return {
    month: date.getMonth(), // 0-11 (January = 0)
    year: date.getFullYear()
  };
};

/**
 * Generate a standardized month category ID
 * @param year Full year (e.g., 2024)
 * @param month Month index (0-11)
 * @returns String ID in format YYYY-MM
 */
export const generateMonthCategoryId = (year: number, month: number): string => {
  return `${year}-${(month + 1).toString().padStart(2, '0')}`;
};

/**
 * Get display name for a month category
 * @param year Full year
 * @param month Month index (0-11)
 * @param locale Locale string for formatting
 * @returns Formatted display name (e.g., "January 2024")
 */
export const getMonthDisplayName = (year: number, month: number, locale = 'en-US'): string => {
  const date = new Date(year, month);
  return date.toLocaleDateString(locale, { 
    month: 'long', 
    year: 'numeric' 
  });
};

/**
 * Get short display name for a month category
 * @param year Full year
 * @param month Month index (0-11)
 * @returns Short formatted name (e.g., "Jan 2024")
 */
export const getMonthShortDisplayName = (year: number, month: number): string => {
  const date = new Date(year, month);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    year: 'numeric' 
  });
};

/**
 * Sort month category IDs chronologically (most recent first)
 * @param monthIds Array of month category IDs
 * @returns Sorted array with most recent months first
 */
export const sortMonthsChronologically = (monthIds: string[]): string[] => {
  return monthIds.sort((a, b) => {
    // Handle special cases
    if (a === 'undated') return 1;
    if (b === 'undated') return -1;
    
    // Compare YYYY-MM strings (descending order for most recent first)
    return b.localeCompare(a);
  });
};

/**
 * Sort month categories chronologically (most recent first)
 * @param categories Array of month categories
 * @returns Sorted array with most recent months first
 */
export const sortMonthCategoriesChronologically = (categories: MonthCategory[]): MonthCategory[] => {
  return categories.sort((a, b) => {
    // Handle undated category - always put at end
    if (a.id === 'undated') return 1;
    if (b.id === 'undated') return -1;
    
    // Sort by year first (descending), then by month (descending)
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    return b.month - a.month;
  });
};

/**
 * Check if a timestamp falls within a specific month
 * @param timestamp Unix timestamp in milliseconds
 * @param year Target year
 * @param month Target month (0-11)
 * @returns True if timestamp is in the specified month
 */
export const isTimestampInMonth = (timestamp: number, year: number, month: number): boolean => {
  const { month: photoMonth, year: photoYear } = extractMonthYear(timestamp);
  return photoYear === year && photoMonth === month;
};

/**
 * Get the current month category ID
 * @returns Current month ID in YYYY-MM format
 */
export const getCurrentMonthId = (): string => {
  const now = new Date();
  return generateMonthCategoryId(now.getFullYear(), now.getMonth());
};

/**
 * Parse month category ID to get year and month
 * @param monthId Category ID in YYYY-MM format
 * @returns Object with year and month, or null if invalid
 */
export const parseMonthCategoryId = (monthId: string): { year: number; month: number } | null => {
  if (monthId === 'undated') return null;
  
  const parts = monthId.split('-');
  if (parts.length !== 2) return null;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Convert to 0-11
  
  if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
    return null;
  }
  
  return { year, month };
};

/**
 * Get month name from month index
 * @param month Month index (0-11)
 * @param locale Locale for formatting
 * @returns Month name
 */
export const getMonthName = (month: number, locale = 'en-US'): string => {
  const date = new Date(2024, month); // Use any year
  return date.toLocaleDateString(locale, { month: 'long' });
}; 