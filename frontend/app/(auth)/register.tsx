import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { User, Mail, Lock, ShieldCheck } from "lucide-react-native";

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = () => {
    router.replace("/(tabs)");
  };

  return (
    <ScrollView className="flex-1 bg-slate-900 px-6 pt-12">
      <Text className="text-2xl font-bold text-white mb-1">Tạo tài khoản mới</Text>
      <Text className="text-slate-400 text-xs mb-6">
        Bắt đầu khai thác Đồ thị Tri thức và tham gia các nhóm học tập.
      </Text>

      {/* Name */}
      <View className="mb-4">
        <Text className="text-slate-300 text-xs font-medium mb-1.5">Họ và tên</Text>
        <View className="flex-row items-center bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5">
          <User size={18} color="#94A3B8" />
          <TextInput
            placeholder="Nguyễn Văn Minh"
            placeholderTextColor="#64748B"
            className="flex-1 text-slate-100 text-sm ml-2.5"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>
      </View>

      {/* Email */}
      <View className="mb-4">
        <Text className="text-slate-300 text-xs font-medium mb-1.5">Email</Text>
        <View className="flex-row items-center bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5">
          <Mail size={18} color="#94A3B8" />
          <TextInput
            placeholder="minh.nguyen@example.com"
            placeholderTextColor="#64748B"
            className="flex-1 text-slate-100 text-sm ml-2.5"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>
      </View>

      {/* Password */}
      <View className="mb-4">
        <Text className="text-slate-300 text-xs font-medium mb-1.5">Mật khẩu</Text>
        <View className="flex-row items-center bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5">
          <Lock size={18} color="#94A3B8" />
          <TextInput
            placeholder="Tối thiểu 8 ký tự, có chữ hoa và số"
            placeholderTextColor="#64748B"
            className="flex-1 text-slate-100 text-sm ml-2.5"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>
        <View className="flex-row items-center mt-1.5">
          <ShieldCheck size={12} color="#10B981" />
          <Text className="text-emerald-400 text-[10px] ml-1">Độ mạnh mật khẩu: Tốt</Text>
        </View>
      </View>

      {/* Confirm Password */}
      <View className="mb-6">
        <Text className="text-slate-300 text-xs font-medium mb-1.5">Xác nhận mật khẩu</Text>
        <View className="flex-row items-center bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5">
          <Lock size={18} color="#94A3B8" />
          <TextInput
            placeholder="Nhập lại mật khẩu"
            placeholderTextColor="#64748B"
            className="flex-1 text-slate-100 text-sm ml-2.5"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>
      </View>

      <Text className="text-slate-500 text-[11px] mb-6 leading-relaxed">
        Bằng việc đăng ký, bạn đồng ý với <Text className="text-indigo-400">Điều khoản dịch vụ</Text> và{" "}
        <Text className="text-indigo-400">Chính sách quyền riêng tư</Text> của DocuGraph AI.
      </Text>

      <TouchableOpacity
        className="bg-indigo-600 p-4 rounded-xl items-center mb-6 active:opacity-90"
        onPress={handleRegister}
      >
        <Text className="text-white font-semibold text-sm">Đăng ký tài khoản</Text>
      </TouchableOpacity>

      <View className="flex-row justify-center pb-12">
        <Text className="text-slate-400 text-xs">Đã có tài khoản? </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-indigo-400 text-xs font-bold">Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

