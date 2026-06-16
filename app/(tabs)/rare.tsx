import { useMemo, useState, useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listings } from '../../lib/listingsService';
import { ListingCard } from '../../components/ListingCard';
import { sortByUniqueness } from '../../lib/uniqueness';

export default function RareFindsScreen() {
  const ranked = useMemo(() => sortByUniqueness(listings), []);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>Rare finds</Text>
        <Text style={styles.subheading}>
          Stays ranked by how unusual they are — one-of-a-kind structures and standout features rise to the top.
        </Text>
      </View>

      <FlatList
        data={ranked}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C8A86B" colors={['#C8A86B']} />}
        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            badge={{ label: `Rarity ${item.uniqueness.score}`, tone: 'rare' }}
            footnote={item.uniqueness.reasons[0]}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F5F3EF',
  },
  subheading: {
    marginTop: 4,
    fontSize: 14,
    color: '#555555',
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
    paddingTop: 16,
  },
});
