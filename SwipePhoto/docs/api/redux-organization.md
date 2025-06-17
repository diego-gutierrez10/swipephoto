# Redux Organization API Documentation

This document provides comprehensive API documentation for using the photo organization system with Redux in React components.

## Overview

The Redux organization integration provides async thunk actions, selectors, and middleware to manage photo organization state efficiently. This includes:

- **Thunk Actions**: Async operations for organizing photos
- **Selectors**: Optimized data access with memoization
- **Middleware**: Batching for performance optimization
- **Type Safety**: Full TypeScript support

## Quick Start

### Basic Setup in Component

```typescript
import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { organizePhotosAsync } from '../store/thunks/organizationThunks';
import { 
  selectAllPhotoReferences,
  selectOrganizationProgress,
  selectMonthCategories 
} from '../store/selectors/organizationSelectors';

export const PhotoOrganizationScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Access organized data
  const photoReferences = useAppSelector(selectAllPhotoReferences);
  const progress = useAppSelector(selectOrganizationProgress);
  const monthCategories = useAppSelector(selectMonthCategories);
  
  // Start organization
  const handleOrganizePhotos = async (photos: PhotoAsset[]) => {
    try {
      const result = await dispatch(organizePhotosAsync({ photos })).unwrap();
      console.log('Organization completed:', result);
    } catch (error) {
      console.error('Organization failed:', error);
    }
  };
  
  return (
    <View>
      {/* Your UI components */}
    </View>
  );
};
```

## Thunk Actions

### `organizePhotosAsync`

Organize photos with both month and source categorization.

**Signature:**
```typescript
organizePhotosAsync(params: {
  photos: PhotoAsset[];
  options?: {
    skipExisting?: boolean;
    batchSize?: number;
  };
}): AsyncThunk<OrganizationResult>
```

**Usage:**
```typescript
// Basic organization
const result = await dispatch(organizePhotosAsync({ 
  photos: photoArray 
}));

// With options
const result = await dispatch(organizePhotosAsync({
  photos: photoArray,
  options: {
    skipExisting: true,  // Skip already organized photos
    batchSize: 25       // Process in smaller batches
  }
}));

// Handle result
if (result.payload.success) {
  console.log(`Organized ${result.payload.photosOrganized} photos`);
} else {
  console.error('Errors:', result.payload.errors);
}
```

**Returns:**
```typescript
interface OrganizationResult {
  success: boolean;
  categoriesCreated: number;
  photosOrganized: number;
  errors: string[];
  processingTime: number;
}
```

### `reorganizePhotosAsync`

Re-organize all photos (clears existing organization first).

**Usage:**
```typescript
const result = await dispatch(reorganizePhotosAsync());
```

### `updateOrganizationForPhotos`

Update organization for specific photos (e.g., newly added).

**Usage:**
```typescript
const result = await dispatch(updateOrganizationForPhotos(newPhotos));
```

### `validateOrganizationAsync`

Validate and optionally fix organization integrity.

**Usage:**
```typescript
const result = await dispatch(validateOrganizationAsync());

if (!result.payload.isValid) {
  console.log('Issues found:', result.payload.issues);
  console.log('Fixed issues:', result.payload.fixedIssues);
}
```

### `recalculateIntersectionsAsync`

Recalculate category intersections for cross-categorization.

**Usage:**
```typescript
const result = await dispatch(recalculateIntersectionsAsync());
console.log(`Found ${result.payload.intersectionCount} intersections`);
```

## Selectors

### Photo Reference Selectors

```typescript
// Get all photo references
const allPhotos = useAppSelector(selectAllPhotoReferences);

// Get photo references by month
const januaryPhotos = useAppSelector(state => 
  selectPhotoReferencesByMonth(state, '2024-01')
);

// Get photo references by source
const whatsappPhotos = useAppSelector(state => 
  selectPhotoReferencesBySource(state, 'source_whatsapp')
);

// Get photos in category intersection
const intersection = useAppSelector(state => 
  selectPhotosInIntersection(state, '2024-01', 'source_camera')
);
```

### Category Selectors

```typescript
// Get all month categories
const monthCategories = useAppSelector(selectMonthCategories);

// Get all source categories  
const sourceCategories = useAppSelector(selectSourceCategories);

// Get categories with photo counts
const categoriesWithCounts = useAppSelector(selectCategoriesWithCounts);

// Get category by ID
const category = useAppSelector(state => 
  selectCategoryById(state, 'month', '2024-01')
);
```

### Cross-Category Selectors

```typescript
// Get available category intersections
const intersections = useAppSelector(selectCategoryIntersections);

// Get cross-categorization summary
const summary = useAppSelector(selectCrossCategorySummary);

// Get photos that appear in multiple categories
const crossReferences = useAppSelector(selectCrossReferencedPhotos);
```

### Statistics Selectors

```typescript
// Get organization statistics
const stats = useAppSelector(selectOrganizationStatistics);
// Returns: { totalPhotos, organizedPhotos, categories, etc. }

// Get category statistics
const categoryStats = useAppSelector(selectCategoryStatistics);

// Get organization progress
const progress = useAppSelector(selectOrganizationProgress);
// Returns: { current, total, currentOperation, isActive }
```

