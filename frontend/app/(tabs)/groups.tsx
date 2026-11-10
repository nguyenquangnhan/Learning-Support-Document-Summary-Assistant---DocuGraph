import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ArrowLeft,
  CheckCircle,
  Copy,
  Download,
  Eye,
  FileText,
  GitFork,
  LogIn,
  MessageSquare,
  Plus,
  Share2,
  Swords,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sl } from "../../src/core/di/injection_container";
import { DocumentModel } from "../../src/features/documents/data/models/document_model";
import { useAuthStore } from "../../stores/authStore";

interface GroupMember {
  id: string;
  name: string;
  email: string;
  role: "Trưởng nhóm" | "Thành viên";
  color: string;
}

interface SharedResource {
  id: string;
  title: string;
  fileType: string;
  numPages: number;
  uploadedBy: string;
  summaryTldr?: string;
  summaryDetailed?: string;
  createdAt: string;
}

interface StudyGroup {
  id: string;
  name: string;
  code: string;
  isPrivate: boolean;
  members: GroupMember[];
  resources: SharedResource[];
}

const STORAGE_KEY_GROUPS = "@docugraph/study_groups_v1";
const AVATAR_COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EC4899", "#06B6D4", "#8B5CF6"];

export default function GroupScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const currentUserName = user?.full_name?.trim() || "Bạn";
  const currentUserEmail = user?.email || "student@vku.udn.vn";

  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [offlineSavedIds, setOfflineSavedIds] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string>("");

  // Modals state
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showShareDocModal, setShowShareDocModal] = useState(false);
  const [showMembersListModal, setShowMembersListModal] = useState(false);

  // Inputs state
  const [newGroupName, setNewGroupName] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");

  // Load user's personal uploaded documents so they can share 1-click into the group
  const { data: myDocuments = [], isLoading: isLoadingMyDocs } = useQuery({
    queryKey: ["documents", user?.id || "guest"],
    queryFn: async () => {
      const resEither = await sl.getDocumentsUseCase.call();
      return resEither.fold(
        () => [],
        (list) => list
      );
    },
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? "" : prev));
    }, 2800);
  };

  // Load persisted study groups for current user
  useEffect(() => {
    const loadGroups = async () => {
      const storageKey = `${STORAGE_KEY_GROUPS}_${user?.id || "guest"}`;
      try {
        if (typeof window !== "undefined") {
          const raw = await AsyncStorage.getItem(storageKey);
          if (raw) {
            const parsed: StudyGroup[] = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setGroups(parsed);
              setSelectedGroupId(parsed[0].id);
              return;
            }
          }
        }
      } catch {
        // Ignore storage error
      }

      // Default initial study group owned by current user
      const defaultGroup: StudyGroup = {
        id: "grp_default_1",
        name: "Ôn thi Hệ Điều Hành - Nhóm 23SE",
        code: "VKU23S",
        isPrivate: true,
        members: [
          {
            id: user?.id || "m_owner",
            name: currentUserName,
            email: currentUserEmail,
            role: "Trưởng nhóm",
            color: "#4F46E5",
          },
          {
            id: "m_2",
            name: "Trần Minh Tuấn",
            email: "tuantm.23it@vku.udn.vn",
            role: "Thành viên",
            color: "#10B981",
          },
          {
            id: "m_3",
            name: "Lê Hoàng Linh",
            email: "linhlh.23it@vku.udn.vn",
            role: "Thành viên",
            color: "#F59E0B",
          },
        ],
        resources: [],
      };
      setGroups([defaultGroup]);
      setSelectedGroupId(defaultGroup.id);
    };
    loadGroups();
  }, [user?.id]);

  const persistGroups = async (updated: StudyGroup[]) => {
    setGroups(updated);
    const storageKey = `${STORAGE_KEY_GROUPS}_${user?.id || "guest"}`;
    try {
      if (typeof window !== "undefined") {
        await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
      }
    } catch {
      // Ignore storage error
    }
  };

  const activeGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];

  // Combine group's explicitly shared resources with user's uploaded documents if not yet added
  const groupResources: SharedResource[] = React.useMemo(() => {
    if (!activeGroup) return [];
    const map = new Map<string, SharedResource>();
    for (const r of activeGroup.resources) {
      map.set(r.id, r);
    }
    for (const d of myDocuments) {
      if (!map.has(d.id)) {
        map.set(d.id, {
          id: d.id,
          title: d.title,
          fileType: d.fileType,
          numPages: d.numPages,
          uploadedBy: `${currentUserName} (Trưởng nhóm)`,
          summaryTldr: d.summaryTldr,
          summaryDetailed: d.summaryDetailed,
          createdAt: d.createdAt,
        });
      }
    }
    return Array.from(map.values());
  }, [activeGroup, myDocuments, currentUserName]);

  // 1. Copy Group Code
  const handleCopyGroupCode = async () => {
    if (!activeGroup) return;
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(activeGroup.code);
      }
    } catch {
      // Fallback
    }
    showToast(`Đã sao chép mã nhóm: ${activeGroup.code}`);
  };

  // 2. Create New Study Group
  const handleCreateGroup = async () => {
    const cleanName = newGroupName.trim();
    if (!cleanName) {
      showToast("Vui lòng nhập tên nhóm học tập!");
      return;
    }
    const randomCode =
      "VKU" +
      Math.random()
        .toString(36)
        .substring(2, 5)
        .toUpperCase();
    const newGroup: StudyGroup = {
      id: `grp_${Date.now()}`,
      name: cleanName,
      code: randomCode,
      isPrivate: true,
      members: [
        {
          id: user?.id || "m_owner",
          name: currentUserName,
          email: currentUserEmail,
          role: "Trưởng nhóm",
          color: "#4F46E5",
        },
      ],
      resources: [],
    };
    const nextGroups = [newGroup, ...groups];
    await persistGroups(nextGroups);
    setSelectedGroupId(newGroup.id);
    setNewGroupName("");
    setShowCreateGroupModal(false);
    showToast(`Đã tạo nhóm "${cleanName}" (Mã: ${randomCode})`);
  };

  // 3. Join Group by PIN Code
  const handleJoinGroup = async () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code || code.length < 4) {
      showToast("Vui lòng nhập mã nhóm hợp lệ (VD: VKU23S)");
      return;
    }
    const existing = groups.find((g) => g.code.toUpperCase() === code);
    if (existing) {
      setSelectedGroupId(existing.id);
      setJoinCodeInput("");
      setShowJoinGroupModal(false);
      showToast(`Đã chuyển tới nhóm ${existing.name}`);
      return;
    }

    const joinedGroup: StudyGroup = {
      id: `grp_join_${Date.now()}`,
      name: `Nhóm Học Tập (${code})`,
      code,
      isPrivate: true,
      members: [
        {
          id: "m_host",
          name: "Nguyễn Văn Minh",
          email: "minhnv@vku.udn.vn",
          role: "Trưởng nhóm",
          color: "#10B981",
        },
        {
          id: user?.id || "m_me",
          name: currentUserName,
          email: currentUserEmail,
          role: "Thành viên",
          color: "#4F46E5",
        },
      ],
      resources: [],
    };
    const nextGroups = [joinedGroup, ...groups];
    await persistGroups(nextGroups);
    setSelectedGroupId(joinedGroup.id);
    setJoinCodeInput("");
    setShowJoinGroupModal(false);
    showToast(`Đã tham gia nhóm có mã ${code} thành công!`);
  };

  // 4. Add Friend / Member to Active Group
  const handleAddMember = async () => {
    if (!activeGroup) return;
    const name = newMemberName.trim();
    const email = newMemberEmail.trim() || `${name.toLowerCase().replace(/\s+/g, "")}@vku.udn.vn`;
    if (!name) {
      showToast("Vui lòng nhập tên bạn học cần thêm!");
      return;
    }
    const newMember: GroupMember = {
      id: `mem_${Date.now()}`,
      name,
      email,
      role: "Thành viên",
      color: AVATAR_COLORS[activeGroup.members.length % AVATAR_COLORS.length],
    };
    const updatedGroups = groups.map((g) =>
      g.id === activeGroup.id ? { ...g, members: [...g.members, newMember] } : g
    );
    await persistGroups(updatedGroups);
    setNewMemberName("");
    setNewMemberEmail("");
    setShowAddMemberModal(false);
    showToast(`Đã thêm ${name} vào nhóm!`);
  };

  // 5. Remove Member from Active Group
  const handleRemoveMember = async (memberId: string) => {
    if (!activeGroup) return;
    const updatedGroups = groups.map((g) =>
      g.id === activeGroup.id
        ? { ...g, members: g.members.filter((m) => m.id !== memberId) }
        : g
    );
    await persistGroups(updatedGroups);
    showToast("Đã xóa thành viên khỏi nhóm.");
  };

  // 6. Save Shared Document for Offline Learning (SSOT Local Cache)
  const handleSaveOffline = async (res: SharedResource) => {
    try {
      const model = new DocumentModel({
        id: res.id,
        title: res.title,
        fileType: res.fileType,
        fileSize: 1024 * 120,
        numPages: res.numPages,
        status: "ready",
        summaryTldr:
          res.summaryTldr ||
          `Tóm tắt tài liệu nhóm "${res.title}" (Chia sẻ bởi ${res.uploadedBy}).`,
        summaryDetailed:
          res.summaryDetailed ||
          `### Tài nguyên học tập chung của nhóm ${activeGroup?.name}\n• Tài liệu: ${res.title}\n• Người đăng: ${res.uploadedBy}\n• Đã lưu ngoại tuyến (Zero-Token Shared Cache).`,
        createdAt: res.createdAt,
        updatedAt: new Date().toISOString(),
        isOfflinePending: false,
      });
      await sl.documentLocalDataSource.upsertCachedDocument(model);
      setOfflineSavedIds((prev) => ({ ...prev, [res.id]: true }));
      showToast(`Đã lưu "${res.title}" về bộ nhớ Offline!`);
    } catch {
      showToast("Không thể lưu ngoại tuyến lúc này.");
    }
  };

  // 7. Share Existing Personal Document into Group
  const handleSharePersonalDocToGroup = async (doc: any) => {
    if (!activeGroup) return;
    const newRes: SharedResource = {
      id: doc.id,
      title: doc.title,
      fileType: doc.fileType || "PDF",
      numPages: doc.numPages || 1,
      uploadedBy: `${currentUserName} (Trưởng nhóm)`,
      summaryTldr: doc.summaryTldr,
      summaryDetailed: doc.summaryDetailed,
      createdAt: doc.createdAt || new Date().toISOString(),
    };
    const exists = activeGroup.resources.some((r) => r.id === doc.id);
    if (!exists) {
      const updatedGroups = groups.map((g) =>
        g.id === activeGroup.id ? { ...g, resources: [newRes, ...g.resources] } : g
      );
      await persistGroups(updatedGroups);
    }
    setShowShareDocModal(false);
    showToast(`Đã chia sẻ "${doc.title}" vào kho tài nguyên nhóm!`);
  };

  return (
    <View className="flex-1 bg-slate-50 pt-12">
      {/* Toast Notification Banner */}
      {toastMessage ? (
        <View
          style={{
            position: "absolute",
            top: 52,
            alignSelf: "center",
            zIndex: 50,
            backgroundColor: "#0F172A",
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 999,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <CheckCircle size={15} color="#10B981" />
          <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "600" }}>
            {toastMessage}
          </Text>
        </View>
      ) : null}

      {/* Header */}
      <View className="px-4 flex-row items-center justify-between pb-3 border-b border-slate-200/70">
        <TouchableOpacity onPress={() => router.push("/(tabs)")} className="p-1.5 rounded-full bg-white border border-slate-200">
          <ArrowLeft size={18} color="#334155" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">
            KHÔNG GIAN HỌC CHUNG
          </Text>
          <Text className="text-base font-bold text-slate-800">Nhóm học tập</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <TouchableOpacity
            onPress={() => setShowJoinGroupModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 flex-row items-center"
          >
            <LogIn size={13} color="#4F46E5" />
            <Text className="text-[11px] font-bold text-indigo-600 ml-1">Nhập mã</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowCreateGroupModal(true)}
            className="p-1.5 rounded-lg bg-indigo-600"
          >
            <Plus size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4 pb-12">
          {/* Group Switcher Chips (Khi có nhiều nhóm học) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
            contentContainerStyle={{ gap: 8 }}
          >
            {groups.map((grp) => {
              const isSelected = grp.id === activeGroup?.id;
              return (
                <Pressable
                  key={grp.id}
                  onPress={() => setSelectedGroupId(grp.id)}
                  className={`px-3.5 py-2 rounded-xl border flex-row items-center ${
                    isSelected
                      ? "bg-indigo-600 border-indigo-600"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <Users size={13} color={isSelected ? "#FFFFFF" : "#64748B"} />
                  <Text
                    className={`text-xs font-bold ml-1.5 ${
                      isSelected ? "text-white" : "text-slate-700"
                    }`}
                  >
                    {grp.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {activeGroup ? (
            <>
              {/* Title & Group Info */}
              <Text className="text-2xl font-black text-slate-900 mb-3">
                {activeGroup.name}
              </Text>

              <View className="flex-row items-center justify-between mb-4">
                <TouchableOpacity
                  onPress={handleCopyGroupCode}
                  className="flex-row items-center bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 active:opacity-75"
                >
                  <Text className="text-indigo-700 font-bold text-xs mr-2">
                    Mã nhóm: {activeGroup.code}
                  </Text>
                  <Copy size={14} color="#4F46E5" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    const updated = groups.map((g) =>
                      g.id === activeGroup.id ? { ...g, isPrivate: !g.isPrivate } : g
                    );
                    persistGroups(updated);
                    showToast(
                      !activeGroup.isPrivate
                        ? "Đã chuyển sang Nhóm riêng tư"
                        : "Đã chuyển sang Nhóm công khai"
                    );
                  }}
                >
                  <Text className="text-xs text-slate-500 font-semibold underline">
                    {activeGroup.isPrivate ? "🔒 Nhóm riêng tư" : "🌐 Nhóm công khai"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Members Bar */}
              <View className="flex-row items-center justify-between mb-6 bg-white p-3.5 rounded-2xl border border-slate-200">
                <TouchableOpacity
                  onPress={() => setShowMembersListModal(true)}
                  className="flex-row items-center flex-1"
                >
                  <View className="flex-row -space-x-2 mr-3">
                    {activeGroup.members.slice(0, 3).map((mem) => (
                      <View
                        key={mem.id}
                        style={{ backgroundColor: mem.color }}
                        className="w-8 h-8 rounded-full border-2 border-white items-center justify-center"
                      >
                        <Text className="text-white text-xs font-bold">
                          {mem.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    ))}
                    {activeGroup.members.length > 3 && (
                      <View className="w-8 h-8 rounded-full bg-slate-700 border-2 border-white items-center justify-center">
                        <Text className="text-white text-[10px] font-bold">
                          +{activeGroup.members.length - 3}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View>
                    <Text className="text-xs text-slate-800 font-bold">
                      {activeGroup.members.length} thành viên
                    </Text>
                    <Text className="text-[10px] text-slate-400">
                      Chạm để xem danh sách
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowAddMemberModal(true)}
                  className="flex-row items-center bg-blue-50 px-3 py-2 rounded-xl border border-blue-100"
                >
                  <UserPlus size={14} color="#2563EB" />
                  <Text className="text-xs text-blue-600 font-bold ml-1.5">
                    + Thêm bạn
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Resources Header */}
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-sm font-bold text-slate-800">
                  Kho tài nguyên chung ({groupResources.length})
                </Text>
                <TouchableOpacity
                  onPress={() => setShowShareDocModal(true)}
                  className="flex-row items-center"
                >
                  <Share2 size={13} color="#4F46E5" />
                  <Text className="text-xs font-bold text-indigo-600 ml-1">
                    Chia sẻ từ kho của tôi
                  </Text>
                </TouchableOpacity>
              </View>
              <Text className="text-xs text-slate-400 mb-3">
                (Xử lý 1 lần - Zero Token cho toàn bộ thành viên trong nhóm)
              </Text>

              {/* Shared Resources List */}
              {isLoadingMyDocs ? (
                <ActivityIndicator size="small" color="#4F46E5" className="my-6" />
              ) : groupResources.length === 0 ? (
                <View className="bg-white p-6 rounded-2xl border border-slate-200 items-center mb-6">
                  <FileText size={32} color="#94A3B8" />
                  <Text className="text-sm font-bold text-slate-700 mt-2">
                    Chưa có tài liệu chung trong nhóm
                  </Text>
                  <Text className="text-xs text-slate-400 text-center mt-1 leading-4">
                    Hãy bấm "Tải tài liệu mới lên nhóm" bên dưới để AI tóm tắt và chia sẻ cho cả nhóm cùng học!
                  </Text>
                </View>
              ) : (
                groupResources.map((res) => {
                  const isSavedOffline = Boolean(offlineSavedIds[res.id]);
                  return (
                    <View
                      key={res.id}
                      className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-4"
                    >
                      <View className="flex-row items-center mb-3">
                        <View className="p-2.5 bg-red-50 rounded-xl mr-3">
                          <FileText size={22} color="#EF4444" />
                        </View>
                        <View className="flex-1">
                          <Text
                            className="font-bold text-slate-800 text-sm"
                            numberOfLines={1}
                          >
                            {res.title}
                          </Text>
                          <Text className="text-xs text-slate-400 mt-0.5">
                            {res.uploadedBy} • {res.numPages} trang
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center bg-emerald-50 p-2 rounded-xl mb-3">
                        <CheckCircle size={14} color="#059669" />
                        <Text className="text-xs text-emerald-700 font-bold ml-1.5">
                          AI Processed - Sẵn sàng cho cả nhóm
                        </Text>
                      </View>

                      {/* Action Buttons: Xem Tóm tắt, Xem Mindmap, Hỏi AI */}
                      <View className="flex-row gap-2 mb-3">
                        <TouchableOpacity
                          onPress={() => router.push(`/document/${res.id}`)}
                          className="flex-1 bg-indigo-50 py-2.5 rounded-xl flex-row items-center justify-center border border-indigo-100"
                        >
                          <Eye size={14} color="#4F46E5" />
                          <Text className="text-indigo-600 font-bold text-xs ml-1.5">
                            Xem Tóm tắt
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() =>
                            router.push({
                              pathname: "/(tabs)/graph",
                              params: { documentId: res.id },
                            })
                          }
                          className="flex-1 bg-indigo-50 py-2.5 rounded-xl flex-row items-center justify-center border border-indigo-100"
                        >
                          <GitFork size={14} color="#4F46E5" />
                          <Text className="text-indigo-600 font-bold text-xs ml-1.5">
                            Xem Mindmap
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() =>
                            router.push({
                              pathname: "/(tabs)/chat",
                              params: { documentId: res.id },
                            })
                          }
                          className="px-3 bg-indigo-50 py-2.5 rounded-xl flex-row items-center justify-center border border-indigo-100"
                        >
                          <MessageSquare size={14} color="#4F46E5" />
                        </TouchableOpacity>
                      </View>

                      {/* Offline Save Button */}
                      <TouchableOpacity
                        onPress={() => handleSaveOffline(res)}
                        className={`py-2 rounded-xl items-center flex-row justify-center ${
                          isSavedOffline ? "bg-emerald-50" : "bg-slate-50"
                        }`}
                      >
                        {isSavedOffline ? (
                          <>
                            <CheckCircle size={14} color="#059669" />
                            <Text className="text-xs text-emerald-700 font-bold ml-1.5">
                              Đã lưu về máy học Offline
                            </Text>
                          </>
                        ) : (
                          <>
                            <Download size={14} color="#64748B" />
                            <Text className="text-xs text-slate-600 font-medium ml-1.5">
                              Lưu về máy học offline
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}

              {/* Upload New Document to Group Button */}
              <TouchableOpacity
                onPress={() => router.push("/document/new")}
                className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-4 rounded-2xl flex-row items-center justify-center mb-6"
              >
                <Upload size={18} color="#4F46E5" />
                <Text className="text-indigo-600 font-bold text-xs ml-2">
                  Tải tài liệu mới lên nhóm
                </Text>
              </TouchableOpacity>

              {/* Action Battle Room */}
              <TouchableOpacity
                onPress={() => {
                  const firstDocId = groupResources[0]?.id || "";
                  router.push({
                    pathname: `/battle/${activeGroup.code}` as any,
                    params: firstDocId ? { documentId: firstDocId } : {},
                  });
                }}
                className="bg-indigo-600 py-4 rounded-2xl flex-row items-center justify-center shadow-md shadow-indigo-200"
              >
                <Swords size={20} color="#FFF" />
                <Text className="text-white font-bold text-sm ml-2">
                  Tạo phòng Đấu trí Trắc nghiệm nhóm ({activeGroup.code})
                </Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </ScrollView>

      {/* Modal 1: Thêm thành viên mới vào nhóm */}
      <Modal
        visible={showAddMemberModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <View className="flex-1 bg-slate-900/50 justify-center items-center p-5">
          <View className="bg-white w-full max-w-[380px] rounded-2xl p-5 border border-slate-200">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-bold text-slate-900">
                Thêm bạn vào nhóm {activeGroup?.code}
              </Text>
              <TouchableOpacity onPress={() => setShowAddMemberModal(false)}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text className="text-xs text-slate-500 mb-3">
              Nhập họ tên và email sinh viên để mời vào không gian học chung:
            </Text>
            <TextInput
              placeholder="Họ và tên (VD: Phạm Quốc Bảo)"
              placeholderTextColor="#94A3B8"
              value={newMemberName}
              onChangeText={setNewMemberName}
              className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 mb-2.5"
            />
            <TextInput
              placeholder="Email (VD: baopq.23it@vku.udn.vn)"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={newMemberEmail}
              onChangeText={setNewMemberEmail}
              className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 mb-4"
            />
            <TouchableOpacity
              onPress={handleAddMember}
              className="bg-indigo-600 py-3 rounded-xl items-center"
            >
              <Text className="text-white font-bold text-xs">Xác nhận thêm thành viên</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Xem danh sách thành viên trong nhóm */}
      <Modal
        visible={showMembersListModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMembersListModal(false)}
      >
        <View className="flex-1 bg-slate-900/50 justify-center items-center p-5">
          <View className="bg-white w-full max-w-[380px] rounded-2xl p-5 border border-slate-200">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-bold text-slate-900">
                Thành viên nhóm ({activeGroup?.members.length || 0})
              </Text>
              <TouchableOpacity onPress={() => setShowMembersListModal(false)}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 280 }}>
              {activeGroup?.members.map((mem) => (
                <View
                  key={mem.id}
                  className="flex-row items-center justify-between py-2.5 border-b border-slate-100"
                >
                  <View className="flex-row items-center flex-1 mr-2">
                    <View
                      style={{ backgroundColor: mem.color }}
                      className="w-8 h-8 rounded-full items-center justify-center mr-2.5"
                    >
                      <Text className="text-white text-xs font-bold">
                        {mem.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-slate-800">{mem.name}</Text>
                      <Text className="text-[11px] text-slate-400">{mem.email}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className="px-2 py-0.5 rounded bg-slate-100">
                      <Text className="text-[10px] font-semibold text-slate-600">
                        {mem.role}
                      </Text>
                    </View>
                    {mem.role !== "Trưởng nhóm" && (
                      <TouchableOpacity onPress={() => handleRemoveMember(mem.id)}>
                        <Trash2 size={14} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal 3: Tạo nhóm học tập mới */}
      <Modal
        visible={showCreateGroupModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateGroupModal(false)}
      >
        <View className="flex-1 bg-slate-900/50 justify-center items-center p-5">
          <View className="bg-white w-full max-w-[380px] rounded-2xl p-5 border border-slate-200">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-bold text-slate-900">Tạo nhóm học tập mới</Text>
              <TouchableOpacity onPress={() => setShowCreateGroupModal(false)}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text className="text-xs text-slate-500 mb-3">
              Đặt tên môn học hoặc chủ đề ôn thi. Hệ thống sẽ tự sinh mã PIN để bạn mời bạn bè:
            </Text>
            <TextInput
              placeholder="VD: Đồ án Đa nền tảng - Nhóm K23"
              placeholderTextColor="#94A3B8"
              value={newGroupName}
              onChangeText={setNewGroupName}
              className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 mb-4"
            />
            <TouchableOpacity
              onPress={handleCreateGroup}
              className="bg-indigo-600 py-3 rounded-xl items-center"
            >
              <Text className="text-white font-bold text-xs">Tạo nhóm ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal 4: Tham gia nhóm bằng mã PIN */}
      <Modal
        visible={showJoinGroupModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowJoinGroupModal(false)}
      >
        <View className="flex-1 bg-slate-900/50 justify-center items-center p-5">
          <View className="bg-white w-full max-w-[380px] rounded-2xl p-5 border border-slate-200">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-bold text-slate-900">Tham gia nhóm bằng mã</Text>
              <TouchableOpacity onPress={() => setShowJoinGroupModal(false)}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text className="text-xs text-slate-500 mb-3">
              Nhập mã nhóm 6 ký tự do trưởng nhóm cung cấp:
            </Text>
            <TextInput
              placeholder="VD: VKU23S"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              value={joinCodeInput}
              onChangeText={setJoinCodeInput}
              className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 mb-4"
            />
            <TouchableOpacity
              onPress={handleJoinGroup}
              className="bg-indigo-600 py-3 rounded-xl items-center"
            >
              <Text className="text-white font-bold text-xs">Tham gia nhóm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal 5: Chia sẻ tài liệu từ kho cá nhân vào nhóm */}
      <Modal
        visible={showShareDocModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowShareDocModal(false)}
      >
        <View className="flex-1 bg-slate-900/50 justify-center items-center p-5">
          <View className="bg-white w-full max-w-[380px] rounded-2xl p-5 border border-slate-200">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-bold text-slate-900">
                Chia sẻ tài liệu vào nhóm
              </Text>
              <TouchableOpacity onPress={() => setShowShareDocModal(false)}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            {myDocuments.length === 0 ? (
              <View className="py-4 items-center">
                <Text className="text-xs text-slate-500 text-center mb-3">
                  Kho tài liệu cá nhân của bạn đang trống. Hãy tải lên tài liệu mới trước nhé!
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowShareDocModal(false);
                    router.push("/document/new");
                  }}
                  className="bg-indigo-600 px-4 py-2.5 rounded-xl"
                >
                  <Text className="text-white font-bold text-xs">+ Tải tài liệu mới</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 260 }}>
                {myDocuments.map((doc) => (
                  <TouchableOpacity
                    key={doc.id}
                    onPress={() => handleSharePersonalDocToGroup(doc)}
                    className="flex-row items-center justify-between py-3 border-b border-slate-100"
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <FileText size={18} color="#4F46E5" />
                      <Text
                        className="text-xs font-semibold text-slate-800 ml-2 flex-1"
                        numberOfLines={1}
                      >
                        {doc.title}
                      </Text>
                    </View>
                    <Text className="text-[11px] font-bold text-indigo-600">Chia sẻ →</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
