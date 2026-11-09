import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Timer, Trophy, Award, Zap, RotateCcw, Bookmark, Users } from "lucide-react-native";

export default function BattleRoomScreen() {
  const { roomCode } = useLocalSearchParams();
  const router = useRouter();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const sampleQuestions = [
    {
      question: "Theo định lý Weierstrass, hàm số f(x) liên tục trên đoạn [a, b] sẽ có tính chất nào sau đây?",
      options: [
        { key: "A", text: "Luôn có đạo hàm tại mọi điểm trong khoảng (a, b)" },
        { key: "B", text: "Đạt giá trị lớn nhất và giá trị nhỏ nhất trên [a, b]" },
        { key: "C", text: "Đồ thị luôn là một đường thẳng đi qua gốc tọa độ" },
        { key: "D", text: "Hàm số đồng biến trên toàn bộ tập số thực" },
      ],
      correct: "B",
    },
    {
      question: "Quy tắc L'Hôpital được áp dụng để tính giới hạn trong trường hợp vô định nào?",
      options: [
        { key: "A", text: "0/0 hoặc ∞/∞" },
        { key: "B", text: "0 * 1" },
        { key: "C", text: "1/∞" },
        { key: "D", text: "∞ - 0" },
      ],
      correct: "A",
    },
  ];

  // 10s Countdown Timer per question
  useEffect(() => {
    if (isFinished) return;
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Time up -> next question or finish
      handleNext();
    }
  }, [timeLeft, isFinished]);

  const handleSelectOption = (key: string) => {
    if (selectedOption !== null) return;
    setSelectedOption(key);
    const isCorrect = key === sampleQuestions[currentQuestionIndex].correct;
    if (isCorrect) {
      const speedBonus = timeLeft * 10;
      setScore((s) => s + 100 + speedBonus);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    if (currentQuestionIndex + 1 < sampleQuestions.length) {
      setCurrentQuestionIndex((idx) => idx + 1);
      setTimeLeft(10);
    } else {
      setIsFinished(true);
    }
  };
  const handleFinishBattle = () => {
    // Chuyển hướng sang màn hình Kết quả & Podium
    router.replace('/battle/results');
  };

  // Screen 11: Podium & Performance Summary
  if (isFinished) {
    return (
      <ScrollView className="flex-1 bg-slate-900 p-6">
        <View className="items-center my-6">
          <View className="bg-amber-500/20 p-5 rounded-full border border-amber-400/40 mb-3">
            <Trophy size={48} color="#F59E0B" />
          </View>
          <Text className="text-2xl font-black text-white">BẢNG VÀNG TỔNG KẾT</Text>
          <Text className="text-slate-400 text-xs mt-1">Phòng thi đấu: {roomCode || "MATH22"}</Text>
        </View>

        {/* Podium Top 3 */}
        <View className="flex-row items-end justify-center mb-8 px-2 space-x-3">
          {/* Rank 2 */}
          <View className="items-center flex-1">
            <Text className="text-slate-300 text-xs font-semibold mb-1">Linh</Text>
            <View className="w-full h-24 bg-slate-800 border border-slate-700 rounded-t-xl items-center justify-center">
              <Award size={20} color="#CBD5E1" />
              <Text className="text-white font-bold text-xs mt-1">210 đ</Text>
            </View>
          </View>

          {/* Rank 1 (Minh - Current User) */}
          <View className="items-center flex-1">
            <Text className="text-amber-400 text-xs font-bold mb-1">Minh (Bạn)</Text>
            <View className="w-full h-32 bg-amber-500/30 border border-amber-400/60 rounded-t-xl items-center justify-center">
              <Trophy size={28} color="#F59E0B" />
              <Text className="text-amber-300 font-extrabold text-sm mt-1">{score} đ</Text>
            </View>
          </View>

          {/* Rank 3 */}
          <View className="items-center flex-1">
            <Text className="text-slate-400 text-xs font-semibold mb-1">Tuấn</Text>
            <View className="w-full h-18 bg-slate-800 border border-slate-700 rounded-t-xl items-center justify-center">
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
            <Text className="text-emerald-400 font-bold text-xs">Hạng 1 / 8 người chơi</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-slate-400 text-xs">Tổng điểm đạt được:</Text>
            <Text className="text-white font-bold text-xs">{score} điểm</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-slate-400 text-xs">Số câu trả lời đúng:</Text>
            <Text className="text-indigo-400 font-bold text-xs">2 / 2 câu (100%)</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-slate-400 text-xs">Thời gian phản hồi TB:</Text>
            <Text className="text-amber-400 font-bold text-xs">2.8 giây</Text>
          </View>
        </View>

        {/* Post-battle Action Buttons */}
        <View className="space-y-3 mb-12">
          <TouchableOpacity
            className="bg-indigo-600 p-4 rounded-xl flex-row justify-center items-center mb-3"
            onPress={() => {
              setIsFinished(false);
              setCurrentQuestionIndex(0);
              setTimeLeft(10);
              setScore(0);
            }}
          >
            <RotateCcw size={16} color="#FFFFFF" />
            <Text className="text-white font-semibold text-sm ml-2">Chơi lại trận mới</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex-row justify-center items-center"
            onPress={() => router.replace("/(tabs)")}
          >
            <Bookmark size={16} color="#818CF8" />
            <Text className="text-indigo-300 font-semibold text-sm ml-2">Lưu vào Sổ tay câu hỏi ôn tập</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Screen 10: Real-time Quiz Battle Room
  const q = sampleQuestions[currentQuestionIndex];

  return (
    <View className="flex-1 bg-slate-900 px-4 pt-4">
      {/* Top Header: Room PIN, Participant count, Question Progress */}
      <View className="flex-row justify-between items-center bg-slate-800 p-3.5 rounded-2xl mb-4 border border-slate-700">
        <View>
          <Text className="text-slate-400 text-[10px]">MÃ PHÒNG</Text>
          <Text className="text-white font-mono font-bold text-sm tracking-wider">{roomCode || "MATH22"}</Text>
        </View>

        <View className="flex-row items-center bg-indigo-500/20 px-3 py-1.5 rounded-xl">
          <Users size={14} color="#818CF8" />
          <Text className="text-indigo-300 text-xs font-semibold ml-1.5">6 Người chơi</Text>
        </View>

        <View className="items-end">
          <Text className="text-slate-400 text-[10px]">CÂU HỎI</Text>
          <Text className="text-white font-bold text-sm">
            {currentQuestionIndex + 1}/{sampleQuestions.length}
          </Text>
        </View>
      </View>

      {/* Countdown Clock & Speed Bonus */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
          <Timer size={16} color={timeLeft <= 3 ? "#EF4444" : "#F59E0B"} />
          <Text className={`font-mono font-bold text-sm ml-1.5 ${timeLeft <= 3 ? "text-rose-400" : "text-amber-400"}`}>
            00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}s
          </Text>
        </View>

        <View className="flex-row items-center bg-amber-500/10 px-3 py-1.5 rounded-xl">
          <Zap size={14} color="#F59E0B" />
          <Text className="text-amber-300 text-xs font-semibold ml-1">+{timeLeft * 10}đ Thưởng tốc độ</Text>
        </View>
      </View>

      {/* Question Card */}
      <View className="bg-slate-800 p-5 rounded-2xl mb-6 border border-slate-700">
        <Text className="text-white text-base font-semibold leading-relaxed">{q.question}</Text>
      </View>

      {/* 4 Options */}
      <View className="space-y-3 flex-1">
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
      </View>

      {/* Next Question / Skip Button */}
      {selectedOption !== null && (
        <View className="pb-8">
          <TouchableOpacity
            className="bg-indigo-600 p-4 rounded-xl items-center"
            onPress={handleNext}
          >
            <Text className="text-white font-bold text-sm">Câu tiếp theo →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