## Performance Optimizations

### Batch Middleware

The batch middleware automatically batches organization actions for better performance:

```typescript
// These actions are automatically batched
dispatch({ type: 'organization/addPhotoReference', payload: photoRef });
dispatch({ type: 'organization/updateCategoryCount', payload: count });
dispatch({ type: 'organization/addMonthCategory', payload: category });

// Manual flush if needed
dispatch({ type: 'FLUSH_ORGANIZATION_BATCH' });
```

### Memoized Selectors

All selectors use `createSelector` for memoization:

```typescript
// Selector only recalculates when dependencies change
const expensiveData = useAppSelector(selectComplexCrossReference);
```

### Incremental Updates

For large photo libraries, use incremental organization:

```typescript
// Only processes changed photos
const result = await dispatch(organizePhotosAsync({
  photos: allPhotos,
  options: { skipExisting: true }
}));
```

## Error Handling

### Handling Async Thunk Errors

```typescript
try {
  const result = await dispatch(organizePhotosAsync({ photos })).unwrap();
  // Success - result contains OrganizationResult
} catch (error) {
  // Error - handle failure
  console.error('Organization failed:', error);
}
```

### Using RTK Query Error Handling

```typescript
const handleOrganization = useCallback(async () => {
  const action = await dispatch(organizePhotosAsync({ photos }));
  
  if (organizePhotosAsync.fulfilled.match(action)) {
    // Success
    console.log('Success:', action.payload);
  } else if (organizePhotosAsync.rejected.match(action)) {
    // Error
    console.error('Error:', action.error);
  }
}, [dispatch, photos]);
```

## Type Safety

### Using Typed Hooks

```typescript
// Properly typed dispatch and selector hooks
const dispatch = useAppDispatch();  // Typed dispatch
const data = useAppSelector(selectAllPhotoReferences);  // Typed selector
```

### Action Type Guards

```typescript
// Check action types
if (organizePhotosAsync.pending.match(action)) {
  // Handle pending state
}

if (organizePhotosAsync.fulfilled.match(action)) {
  // Handle fulfilled state
  const result: OrganizationResult = action.payload;
}
```

## Best Practices

### 1. Component Integration

```typescript
const PhotoManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  
  // Load photos and organize
  useEffect(() => {
    const loadAndOrganize = async () => {
      try {
        // Load photos from device
        const loadedPhotos = await PhotoLibraryService.getPhotos();
        setPhotos(loadedPhotos);
        
        // Organize with Redux
        await dispatch(organizePhotosAsync({ 
          photos: loadedPhotos 
        })).unwrap();
      } catch (error) {
        console.error('Failed to load/organize photos:', error);
      }
    };
    
    loadAndOrganize();
  }, [dispatch]);
  
  return <PhotoGrid />;
};
```

### 2. Progress Tracking

```typescript
const OrganizationProgress: React.FC = () => {
  const progress = useAppSelector(selectOrganizationProgress);
  
  if (!progress.isActive) return null;
  
  return (
    <View>
      <Text>{progress.currentOperation}</Text>
      <ProgressBar 
        progress={progress.current / progress.total} 
      />
    </View>
  );
};
```

### 3. Category Navigation

```typescript
const CategoryList: React.FC = () => {
  const monthCategories = useAppSelector(selectMonthCategories);
  const sourceCategories = useAppSelector(selectSourceCategories);
  
  return (
    <ScrollView>
      <Text>By Month</Text>
      {monthCategories.map(category => (
        <CategoryItem 
          key={category.id} 
          category={category}
          onPress={() => navigateToCategory(category)}
        />
      ))}
      
      <Text>By Source</Text>
      {sourceCategories.map(category => (
        <CategoryItem 
          key={category.id} 
          category={category}
          onPress={() => navigateToCategory(category)}
        />
      ))}
    </ScrollView>
  );
};
```

## Integration with Existing Code

This Redux system integrates seamlessly with existing photo organization services:

- **Services Layer**: All existing services (`MonthCategorizationService`, `SourceCategorizationService`, etc.) are used internally
- **Type Compatibility**: Uses the same `PhotoAsset`, `MonthCategory`, `SourceCategory` types
- **Performance Services**: Integrates with `LazyLoadingService`, `IncrementalOrganizationService`
- **Cross-Categorization**: Full support for complex category intersections

## Migration Guide

To migrate existing code to use Redux integration:

1. **Replace direct service calls**:
   ```typescript
   // Before
   const result = monthCategorizationService.organizePhotosByMonth(photos);
   
   // After  
   const result = await dispatch(organizePhotosAsync({ photos })).unwrap();
   ```

2. **Use selectors for data access**:
   ```typescript
   // Before
   const categories = someState.monthCategories;
   
   // After
   const categories = useAppSelector(selectMonthCategories);
   ```

3. **Handle async operations properly**:
   ```typescript
   // Before
   const categories = service.getCategories(); // sync
   
   // After
   useEffect(() => {
     dispatch(organizePhotosAsync({ photos }));
   }, [photos]);
   const categories = useAppSelector(selectMonthCategories);
   ``` 