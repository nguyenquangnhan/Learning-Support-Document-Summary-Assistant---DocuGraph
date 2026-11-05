import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Lock, CheckCircle2 } from "lucide-react-native";

export default function VerifyOTPScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [countdown, setCountdown] = useState(59);

  const handleResetPassword = () => {
    router.replace("/(auth)/login");
  };

  return (
    <ScrollView className="flex-1 bg-slate-900 px-6 pt-10">
      <Text className="text-2xl font-bold text-white mb-2">Nhập mã xác thực OTP</Text>
      <Text className="text-slate-400 text-xs mb-6">
        Mã OTP 6 chữ số đã được gửi tới email <Text className="text-indigo-400">{email || "của bạn"}</Text>.
      </Text>

      {/* 6 OTP boxes representation */}
      <View className="flex-row justify-between mb-4">
        {[0, 1, 2, 3, 4, 5].map((idx) => (
          <View
            key={idx}
            className="w-12 h-14 bg-slate-800 border border-slate-700 rounded-xl items-center justify-center"
          >
            <TextInput
              className="text-white text-xl font-bold text-center"
              maxLength={1}
              keyboardType="number-pad"
              onChangeText={(val) => {
                const nextOtp = [...otp];
                nextOtp[idx] = val;
                setOtp(nextOtp);
              }}
            />
          </View>
        ))}
      </View>

      {/* Countdown and resend */}
      <View className="flex-row justify-between items-center mb-8">
        <Text className="text-slate-500 text-xs">Mã hết hạn sau: 00:{countdown < 10 ? `0${countdown}` : countdown}</Text>
        <TouchableOpacity>
          <Text className="text-indigo-400 text-xs font-semibold">Gửi lại mã</Text>
        </TouchableOpacity>
      </View>

      {/* New Password */}
      <View className="mb-4">
        <Text className="text-slate-300 text-xs font-medium mb-1.5">Mật khẩu mới</Text>
        <View className="flex-row items-center bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5">
          <Lock size={18} color="#94A3B8" />
          <TextInput
            placeholder="Mật khẩu mới (≥ 8 ký tự)"
            placeholderTextColor="#64748B"
            className="flex-1 text-slate-100 text-sm ml-2.5"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
        </View>
      </View>

      {/* Confirm Password */}
      <View className="mb-8">
        <Text className="text-slate-300 text-xs font-medium mb-1.5">Xác nhận mật khẩu mới</Text>
        <View className="flex-row items-center bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5">
          <Lock size={18} color="#94A3B8" />
          <TextInput
            placeholder="Nhập lại mật khẩu mới"
            placeholderTextColor="#64748B"
            className="flex-1 text-slate-100 text-sm ml-2.5"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>
      </View>

      <TouchableOpacity
        className="bg-indigo-600 p-4 rounded-xl items-center mb-8 active:opacity-90"
        onPress={handleResetPassword}
      >
        <Text className="text-white font-semibold text-sm">Đặt lại mật khẩu & Đăng nhập</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

