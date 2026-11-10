import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  FileText,
  GitFork,
  HardDrive,
  ListTree,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react-native";
import { api } from "../../lib/api";
import { sl } from "../../src/core/di/injection_container";
import { useAuthStore } from "../../stores/authStore";
import type { DocumentItem } from "../../stores/documentStore";

type FilterType = "all" | "textbook" | "mindmap" | "quiz";

const filterTabs: { id: FilterType; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "textbook", label: "Giáo trình" },
  { id: "mindmap", label: "Đã có Mindmap" },
  { id: "quiz", label: "Quiz" },
];

export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const displayName = user?.full_name?.trim() || "Minh";

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [isOfflineDemo, setIsOfflineDemo] = useState(sl.networkInfo.isSimulatedOffline());
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!docToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      try {
        await api.delete(`/documents/${docToDelete.id}`);
      } catch {
        // Also allow deleting offline-only cached documents
      }
      await sl.documentLocalDataSource.removeCachedDocument(docToDelete.id);
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      setDocToDelete(null);
      refetch();
    } finally {
      setIsDeleting(false);
    }
  };

  const {
    data: documents = [],
    isLoading,
    refetch,
  } = useQuery<DocumentItem[]>({
    queryKey: ["documents", user?.id || "guest", isOfflineDemo],
    queryFn: async () => {
      const resultEither = await sl.getDocumentsUseCase.call();
      return resultEither.fold(
        () => [],
        (entities) =>
          entities.map((e) => ({
            id: e.id,
            title: e.title,
            file_type: e.fileType,
            file_size: e.fileSize,
            num_pages: e.numPages,
            status: e.status,
            summary_tldr: e.summaryTldr,
            summary_detailed: e.summaryDetailed,
            created_at: e.createdAt,
          }))
      );
    },
  });

  const handleToggleOfflineMode = () => {
    const nextOffline = !isOfflineDemo;
    sl.networkInfo.setSimulatedOffline(nextOffline);
    setIsOfflineDemo(nextOffline);
    refetch();
  };

  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return documents.filter((doc) => {
      const matchSearch = doc.title.toLowerCase().includes(q);
      if (activeFilter === "all") return matchSearch;
      if (activeFilter === "mindmap") return matchSearch && doc.status.toLowerCase() === "ready";
      return matchSearch;
    });
  }, [documents, searchQuery, activeFilter]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="dark" />
      
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header & Avatar */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brandTitle}>DocuGraph AI</Text>
            <Text style={styles.greetingTitle}>Xin chào, {displayName} 👋</Text>
            <Pressable onPress={handleToggleOfflineMode} style={styles.statusRow}>
              <View
                style={[
                  styles.onlineDot,
                  isOfflineDemo && { backgroundColor: "#F59E0B" },
                ]}
              />
              <Text style={styles.statusText}>
                {isOfflineDemo
                  ? "Chế độ Ngoại tuyến (Offline Cache SSOT)"
                  : "Đang trực tuyến · Clean Arch SSOT"}
              </Text>
            </Pressable>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* 2. Thanh tìm kiếm */}
        <View style={styles.searchBar}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            placeholder="Tìm kiếm giáo trình, tóm tắt, đề thi..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          <Pressable hitSlop={8}>
            <SlidersHorizontal size={18} color="#1D44B8" />
          </Pressable>
        </View>

        {/* 3. Thẻ bộ nhớ ngoại tuyến */}
        <View style={styles.storageCard}>
          <View style={styles.storageHeader}>
            <HardDrive size={16} color="#1D44B8" />
            <Text style={styles.storageText}>
              Bộ nhớ ngoại tuyến: {(documents.length * 1.4).toFixed(1)} MB / 2.0 GB
            </Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, documents.length * 5)}%` },
              ]}
            />
          </View>
        </View>

        {/* 4. Tiêu đề mục & Số lượng */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tài liệu gần đây</Text>
          <Text style={styles.sectionCount}>{filteredDocs.length} tài liệu</Text>
        </View>

        {/* 5. Bộ lọc Tabs (Filter Chips) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
        >
          {filterTabs.map((tab) => {
            const isSelected = activeFilter === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveFilter(tab.id)}
                style={[
                  styles.filterChip,
                  isSelected ? styles.filterChipActive : styles.filterChipInactive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    isSelected ? styles.filterTextActive : styles.filterTextInactive,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 6. Danh sách thẻ tài liệu (Document Cards) */}
        {isLoading ? (
          <ActivityIndicator size="small" color="#1D44B8" style={{ marginTop: 24 }} />
        ) : filteredDocs.length === 0 ? (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              padding: 28,
              alignItems: "center",
              marginTop: 8,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "#EFF6FF",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <FileText size={26} color="#1D44B8" />
            </View>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#0F172A", marginBottom: 6 }}>
              Chưa có tài liệu nào
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#64748B",
                textAlign: "center",
                lineHeight: 18,
                marginBottom: 16,
              }}
            >
              Tài khoản của bạn hiện đang trống. Hãy tải lên giáo trình PDF/DOCX hoặc quét tài liệu bằng On-Device ML Kit OCR để bắt đầu!
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => router.push("/document/scan")}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: "#EFF6FF",
                  borderWidth: 1,
                  borderColor: "#BFDBFE",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#1D44B8" }}>
                  Quét OCR (ML Kit)
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/document/new")}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: "#1D44B8",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#FFFFFF" }}>
                  + Tải lên tài liệu
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {filteredDocs.map((doc, idx) => {
              const isPdf = doc.file_type.toUpperCase() === "PDF" || doc.title.endsWith(".pdf");
              
              return (
                <Pressable
                  key={doc.id || idx}
                  onPress={() => router.push(`/document/${doc.id}`)}
                  style={styles.docCard}
                >
                  <View style={styles.docTopRow}>
                    {/* Icon File badge */}
                    <View style={[styles.fileBadge, isPdf ? styles.pdfBadge : styles.docxBadge]}>
                      <FileText size={20} color={isPdf ? "#EF4444" : "#2563EB"} />
                      <Text style={[styles.fileBadgeText, isPdf ? { color: "#EF4444" } : { color: "#2563EB" }]}>
                        {isPdf ? "PDF" : "DOCX"}
                      </Text>
                    </View>

                    {/* Tiêu đề & Thông tin phụ */}
                    <View style={{ flex: 1, marginHorizontal: 12 }}>
                      <Text style={styles.docTitle} numberOfLines={1}>
                        {doc.title}
                      </Text>
                      <Text style={styles.docSubtitle}>
                        {doc.num_pages || (isPdf ? 45 : 12)} trang • {isPdf ? "Đã xử lý OCR" : "Tóm tắt TL;DR"}
                      </Text>
                    </View>

                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation?.();
                        setDocToDelete(doc);
                      }}
                      hitSlop={12}
                      style={{
                        padding: 8,
                        borderRadius: 10,
                        backgroundColor: "#FEF2F2",
                        borderWidth: 1,
                        borderColor: "#FECACA",
                      }}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </Pressable>
                  </View>

                  {/* Badges tính năng bên dưới card */}
                  <View style={styles.badgeRow}>
                    {isPdf ? (
                      <>
                        <View style={styles.purpleTag}>
                          <GitFork size={12} color="#8B5CF6" />
                          <Text style={styles.purpleTagText}>Graph Ready</Text>
                        </View>
                        <View style={styles.greenTag}>
                          <CheckCircle2 size={12} color="#10B981" />
                          <Text style={styles.greenTagText}>Offline</Text>
                        </View>
                      </>
                    ) : (
                      <View style={styles.blueTag}>
                        <ListTree size={12} color="#2563EB" />
                        <Text style={styles.blueTagText}>Quiz sẵn sàng</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* 7. Floating Action Bar (Tải lên / Quét + Button tròn) */}
      <View style={styles.fabContainer}>
        <Pressable
          onPress={() => router.push("/document/scan")}
          style={styles.scanButton}
        >
          <Text style={styles.scanText}>Tải lên / Quét</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/document/new")}
          style={({ pressed }) => [styles.plusCircle, pressed && { opacity: 0.9 }]}
        >
          <Plus size={24} color="#FFFFFF" strokeWidth={2.4} />
        </Pressable>
      </View>

      {/* Modal Xác nhận Xóa Tài liệu */}
      <Modal
        visible={Boolean(docToDelete)}
        transparent
        animationType="fade"
        onRequestClose={() => setDocToDelete(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 42, 0.55)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 360,
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: "#E2E8F0",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 8 }}>
              Xóa tài liệu khỏi Tủ sách?
            </Text>
            <Text style={{ fontSize: 12, color: "#64748B", lineHeight: 18, marginBottom: 18 }}>
              Bạn có chắc chắn muốn xóa tài liệu{" "}
              <Text style={{ fontWeight: "700", color: "#0F172A" }}>
                "{docToDelete?.title}"
              </Text>{" "}
              khỏi Tủ sách và bộ nhớ ngoại tuyến không?
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => setDocToDelete(null)}
                style={{
                  flex: 1,
                  paddingVertical: 11,
                  borderRadius: 10,
                  backgroundColor: "#F1F5F9",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#475569" }}>
                  Hủy bỏ
                </Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  paddingVertical: 11,
                  borderRadius: 10,
                  backgroundColor: "#EF4444",
                  alignItems: "center",
                }}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#FFFFFF" }}>
                    Xóa ngay
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFC",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 90,
  },

  /* Header */
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2547BD",
    marginBottom: 4,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  statusText: {
    fontSize: 12,
    color: "#64748B",
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1D44B8",
  },

  /* Tìm kiếm */
  searchBar: {
    height: 46,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 13,
    color: "#0F172A",
    marginHorizontal: 10,
  },

  /* Thẻ bộ nhớ */
  storageCard: {
    backgroundColor: "#EEF4FF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 22,
  },
  storageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  storageText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DBEAFE",
    overflow: "hidden",
  },
  progressBarFill: {
    width: "60%",
    height: "100%",
    backgroundColor: "#1D44B8",
    borderRadius: 2,
  },

  /* Section Title */
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionCount: {
    fontSize: 12,
    color: "#64748B",
  },

  /* Filter Tabs */
  filterScroll: {
    marginBottom: 2,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  filterChipActive: {
    backgroundColor: "#1D44B8",
  },
  filterChipInactive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  filterTextInactive: {
    color: "#64748B",
  },

  /* Document Cards */
  docCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
  },
  docTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  fileBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pdfBadge: {
    backgroundColor: "#FEF2F2",
  },
  docxBadge: {
    backgroundColor: "#EFF6FF",
  },
  fileBadgeText: {
    fontSize: 7.5,
    fontWeight: "800",
    marginTop: 1,
  },
  docTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  docSubtitle: {
    fontSize: 11,
    color: "#64748B",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingLeft: 56,
  },
  purpleTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#F5F3FF",
  },
  purpleTagText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#7C3AED",
  },
  greenTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#F0FDF4",
  },
  greenTagText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#15803D",
  },
  blueTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#EFF6FF",
  },
  blueTagText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#2563EB",
  },

  /* Nút FAB */
  fabContainer: {
    position: "absolute",
    bottom: 22,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scanButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  scanText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1D44B8",
  },
  plusCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1D44B8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1D44B8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});