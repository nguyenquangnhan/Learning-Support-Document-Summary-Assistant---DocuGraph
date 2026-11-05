import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ChatMessage } from '../../stores/chatStore';

interface ChatBubbleProps {
  message: ChatMessage;
  onCitationPress?: (pageNumber: number) => void;
}

export function ChatBubble({ message, onCitationPress }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <View className={`mb-3 ${isUser ? 'items-end' : 'items-start'}`}>
      {/* Avatar (AI only) */}
      {!isUser && (
        <View className="flex-row items-end gap-2 mb-1">
          <View className="w-7 h-7 rounded-full bg-indigo-600 items-center justify-center">
            <Ionicons name="sparkles" size={14} color="white" />
          </View>
          <Text className="text-xs text-gray-500">DocuGraph AI</Text>
        </View>
      )}

      {/* Bubble */}
      <View
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-indigo-600 rounded-tr-sm'
            : 'bg-gray-100 dark:bg-gray-800 rounded-tl-sm'
        }`}
      >
        {/* Streaming indicator */}
        {message.isStreaming && (
          <View className="flex-row gap-1 mb-1">
            <View className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
            <View className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
            <View className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
          </View>
        )}

        <Text
          className={`text-sm leading-5 ${
            isUser ? 'text-white' : 'text-gray-800 dark:text-gray-100'
          }`}
        >
          {message.content}
        </Text>
      </View>

      {/* Citations */}
      {!isUser && message.citations && message.citations.length > 0 && (
        <View className="mt-2 ml-9 gap-1">
          <Text className="text-xs text-gray-400 mb-1">📌 Nguồn trích dẫn:</Text>
          {message.citations.map((citation, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => onCitationPress?.(citation.pageNumber)}
              className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-lg px-3 py-1.5"
            >
              <Text className="text-xs text-indigo-700 dark:text-indigo-300">
                Trang {citation.pageNumber}: {citation.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Timestamp */}
      <Text className={`text-xs text-gray-400 mt-1 ${isUser ? 'mr-1' : 'ml-9'}`}>
        {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );
}
