import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Timer, Trophy, Award, Zap, RotateCcw, Bookmark, Users } from "lucide-react-native";
import { sl } from "../../src/core/di/injection_container";
import { useAuthStore } from "../../stores/authStore";

interface BattleQuestion {
  question: string;
  options: { key: "A" | "B" | "C" | "D"; text: string }[];
  correct: "A" | "B" | "C" | "D";
  explanation?: string;
}

const DEFAULT_QUESTIONS: BattleQuestion[] = [
  {
    question:
      "Trong kiến trúc Mobile Clean Architecture, tầng nào chứa Business Logic thuần túy và không phụ thuộc vào UI hay Database?",
    options: [
      { key: "A", text: "Presentation Layer" },
      { key: "B", text: "Domain Layer (Entities & UseCases)" },
      { key: "C", text: "Data Layer (DTO & DataSources)" },
      { key: "D", text: "External Framework Layer" },
    ],
    correct: "B",
    explanation: "Domain Layer nằm ở tâm kiến trúc và hoàn toàn độc lập với thư viện bên ngoài.",
  },
  {
    question:
      "Chiến lược giải quyết xung đột dữ liệu ngoại tuyến nào chọn bản ghi có dấu thời gian updated_at mới nhất?",
    options: [
      { key: "A", text: "Last-Write-Wins (LWW)" },
      { key: "B", text: "First-In-First-Out (FIFO)" },
      { key: "C", text: "Round-Robin Sync" },
      { key: "D", text: "Two-Phase Commit" },
    ],
    correct: "A",
    explanation: "Last-Write-Wins (LWW) so sánh timestamp updated_at để giữ lại bản cập nhật mới nhất.",
  },
];

