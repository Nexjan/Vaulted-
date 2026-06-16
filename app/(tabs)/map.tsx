import { useMemo, useState } from 'react';
import { Image, LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listings } from '../../data/listings';
import { CITY_COORDINATES, fitProjection } from '../../lib/geo';
import { useFavorites } from '../../lib/favorites';
import { getUniqueness } from '../../lib/uniqueness';
import { Listing } from '../../lib/types';

const BG = '#0A0A0A';
const TEXT = '#F5F3EF';
const GOLD = '#C8A86B';
const MUTED = '#555555';
const DIVIDER = '#1E1E1E';
const SURFACE = '#141414';

const MAP_ASPECT_RATIO = 16 / 10;

interface CityPin {
  city: string;
  country: string;
  count: number;
  averagePrice: number;
  x: number;
  y: number;
}

export default function MapScreen() {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [mapWidth, setMapWidth] = useState(0);
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();

  const pins = useMemo<CityPin[]>(() => {
    const cities = Array.from(new Set(listings.map((listing) => listing.city)));
    const coordinates = cities.map((city) => CITY_COORDINATES[city]).filter(Boolean);
    const project = fitProjection(coordinates);

    return cities.map((city) => {
      const cityListings = listings.filter((listing) => listing.city === city);
      const averagePrice =
        cityListings.reduce((sum, listing) => sum + listing.pricePerNight, 0) / cityListings.length;
      const { x, y } = project(CITY_COORDINATES[city]);
      return { city, country: cityListings[0].country, count: cityListings.length, averagePrice, x, y };
    });
  }, []);

  const selectedListings = useMemo(
    () => (selectedCity ? listings.filter((listing) => listing.city === selectedCity) : []),
    [selectedCity],
  );

  const onMapLayout = (event: LayoutChangeEvent) => setMapWidth(event.nativeEvent.layout.width);
  const mapHeight = mapWidth / MAP_ASPECT_RATIO;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.wordmark}>MAP</Text>
          <View style={styles.headerMeta}>
            <Text style={styles.headerLabel}>
              {selectedCity ? `${selectedCity.toUpperCase()} · ${selectedListings.length} STAYS` : `${pins.length} CITIES · TAP A PIN`}
            </Text>
            <View style={styles.headerLine} />
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Map canvas ── */}
        <View style={styles.mapWrapper} onLayout={onMapLayout}>
          <View style={[styles.map, { height: mapHeight || undefined }]}>
            {Array.from({ length: 5 }).map((_, row) => (
              <View key={`row-${row}`} style={[styles.gridH, { top: `${(row + 1) * (100 / 6)}%` }]} />
            ))}
            {Array.from({ length: 7 }).map((_, col) => (
              <View key={`col-${col}`} style={[styles.gridV, { left: `${(col + 1) * (100 / 8)}%` }]} />
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

        {/* ── City legend chips ── */}
        {!selectedCity && (
          <View style={styles.legendSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.legendRow}>
              {pins.map((pin) => (
                <Pressable
                  key={pin.city}
                  onPress={() => setSelectedCity(pin.city)}
                  style={styles.legendChip}
                >
                  <Text style={styles.legendChipText}>{pin.city.toUpperCase()}</Text>
                  <Text style={styles.legendChipCount}>{pin.count}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Selected city listings ── */}
        {selectedCity && (
          <>
            <View style={styles.cityHeader}>
              <View>
                <Text style={styles.cityName}>{selectedCity.toUpperCase()}</Text>
                <Text style={styles.cityMeta}>
                  {selectedListings.length} {selectedListings.length === 1 ? 'stay' : 'stays'} · avg $
                  {Math.round(pins.find((p) => p.city === selectedCity)?.averagePrice ?? 0)}/night
                </Text>
              </View>
              <Pressable onPress={() => setSelectedCity(null)} hitSlop={8} style={styles.clearBtn}>
                <Text style={styles.clearLabel}>CLEAR</Text>
              </Pressable>
            </View>

            <View style={styles.divider} />

            {selectedListings.map((listing, i) => (
              <MapListingRow
                key={listing.id}
                listing={listing}
                number={i + 1}
                router={router}
                isFavorite={isFavorite}
                toggleFavorite={toggleFavorite}
              />
            ))}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function MapListingRow({
  listing, number, router, isFavorite, toggleFavorite,
}: {
  listing: Listing;
  number: number;
  router: ReturnType<typeof useRouter>;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
}) {
  const uniqueness = getUniqueness(listing);
  const active = isFavorite(listing.id);
  const num = String(number).padStart(2, '0');

  return (
    <View>
      <Pressable
        onPress={() => router.push(`/listing/${listing.id}`)}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        <Text style={styles.rowNumber}>{num}</Text>
        <Image source={{ uri: listing.imageUrl }} style={styles.rowImage} resizeMode="cover" />
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle} numberOfLines={2}>{listing.title}</Text>
          <Text style={styles.rowLocation}>{listing.propertyType.toUpperCase()}</Text>
          <View style={styles.rowMeta}>
            <Text style={styles.rowRarity}>◆ {uniqueness.score}</Text>
            <Text style={styles.rowPrice}>${listing.pricePerNight}<Text style={styles.rowUnit}>/nt</Text></Text>
          </View>
        </View>
        <Pressable
          onPress={(e) => { e.stopPropagation(); toggleFavorite(listing.id); }}
          hitSlop={8}
          style={styles.rowHeart}
        >
          <Ionicons name={active ? 'heart' : 'heart-outline'} size={16} color={active ? GOLD : MUTED} />
        </Pressable>
      </Pressable>
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    paddingBottom: 48,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  wordmark: {
    fontSize: 64,
    fontWeight: '900',
    color: TEXT,
    letterSpacing: -2,
    lineHeight: 66,
    fontFamily: 'Georgia',
  },
  headerMeta: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 2.5,
  },
  headerLine: {
    flex: 1,
    height: 1,
    backgroundColor: DIVIDER,
  },

  divider: {
    height: 1,
    backgroundColor: DIVIDER,
  },

  // Map
  mapWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  map: {
    width: '100%',
    backgroundColor: SURFACE,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DIVIDER,
  },
  gridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#1E1E1E',
  },
  gridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#1E1E1E',
  },
  pin: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    marginLeft: -14,
    marginTop: -14,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0A0A0A',
  },
  pinActive: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: -18,
    marginTop: -18,
    backgroundColor: '#0A0A0A',
    borderColor: GOLD,
    borderWidth: 2,
  },
  pinLabel: {
    color: '#0A0A0A',
    fontWeight: '800',
    fontSize: 11,
  },
  pinLabelActive: {
    color: GOLD,
    fontSize: 13,
  },

  // Legend chips
  legendSection: {
    paddingBottom: 8,
  },
  legendRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 4,
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 1,
  },
  legendChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 1.5,
  },
  legendChipCount: {
    fontSize: 9,
    fontWeight: '700',
    color: GOLD,
  },

  // City panel
  cityHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cityName: {
    fontSize: 20,
    fontWeight: '900',
    color: TEXT,
    fontFamily: 'Georgia',
    letterSpacing: -0.5,
  },
  cityMeta: {
    fontSize: 10,
    color: MUTED,
    letterSpacing: 1,
    marginTop: 4,
  },
  clearBtn: {
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  clearLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 2,
  },

  // Editorial rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  rowPressed: {
    backgroundColor: '#111111',
  },
  rowNumber: {
    width: 32,
    fontSize: 20,
    fontWeight: '900',
    color: GOLD,
    fontFamily: 'Georgia',
    letterSpacing: -1,
    textAlign: 'right',
    opacity: 0.85,
  },
  rowImage: {
    width: 90,
    height: 68,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT,
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  rowLocation: {
    fontSize: 9,
    fontWeight: '600',
    color: MUTED,
    letterSpacing: 1.5,
    marginTop: 5,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 7,
  },
  rowRarity: {
    fontSize: 10,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.5,
  },
  rowPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT,
  },
  rowUnit: {
    fontSize: 10,
    fontWeight: '400',
    color: MUTED,
  },
  rowHeart: {
    padding: 8,
  },
});
