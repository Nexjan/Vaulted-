import { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { listings } from '../../data/listings';
import { Badge } from '../../components/Badge';
import { FavoriteButton } from '../../components/FavoriteButton';
import { PriceHistoryChart } from '../../components/PriceHistoryChart';
import { ReviewsSection } from '../../components/ReviewsSection';
import { getUniqueness } from '../../lib/uniqueness';
import { comparePrice } from '../../lib/pricing';
import { getPriceHistory } from '../../lib/priceHistory';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const listing = useMemo(() => listings.find((item) => item.id === id), [id]);

  if (!listing) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>This listing could not be found.</Text>
      </View>
    );
  }

  const uniqueness = getUniqueness(listing);
  const priceComparison = comparePrice(listing, listings);
  const priceHistory = getPriceHistory(listing);

  const dealCopy =
    priceComparison.comparableCount === 0
      ? "We don't have enough comparable stays in this city yet to judge the price."
      : priceComparison.tier === 'great-deal'
        ? `This is priced ${Math.round(Math.abs(priceComparison.percentDiff))}% below the ${Math.round(priceComparison.comparableAverage)}/night average for similar stays in ${listing.city} — a great deal.`
        : priceComparison.tier === 'above-average'
          ? `This runs ${Math.round(Math.abs(priceComparison.percentDiff))}% above the ${Math.round(priceComparison.comparableAverage)}/night average for similar stays in ${listing.city}.`
          : `This is priced close to the ${Math.round(priceComparison.comparableAverage)}/night average for similar stays in ${listing.city} — a fair price.`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Image source={{ uri: listing.imageUrl }} style={styles.heroImage} resizeMode="cover" />
        <FavoriteButton listingId={listing.id} style={styles.heroFavoriteButton} size={22} />
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.location}>{listing.city}, {listing.country} · {listing.propertyType}</Text>
        <Text style={styles.meta}>★ {listing.rating.toFixed(2)} · {listing.reviewCount} reviews · Up to {listing.maxGuests} guests</Text>
      </View>

      <View style={styles.badgeRow}>
        <Badge label={`Rarity score ${uniqueness.score}/100`} tone="rare" />
        {priceComparison.tier === 'great-deal' ? <Badge label="Great deal" tone="deal" /> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About this place</Text>
        <Text style={styles.body}>{listing.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What makes it rare</Text>
        {uniqueness.reasons.map((reason) => (
          <Text key={reason} style={styles.bullet}>• {reason}</Text>
        ))}
        <View style={styles.tagRow}>
          {listing.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Price check</Text>
        <Text style={styles.priceHeadline}>${listing.pricePerNight} <Text style={styles.priceUnit}>/ night</Text></Text>
        <Text style={styles.body}>{dealCopy}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Price history</Text>
        <PriceHistoryChart history={priceHistory} />
      </View>

      <View style={styles.section}>
        <ReviewsSection listing={listing} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingBottom: 48,
  },
  hero: {
    height: 260,
    backgroundColor: '#f3f1ee',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFavoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#222',
  },
  location: {
    marginTop: 4,
    fontSize: 14,
    color: '#717171',
  },
  meta: {
    marginTop: 8,
    fontSize: 14,
    color: '#222',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: '#444',
  },
  bullet: {
    fontSize: 14,
    lineHeight: 22,
    color: '#444',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    backgroundColor: '#f3f1ee',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5b3cc4',
  },
  priceHeadline: {
    fontSize: 22,
    fontWeight: '800',
    color: '#222',
    marginBottom: 8,
  },
  priceUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: '#717171',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: '#717171',
  },
});
