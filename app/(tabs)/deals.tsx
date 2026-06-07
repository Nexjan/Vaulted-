import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listings } from '../../data/listings';
import { ListingCard } from '../../components/ListingCard';
import { sortByBestDeal } from '../../lib/pricing';

export default function DealsScreen() {
  const ranked = useMemo(() => {
    return sortByBestDeal(listings, listings).filter((item) => item.priceComparison.comparableCount > 0);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>Best deals</Text>
        <Text style={styles.subheading}>
          Listings priced well below comparable stays in the same city — sorted from biggest savings to smallest.
        </Text>
      </View>

      <FlatList
        data={ranked}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const { percentDiff, tier, comparableAverage } = item.priceComparison;
          const badge =
            tier === 'great-deal'
              ? { label: `${Math.round(Math.abs(percentDiff))}% below avg`, tone: 'deal' as const }
              : undefined;

          return (
            <ListingCard
              listing={item}
              badge={badge}
              footnote={`Similar stays in ${item.city} average $${Math.round(comparableAverage)}/night`}
            />
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf9f7',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#222',
  },
  subheading: {
    marginTop: 4,
    fontSize: 14,
    color: '#717171',
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
    paddingTop: 16,
  },
});
