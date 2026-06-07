import { ScrollView, StyleSheet, Text, TextInput, Pressable, View } from 'react-native';

interface Props {
  query: string;
  onQueryChange: (value: string) => void;
  cities: string[];
  selectedCity: string | null;
  onSelectCity: (city: string | null) => void;
  maxPrice: number | null;
  onSelectMaxPrice: (price: number | null) => void;
}

const PRICE_OPTIONS = [
  { label: 'Any price', value: null },
  { label: 'Under $100', value: 100 },
  { label: 'Under $150', value: 150 },
  { label: 'Under $250', value: 250 },
];

export function FilterBar({
  query,
  onQueryChange,
  cities,
  selectedCity,
  onSelectCity,
  maxPrice,
  onSelectMaxPrice,
}: Props) {
  return (
    <View style={styles.container}>
      <TextInput
        value={query}
        onChangeText={onQueryChange}
        placeholder="Search by name, place, or vibe (e.g. 'treehouse')"
        placeholderTextColor="#9a9a9a"
        style={styles.input}
      />

      <Text style={styles.sectionLabel}>City</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        <Chip label="All cities" active={selectedCity === null} onPress={() => onSelectCity(null)} />
        {cities.map((city) => (
          <Chip key={city} label={city} active={selectedCity === city} onPress={() => onSelectCity(city)} />
        ))}
      </ScrollView>

      <Text style={styles.sectionLabel}>Budget</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {PRICE_OPTIONS.map((option) => (
          <Chip
            key={option.label}
            label={option.label}
            active={maxPrice === option.value}
            onPress={() => onSelectMaxPrice(option.value)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  sectionLabel: {
    marginTop: 14,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#717171',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#222',
    borderColor: '#222',
  },
  chipLabel: {
    fontSize: 13,
    color: '#222',
    fontWeight: '600',
  },
  chipLabelActive: {
    color: '#fff',
  },
});
