import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listings } from '../../lib/listingsService';
import { ListingCard } from '../../components/ListingCard';
import { sortByUniqueness } from '../../lib/uniqueness';

export default function RareFindsScreen() {
  const ranked = useMemo(() => sortByUniqueness(listings), []);

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
