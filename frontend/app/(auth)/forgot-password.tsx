import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, ArrowRight, Info, Mail } from "lucide-react-native";
import AuthHeader from "../../components/auth/AuthHeader";
import { supabase } from "../../lib/supabase";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleRequestOTP = async () => {
    if (!email.trim()) {
      setErrorMessage("Vui lòng nhập địa chỉ email của bạn.");
      return;
    }
    setIsLoading(true);
    setErrorMessage("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }
      router.push({ pathname: "/(auth)/verify-otp", params: { email: email.trim() } });
    } catch (err: any) {
      setErrorMessage(err.message || "Gửi yêu cầu thất bại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.appPanel}>
            <AuthHeader />

            <View style={styles.card}>
              <View style={styles.iconBox}>
                <Mail size={18} color="#2354C7" />
              </View>
              <Text style={styles.title}>Quên mật khẩu?</Text>
              <Text style={styles.description}>
                Đừng lo, hãy nhập email đã đăng ký. Chúng tôi sẽ gửi mã xác
                thực để bạn đặt lại mật khẩu.
              </Text>

              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  accessibilityLabel="Email"
                  placeholder="Nhập email đã đăng ký"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.infoBox}>
                <Info size={14} color="#2354C7" />
                <Text style={styles.infoText}>
                  Mã xác thực gồm 6 chữ số. Vui lòng kiểm tra cả thư mục rác
                  nếu chưa nhận được email.
                </Text>
              </View>

              {/* Thông báo lỗi */}
              {errorMessage ? (
                <View style={{ backgroundColor: "#FEF2F2", padding: 10, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: "#FCA5A5" }}>
                  <Text style={{ color: "#DC2626", fontSize: 12, fontWeight: "500" }}>{errorMessage}</Text>
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                onPress={handleRequestOTP}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.primaryButton,
                  (pressed || isLoading) && styles.pressed,
                  isLoading && { opacity: 0.7 },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Gửi mã xác thực</Text>
                    <ArrowRight size={14} color="#FFFFFF" />
                  </>
                )}
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.replace("/(auth)/login")}
                style={styles.backButton}
              >
                <ArrowLeft size={14} color="#1E40AF" />
                <Text style={styles.backText}>Quay lại đăng nhập</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  appPanel: {
    flex: 1,
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    padding: 16,
    borderRadius: 28,
    backgroundColor: "#F8FAFC",
  },
  card: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5EAF2",
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
  },
  iconBox: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderRadius: 11,
    backgroundColor: "#EDF4FF",
  },
  title: {
    color: "#152B4A",
    fontSize: 32,
    fontWeight: "700",
  },
  description: {
    marginTop: 8,
    marginBottom: 18,
    color: "#71819B",
    fontSize: 16,
    lineHeight: 19,
  },
  field: {
    marginBottom: 19,
  },
  label: {
    marginBottom: 6,
    color: "#152B4A",
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    height: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#DCE4F0",
    borderRadius: 8,
    color: "#172B4D",
    fontSize: 12,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 19,
    padding: 13,
    borderRadius: 9,
    backgroundColor: "#F3F7FC",
  },
  infoText: {
    flex: 1,
    color: "#71819B",
    fontSize: 11,
    lineHeight: 17,
  },
  primaryButton: {
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 8,
    backgroundColor: "#2443B5",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.82,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 19,
  },
  backText: {
    color: "#1E40AF",
    fontSize: 11,
    fontWeight: "500",
  },
});
