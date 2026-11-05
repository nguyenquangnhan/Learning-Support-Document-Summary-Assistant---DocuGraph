import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Send, Sparkles, BookOpen, User, Bot } from "lucide-react-native";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  citations?: Array<{ page_number: number; text_snippet: string }>;
}

export default function ChatScreen() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m1",
      sender: "ai",
      text: "Xin chào! Tôi là Trợ lý Học tập DocuGraph AI. Tôi có thể giải đáp các thắc mắc từ giáo trình và bài giảng với trích dẫn chính xác và loại bỏ ảo giác thông tin.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { id: String(Date.now()), sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    const questionText = input;
    setInput("");
    setLoading(true);

    // Simulate GraphRAG response with citations
    setTimeout(() => {
      const aiMsg: Message = {
        id: String(Date.now() + 1),
        sender: "ai",
        text: `Dựa trên tài liệu đã học, ${questionText.toLowerCase().includes("định lý") ? "định lý này có điều kiện cần và đủ là tính liên tục trên đoạn đóng [a, b]." : "khái niệm này được phát biểu rõ ở chương 2, đóng vai trò nền tảng cho các thuật toán tối ưu hóa."}`,
        citations: [
          { page_number: 14, text_snippet: "Trang 14: Giáo trình Giải tích Nâng cao - Mục 2.3..." },
          { page_number: 15, text_snippet: "Trang 15: Hệ quả và ví dụ minh họa chứng minh..." }
        ],
      };
      setMessages((prev) => [...prev, aiMsg]);
      setLoading(false);
    }, 1200);
  };

  return (
    <View className="flex-1 bg-slate-900">
      <ScrollView className="flex-1 p-4 space-y-4">
        {messages.map((msg) => (
          <View
            key={msg.id}
            className={`flex-row items-start ${msg.sender === "user" ? "justify-end" : "justify-start"} mb-4`}
          >
            {msg.sender === "ai" && (
              <View className="bg-indigo-600/20 p-2 rounded-full mr-2 border border-indigo-500/30">
                <Bot size={16} color="#818CF8" />
              </View>
            )}

            <View
              className={`max-w-[80%] rounded-2xl p-4 ${
                msg.sender === "user"
                  ? "bg-indigo-600 rounded-tr-none"
                  : "bg-slate-800 border border-slate-700/80 rounded-tl-none"
              }`}
            >
              <Text className="text-slate-100 text-sm leading-relaxed">{msg.text}</Text>

              {/* Citations Tag */}
              {msg.citations && msg.citations.length > 0 && (
                <View className="mt-3 pt-2.5 border-t border-slate-700/60">
                  <Text className="text-[11px] font-semibold text-indigo-400 mb-1.5">
                    Trích dẫn tài liệu gốc:
                  </Text>
                  {msg.citations.map((c, i) => (
                    <View key={i} className="flex-row items-center bg-slate-900/60 p-2 rounded-lg mb-1">
                      <BookOpen size={12} color="#6366F1" />
                      <Text className="text-[10px] text-slate-300 ml-1.5 flex-1" numberOfLines={1}>
                        [Trang {c.page_number}] {c.text_snippet}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {msg.sender === "user" && (
              <View className="bg-indigo-600 p-2 rounded-full ml-2">
                <User size={16} color="#FFFFFF" />
              </View>
            )}
          </View>
        ))}

        {loading && (
          <View className="flex-row items-center space-x-2 bg-slate-800 p-3 rounded-2xl max-w-[50%]">
            <Sparkles size={16} color="#818CF8" />
            <Text className="text-slate-400 text-xs ml-2">Đang suy luận GraphRAG...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input Box */}
      <View className="flex-row items-center p-3 bg-slate-800/90 border-t border-slate-700/80">
        <TextInput
          placeholder="Đặt câu hỏi về giáo trình, công thức..."
          placeholderTextColor="#64748B"
          className="flex-1 bg-slate-900 text-slate-100 text-sm px-4 py-3 rounded-xl border border-slate-700 mr-2"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          className="bg-indigo-600 p-3 rounded-xl active:opacity-80"
          onPress={sendMessage}
        >
          <Send size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

