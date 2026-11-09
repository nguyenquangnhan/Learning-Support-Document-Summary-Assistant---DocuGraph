import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { ArrowRight, Eye, EyeOff, Info } from "lucide-react-native";
import AuthHeader from "../../components/auth/AuthHeader";
import { supabase } from "../../lib/supabase";

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMessage("Vui lòng điền đầy đủ các trường thông tin.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Mật khẩu phải có tối thiểu 6 ký tự.");
      return;
    }
    setIsLoading(true);
    setErrorMessage("");
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      if (data.session) {
        router.replace("/(tabs)");
      } else {
        Alert.alert(
          "Đăng ký thành công!",
          "Vui lòng kiểm tra hộp thư email của bạn để xác thực tài khoản.",
          [{ text: "Đăng nhập ngay", onPress: () => router.push("/(auth)/login") }]
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Đăng ký thất bại.");
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

            <View style={styles.registerCard}>
              <Text style={styles.title}>Tạo tài khoản của bạn</Text>
              <Text style={styles.subtitle}>
                Bắt đầu cùng DocuGraph. Chỉ mất một phút.
              </Text>

              <View style={styles.field}>
                <Text style={styles.label}>Họ và tên</Text>
                <TextInput
                  accessibilityLabel="Họ và tên"
                  placeholder="Nhập họ và tên của bạn"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                  autoCapitalize="words"
                  autoComplete="name"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  accessibilityLabel="Email"
                  placeholder="Nhập địa chỉ email của bạn"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Mật khẩu</Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    accessibilityLabel="Mật khẩu"
                    placeholder="Tạo mật khẩu"
                    placeholderTextColor="#94A3B8"
                    style={styles.passwordInput}
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    value={password}
                    onChangeText={setPassword}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                    }
                    onPress={() => setShowPassword((visible) => !visible)}
                    hitSlop={10}
                  >
                    {showPassword ? (
                      <Eye size={16} color="#64748B" />
                    ) : (
                      <EyeOff size={16} color="#64748B" />
                    )}
                  </Pressable>
                </View>
                <View style={styles.passwordHint}>
                  <Info size={12} color="#71819B" />
                  <Text style={styles.passwordHintText}>
                    Ít nhất 8 ký tự, có chữ hoa và chữ số.
                  </Text>
                </View>
              </View>

              <View style={[styles.field, styles.confirmField]}>
                <Text style={styles.label}>Xác nhận mật khẩu</Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    accessibilityLabel="Xác nhận mật khẩu"
                    placeholder="Nhập lại mật khẩu"
                    placeholderTextColor="#94A3B8"
                    style={styles.passwordInput}
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      showConfirmPassword
                        ? "Ẩn mật khẩu xác nhận"
                        : "Hiện mật khẩu xác nhận"
                    }
                    onPress={() =>
                      setShowConfirmPassword((visible) => !visible)
                    }
                    hitSlop={10}
                  >
                    {showConfirmPassword ? (
                      <Eye size={16} color="#64748B" />
                    ) : (
                      <EyeOff size={16} color="#64748B" />
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Thông báo lỗi */}
              {errorMessage ? (
                <View style={{ backgroundColor: "#FEF2F2", padding: 10, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: "#FCA5A5" }}>
                  <Text style={{ color: "#DC2626", fontSize: 12, fontWeight: "500" }}>{errorMessage}</Text>
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                onPress={handleRegister}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.registerButton,
                  (pressed || isLoading) && styles.pressed,
                  isLoading && { opacity: 0.7 },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.registerButtonText}>
                      Đăng ký tài khoản
                    </Text>
                    <ArrowRight size={16} color="#FFFFFF" />
                  </>
                )}
              </Pressable>

              <Text style={styles.termsText}>
                Bằng việc đăng ký, bạn đồng ý với{" "}
                <Text style={styles.termsLink}>Điều khoản sử dụng</Text> và{" "}
                <Text style={styles.termsLink}>
                  Chính sách quyền riêng tư
                </Text>{" "}
                của DocuGraph.
              </Text>

              <View style={styles.loginRow}>
                <Text style={styles.loginText}>Đã có tài khoản? </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.replace("/(auth)/login")}
                >
                  <Text style={styles.loginLink}>Đăng nhập</Text>
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
  keyboardView: {
    flex: 1,
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
  registerCard: {
    padding: 16,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  title: {
    color: "#172B4D",
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 7,
    marginBottom: 14,
    color: "#71819B",
    fontSize: 12,
  },
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
  passwordHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 7,
  },
  passwordHintText: {
    color: "#71819B",
    fontSize: 10,
  },
  confirmField: {
    marginBottom: 14,
  },
  registerButton: {
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 8,
    backgroundColor: "#2443B5",
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.82,
  },
  termsText: {
    marginTop: 12,
    color: "#71819B",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
  },
  termsLink: {
    color: "#1E40AF",
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 17,
  },
  loginText: {
    color: "#71819B",
    fontSize: 11,
  },
  loginLink: {
    color: "#1E40AF",
    fontSize: 11,
    fontWeight: "600",
  },
});
