import { useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Listing } from '../lib/types';
import { Badge } from './Badge';
import { FavoriteButton } from './FavoriteButton';
import { SkeletonBlock } from './Skeleton';

const REDUCE_MOTION =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();

interface Props {
  listing: Listing;
  /** Optional badge shown in the top-right corner of the card, e.g. a rarity score or deal tag. */
  badge?: { label: string; tone: 'rare' | 'deal' | 'neutral' };
  /** Optional small line of supporting text shown under the location. */
  footnote?: string;
}

export function ListingCard({ listing, badge, footnote }: Props) {
  const router = useRouter();
  const imgOpacity = useRef(new Animated.Value(REDUCE_MOTION ? 1 : 0)).current;

  return (
    <Pressable
      onPress={() => router.push(`/listing/${listing.id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.thumbnail}>
        <SkeletonBlock style={StyleSheet.absoluteFill} />
        <Animated.Image
          source={{ uri: listing.imageUrls[0] }}
          style={[styles.image, { opacity: imgOpacity }]}
          resizeMode="cover"
          onLoad={() => {
            if (REDUCE_MOTION) return;
            Animated.timing(imgOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
          }}
        />
        <FavoriteButton listingId={listing.id} style={styles.favoriteButton} />
        {badge ? <Badge label={badge.label} tone={badge.tone} style={styles.badge} /> : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{listing.name}</Text>
        <Text style={styles.location}>{listing.city}, {listing.country} · {listing.propertyType}</Text>
        {footnote ? <Text style={styles.footnote}>{footnote}</Text> : null}
        <View style={styles.metaRow}>
          <Text style={styles.rating}>★ {listing.rating.toFixed(2)} ({listing.reviewCount})</Text>
          <Text style={styles.price}>${listing.pricePerNight} <Text style={styles.priceUnit}>/ night</Text></Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardPressed: {
    opacity: 0.85,
  },
  thumbnail: {
    height: 160,
    backgroundColor: '#f3f1ee',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  body: {
    padding: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  location: {
    marginTop: 2,
    fontSize: 13,
    color: '#717171',
  },
  footnote: {
    marginTop: 4,
    fontSize: 12,
    color: '#9a6700',
  },
  metaRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    fontSize: 13,
    color: '#222',
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: '#717171',
  },
});
