/**
 * DocuGraph AI – Presentation Layer: Personal AI Quiz & Battle Screen
 * Course Alignment: Week 9 (Uses GetDocumentQuizUseCase via Service Locator sl + Either.fold)
 */
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { X, Zap, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { sl } from "../../src/core/di/injection_container";
import { QuizQuestionEntity } from "../../src/features/quiz/quiz_slice";

export default function BattleScreen() {
  const router = useRouter();
  const { documentId } = useLocalSearchParams<{ documentId?: string }>();

  const [questions, setQuestions] = useState<QuizQuestionEntity[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedKey, setSelectedKey] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [score, setScore] = useState(980);
  const [timeLeft, setTimeLeft] = useState(15);
  const [loading, setLoading] = useState(true);

  const loadQuiz = async () => {
    setLoading(true);
    let targetDocId = documentId || "";
    if (!targetDocId) {
      const docsEither = await sl.getDocumentsUseCase.call();
      docsEither.fold(
        () => {},
        (docs) => {
          if (docs.length > 0) targetDocId = docs[0].id;
        }
      );
    }

    if (!targetDocId) {
      setQuestions([]);
      setLoading(false);
      return;
    }

    const quizEither = await sl.getDocumentQuizUseCase.call(targetDocId, 5);
    setLoading(false);

    quizEither.fold(
      () => {},
      (list) => {
        setQuestions(list);
        setCurrentIdx(0);
        setSelectedKey(null);
        setTimeLeft(15);
      }
    );
  };

  useEffect(() => {
    loadQuiz();
  }, [documentId]);

  useEffect(() => {
    if (loading || selectedKey !== null || questions.length === 0) return;
    if (timeLeft > 0) {
      const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timeLeft, loading, selectedKey, questions.length]);

  const currentQuestion = questions[currentIdx];

  const handleSelectOption = (key: "A" | "B" | "C" | "D") => {
    if (selectedKey !== null || !currentQuestion) return;
    setSelectedKey(key);
    if (key === currentQuestion.correctOption) {
      setScore((prev) => prev + 100 + timeLeft * 10);
    }
  };

  const handleNextQuestion = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((i) => i + 1);
      setSelectedKey(null);
      setTimeLeft(15);
    } else {
      router.push("/battle/results");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="text-xs font-semibold text-slate-500 mt-3">
          Đang sinh câu hỏi trắc nghiệm AI từ tài liệu...
        </Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center px-6">
        <Zap size={38} color="#4F46E5" />
        <Text className="text-base font-bold text-slate-800 mt-3 text-center">
          Chưa có tài liệu để tạo câu hỏi Trắc nghiệm AI
        </Text>
        <Text className="text-xs text-slate-500 text-center mt-1.5 leading-5">
          Hãy tải lên giáo trình hoặc quét OCR tài liệu trước, sau đó quay lại đây để ôn tập trắc nghiệm theo Đồ thị Tri thức.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 pt-12">
      {/* Header */}
      <View className="px-4 flex-row items-center justify-between pb-2">
        <View>
          <Text className="text-xs text-slate-400 font-bold uppercase">ĐẤU TRÍ TRẮC NGHIỆM AI</Text>
          <Text className="text-sm font-bold text-slate-800">
            Ôn tập theo Đồ thị Tri thức
          </Text>
        </View>
        <View className="flex-row items-center space-x-2">
          <TouchableOpacity onPress={loadQuiz} className="p-2 bg-indigo-50 rounded-full mr-1">
            <RotateCcw size={16} color="#4F46E5" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} className="p-1">
            <X size={20} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Room Status */}
      <View className="px-4 flex-row justify-between items-center mb-3">
        <Text className="text-xs font-bold text-indigo-600">PIN: 8392</Text>
        <Text className="text-xs text-emerald-600 font-medium">● 12/20 Đang thi đấu</Text>
      </View>

      {/* Timer Semi-Circle */}
      <View className="items-center mb-4">
        <View className="w-28 h-14 border-t-8 border-l-8 border-r-8 border-amber-400 rounded-t-full items-center justify-end pb-1">
          <Text className="text-xl font-black text-slate-900">{timeLeft}</Text>
          <Text className="text-[10px] text-slate-400 font-semibold">giây còn lại</Text>
        </View>
      </View>

      {/* Question Card & Options */}
      {currentQuestion && (
        <ScrollView className="px-4 flex-1" showsVerticalScrollIndicator={false}>
          <View className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm mb-4">
            <Text className="text-xs font-bold text-indigo-600 uppercase mb-2">
              CÂU {currentIdx + 1} / {questions.length}
            </Text>
            <Text className="text-sm font-bold text-slate-900 leading-snug mb-3">
              {currentQuestion.question}
            </Text>

            <View className="bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 self-start flex-row items-center">
              <Zap size={12} color="#D97706" className="mr-1" />
              <Text className="text-xs text-amber-700 font-bold">
                +{100 + timeLeft * 10} pts (Thưởng tốc độ!)
              </Text>
            </View>
          </View>

          {/* Options */}
          {currentQuestion.optionsList.map((opt) => {
            const isSelected = selectedKey === opt.key;
            const isCorrect = opt.key === currentQuestion.correctOption;

            let cardStyle = "bg-white border-slate-200";
            let badgeStyle = "bg-slate-100";
            let badgeText = "text-slate-600";

            if (selectedKey !== null) {
              if (isCorrect) {
                cardStyle = "bg-emerald-50 border-emerald-500";
                badgeStyle = "bg-emerald-600";
                badgeText = "text-white";
              } else if (isSelected) {
                cardStyle = "bg-rose-50 border-rose-500";
                badgeStyle = "bg-rose-600";
                badgeText = "text-white";
              }
            } else if (isSelected) {
              cardStyle = "bg-indigo-50 border-indigo-600";
              badgeStyle = "bg-indigo-600";
              badgeText = "text-white";
            }

            return (
              <TouchableOpacity
                key={opt.key}
                disabled={selectedKey !== null}
                onPress={() => handleSelectOption(opt.key)}
                className={`p-3.5 rounded-2xl border mb-2.5 flex-row items-center ${cardStyle}`}
              >
                <View className={`w-8 h-8 rounded-xl items-center justify-center mr-3 ${badgeStyle}`}>
                  <Text className={`font-bold text-xs ${badgeText}`}>{opt.key}</Text>
                </View>
                <Text className="font-semibold text-slate-800 text-xs flex-1">{opt.text}</Text>
              </TouchableOpacity>
            );
          })}

          {/* Explanation & Next Button */}
          {selectedKey !== null && (
            <View className="mt-2 mb-6">
              <View className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 mb-3 flex-row items-start">
                {selectedKey === currentQuestion.correctOption ? (
                  <CheckCircle2 size={16} color="#059669" />
                ) : (
                  <AlertCircle size={16} color="#E11D48" />
                )}
                <Text className="text-xs text-slate-700 ml-2 flex-1 leading-relaxed">
                  <Text className="font-bold">Giải thích: </Text>
                  {currentQuestion.explanation}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleNextQuestion}
                className="bg-indigo-600 py-3.5 rounded-2xl items-center"
              >
                <Text className="text-white font-bold text-xs">
                  {currentIdx + 1 < questions.length
                    ? "Câu hỏi tiếp theo →"
                    : "Xem Bảng Xếp Hạng Chung Cuộc 🏆"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* Live Leaderboard */}
      <View className="bg-white p-4 border-t border-slate-200">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-xs font-bold text-slate-400 uppercase">BẢNG XẾP HẠNG TRỰC TIẾP</Text>
          <Text className="text-[10px] text-emerald-600 font-bold">● LIVE</Text>
        </View>
        <View className="flex-row justify-around">
          <Text className="text-xs font-bold text-slate-700">Tuấn: 1250 pts</Text>
          <Text className="text-xs font-bold text-indigo-600">Minh (Bạn): {score} pts</Text>
          <Text className="text-xs font-bold text-slate-700">Linh: 850 pts</Text>
        </View>
      </View>
    </View>
  );
}
