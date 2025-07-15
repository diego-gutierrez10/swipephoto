import { useCallback, useEffect } from 'react';
import { Image, ImageProps } from 'expo-image';
import { ImageSourcePropType } from 'react-native';

interface UseOptimizedImageProps {
  source: ImageSourcePropType;
  style?: ImageProps['style'];
  blurhash?: string;
  [key: string]: any;
}

export const useOptimizedImage = ({
  source,
  style,
  blurhash,
  ...props
}: UseOptimizedImageProps) => {
  useEffect(() => {
    const sourceUri =
      typeof source === 'number'
        ? null
        : Array.isArray(source)
        ? source[0]?.uri
        : source?.uri;

    if (sourceUri) {
      Image.prefetch(sourceUri);
    }
  }, [source]);

  const OptimizedImage = useCallback(
    () => (
      <Image
        source={source}
        style={style}
        placeholder={blurhash}
        contentFit="cover"
        transition={500}
        {...props}
      />
    ),
    [source, style, blurhash, props]
  );

  return { OptimizedImage };
};