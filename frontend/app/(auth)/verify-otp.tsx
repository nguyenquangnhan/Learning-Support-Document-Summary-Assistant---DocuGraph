import React, { useEffect, useState } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, KeyRound } from "lucide-react-native";
import AuthHeader from "../../components/auth/AuthHeader";
import { supabase } from "../../lib/supabase";

export default function VerifyOTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const email = Array.isArray(params.email) ? params.email[0] : params.email;
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (countdown === 0) return;
    const timer = setTimeout(() => setCountdown((remaining) => remaining - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResetPassword = async () => {
    const token = otp.join("");
    if (token.length < 6) {
      setErrorMessage("Vui lòng nhập đầy đủ 6 số mã xác thực.");
      return;
    }
    if (!newPassword || newPassword !== confirmPassword) {
      setErrorMessage("Mật khẩu mới và xác nhận mật khẩu không khớp.");
      return;
    }
    setIsLoading(true);
    setErrorMessage("");
    try {
      if (email) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email,
          token,
          type: "recovery",
        });
        if (verifyError) {
          setErrorMessage(verifyError.message);
          setIsLoading(false);
          return;
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setErrorMessage(updateError.message);
        setIsLoading(false);
        return;
      }

      Alert.alert("Thành công", "Mật khẩu đã được cập nhật thành công!", [
        { text: "Đăng nhập", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (err: any) {
      setErrorMessage(err.message || "Đặt lại mật khẩu thất bại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (email) {
      await supabase.auth.resetPasswordForEmail(email);
    }
    setOtp(["", "", "", "", "", ""]);
    setCountdown(45);
  };

  const passwordMeetsRequirements =
    newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /\d/.test(newPassword);

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
                <KeyRound size={18} color="#2354C7" />
              </View>
              <Text style={styles.title}>Đặt lại mật khẩu</Text>
              <Text style={styles.subtitle}>
                Mã đã gửi đến{" "}
                <Text style={styles.emailText}>{email || "email của bạn"}</Text>
              </Text>

              <Text style={styles.label}>Mã xác thực</Text>
              <View style={styles.otpRow}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    accessibilityLabel={`Chữ số OTP thứ ${index + 1}`}
                    value={digit}
                    onChangeText={(value) => {
                      const nextOtp = [...otp];
                      nextOtp[index] = value.replace(/\D/g, "").slice(-1);
                      setOtp(nextOtp);
                    }}
                    style={[
                      styles.otpInput,
                      index === 0 && styles.activeOtpInput,
                    ]}
                    maxLength={1}
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    selectTextOnFocus
                  />
                ))}
              </View>

              <View style={styles.resendRow}>
                <Pressable
                  accessibilityRole="button"
                  disabled={countdown > 0}
                  onPress={handleResendCode}
                >
                  <Text
                    style={[
                      styles.resendText,
                      countdown > 0 && styles.disabledText,
                    ]}
                  >
                    Gửi lại mã
                  </Text>
                </Pressable>
                <Text style={styles.timerText}>
                  ◷ 00:{String(countdown).padStart(2, "0")}
                </Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Mật khẩu mới</Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    accessibilityLabel="Mật khẩu mới"
                    placeholder="Nhập mật khẩu mới"
                    placeholderTextColor="#94A3B8"
                    style={styles.passwordInput}
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    value={newPassword}
                    onChangeText={setNewPassword}
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
                      <Eye size={16} color="#1E40AF" />
                    ) : (
                      <EyeOff size={16} color="#1E40AF" />
                    )}
                  </Pressable>
                </View>
                <View style={styles.passwordHint}>
                  <Check
                    size={12}
                    color={passwordMeetsRequirements ? "#16A34A" : "#94A3B8"}
                  />
                  <Text
                    style={[
                      styles.passwordHintText,
                      passwordMeetsRequirements && styles.validPasswordText,
                    ]}
                  >
                    Ít nhất 8 ký tự, có chữ hoa và chữ số
                  </Text>
                </View>
              </View>

              <View style={[styles.field, styles.confirmField]}>
                <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    accessibilityLabel="Xác nhận mật khẩu mới"
                    placeholder="Nhập lại mật khẩu mới"
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
                      <Eye size={16} color="#1E40AF" />
                    ) : (
                      <EyeOff size={16} color="#1E40AF" />
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
                onPress={handleResetPassword}
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
                    <Text style={styles.primaryButtonText}>
                      Xác nhận và đặt lại mật khẩu
                    </Text>
                    <ArrowRight size={16} color="#FFFFFF" />
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
    color: "#1E40AF",
    fontSize: 23,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 17,
    color: "#71819B",
    fontSize: 12,
  },
  emailText: {
    color: "#71819B",
  },
  label: {
    marginBottom: 6,
    color: "#172B4D",
    fontSize: 11,
    fontWeight: "500",
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  otpInput: {
    flex: 1,
    height: 56,
    padding: 0,
    width: 43.5,
    borderWidth: 1,
    borderColor: "#DCE4F0",
    borderRadius: 8,
    color: "#172B4D",
    fontSize: 17,
    textAlign: "center",
  },
  activeOtpInput: {
    borderColor: "#2443B5",
    borderWidth: 2,
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 21,
  },
  resendText: {
    color: "#1E40AF",
    fontSize: 11,
    fontWeight: "500",
  },
  disabledText: {
    color: "#94A3B8",
  },
  timerText: {
    color: "#94A3B8",
    fontSize: 11,
  },
  field: {
    marginBottom: 14,
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
    gap: 4,
    marginTop: 6,
  },
  passwordHintText: {
    color: "#94A3B8",
    fontSize: 10,
  },
  validPasswordText: {
    color: "#16A34A",
  },
  confirmField: {
    marginBottom: 19,
  },
  primaryButton: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 8,
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
