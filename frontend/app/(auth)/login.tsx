import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Mail, Lock, Eye, EyeOff, Sparkles } from "lucide-react-native";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    // Navigate into main tabs
    router.replace("/(tabs)");
  };

  return (
    <ScrollView className="flex-1 bg-slate-900 px-6 pt-16">
      {/* Brand Header */}
      <View className="items-center mb-8">
        <View className="bg-indigo-600/20 p-4 rounded-3xl border border-indigo-500/30 mb-3">
          <Sparkles size={36} color="#818CF8" />
        </View>
        <Text className="text-2xl font-bold text-white">DocuGraph AI</Text>
        <Text className="text-slate-400 text-xs mt-1 text-center">
          Nền tảng Trợ lý Tri thức Đa tầng & Đồ thị Học tập Thông minh
        </Text>
      </View>

      <Text className="text-xl font-bold text-white mb-6">Đăng nhập tài khoản</Text>

      {/* Google OAuth Button */}
      <TouchableOpacity
        className="bg-slate-800 border border-slate-700 p-3.5 rounded-xl flex-row items-center justify-center mb-5 active:bg-slate-750"
        onPress={handleLogin}
      >
        <Text className="text-slate-200 font-semibold text-sm">Đăng nhập với Google</Text>
      </TouchableOpacity>

      <View className="flex-row items-center mb-5">
        <View className="flex-1 h-[1px] bg-slate-800" />
        <Text className="text-slate-500 text-xs mx-3">Hoặc email và mật khẩu</Text>
        <View className="flex-1 h-[1px] bg-slate-800" />
      </View>

      {/* Email Input */}
      <View className="mb-4">
        <Text className="text-slate-300 text-xs font-medium mb-1.5">Email sinh viên</Text>
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

      {/* Password Input */}
      <View className="mb-2">
        <Text className="text-slate-300 text-xs font-medium mb-1.5">Mật khẩu</Text>
        <View className="flex-row items-center bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5">
          <Lock size={18} color="#94A3B8" />
          <TextInput
            placeholder="••••••••"
            placeholderTextColor="#64748B"
            className="flex-1 text-slate-100 text-sm ml-2.5"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Forgot Password Link */}
      <TouchableOpacity
        className="self-end mb-6"
        onPress={() => router.push("/(auth)/forgot-password")}
      >
        <Text className="text-indigo-400 text-xs font-medium">Quên mật khẩu?</Text>
      </TouchableOpacity>

      {/* Login Submit Button */}
      <TouchableOpacity
        className="bg-indigo-600 p-4 rounded-xl items-center mb-6 active:opacity-90"
        onPress={handleLogin}
      >
        <Text className="text-white font-semibold text-sm">Đăng nhập</Text>
      </TouchableOpacity>

      {/* Register Link */}
      <View className="flex-row justify-center pb-12">
        <Text className="text-slate-400 text-xs">Chưa có tài khoản? </Text>
        <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
          <Text className="text-indigo-400 text-xs font-bold">Đăng ký ngay</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

