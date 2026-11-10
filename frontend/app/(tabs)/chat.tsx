/**
 * DocuGraph AI – Presentation Layer: GraphRAG Chat Assistant Screen
 * Course Alignment:
 *  - Week 9: Uses AskQuestionUseCase & GetDocumentsUseCase via Service Locator (sl) + Either.fold()
 *  - Week 10: Transparent Offline GraphRAG fallback when disconnected
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Send, Sparkles, BookOpen, User, Bot, FileCheck2 } from "lucide-react-native";
import { sl } from "../../src/core/di/injection_container";
import { DocumentEntity } from "../../src/features/documents/domain/entities/document_entity";

interface UIMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  citations?: Array<{ pageNumber: number; textSnippet: string }>;
}

export default function ChatScreen() {
  const { documentId } = useLocalSearchParams<{ documentId?: string }>();
  const [documents, setDocuments] = useState<DocumentEntity[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>(documentId || "");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<UIMessage[]>([
    {
      id: "m1",
      sender: "ai",
      text: "Xin chào! Tôi là Trợ lý Học tập DocuGraph AI (GraphRAG). Hãy chọn tài liệu bên trên và đặt câu hỏi — tôi sẽ kết hợp tìm kiếm Vector (pgvector) và Đồ thị Tri thức (Neo4j) kèm trích dẫn số trang chính xác.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadDocs = async () => {
      const resEither = await sl.getDocumentsUseCase.call();
      resEither.fold(
        () => {},
        (docs) => {
          setDocuments(docs);
          if (!selectedDocId && docs.length > 0) {
            setSelectedDocId(docs[0].id);
          }
        }
      );
    };
    loadDocs();
  }, []);

  useEffect(() => {
    if (documentId) {
      setSelectedDocId(documentId);
    }
  }, [documentId]);

  const sendMessage = async (presetQuestion?: string) => {
    const questionText = (presetQuestion ?? input).trim();
    if (!questionText || loading) return;

    const userMsg: UIMessage = {
      id: String(Date.now()),
      sender: "user",
      text: questionText,
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!presetQuestion) setInput("");
    setLoading(true);

    const answerEither = await sl.askQuestionUseCase.call(selectedDocId, questionText);
    setLoading(false);

    answerEither.fold(
      (failure) => {
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now() + 1),
            sender: "ai",
            text: `⚠️ ${failure.message}`,
          },
        ]);
      },
      (aiEntity) => {
        setMessages((prev) => [
          ...prev,
          {
            id: aiEntity.id,
            sender: "ai",
            text: aiEntity.text,
            citations: aiEntity.citations,
          },
        ]);
      }
    );
  };

  return (
    <View className="flex-1 bg-slate-900 pt-10">
      {/* Top Document Context Selector */}
      <View className="px-4 py-2.5 bg-slate-800/90 border-b border-slate-700/80">
        <Text className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1.5">
          NGỮ CẢNH TÀI LIỆU GRAPHRAG ĐANG CHỌN:
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {documents.length > 0 ? (
            documents.map((doc) => {
              const active = doc.id === selectedDocId;
              return (
                <TouchableOpacity
                  key={doc.id}
                  onPress={() => setSelectedDocId(doc.id)}
                  className={`flex-row items-center px-3 py-1.5 rounded-xl mr-2 border ${
                    active
                      ? "bg-indigo-600 border-indigo-400"
                      : "bg-slate-900 border-slate-700"
                  }`}
                >
                  <FileCheck2 size={12} color={active ? "#FFFFFF" : "#94A3B8"} />
                  <Text
                    className={`text-xs font-semibold ml-1.5 max-w-[180px] ${
                      active ? "text-white" : "text-slate-300"
                    }`}
                    numberOfLines={1}
                  >
                    {doc.title}
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <View className="flex-row items-center px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700">
              <FileCheck2 size={12} color="#818CF8" />
              <Text className="text-xs text-slate-300 ml-1.5">
                Giáo trình mặc định (Tải tài liệu lên để hỏi đáp sâu)
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Messages List */}
      <ScrollView className="flex-1 p-4 space-y-4">
        {messages.map((msg) => (
          <View
            key={msg.id}
            className={`flex-row items-start ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            } mb-4`}
          >
            {msg.sender === "ai" && (
              <View className="bg-indigo-600/20 p-2 rounded-full mr-2 border border-indigo-500/30">
                <Bot size={16} color="#818CF8" />
              </View>
            )}

            <View
              className={`max-w-[82%] rounded-2xl p-4 ${
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
                    Trích dẫn tài liệu gốc (Grounded Citations):
                  </Text>
                  {msg.citations.map((c, i) => (
                    <View
                      key={i}
                      className="flex-row items-center bg-slate-900/60 p-2 rounded-lg mb-1"
                    >
                      <BookOpen size={12} color="#6366F1" />
                      <Text
                        className="text-[10px] text-slate-300 ml-1.5 flex-1"
                        numberOfLines={2}
                      >
                        [Trang {c.pageNumber}] {c.textSnippet}
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
          <View className="flex-row items-center space-x-2 bg-slate-800 p-3 rounded-2xl max-w-[65%] mb-4">
            <Sparkles size={16} color="#818CF8" />
            <Text className="text-slate-300 text-xs ml-2">
              Đang truy vấn Vector + Đồ thị Tri thức...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Quick Prompt Suggestions */}
      <View className="px-3 py-2 bg-slate-900 border-t border-slate-800">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            "Tóm tắt các khái niệm trọng tâm ở Trang 1?",
            "Giải thích các thực thể chính trong Đồ thị Tri thức?",
            "Điều kiện xảy ra Deadlock và cách phòng tránh?",
          ].map((q, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => sendMessage(q)}
              className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full mr-2"
            >
              <Text className="text-indigo-300 text-[11px] font-medium">{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input Box */}
      <View className="flex-row items-center p-3 bg-slate-800/90 border-t border-slate-700/80">
        <TextInput
          placeholder="Đặt câu hỏi về giáo trình, công thức..."
          placeholderTextColor="#64748B"
          className="flex-1 bg-slate-900 text-slate-100 text-sm px-4 py-3 rounded-xl border border-slate-700 mr-2"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => sendMessage()}
        />
        <TouchableOpacity
          className="bg-indigo-600 p-3 rounded-xl active:opacity-80"
          onPress={() => sendMessage()}
        >
          <Send size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
