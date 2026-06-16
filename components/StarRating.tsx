import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DisplayProps {
  rating: number;
  size?: number;
  color?: string;
}

/** Read-only row of filled/empty stars representing a rating out of 5. */
export function StarRating({ rating, size = 14, color = '#C8A86B' }: DisplayProps) {
  const rounded = Math.round(rating);
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((position) => (
        <Ionicons
          key={position}
          name={position <= rounded ? 'star' : 'star-outline'}
          size={size}
          color={color}
          style={styles.star}
        />
      ))}
    </View>
  );
}

interface InputProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
}

/** Interactive row of stars for picking a 1-5 rating. */
export function StarRatingInput({ value, onChange, size = 28 }: InputProps) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((position) => (
        <Pressable key={position} onPress={() => onChange(position)} hitSlop={6} style={styles.star}>
          <Ionicons name={position <= value ? 'star' : 'star-outline'} size={size} color="#5b3cc4" />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  star: {
    marginRight: 2,
  },
});
