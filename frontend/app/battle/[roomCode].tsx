/**
 * DocuGraph AI – Phòng Đấu trí nhiều người (đồng bộ theo đồng hồ server)
 * Pha: waiting -> countdown -> (question -> reveal) x N -> finished
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Award,
  CheckCircle2,
  Copy,
  Crown,
  LogOut,
  Play,
  Timer,
  Trophy,
  Users,
  XCircle,
} from "lucide-react-native";
import { useAuthStore } from "../../stores/authStore";
import { battleApi, BattleRoomState } from "../../lib/battleApi";

const POLL_MS = 1000;

export default function BattleRoomScreen() {
  const { roomCode } = useLocalSearchParams<{ roomCode: string }>();
  const code = String(roomCode || "");
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id || "";
  const userName = user?.full_name?.trim() || user?.email?.split("@")[0] || "Người chơi";

  const [state, setState] = useState<BattleRoomState | null>(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const [pendingOption, setPendingOption] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const clockOffsetRef = useRef(0); // server_now(ms) - Date.now()
  const joinedRef = useRef(false);

  const applyState = (s: BattleRoomState) => {
    clockOffsetRef.current = s.server_now * 1000 - Date.now();
    setState(s);
  };

  const fetchState = useCallback(async () => {
    if (!code || !userId) return;
    try {
      let s = await battleApi.getState(code, userId);
      // Tự động vào phòng nếu mở bằng link khi phòng còn đang chờ
      if (!s.is_member && s.status === "waiting" && !joinedRef.current) {
        joinedRef.current = true;
        s = await battleApi.joinRoom(code, userId, userName);
      }
      applyState(s);
      setError("");
    } catch (e: any) {
      setError(e.message);
    }
  }, [code, userId, userName]);

  // Polling trạng thái phòng
  useEffect(() => {
    fetchState();
    const t = setInterval(fetchState, POLL_MS);
    return () => clearInterval(t);
  }, [fetchState]);

  // Đồng hồ hiển thị mượt (250ms)
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  // Reset lựa chọn tạm khi sang câu mới
  useEffect(() => {
    setPendingOption(null);
  }, [state?.question_index]);

  const remainingSec = (() => {
    if (!state?.phase_ends_at) return 0;
    const serverNowMs = nowTick + clockOffsetRef.current;
    return Math.max(0, Math.ceil((state.phase_ends_at * 1000 - serverNowMs) / 1000));
  })();

  const handleStart = async () => {
    setStarting(true);
    try {
      applyState(await battleApi.startRoom(code, userId));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setStarting(false);
    }
  };

  const handleAnswer = async (option: string) => {
    if (!state || state.phase !== "question" || state.my_answer || pendingOption) return;
    setPendingOption(option);
    try {
      await battleApi.submitAnswer(code, userId, state.question_index, option);
      fetchState();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleLeave = async () => {
    await battleApi.leaveRoom(code, userId);
    router.replace("/(tabs)/battle");
  };

  const copyCode = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(code);
      }
    } catch {}
  };

  // ── Loading / lỗi ──
  if (!userId) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center p-6">
        <Text className="text-white font-bold text-base mb-3">Bạn cần đăng nhập để vào phòng</Text>
        <Pressable onPress={() => router.replace("/(auth)/login")} className="bg-indigo-600 px-5 py-3 rounded-xl">
          <Text className="text-white font-bold text-sm">Đăng nhập</Text>
        </Pressable>
      </View>
    );
  }

  if (!state) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center p-6">
        {error ? (
          <>
            <XCircle size={40} color="#F87171" />
            <Text className="text-rose-300 font-semibold text-sm mt-3 text-center">{error}</Text>
            <Pressable onPress={() => router.replace("/(tabs)/battle")} className="mt-5 bg-slate-800 px-5 py-3 rounded-xl">
              <Text className="text-white font-bold text-sm">Quay lại sảnh</Text>
            </Pressable>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color="#818CF8" />
            <Text className="text-slate-300 text-xs mt-3">Đang kết nối phòng {code}...</Text>
          </>
        )}
      </View>
    );
  }

  // Người đến muộn sau khi trận đã bắt đầu
  if (!state.is_member) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center p-6">
        <XCircle size={40} color="#F87171" />
        <Text className="text-white font-bold text-base mt-3 text-center">
          Trận đấu trong phòng {code} đã bắt đầu
        </Text>
        <Text className="text-slate-400 text-xs mt-1 text-center">Bạn không thể tham gia giữa chừng.</Text>
        <Pressable onPress={() => router.replace("/(tabs)/battle")} className="mt-5 bg-indigo-600 px-5 py-3 rounded-xl">
          <Text className="text-white font-bold text-sm">Quay lại sảnh</Text>
        </Pressable>
      </View>
    );
  }

  // ── PHÒNG CHỜ ──
  if (state.phase === "waiting") {
    return (
      <ScrollView className="flex-1 bg-slate-900" contentContainerStyle={{ padding: 20, paddingTop: 48 }}>
        <Text className="text-slate-400 text-xs font-bold uppercase text-center">Phòng chờ</Text>
        <Pressable onPress={copyCode} className="items-center mt-2">
          <Text className="text-white text-5xl font-black tracking-[10px]">{code}</Text>
          <View className="flex-row items-center mt-2">
            <Copy size={12} color="#94A3B8" />
            <Text className="text-slate-400 text-[11px] ml-1">Chia sẻ mã này cho bạn bè để vào phòng</Text>
          </View>
        </Pressable>

        <View className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mt-6">
          <Text className="text-slate-400 text-[11px]">Đề thi từ tài liệu</Text>
          <Text className="text-white font-bold text-sm mt-0.5" numberOfLines={2}>
            {state.document_title}
          </Text>
          <Text className="text-indigo-300 text-[11px] mt-1">
            {state.total_questions} câu hỏi • {state.question_seconds}s mỗi câu
          </Text>
        </View>

        <View className="flex-row items-center mt-6 mb-3">
          <Users size={16} color="#818CF8" />
          <Text className="text-white font-bold text-sm ml-2">
            Người chơi ({state.players.length})
          </Text>
        </View>
        {state.players.map((p) => (
          <View
            key={p.user_id}
            className="flex-row items-center bg-slate-800 border border-slate-700 rounded-xl p-3 mb-2"
          >
            <View className="w-9 h-9 rounded-full bg-indigo-500 items-center justify-center mr-3">
              <Text className="text-white font-bold">{p.name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text className="text-white text-sm font-semibold flex-1" numberOfLines={1}>
              {p.name}
              {p.user_id === userId ? " (Bạn)" : ""}
            </Text>
            {p.is_host && (
              <View className="flex-row items-center bg-amber-500/20 px-2 py-1 rounded-lg">
                <Crown size={12} color="#F59E0B" />
                <Text className="text-amber-300 text-[10px] font-bold ml-1">Chủ phòng</Text>
              </View>
            )}
          </View>
        ))}

        {error ? <Text className="text-rose-300 text-xs mt-3 text-center">{error}</Text> : null}

        {state.is_host ? (
          <Pressable
            onPress={handleStart}
            disabled={starting}
            className="mt-6 bg-emerald-500 rounded-2xl py-4 flex-row items-center justify-center"
          >
            {starting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Play size={18} color="#FFF" />
                <Text className="text-white font-black text-base ml-2">Bắt đầu trận đấu</Text>
              </>
            )}
          </Pressable>
        ) : (
          <View className="mt-6 bg-slate-800 border border-slate-700 rounded-2xl py-4 flex-row items-center justify-center">
            <ActivityIndicator color="#818CF8" />
            <Text className="text-slate-300 font-semibold text-sm ml-2">
              Đang chờ chủ phòng bắt đầu...
            </Text>
          </View>
        )}

        <Pressable onPress={handleLeave} className="mt-3 py-3 flex-row items-center justify-center">
          <LogOut size={14} color="#94A3B8" />
          <Text className="text-slate-400 text-xs font-semibold ml-1.5">
            {state.is_host ? "Đóng phòng" : "Rời phòng"}
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ── ĐẾM NGƯỢC ──
  if (state.phase === "countdown") {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <Text className="text-slate-400 text-sm font-semibold">Trận đấu bắt đầu sau</Text>
        <Text className="text-white text-8xl font-black mt-2">{Math.max(1, remainingSec)}</Text>
        <Text className="text-indigo-300 text-xs mt-2">{state.players.length} người chơi đã sẵn sàng</Text>
      </View>
    );
  }

  // ── KẾT THÚC: BẢNG VÀNG ──
  if (state.phase === "finished") {
    const [first, second, third] = state.players;
    const me = state.players.find((p) => p.user_id === userId);
    return (
      <ScrollView className="flex-1 bg-slate-900" contentContainerStyle={{ padding: 20, paddingTop: 40 }}>
        <View className="items-center mb-6">
          <View className="bg-amber-500/20 p-5 rounded-full border border-amber-400/40 mb-3">
            <Trophy size={44} color="#F59E0B" />
          </View>
          <Text className="text-2xl font-black text-white">BẢNG VÀNG TỔNG KẾT</Text>
          <Text className="text-slate-400 text-xs mt-1">Phòng {code}</Text>
        </View>

        <View className="flex-row items-end justify-center mb-6 gap-3">
          {[second, first, third].map((p, i) => {
            if (!p) return <View key={i} className="flex-1" />;
            const heights = ["h-24", "h-32", "h-20"];
            const isFirst = i === 1;
            return (
              <View key={p.user_id} className="items-center flex-1">
                <Text
                  className={`text-xs font-bold mb-1 ${isFirst ? "text-amber-400" : "text-slate-300"}`}
                  numberOfLines={1}
                >
                  {p.name}
                  {p.user_id === userId ? " (Bạn)" : ""}
                </Text>
                <View
                  className={`w-full ${heights[i]} rounded-t-xl items-center justify-center border ${
                    isFirst ? "bg-amber-500/30 border-amber-400/60" : "bg-slate-800 border-slate-700"
                  }`}
                >
                  {isFirst ? <Trophy size={24} color="#F59E0B" /> : <Award size={18} color={i === 0 ? "#CBD5E1" : "#CD7F32"} />}
                  <Text className="text-white font-bold text-xs mt-1">{p.score} đ</Text>
                </View>
              </View>
            );
          })}
        </View>

        {state.players.map((p) => (
          <View
            key={p.user_id}
            className={`flex-row items-center rounded-xl p-3 mb-2 border ${
              p.user_id === userId ? "bg-indigo-500/20 border-indigo-400" : "bg-slate-800 border-slate-700"
            }`}
          >
            <Text className="text-slate-300 font-black w-7">#{p.rank}</Text>
            <Text className="text-white text-sm font-semibold flex-1" numberOfLines={1}>
              {p.name}
            </Text>
            <Text className="text-emerald-300 text-xs mr-3">
              {p.correct}/{state.total_questions} đúng
            </Text>
            <Text className="text-amber-300 font-bold text-sm">{p.score} đ</Text>
          </View>
        ))}

        {me && (
          <Text className="text-slate-400 text-xs text-center mt-3">
            Bạn xếp hạng {me.rank}/{state.players.length} • Thời gian trả lời TB{" "}
            {(me.avg_answer_ms / 1000).toFixed(1)}s
          </Text>
        )}

        <Pressable
          onPress={() => router.replace("/(tabs)/battle")}
          className="mt-6 bg-indigo-600 rounded-xl py-4 items-center"
        >
          <Text className="text-white font-bold text-sm">Về sảnh Đấu trí</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ── CÂU HỎI / ĐÁP ÁN ──
  const q = state.question;
  const isReveal = state.phase === "reveal";
  const chosen = state.my_answer?.option || pendingOption;

  return (
    <View className="flex-1 bg-slate-900 px-4 pt-10">
      <View className="flex-row justify-between items-center bg-slate-800 p-3.5 rounded-2xl mb-4 border border-slate-700">
        <View>
          <Text className="text-slate-400 text-[10px]">PHÒNG</Text>
          <Text className="text-white font-mono font-bold text-sm">{code}</Text>
        </View>
        <View className="flex-row items-center bg-indigo-500/20 px-3 py-1.5 rounded-xl">
          <Users size={14} color="#818CF8" />
          <Text className="text-indigo-300 text-xs font-semibold ml-1.5">
            {state.answered_count}/{state.players.length} đã trả lời
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-slate-400 text-[10px]">CÂU</Text>
          <Text className="text-white font-bold text-sm">
            {state.question_index + 1}/{state.total_questions}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
          <Timer size={16} color={!isReveal && remainingSec <= 3 ? "#EF4444" : "#F59E0B"} />
          <Text className={`font-mono font-bold text-sm ml-1.5 ${!isReveal && remainingSec <= 3 ? "text-rose-400" : "text-amber-400"}`}>
            {isReveal ? `Câu tiếp theo sau ${remainingSec}s` : `${remainingSec}s`}
          </Text>
        </View>
        {state.my_answer && (
          <Text className="text-emerald-300 text-xs font-bold">
            {isReveal ? (state.my_answer.correct ? `+${state.my_answer.points}đ` : "+0đ") : "Đã chốt đáp án"}
          </Text>
        )}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="bg-slate-800 p-5 rounded-2xl mb-5 border border-slate-700">
          <Text className="text-white text-base font-semibold leading-relaxed">{q?.question}</Text>
        </View>

        {q?.options.map((opt) => {
          let bg = "bg-slate-800";
          let border = "border-slate-700";
          if (isReveal) {
            if (opt.key === q.correct_option) {
              bg = "bg-emerald-600/30";
              border = "border-emerald-500";
            } else if (opt.key === chosen) {
              bg = "bg-rose-600/30";
              border = "border-rose-500";
            }
          } else if (opt.key === chosen) {
            bg = "bg-indigo-600/40";
            border = "border-indigo-400";
          }
          const locked = isReveal || !!chosen;
          return (
            <Pressable
              key={opt.key}
              disabled={locked}
              onPress={() => handleAnswer(opt.key)}
              className={`${bg} border ${border} p-4 rounded-xl flex-row items-center mb-3`}
            >
              <View className="w-8 h-8 rounded-lg bg-slate-900 items-center justify-center mr-3">
                <Text className="text-indigo-400 font-bold text-xs">{opt.key}</Text>
              </View>
              <Text className="text-slate-100 text-xs font-medium flex-1">{opt.text}</Text>
              {isReveal && opt.key === q.correct_option && <CheckCircle2 size={16} color="#34D399" />}
            </Pressable>
          );
        })}

        {isReveal && (
          <>
            {!state.my_answer && (
              <Text className="text-rose-300 text-xs font-semibold mb-2">Bạn chưa trả lời câu này (+0đ)</Text>
            )}
            {q?.explanation ? (
              <View className="bg-indigo-950/60 border border-indigo-700/60 p-3.5 rounded-xl mb-4">
                <Text className="text-indigo-300 text-xs font-semibold">💡 {q.explanation}</Text>
              </View>
            ) : null}
            <Text className="text-white font-bold text-sm mb-2">Bảng xếp hạng tạm thời</Text>
            {state.players.slice(0, 5).map((p) => (
              <View key={p.user_id} className="flex-row items-center bg-slate-800 rounded-xl p-2.5 mb-1.5">
                <Text className="text-slate-400 font-bold w-7 text-xs">#{p.rank}</Text>
                <Text className="text-white text-xs flex-1" numberOfLines={1}>
                  {p.name}
                  {p.user_id === userId ? " (Bạn)" : ""}
                </Text>
                <Text className="text-amber-300 text-xs font-bold">{p.score} đ</Text>
              </View>
            ))}
          </>
        )}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
