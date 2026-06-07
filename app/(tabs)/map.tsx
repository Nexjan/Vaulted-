import { useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listings } from '../../data/listings';
import { ListingCard } from '../../components/ListingCard';
import { CITY_COORDINATES, fitProjection } from '../../lib/geo';

interface CityPin {
  city: string;
  country: string;
  count: number;
  averagePrice: number;
  x: number;
  y: number;
}

const MAP_ASPECT_RATIO = 16 / 10;

export default function MapScreen() {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [mapWidth, setMapWidth] = useState(0);

  const pins = useMemo<CityPin[]>(() => {
    const cities = Array.from(new Set(listings.map((listing) => listing.city)));
    const coordinates = cities.map((city) => CITY_COORDINATES[city]).filter(Boolean);
    const project = fitProjection(coordinates);

    return cities.map((city) => {
      const cityListings = listings.filter((listing) => listing.city === city);
      const averagePrice =
        cityListings.reduce((sum, listing) => sum + listing.pricePerNight, 0) / cityListings.length;
      const { x, y } = project(CITY_COORDINATES[city]);

      return {
        city,
        country: cityListings[0].country,
        count: cityListings.length,
        averagePrice,
        x,
        y,
      };
    });
  }, []);

  const selectedListings = useMemo(
    () => (selectedCity ? listings.filter((listing) => listing.city === selectedCity) : []),
    [selectedCity],
  );

  const onMapLayout = (event: LayoutChangeEvent) => {
    setMapWidth(event.nativeEvent.layout.width);
  };

  const mapHeight = mapWidth / MAP_ASPECT_RATIO;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>Explore the map</Text>
        <Text style={styles.subheading}>Tap a pin to see the unique stays waiting in that city.</Text>
      </View>

      <View style={styles.mapWrapper} onLayout={onMapLayout}>
        <View style={[styles.map, { height: mapHeight || undefined }]}>
          {Array.from({ length: 5 }).map((_, row) => (
            <View key={`row-${row}`} style={[styles.gridLineHorizontal, { top: `${(row + 1) * (100 / 6)}%` }]} />
          ))}
          {Array.from({ length: 7 }).map((_, col) => (
            <View key={`col-${col}`} style={[styles.gridLineVertical, { left: `${(col + 1) * (100 / 8)}%` }]} />
          ))}

          {pins.map((pin) => {
            const active = selectedCity === pin.city;
            return (
              <Pressable
                key={pin.city}
                onPress={() => setSelectedCity(active ? null : pin.city)}
                style={[
                  styles.pin,
                  active && styles.pinActive,
                  { left: `${pin.x * 100}%`, top: `${pin.y * 100}%` },
                ]}
              >
                <Text style={[styles.pinLabel, active && styles.pinLabelActive]}>{pin.count}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {selectedCity ? (
        <View style={styles.detailHeader}>
          <View>
            <Text style={styles.detailCity}>{selectedCity}</Text>
            <Text style={styles.detailMeta}>
              {selectedListings.length} {selectedListings.length === 1 ? 'stay' : 'stays'} · avg $
              {Math.round(pins.find((pin) => pin.city === selectedCity)?.averagePrice ?? 0)}/night
            </Text>
          </View>
          <Pressable onPress={() => setSelectedCity(null)} hitSlop={8}>
            <Text style={styles.clearLabel}>Clear</Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.listContent}>
        {selectedCity ? (
          selectedListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)
        ) : (
          <View style={styles.hint}>
            <Text style={styles.hintText}>Pick a pin above to browse stays in that city.</Text>
            <View style={styles.legendRow}>
              {pins.map((pin) => (
                <Pressable key={pin.city} onPress={() => setSelectedCity(pin.city)} style={styles.legendChip}>
                  <Text style={styles.legendChipText}>{pin.city} ({pin.count})</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
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
  mapWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  map: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#dceefb',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#c3def0',
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  pin: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: -16,
    marginTop: -16,
    backgroundColor: '#5b3cc4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  pinActive: {
    backgroundColor: '#e0355b',
    width: 38,
    height: 38,
    borderRadius: 19,
    marginLeft: -19,
    marginTop: -19,
  },
  pinLabel: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  pinLabelActive: {
    fontSize: 15,
  },
  detailHeader: {
    marginTop: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailCity: {
    fontSize: 18,
    fontWeight: '800',
    color: '#222',
  },
  detailMeta: {
    marginTop: 2,
    fontSize: 13,
    color: '#717171',
  },
  clearLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5b3cc4',
  },
  listContent: {
    padding: 16,
    paddingTop: 16,
  },
  hint: {
    alignItems: 'center',
    paddingTop: 8,
  },
  hintText: {
    fontSize: 14,
    color: '#9a9a9a',
    textAlign: 'center',
  },
  legendRow: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  legendChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  legendChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#222',
  },
});
