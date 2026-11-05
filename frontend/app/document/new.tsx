import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import api from '../../lib/api';

type SummaryType = 'tldr' | 'detailed';

export default function NewDocumentScreen() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    uri: string;
    mimeType: string;
    size: number;
  } | null>(null);
  const [summaryType, setSummaryType] = useState<SummaryType>('tldr');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedFile({
        name: asset.name,
        uri: asset.uri,
        mimeType: asset.mimeType ?? 'application/pdf',
        size: asset.size ?? 0,
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setProgress('Đang tải lên...');

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType,
      } as unknown as Blob);
      formData.append('summary_type', summaryType);

      setProgress('Trích xuất nội dung...');
      const response = await api.post('/api/v1/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setProgress('Tạo Vector Embedding...');
      await new Promise(r => setTimeout(r, 1000));

      setProgress('Xây dựng Đồ thị Tri thức...');
      await new Promise(r => setTimeout(r, 1000));

      const documentId: string = response.data.id;
      router.replace(`/document/${documentId}`);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải lên tài liệu. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
      setProgress(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#6366f1" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 dark:text-white flex-1">
          Tải tài liệu mới
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* File picker */}
        <TouchableOpacity
          onPress={handlePickFile}
          disabled={isUploading}
          className="border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-2xl p-8 items-center mb-6"
        >
          {selectedFile ? (
            <View className="items-center">
              <Ionicons
                name={selectedFile.mimeType.includes('pdf') ? 'document-text' : 'document'}
                size={48}
                color="#6366f1"
              />
              <Text className="text-gray-900 dark:text-white font-semibold mt-3 text-center">
                {selectedFile.name}
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                {formatFileSize(selectedFile.size)}
              </Text>
              <Text className="text-indigo-500 text-sm mt-2">Nhấn để đổi file</Text>
            </View>
          ) : (
            <View className="items-center">
              <Ionicons name="cloud-upload-outline" size={48} color="#a5b4fc" />
              <Text className="text-gray-700 dark:text-gray-300 font-semibold mt-3">
                Chọn file PDF hoặc DOCX
              </Text>
              <Text className="text-gray-400 text-sm mt-1">Tối đa 50MB</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Summary type */}
        <Text className="text-gray-700 dark:text-gray-300 font-semibold mb-3">
          Loại tóm tắt
        </Text>
        <View className="flex-row gap-3 mb-8">
          {[
            { id: 'tldr', label: 'TL;DR', desc: 'Tóm tắt ngắn gọn, nhanh nắm bắt', icon: 'flash' },
            { id: 'detailed', label: 'Chi tiết', desc: 'Phân tích sâu, luận điểm đầy đủ', icon: 'book' },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.id}
              onPress={() => setSummaryType(opt.id as SummaryType)}
              className={`flex-1 rounded-2xl p-4 border-2 ${
                summaryType === opt.id
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500'
                  : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
              }`}
            >
              <Ionicons
                name={opt.icon as any}
                size={24}
                color={summaryType === opt.id ? '#6366f1' : '#9ca3af'}
              />
              <Text className={`font-semibold mt-2 ${summaryType === opt.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>
                {opt.label}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {opt.desc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Processing progress */}
        {isUploading && progress && (
          <View className="bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl p-4 mb-6">
            <View className="flex-row items-center gap-3">
              <ActivityIndicator size="small" color="#6366f1" />
              <Text className="text-indigo-700 dark:text-indigo-300 font-medium">
                {progress}
              </Text>
            </View>
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-9">
              Vui lòng không thoát ứng dụng
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Upload button */}
      <View className="px-4 pb-6">
        <TouchableOpacity
          onPress={handleUpload}
          disabled={!selectedFile || isUploading}
          className={`rounded-2xl py-4 items-center ${
            selectedFile && !isUploading
              ? 'bg-indigo-600'
              : 'bg-gray-200 dark:bg-gray-800'
          }`}
        >
          {isUploading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className={`font-bold text-base ${selectedFile ? 'text-white' : 'text-gray-400'}`}>
              {selectedFile ? 'Tải lên & Phân tích' : 'Chọn file trước'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
