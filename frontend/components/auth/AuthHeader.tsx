import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SvgUri } from "react-native-svg";
import { Asset } from "expo-asset";

interface AuthHeaderProps {
  brandName?: string;
}

// Lấy đường dẫn URI chuẩn của file Logo.svg từ assets
const logoUri = Asset.fromModule(require("../../assets/Logo.svg")).uri;

export default function AuthHeader({ brandName = "DocuGraph" }: AuthHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <SvgUri width={32} height={32} uri={logoUri} />
        <Text style={styles.brandName}>{brandName}</Text>
      </View>
      <Pressable onPress={() => router.push("/(auth)/forgot-password")} hitSlop={8}>
        <Text style={styles.helpText}>Trợ giúp</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandName: {
    color: "#1D3BB9",
    fontSize: 20,
    fontWeight: "700",
  },
  helpText: {
    color: "#2547BD",
    fontSize: 12,
    fontWeight: "600",
  },
});