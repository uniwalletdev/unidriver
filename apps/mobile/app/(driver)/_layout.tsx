import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { SymbolView } from 'expo-symbols';
import { useSession } from '@/lib/session';
import { usePalette } from '@/lib/theme';

export default function DriverTabs() {
  const { account } = useSession();
  const c = usePalette();
  if (!account) {
    return <Redirect href="/welcome" />;
  }
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.brand,
        tabBarInactiveTintColor: c.text3,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: account.approved ? 'Trust' : 'Get approved',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'shield.lefthalf.filled', android: 'shield', web: 'shield' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="find"
        options={{
          title: 'Find a car',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
