import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#5b3cc4',
        tabBarInactiveTintColor: '#9a9a9a',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Ionicons name="search" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="rare"
        options={{
          title: 'Finds',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="deals"
        options={{
          title: 'Best Deals',
          tabBarIcon: ({ color, size }) => <Ionicons name="pricetag" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => <Ionicons name="map" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color, size }) => <Ionicons name="heart" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
