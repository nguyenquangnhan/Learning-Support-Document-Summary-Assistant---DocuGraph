import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Edit3,
  GraduationCap,
  HardDrive,
  KeyRound,
  LogIn,
  LogOut,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
  Trash2,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react-native";
import { useAuthStore } from "../../stores/authStore";
import { useThemeStore } from "../../stores/themeStore";
import { sl } from "../../src/core/di/injection_container";

export default function ProfileTabScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout, updateProfile, changePassword } = useAuthStore();
  const { isDarkMode, toggleDarkMode } = useThemeStore();

  const displayName = user?.full_name?.trim() || "Sinh viên VKU";
  const displayEmail = user?.email || "student@vku.udn.vn";
  const displayStudentId = user?.student_id?.trim() || "23IT.B001";
  const displayMajor = user?.major?.trim() || "Kỹ thuật Phần mềm (CNTT)";

  // Modals state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Edit Profile Inputs
  const [fullNameInput, setFullNameInput] = useState(displayName);
  const [studentIdInput, setStudentIdInput] = useState(displayStudentId);
  const [majorInput, setMajorInput] = useState(displayMajor);
  const [savingProfile, setSavingProfile] = useState(false);

  // Change Password Inputs
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Feedback banner
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setFullNameInput(user?.full_name?.trim() || "Sinh viên VKU");
    setStudentIdInput(user?.student_id?.trim() || "23IT.B001");
    setMajorInput(user?.major?.trim() || "Kỹ thuật Phần mềm (CNTT)");
  }, [user]);

  const { data: documents = [] } = useQuery({
    queryKey: ["documents", user?.id || "guest"],
    queryFn: async () => {
      const resEither = await sl.getDocumentsUseCase.call();
      return resEither.fold(
        () => [],
        (list) => list
      );
    },
  });

  const showBanner = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 3200);
  };

  const handleSaveProfile = async () => {
    const cleanName = fullNameInput.trim();
    if (!cleanName) {
      showBanner("error", "Tên hiển thị không được để trống.");
      return;
    }
    setSavingProfile(true);
    const res = await updateProfile({
      full_name: cleanName,
      student_id: studentIdInput.trim(),
      major: majorInput.trim(),
    });
    setSavingProfile(false);
    setShowEditProfileModal(false);
    showBanner(res.ok ? "success" : "error", res.message);
  };

  const handleSavePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showBanner("error", "Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showBanner("error", "Mật khẩu xác nhận không khớp.");
      return;
    }
    setSavingPassword(true);
    const res = await changePassword(newPassword);
    setSavingPassword(false);
    if (res.ok) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordModal(false);
    }
    showBanner(res.ok ? "success" : "error", res.message);
  };

  const handleClearOfflineCache = async () => {
    try {
      for (const d of documents) {
        await sl.documentLocalDataSource.removeCachedDocument(d.id);
      }
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      showBanner("success", "Đã dọn dẹp bộ nhớ đệm ngoại tuyến thành công!");
    } catch {
      showBanner("error", "Không thể xóa bộ nhớ đệm lúc này.");
    }
  };

  const bgMain = isDarkMode ? "#0F172A" : "#F8FAFC";
  const bgCard = isDarkMode ? "#1E293B" : "#FFFFFF";
  const borderCard = isDarkMode ? "#334155" : "#E2E8F0";
  const textPrimary = isDarkMode ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDarkMode ? "#94A3B8" : "#64748B";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgMain }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Title + Theme Quick Button */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <View>
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#6366F1", textTransform: "uppercase" }}>
              HỒ SƠ HỌC TẬP & CÀI ĐẶT
            </Text>
            <Text style={{ fontSize: 22, fontWeight: "800", color: textPrimary, marginTop: 2 }}>
              Cá nhân & Bảo mật
            </Text>
          </View>
          <Pressable
            onPress={toggleDarkMode}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: bgCard,
              borderWidth: 1,
              borderColor: borderCard,
            }}
          >
            {isDarkMode ? (
              <>
                <Sun size={16} color="#FBBF24" />
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#FBBF24" }}>Sáng</Text>
              </>
            ) : (
              <>
                <Moon size={16} color="#4F46E5" />
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#4F46E5" }}>Tối</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Status Toast Banner */}
        {statusMessage && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              padding: 12,
              borderRadius: 14,
              marginBottom: 14,
              backgroundColor:
                statusMessage.type === "success"
                  ? isDarkMode
                    ? "#064E3B"
                    : "#ECFDF5"
                  : isDarkMode
                  ? "#7F1D1D"
                  : "#FEF2F2",
              borderWidth: 1,
              borderColor: statusMessage.type === "success" ? "#10B981" : "#EF4444",
            }}
          >
            <CheckCircle2
              size={16}
              color={statusMessage.type === "success" ? "#10B981" : "#EF4444"}
            />
            <Text
              style={{
                flex: 1,
                fontSize: 12,
                fontWeight: "600",
                color:
                  statusMessage.type === "success"
                    ? isDarkMode
                      ? "#A7F3D0"
                      : "#065F46"
                    : isDarkMode
                    ? "#FECACA"
                    : "#991B1B",
              }}
            >
              {statusMessage.text}
            </Text>
          </View>
        )}

        {/* 1. User Avatar & Profile Card */}
        <View
          style={{
            backgroundColor: bgCard,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: borderCard,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 58,
                height: 58,
                borderRadius: 29,
                backgroundColor: isDarkMode ? "#312E81" : "#E0E7FF",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: isDarkMode ? "#A5B4FC" : "#3730A3",
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: "800", color: textPrimary }}>
                {displayName}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 3, gap: 5 }}>
                <Mail size={12} color={textSecondary} />
                <Text style={{ fontSize: 12, color: textSecondary }}>{displayEmail}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 3, gap: 5 }}>
                <GraduationCap size={13} color="#6366F1" />
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#6366F1" }}>
                  MSSV: {displayStudentId} • {displayMajor}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => setShowEditProfileModal(true)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor: isDarkMode ? "#312E81" : "#EEF2FF",
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Edit3 size={14} color={isDarkMode ? "#A5B4FC" : "#4F46E5"} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: isDarkMode ? "#A5B4FC" : "#4F46E5",
                }}
              >
                Sửa
              </Text>
            </Pressable>
          </View>

          {/* Learning Stats Row */}
          <View
            style={{
              flexDirection: "row",
              marginTop: 16,
              paddingTop: 14,
              borderTopWidth: 1,
              borderTopColor: borderCard,
              justifyContent: "space-around",
            }}
          >
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#6366F1" }}>
                {documents.length}
              </Text>
              <Text style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>
                Tài liệu đã tải
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: borderCard }} />
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#10B981" }}>
                {(documents.length * 1.4).toFixed(1)} MB
              </Text>
              <Text style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>
                Bộ nhớ Offline
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: borderCard }} />
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#F59E0B" }}>
                {user ? "Đã xác thực" : "Chế độ Khách"}
              </Text>
              <Text style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>
                Trạng thái
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Chế độ giao diện (Dark Mode Toggle Row) */}
        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: textSecondary,
            textTransform: "uppercase",
            marginBottom: 8,
            marginLeft: 4,
          }}
        >
          Giao diện & Hiển thị
        </Text>
        <View
          style={{
            backgroundColor: bgCard,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: borderCard,
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginBottom: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: isDarkMode ? "#312E81" : "#EEF2FF",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isDarkMode ? (
                <Moon size={18} color="#818CF8" />
              ) : (
                <Sun size={18} color="#4F46E5" />
              )}
            </View>
            <View>
              <Text style={{ fontSize: 14, fontWeight: "700", color: textPrimary }}>
                Chế độ Ban đêm (Dark Mode)
              </Text>
              <Text style={{ fontSize: 11, color: textSecondary, marginTop: 1 }}>
                {isDarkMode
                  ? "Đang bật giao diện tối bảo vệ mắt"
                  : "Đang dùng giao diện sáng tiêu chuẩn"}
              </Text>
            </View>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: "#CBD5E1", true: "#4F46E5" }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* 3. Quản lý thông tin cá nhân & Bảo mật */}
        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: textSecondary,
            textTransform: "uppercase",
            marginBottom: 8,
            marginLeft: 4,
          }}
        >
          Thiết lập tài khoản
        </Text>
        <View
          style={{
            backgroundColor: bgCard,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: borderCard,
            marginBottom: 16,
            overflow: "hidden",
          }}
        >
          {/* Đổi tên hiển thị & MSSV */}
          <Pressable
            onPress={() => setShowEditProfileModal(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: borderCard,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: isDarkMode ? "#1E3A8A" : "#DBEAFE",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UserCheck size={18} color={isDarkMode ? "#93C5FD" : "#2563EB"} />
              </View>
              <View>
                <Text style={{ fontSize: 13.5, fontWeight: "700", color: textPrimary }}>
                  Đổi tên hiển thị & Thông tin sinh viên
                </Text>
                <Text style={{ fontSize: 11, color: textSecondary, marginTop: 1 }}>
                  Cập nhật họ tên, mã số sinh viên, chuyên ngành học
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={textSecondary} />
          </Pressable>

          {/* Đổi mật khẩu */}
          <Pressable
            onPress={() => setShowPasswordModal(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: borderCard,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: isDarkMode ? "#064E3B" : "#D1FAE5",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <KeyRound size={18} color="#10B981" />
              </View>
              <View>
                <Text style={{ fontSize: 13.5, fontWeight: "700", color: textPrimary }}>
                  Đổi mật khẩu đăng nhập
                </Text>
                <Text style={{ fontSize: 11, color: textSecondary, marginTop: 1 }}>
                  Thay đổi mật khẩu bảo vệ tài khoản của bạn
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={textSecondary} />
          </Pressable>

          {/* Quản lý tài liệu của tôi */}
          <Pressable
            onPress={() => router.push("/document/new")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: borderCard,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: isDarkMode ? "#312E81" : "#E0E7FF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BookOpen size={18} color="#6366F1" />
              </View>
              <View>
                <Text style={{ fontSize: 13.5, fontWeight: "700", color: textPrimary }}>
                  Tải thêm tài liệu học tập mới
                </Text>
                <Text style={{ fontSize: 11, color: textSecondary, marginTop: 1 }}>
                  Hỗ trợ PDF, DOCX, TXT kèm tóm tắt AI đa tầng
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={textSecondary} />
          </Pressable>

          {/* Xóa bộ nhớ đệm Offline */}
          <Pressable
            onPress={handleClearOfflineCache}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: isDarkMode ? "#451A03" : "#FEF3C7",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <HardDrive size={18} color="#F59E0B" />
              </View>
              <View>
                <Text style={{ fontSize: 13.5, fontWeight: "700", color: textPrimary }}>
                  Dọn dẹp bộ nhớ đệm Offline ({documents.length} tệp)
                </Text>
                <Text style={{ fontSize: 11, color: textSecondary, marginTop: 1 }}>
                  Giải phóng dung lượng lưu trữ cục bộ trên thiết bị
                </Text>
              </View>
            </View>
            <Trash2 size={16} color="#F59E0B" />
          </Pressable>
        </View>

        {/* 4. Thông tin bảo mật Supabase BaaS */}
        <View
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: isDarkMode ? "#065F46" : "#A7F3D0",
            backgroundColor: isDarkMode ? "#064E3B" : "#ECFDF5",
            padding: 14,
            marginBottom: 20,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={18} color={isDarkMode ? "#34D399" : "#047857"} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: isDarkMode ? "#A7F3D0" : "#065F46",
              }}
            >
              Supabase Auth + Offline-First SSOT
            </Text>
          </View>
          <Text
            style={{
              marginTop: 4,
              fontSize: 11,
              color: isDarkMode ? "#6EE7B7" : "#047857",
            }}
          >
            Trạng thái phiên: {user ? `Đã đăng nhập (ID: ${user.id.slice(0, 10)}...)` : "Chế độ Khách"}
          </Text>
        </View>

        {/* 5. Nút Đăng xuất / Đăng nhập */}
        <View style={{ gap: 10 }}>
          {user ? (
            <Pressable
              onPress={async () => {
                await logout();
                router.replace("/(auth)/login");
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderRadius: 14,
                backgroundColor: "#EF4444",
                paddingVertical: 14,
              }}
            >
              <LogOut size={16} color="#FFFFFF" />
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>
                Đăng xuất tài khoản
              </Text>
            </Pressable>
          ) : (
            <>
              <Pressable
                onPress={() => router.push("/(auth)/login")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  borderRadius: 14,
                  backgroundColor: "#4F46E5",
                  paddingVertical: 14,
                }}
              >
                <LogIn size={16} color="#FFFFFF" />
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>
                  Đăng nhập tài khoản
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/(auth)/register")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#4F46E5",
                  backgroundColor: bgCard,
                  paddingVertical: 14,
                }}
              >
                <UserPlus size={16} color="#6366F1" />
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#6366F1" }}>
                  Đăng ký tài khoản mới
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>

      {/* ================================================================= */}
      {/* MODAL 1: CHỈNH SỬA HỒ SƠ CÁ NHÂN (Đổi tên, MSSV, Chuyên ngành)    */}
      {/* ================================================================= */}
      <Modal
        visible={showEditProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: bgCard,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              borderTopWidth: 1,
              borderTopColor: borderCard,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 17, fontWeight: "800", color: textPrimary }}>
                Cập nhật thông tin cá nhân
              </Text>
              <Pressable
                onPress={() => setShowEditProfileModal(false)}
                style={{
                  padding: 6,
                  borderRadius: 999,
                  backgroundColor: isDarkMode ? "#334155" : "#F1F5F9",
                }}
              >
                <X size={18} color={textSecondary} />
              </Pressable>
            </View>

            <Text style={{ fontSize: 12, fontWeight: "700", color: textSecondary, marginBottom: 6 }}>
              Họ và tên hiển thị
            </Text>
            <TextInput
              value={fullNameInput}
              onChangeText={setFullNameInput}
              placeholder="Nhập họ và tên của bạn..."
              placeholderTextColor="#94A3B8"
              style={{
                backgroundColor: bgMain,
                borderColor: borderCard,
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                color: textPrimary,
                marginBottom: 12,
              }}
            />

            <Text style={{ fontSize: 12, fontWeight: "700", color: textSecondary, marginBottom: 6 }}>
              Mã số sinh viên (MSSV)
            </Text>
            <TextInput
              value={studentIdInput}
              onChangeText={setStudentIdInput}
              placeholder="VD: 23IT.B001"
              placeholderTextColor="#94A3B8"
              style={{
                backgroundColor: bgMain,
                borderColor: borderCard,
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                color: textPrimary,
                marginBottom: 12,
              }}
            />

            <Text style={{ fontSize: 12, fontWeight: "700", color: textSecondary, marginBottom: 6 }}>
              Khoa / Chuyên ngành
            </Text>
            <TextInput
              value={majorInput}
              onChangeText={setMajorInput}
              placeholder="VD: Kỹ thuật Phần mềm (CNTT)"
              placeholderTextColor="#94A3B8"
              style={{
                backgroundColor: bgMain,
                borderColor: borderCard,
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                color: textPrimary,
                marginBottom: 18,
              }}
            />

            <Pressable
              onPress={handleSaveProfile}
              disabled={savingProfile}
              style={{
                backgroundColor: "#4F46E5",
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              {savingProfile ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>
                  Lưu thay đổi
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ================================================================= */}
      {/* MODAL 2: ĐỔI MẬT KHẨU                                             */}
      {/* ================================================================= */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: bgCard,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              borderTopWidth: 1,
              borderTopColor: borderCard,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 17, fontWeight: "800", color: textPrimary }}>
                Đổi mật khẩu tài khoản
              </Text>
              <Pressable
                onPress={() => setShowPasswordModal(false)}
                style={{
                  padding: 6,
                  borderRadius: 999,
                  backgroundColor: isDarkMode ? "#334155" : "#F1F5F9",
                }}
              >
                <X size={18} color={textSecondary} />
              </Pressable>
            </View>

            <Text style={{ fontSize: 12, fontWeight: "700", color: textSecondary, marginBottom: 6 }}>
              Mật khẩu hiện tại
            </Text>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Nhập mật khẩu hiện tại..."
              placeholderTextColor="#94A3B8"
              secureTextEntry
              style={{
                backgroundColor: bgMain,
                borderColor: borderCard,
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                color: textPrimary,
                marginBottom: 12,
              }}
            />

            <Text style={{ fontSize: 12, fontWeight: "700", color: textSecondary, marginBottom: 6 }}>
              Mật khẩu mới (tối thiểu 6 ký tự)
            </Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Nhập mật khẩu mới..."
              placeholderTextColor="#94A3B8"
              secureTextEntry
              style={{
                backgroundColor: bgMain,
                borderColor: borderCard,
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                color: textPrimary,
                marginBottom: 12,
              }}
            />

            <Text style={{ fontSize: 12, fontWeight: "700", color: textSecondary, marginBottom: 6 }}>
              Xác nhận mật khẩu mới
            </Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Nhập lại mật khẩu mới..."
              placeholderTextColor="#94A3B8"
              secureTextEntry
              style={{
                backgroundColor: bgMain,
                borderColor: borderCard,
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                color: textPrimary,
                marginBottom: 18,
              }}
            />

            <Pressable
              onPress={handleSavePassword}
              disabled={savingPassword}
              style={{
                backgroundColor: "#10B981",
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              {savingPassword ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>
                  Cập nhật mật khẩu mới
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
