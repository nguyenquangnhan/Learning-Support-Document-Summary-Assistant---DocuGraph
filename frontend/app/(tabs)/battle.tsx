/**
 * DocuGraph AI – Sảnh Đấu trí (Battle Lobby)
 *  - Chủ phòng: chọn tài liệu -> Tạo phòng -> nhận mã phòng 6 số
 *  - Người chơi: nhập mã phòng -> vào phòng chờ
 *  - Chỉ khi chủ phòng bấm "Bắt đầu" thì tất cả mới cùng chơi
 */
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Swords, LogIn, Crown, FileText, CheckCircle2 } from "lucide-react-native";
import { sl } from "../../src/core/di/injection_container";
import { useAuthStore } from "../../stores/authStore";
import { battleApi } from "../../lib/battleApi";

export default function BattleLobbyScreen() {
  const router = useRouter();
  const { documentId: presetDocId } = useLocalSearchParams<{ documentId?: string }>();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id || "";
  const userName = user?.full_name?.trim() || user?.email?.split("@")[0] || "Người chơi";

  const [selectedDocId, setSelectedDocId] = useState<string>(presetDocId || "");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents", userId || "guest"],
    queryFn: async () => {
      const res = await sl.getDocumentsUseCase.call();
      return res.fold(
        () => [],
        (list) => list
      );
    },
  });

  const effectiveDocId = selectedDocId || documents[0]?.id || "";

  const handleCreateRoom = async () => {
    setError("");
    if (!userId) {
      setError("Vui lòng đăng nhập để tạo phòng đấu trí.");
      return;
    }
    const doc = documents.find((d) => d.id === effectiveDocId);
    if (!doc) {
      setError("Bạn cần chọn một tài liệu trong Tủ sách để làm đề thi.");
      return;
    }
    setCreating(true);
    try {
      const room = await battleApi.createRoom({
        hostId: userId,
        hostName: userName,
        documentId: doc.id,
        documentTitle: doc.title,
        numQuestions: 5,
      });
      router.push(`/battle/${room.room_code}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    setError("");
    const code = roomCodeInput.trim();
    if (!userId) {
      setError("Vui lòng đăng nhập để vào phòng đấu trí.");
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError("Mã phòng gồm đúng 6 chữ số.");
      return;
    }
    setJoining(true);
    try {
      await battleApi.joinRoom(code, userId, userName);
      router.push(`/battle/${code}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setJoining(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text className="text-xs font-bold text-indigo-600 uppercase">Đấu trí trắc nghiệm</Text>
        <Text className="text-2xl font-black text-slate-900 mt-1">Phòng thi đấu nhiều người</Text>
        <Text className="text-xs text-slate-500 mt-1 leading-5">
          Chủ phòng tạo phòng và chia sẻ mã 6 số. Mọi người nhập mã để vào phòng chờ, khi chủ phòng
          bấm "Bắt đầu" tất cả sẽ cùng trả lời từng câu hỏi tại cùng một thời điểm.
        </Text>

        {error ? (
          <View className="bg-red-50 border border-red-200 rounded-xl p-3 mt-4">
            <Text className="text-xs font-semibold text-red-600">{error}</Text>
          </View>
        ) : null}

        {/* Vào phòng bằng mã */}
        <View className="bg-white rounded-2xl border border-slate-200 p-4 mt-5">
          <View className="flex-row items-center mb-3">
            <LogIn size={18} color="#4F46E5" />
            <Text className="text-sm font-bold text-slate-800 ml-2">Vào phòng bằng mã</Text>
          </View>
          <TextInput
            value={roomCodeInput}
            onChangeText={(t) => setRoomCodeInput(t.replace(/\D/g, "").slice(0, 6))}
            placeholder="Nhập mã phòng 6 số"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            maxLength={6}
            className="border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold tracking-[6px] text-center text-slate-900"
          />
          <Pressable
            onPress={handleJoinRoom}
            disabled={joining}
            className="mt-3 bg-indigo-600 rounded-xl py-3 items-center"
          >
            {joining ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-white font-bold text-sm">Vào phòng</Text>
            )}
          </Pressable>
        </View>

        {/* Tạo phòng mới (chủ phòng) */}
        <View className="bg-white rounded-2xl border border-slate-200 p-4 mt-4">
          <View className="flex-row items-center mb-1">
            <Crown size={18} color="#F59E0B" />
            <Text className="text-sm font-bold text-slate-800 ml-2">Tạo phòng mới (Chủ phòng)</Text>
          </View>
          <Text className="text-xs text-slate-500 mb-3">
            Chọn tài liệu để AI sinh đề thi trắc nghiệm cho cả phòng:
          </Text>

          {isLoading ? (
            <ActivityIndicator color="#4F46E5" />
          ) : documents.length === 0 ? (
            <View className="items-center py-3">
              <Text className="text-xs text-slate-500 text-center mb-2">
                Tủ sách của bạn đang trống. Hãy tải tài liệu lên trước khi tạo phòng.
              </Text>
              <Pressable
                onPress={() => router.push("/document/new")}
                className="bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-xl"
              >
                <Text className="text-indigo-700 font-bold text-xs">+ Tải tài liệu lên</Text>
              </Pressable>
            </View>
          ) : (
            documents.slice(0, 8).map((doc) => {
              const active = doc.id === effectiveDocId;
              return (
                <Pressable
                  key={doc.id}
                  onPress={() => setSelectedDocId(doc.id)}
                  className={`flex-row items-center p-3 rounded-xl border mb-2 ${
                    active ? "bg-indigo-50 border-indigo-500" : "bg-white border-slate-200"
                  }`}
                >
                  <FileText size={16} color={active ? "#4F46E5" : "#64748B"} />
                  <Text
                    numberOfLines={1}
                    className={`flex-1 ml-2 text-xs ${
                      active ? "font-bold text-indigo-700" : "font-medium text-slate-700"
                    }`}
                  >
                    {doc.title}
                  </Text>
                  {active && <CheckCircle2 size={16} color="#4F46E5" />}
                </Pressable>
              );
            })
          )}

          <Pressable
            onPress={handleCreateRoom}
            disabled={creating || documents.length === 0}
            className={`mt-2 rounded-xl py-3 flex-row items-center justify-center ${
              documents.length === 0 ? "bg-slate-300" : "bg-amber-500"
            }`}
          >
            {creating ? (
              <>
                <ActivityIndicator color="#FFF" />
                <Text className="text-white font-bold text-xs ml-2">Đang sinh đề thi AI...</Text>
              </>
            ) : (
              <>
                <Swords size={16} color="#FFF" />
                <Text className="text-white font-bold text-sm ml-2">Tạo phòng đấu trí</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
