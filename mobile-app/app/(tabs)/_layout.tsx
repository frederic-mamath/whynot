import { Tabs } from "expo-router";
import { Home, Radio, ShoppingBag, Store, User } from "lucide-react-native";
import { useTheme } from "@/lib/theme";
import { useUserRole } from "@/hooks/useUserRole";
import { TabBarIcon } from "@/components/TabBarIcon";

export default function TabLayout() {
  const theme = useTheme();
  const { isSeller } = useUserRole();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
        headerStyle: {
          backgroundColor: theme.colors.card,
        },
        headerTintColor: theme.colors.foreground,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <TabBarIcon icon={Home} color={color} />,
        }}
      />
      <Tabs.Screen
        name="channels"
        options={{
          title: "Live",
          tabBarIcon: ({ color }) => <TabBarIcon icon={Radio} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color }) => (
            <TabBarIcon icon={ShoppingBag} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarIcon: ({ color }) => <TabBarIcon icon={Store} color={color} />,
          href: isSeller ? "/(tabs)/shop" : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabBarIcon icon={User} color={color} />,
        }}
      />
    </Tabs>
  );
}
