import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Mail, ArrowLeft } from "lucide-react-native";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleRequestOTP = () => {
    router.push({ pathname: "/(auth)/verify-otp", params: { email } });
  };

  return (
    <View className="flex-1 bg-slate-900 px-6 pt-12">
      <TouchableOpacity onPress={() => router.back()} className="mb-6">
        <ArrowLeft size={24} color="#94A3B8" />
      </TouchableOpacity>

      <Text className="text-2xl font-bold text-white mb-2">Quên mật khẩu?</Text>
      <Text className="text-slate-400 text-xs mb-8 leading-relaxed">
        Nhập địa chỉ email đã đăng ký. Hệ thống sẽ gửi mã xác thực OTP 6 chữ số để bạn đặt lại mật khẩu.
      </Text>

      <View className="mb-6">
        <Text className="text-slate-300 text-xs font-medium mb-1.5">Email tài khoản</Text>
        <View className="flex-row items-center bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5">
          <Mail size={18} color="#94A3B8" />
          <TextInput
            placeholder="minh.nguyen@student.edu.vn"
            placeholderTextColor="#64748B"
            className="flex-1 text-slate-100 text-sm ml-2.5"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>
      </View>

      <TouchableOpacity
        className="bg-indigo-600 p-4 rounded-xl items-center mb-6 active:opacity-90"
        onPress={handleRequestOTP}
      >
        <Text className="text-white font-semibold text-sm">Gửi mã xác thực</Text>
      </TouchableOpacity>

      <Text className="text-slate-500 text-xs text-center">
        Hãy nhớ kiểm tra cả hộp thư chính và thư mục spam/rác.
      </Text>
    </View>
  );
}

