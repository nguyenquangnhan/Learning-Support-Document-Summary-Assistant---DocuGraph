import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { X, UploadCloud, CheckCircle2, Lock } from 'lucide-react-native';
import { api } from '../../lib/api';

type SummaryType = 'tldr' | 'detailed';

export default function NewDocumentScreen() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [summaryType, setSummaryType] = useState<SummaryType>('detailed');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>('Đang tải lên...');

  // Hàm chọn file từ bộ nhớ máy
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chọn tệp tin này');
    }
  };

  // Hàm tải tệp lên server và chuyển tới màn hình tóm tắt
  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('Thông báo', 'Vui lòng chọn một tệp tài liệu (PDF hoặc DOCX)');
      return;
    }

    setIsProcessing(true);
    setProcessStep('Đang trích xuất nội dung văn bản...');
    try {
      const formData = new FormData();
      if (Platform.OS === 'web' && (selectedFile as any).file) {
        formData.append('file', (selectedFile as any).file);
      } else if (Platform.OS === 'web') {
        const resp = await fetch(selectedFile.uri);
        const blob = await resp.blob();
        formData.append('file', blob, selectedFile.name);
      } else {
        formData.append('file', {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.mimeType || 'application/pdf',
        } as any);
      }
      formData.append('title', selectedFile.name);
      formData.append('summary_type', summaryType);

      setProcessStep('Gemini đang phân tích luận điểm & tạo đồ thị tri thức...');
      const res = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setIsProcessing(false);
      const documentId = res.data.document_id;
      router.replace(`/document/${documentId}`);
    } catch (err: any) {
      setIsProcessing(false);
      const errorMsg = err?.response?.data?.detail || err?.message || 'Có lỗi xảy ra khi tải lên tài liệu';
      Alert.alert('Lỗi xử lý', errorMsg);
    }
  };

  return (
    <View className="flex-1 bg-slate-900/40 justify-end">
      <View className="bg-white rounded-t-3xl pt-4 pb-8 px-5 max-h-[92%] shadow-2xl">
        {/* Header Modal */}
        <View className="flex-row items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <Text className="text-lg font-bold text-slate-900">Thêm tài liệu học tập</Text>
          <TouchableOpacity onPress={() => router.back()} className="p-1.5 rounded-full bg-slate-100">
            <X size={18} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Tab Switcher */}
          <View className="flex-row border-b border-slate-200 mb-5">
            <TouchableOpacity className="flex-1 py-2.5 items-center border-b-2 border-indigo-600">
              <Text className="text-xs font-bold text-indigo-600">Tải file (PDF/DOCX)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.push('/document/scan')}
              className="flex-1 py-2.5 items-center border-b-2 border-transparent"
            >
              <Text className="text-xs font-bold text-slate-500">Chụp ảnh OCR Camera</Text>
            </TouchableOpacity>
          </View>

          {/* Upload Dropzone Area */}
          <TouchableOpacity 
            onPress={handlePickDocument}
            className="border-2 border-dashed border-indigo-200 bg-indigo-50/40 rounded-2xl py-7 items-center justify-center mb-5 px-4"
          >
            <View className="p-3 bg-indigo-100/60 rounded-full mb-2">
              <UploadCloud size={28} color="#4F46E5" />
            </View>
            <Text className="text-xs text-slate-700 font-bold text-center mb-1">
              {selectedFile ? selectedFile.name : 'Chạm để tải file từ máy'}
            </Text>
            <Text className="text-[11px] text-slate-400 font-medium text-center">
              (Tối đa 50MB, 500 trang - PDF, DOCX)
            </Text>
          </TouchableOpacity>

          {/* Option 1: TL;DR */}
          <TouchableOpacity
            onPress={() => setSummaryType('tldr')}
            className={`p-4 rounded-2xl border flex-row items-center mb-3 ${
              summaryType === 'tldr' ? 'bg-indigo-50/60 border-indigo-600' : 'bg-white border-slate-200'
            }`}
          >
            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
              summaryType === 'tldr' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
            }`}>
              {summaryType === 'tldr' && <View className="w-2 h-2 rounded-full bg-white" />}
            </View>
            <Text className="text-xs font-semibold text-slate-800 flex-1">
              Tóm tắt TL;DR (Tổng quan ngắn gọn)
            </Text>
          </TouchableOpacity>

          {/* Option 2: Key Takeaways */}
          <TouchableOpacity
            onPress={() => setSummaryType('detailed')}
            className={`p-4 rounded-2xl border flex-row items-center mb-5 ${
              summaryType === 'detailed' ? 'bg-indigo-50/60 border-indigo-600' : 'bg-white border-slate-200'
            }`}
          >
            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
              summaryType === 'detailed' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
            }`}>
              {summaryType === 'detailed' && <View className="w-2 h-2 rounded-full bg-white" />}
            </View>
            <Text className="text-xs font-bold text-slate-900 flex-1">
              Tóm tắt chi tiết & Luận điểm chính (Key Takeaways)
            </Text>
          </TouchableOpacity>

          {/* AI Progress Box */}
          {isProcessing && (
            <View className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 mb-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-xs font-bold text-indigo-700 flex-1 mr-2">{processStep}</Text>
                <ActivityIndicator size="small" color="#4F46E5" />
              </View>

              <View className="w-full h-1.5 bg-slate-200 rounded-full mb-4 overflow-hidden">
                <View className="w-[75%] h-full bg-indigo-600 rounded-full" />
              </View>

              <View className="space-y-2">
                <View className="flex-row items-center mb-1">
                  <Text className="text-xs font-semibold text-emerald-600 flex-1">1. PaddleOCR trích xuất chữ</Text>
                  <CheckCircle2 size={14} color="#059669" />
                </View>
                <View className="flex-row items-center mb-1">
                  <Text className="text-xs font-semibold text-emerald-600 flex-1">2. Gemini Vector Embedding</Text>
                  <CheckCircle2 size={14} color="#059669" />
                </View>
                <View className="flex-row items-center">
                  <Text className="text-xs font-bold text-indigo-600 flex-1">3. Trích xuất Đồ thị Tri thức (Đang chạy...)</Text>
                </View>
              </View>
            </View>
          )}

          {/* Lock status info */}
          <View className="flex-row items-center mb-5 px-1">
            <Lock size={14} color="#64748B" className="mr-2" />
            <Text className="text-[11px] text-slate-500 leading-tight flex-1">
              Tạm khóa bắt đầu mới khi đang xử lý. Vui lòng chờ phân tích hoàn tất.
            </Text>
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            onPress={handleUpload}
            disabled={isProcessing}
            className={`py-3.5 rounded-2xl flex-row items-center justify-center mb-3 shadow-md ${
              isProcessing ? 'bg-indigo-400' : 'bg-indigo-700 shadow-indigo-300'
            }`}
          >
            <Lock size={16} color="#FFF" className="mr-2" />
            <Text className="text-white font-bold text-xs">Bắt đầu bóc tách tài liệu</Text>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity onPress={() => router.back()} className="py-2.5 items-center">
            <Text className="text-xs text-slate-500 font-bold">Hủy bỏ</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}