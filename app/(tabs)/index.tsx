import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listings } from '../../data/listings';
import { FilterBar } from '../../components/FilterBar';
import { ListingCard } from '../../components/ListingCard';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  const cities = useMemo(
    () => Array.from(new Set(listings.map((listing) => listing.city))).sort(),
    [],
  );

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return listings.filter((listing) => {
      if (selectedCity && listing.city !== selectedCity) return false;
      if (maxPrice !== null && listing.pricePerNight > maxPrice) return false;

      if (normalizedQuery) {
        const haystack = [
          listing.title,
          listing.city,
          listing.country,
          listing.propertyType,
          ...listing.tags,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }

      return true;
    });
  }, [query, selectedCity, maxPrice]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>Find your stay</Text>
        <Text style={styles.subheading}>Search and filter unique places to stay, anywhere</Text>
      </View>

      <FilterBar
        query={query}
        onQueryChange={setQuery}
        cities={cities}
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
        maxPrice={maxPrice}
        onSelectMaxPrice={setMaxPrice}
      />

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <ListingCard listing={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No stays match your filters yet — try widening your search.</Text>
          </View>
        }
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
  },
  listContent: {
    padding: 16,
    paddingTop: 12,
  },
  empty: {
    paddingTop: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9a9a9a',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
