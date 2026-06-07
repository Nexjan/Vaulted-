import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../lib/favorites';

interface Props {
  listingId: string;
  style?: ViewStyle;
  size?: number;
}

export function FavoriteButton({ listingId, style, size = 18 }: Props) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(listingId);

  return (
    <Pressable
      onPress={(event) => {
        event.stopPropagation();
        toggleFavorite(listingId);
      }}
      hitSlop={8}
      style={[styles.button, style]}
    >
      <Ionicons name={active ? 'heart' : 'heart-outline'} size={size} color={active ? '#e0355b' : '#222'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
