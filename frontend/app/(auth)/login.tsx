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
import { ArrowRight, Eye, EyeOff } from "lucide-react-native";
import AuthHeader from "../../components/auth/AuthHeader";
import { supabase } from "../../lib/supabase";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMessage("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }
    setIsLoading(true);
    setErrorMessage("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      if (data.session) {
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Đăng nhập thất bại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      if (error) setErrorMessage(error.message);
    } catch (err: any) {
      setErrorMessage(err.message || "Lỗi đăng nhập Google");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.appPanel}>
            <AuthHeader />

            {/* Login Card */}
            <View style={styles.loginCard}>
              <Text style={styles.title}>Chào mừng trở lại!</Text>
              <Text style={styles.subtitle}>Đăng nhập để tiếp tục học tập cùng DocuGraph.</Text>

              {/* Nút Google */}
              <Pressable
                onPress={handleGoogleLogin}
                style={({ pressed }) => [styles.googleButton, pressed && styles.pressed]}
              >
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>Đăng nhập với Google</Text>
              </Pressable>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>hoặc bằng email</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Input Email */}
              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  placeholder="name@student.edu.vn"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {/* Input Password */}
              <View style={styles.field}>
                <Text style={styles.label}>Mật khẩu</Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    style={styles.passwordInput}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={10}>
                    {showPassword ? <Eye size={17} color="#1E40AF" /> : <EyeOff size={17} color="#1E40AF" />}
                  </Pressable>
                </View>
              </View>

              {/* Thông báo lỗi nếu có */}
              {errorMessage ? (
                <View style={{ backgroundColor: "#FEF2F2", padding: 10, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: "#FCA5A5" }}>
                  <Text style={{ color: "#DC2626", fontSize: 12, fontWeight: "500" }}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Quên mật khẩu */}
              <Pressable onPress={() => router.push("/(auth)/forgot-password")} style={styles.forgotButton}>
                <Text style={styles.linkText}>Quên mật khẩu?</Text>
              </Pressable>

              {/* Nút Đăng nhập */}
              <Pressable
                onPress={handleLogin}
                disabled={isLoading}
                style={({ pressed }) => [styles.loginButton, (pressed || isLoading) && styles.pressed, isLoading && { opacity: 0.7 }]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Đăng nhập</Text>
                    <ArrowRight size={16} color="#FFFFFF" />
                  </>
                )}
              </Pressable>

              {/* Chuyển sang Đăng ký */}
              <View style={styles.registerRow}>
                <Text style={styles.registerText}>Chưa có tài khoản? </Text>
                <Pressable onPress={() => router.push("/(auth)/register")}>
                  <Text style={styles.linkText}>Đăng ký ngay</Text>
                </Pressable>
              </View>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 20,
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

  /* Thẻ đăng nhập */
  loginCard: {
    padding: 16,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  title: {
    color: "#0F172A",
    fontSize: 21,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 7,
    marginBottom: 18,
    color: "#71819B",
    fontSize: 12,
  },

  /* Nút Google */
  googleButton: {
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#DCE4F0",
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
  },
  googleIcon: {
    color: "#1E40AF",
    fontSize: 18,
    fontWeight: "700",
  },
  googleButtonText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "600",
  },

  /* Đường gạch ngang chia cách */
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E7ECF3",
  },
  dividerText: {
    color: "#94A3B8",
    fontSize: 11,
  },

  /* Các ô nhập liệu (Inputs) */
  field: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 7,
    color: "#172B4D",
    fontSize: 12,
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
  passwordInputWrapper: {
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#DCE4F0",
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    color: "#172B4D",
    fontSize: 12,
  },

  /* Nút hành động & Điều hướng */
  forgotButton: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  linkText: {
    color: "#1E40AF",
    fontSize: 11,
    fontWeight: "600",
  },
  loginButton: {
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 8,
    backgroundColor: "#2443B5",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.82,
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  registerText: {
    color: "#64748B",
    fontSize: 11,
  },
});