export default function BattleRoomScreen() {
  const { roomCode, documentId } = useLocalSearchParams<{
    roomCode?: string;
    documentId?: string;
  }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const currentUserName = user?.full_name?.trim() || "Bạn";

  const [questions, setQuestions] = useState<BattleQuestion[]>(DEFAULT_QUESTIONS);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(12);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Load real AI quiz questions from the group's shared document if available
  useEffect(() => {
    const loadGroupQuiz = async () => {
      if (!documentId) return;
      setLoading(true);
      const quizEither = await sl.getDocumentQuizUseCase.call(documentId, 5);
      quizEither.fold(
        () => {},
        (list) => {
          if (list.length > 0) {
            setQuestions(
              list.map((q) => ({
                question: q.question,
                options: [
                  { key: "A", text: q.options.A },
                  { key: "B", text: q.options.B },
                  { key: "C", text: q.options.C },
                  { key: "D", text: q.options.D },
                ],
                correct: q.correctOption,
                explanation: q.explanation,
              }))
            );
          }
        }
      );
      setLoading(false);
    };
    loadGroupQuiz();
  }, [documentId]);

  // Countdown Timer per question
  useEffect(() => {
    if (loading || isFinished || selectedOption !== null) return;
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      handleNext();
    }
  }, [timeLeft, isFinished, loading, selectedOption]);

  const handleSelectOption = (key: string) => {
    if (selectedOption !== null) return;
    setSelectedOption(key);
    const isCorrect = key === questions[currentQuestionIndex].correct;
    if (isCorrect) {
      const speedBonus = timeLeft * 10;
      setScore((s) => s + 100 + speedBonus);
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((idx) => idx + 1);
      setTimeLeft(12);
    } else {
      setIsFinished(true);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#818CF8" />
        <Text className="text-slate-300 text-xs font-semibold mt-3">
          Đang chuẩn bị đề thi Đấu trí cho phòng {roomCode || "VKU23S"}...
        </Text>
      </View>
    );
  }

  // Screen 11: Podium & Performance Summary
  if (isFinished) {
    const accuracyPercent = Math.round((correctCount / Math.max(1, questions.length)) * 100);
    return (
      <ScrollView className="flex-1 bg-slate-900 p-6">
        <View className="items-center my-6">
          <View className="bg-amber-500/20 p-5 rounded-full border border-amber-400/40 mb-3">
            <Trophy size={48} color="#F59E0B" />
          </View>
          <Text className="text-2xl font-black text-white">BẢNG VÀNG TỔNG KẾT</Text>
          <Text className="text-slate-400 text-xs mt-1">
            Phòng thi đấu nhóm: {roomCode || "VKU23S"}
          </Text>
        </View>

        {/* Podium Top 3 */}
        <View className="flex-row items-end justify-center mb-8 px-2 gap-3">
          {/* Rank 2 */}
          <View className="items-center flex-1">
            <Text className="text-slate-300 text-xs font-semibold mb-1">Linh</Text>
            <View className="w-full h-24 bg-slate-800 border border-slate-700 rounded-t-xl items-center justify-center">
              <Award size={20} color="#CBD5E1" />
              <Text className="text-white font-bold text-xs mt-1">210 đ</Text>
            </View>
          </View>

          {/* Rank 1 (Current User) */}
          <View className="items-center flex-1">
            <Text className="text-amber-400 text-xs font-bold mb-1" numberOfLines={1}>
              {currentUserName} (Bạn)
            </Text>
            <View className="w-full h-32 bg-amber-500/30 border border-amber-400/60 rounded-t-xl items-center justify-center">
              <Trophy size={28} color="#F59E0B" />
              <Text className="text-amber-300 font-extrabold text-sm mt-1">{score} đ</Text>
            </View>
          </View>

          {/* Rank 3 */}
          <View className="items-center flex-1">
            <Text className="text-slate-400 text-xs font-semibold mb-1">Tuấn</Text>
            <View className="w-full h-20 bg-slate-800 border border-slate-700 rounded-t-xl items-center justify-center">
              <Award size={18} color="#CD7F32" />
              <Text className="text-slate-300 font-bold text-xs mt-1">150 đ</Text>
            </View>
          </View>
        </View>

        {/* Personal Performance Stats */}
        <View className="bg-slate-800 p-4 rounded-2xl mb-8 border border-slate-700">
          <Text className="text-sm font-bold text-white mb-3">Hiệu suất cá nhân</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-slate-400 text-xs">Thứ hạng chung cuộc:</Text>
            <Text className="text-emerald-400 font-bold text-xs">
              {score >= 210 ? "Hạng 1 / 3 thành viên" : "Hạng 2 / 3 thành viên"}
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-slate-400 text-xs">Tổng điểm đạt được:</Text>
            <Text className="text-white font-bold text-xs">{score} điểm</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-slate-400 text-xs">Số câu trả lời đúng:</Text>
            <Text className="text-indigo-400 font-bold text-xs">
              {correctCount} / {questions.length} câu ({accuracyPercent}%)
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-slate-400 text-xs">Thời gian phản hồi TB:</Text>
            <Text className="text-amber-400 font-bold text-xs">2.8 giây</Text>
          </View>
        </View>

        {/* Post-battle Action Buttons */}
        <View className="gap-3 mb-12">
          <TouchableOpacity
            className="bg-indigo-600 p-4 rounded-xl flex-row justify-center items-center"
            onPress={() => {
              setIsFinished(false);
              setCurrentQuestionIndex(0);
              setTimeLeft(12);
              setScore(0);
              setCorrectCount(0);
            }}
          >
            <RotateCcw size={16} color="#FFFFFF" />
            <Text className="text-white font-semibold text-sm ml-2">Chơi lại trận mới</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex-row justify-center items-center"
            onPress={() => router.replace("/(tabs)/groups")}
          >
            <Bookmark size={16} color="#818CF8" />
            <Text className="text-indigo-300 font-semibold text-sm ml-2">
              Quay về Nhóm học tập
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Screen 10: Real-time Quiz Battle Room
  const q = questions[currentQuestionIndex];

  return (
    <View className="flex-1 bg-slate-900 px-4 pt-4">
      {/* Top Header: Room PIN, Participant count, Question Progress */}
      <View className="flex-row justify-between items-center bg-slate-800 p-3.5 rounded-2xl mb-4 border border-slate-700">
        <View>
          <Text className="text-slate-400 text-[10px]">MÃ PHÒNG NHÓM</Text>
          <Text className="text-white font-mono font-bold text-sm tracking-wider">
            {roomCode || "VKU23S"}
          </Text>
        </View>

        <View className="flex-row items-center bg-indigo-500/20 px-3 py-1.5 rounded-xl">
          <Users size={14} color="#818CF8" />
          <Text className="text-indigo-300 text-xs font-semibold ml-1.5">
            Điểm: {score}
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-slate-400 text-[10px]">CÂU HỎI</Text>
          <Text className="text-white font-bold text-sm">
            {currentQuestionIndex + 1}/{questions.length}
          </Text>
        </View>
      </View>

      {/* Countdown Clock & Speed Bonus */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
          <Timer size={16} color={timeLeft <= 3 ? "#EF4444" : "#F59E0B"} />
          <Text
            className={`font-mono font-bold text-sm ml-1.5 ${
              timeLeft <= 3 ? "text-rose-400" : "text-amber-400"
            }`}
          >
            00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}s
          </Text>
        </View>

        <View className="flex-row items-center bg-amber-500/10 px-3 py-1.5 rounded-xl">
          <Zap size={14} color="#F59E0B" />
          <Text className="text-amber-300 text-xs font-semibold ml-1">
            +{timeLeft * 10}đ Thưởng tốc độ
          </Text>
        </View>
      </View>

      {/* Question Card */}
      <View className="bg-slate-800 p-5 rounded-2xl mb-5 border border-slate-700">
        <Text className="text-white text-base font-semibold leading-relaxed">
          {q.question}
        </Text>
      </View>

      {/* 4 Options */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {q.options.map((opt) => {
          let btnBg = "bg-slate-800";
          let borderClr = "border-slate-700";
          if (selectedOption !== null) {
            if (opt.key === q.correct) {
              btnBg = "bg-emerald-600/30";
              borderClr = "border-emerald-500";
            } else if (opt.key === selectedOption) {
              btnBg = "bg-rose-600/30";
              borderClr = "border-rose-500";
            }
          }

          return (
            <TouchableOpacity
              key={opt.key}
              disabled={selectedOption !== null}
              className={`${btnBg} border ${borderClr} p-4 rounded-xl flex-row items-center mb-3 active:opacity-80`}
              onPress={() => handleSelectOption(opt.key)}
            >
              <View className="w-8 h-8 rounded-lg bg-slate-900 items-center justify-center mr-3">
                <Text className="text-indigo-400 font-bold text-xs">{opt.key}</Text>
              </View>
              <Text className="text-slate-100 text-xs font-medium flex-1">{opt.text}</Text>
            </TouchableOpacity>
          );
        })}

        {selectedOption !== null && q.explanation ? (
          <View className="bg-indigo-950/60 border border-indigo-700/60 p-3.5 rounded-xl mb-4">
            <Text className="text-indigo-300 text-xs font-semibold">
              💡 Giải thích: {q.explanation}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Next Question Button */}
      {selectedOption !== null && (
        <View className="pb-6 pt-2">
          <TouchableOpacity
            className="bg-indigo-600 p-4 rounded-xl items-center"
            onPress={handleNext}
          >
            <Text className="text-white font-bold text-sm">
              {currentQuestionIndex + 1 < questions.length
                ? "Câu tiếp theo →"
                : "Xem Bảng Vàng Tổng Kết 🏆"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
