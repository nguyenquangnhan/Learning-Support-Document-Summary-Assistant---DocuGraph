import { Tabs } from "expo-router";
import {
  BookOpen,
  MessageSquare,
  Swords,
  Users,
  UserRound,
} from "lucide-react-native";
import { useThemeStore } from "../../stores/themeStore";

export default function TabLayout() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDarkMode ? "#0F172A" : "#FFFFFF",
          borderTopColor: isDarkMode ? "#1E293B" : "#E2E8F0",
          height: 66,
          paddingBottom: 6,
          paddingTop: 7,
        },
        tabBarActiveTintColor: isDarkMode ? "#818CF8" : "#2447BA",
        tabBarInactiveTintColor: isDarkMode ? "#64748B" : "#64748B",
        tabBarLabelStyle: { fontSize: 10, fontWeight: "500" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Tủ sách",
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat AI",
          tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: "Nhóm học",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="battle"
        options={{
          title: "Đấu trí",
          tabBarIcon: ({ color, size }) => <Swords color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Cá nhân",
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="graph" options={{ href: null }} />
    </Tabs>
  );
}
