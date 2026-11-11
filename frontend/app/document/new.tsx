import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { X, UploadCloud, CheckCircle2, Lock, Clock, FileText, ChevronRight, Trash2 } from 'lucide-react-native';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { sl } from '../../src/core/di/injection_container';
import { DocumentModel } from '../../src/features/documents/data/models/document_model';

type SummaryType = 'tldr' | 'detailed';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function NewDocumentScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [summaryType, setSummaryType] = useState<SummaryType>('detailed');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentStage, setCurrentStage] = useState<number>(0); // 0: chưa chạy, 1: OCR, 2: Embedding, 3: Graph, 4: Hoàn tất
  const [processStep, setProcessStep] = useState<string>('Chờ chọn tệp để bắt đầu bóc tách...');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const { data: uploadedHistory = [] } = useQuery({
    queryKey: ['documents', user?.id || 'guest'],
    queryFn: async () => {
      const resEither = await sl.getDocumentsUseCase.call();
      return resEither.fold(
        () => [],
        (list) => list
      );
    },
  });

  // Hàm chọn file từ bộ nhớ máy
  const handlePickDocument = async () => {
    if (isProcessing) return;
    setErrorMessage('');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
        setProgressPercent(0);
        setCurrentStage(0);
        setProcessStep(`Đã chọn: ${result.assets[0].name} (Sẵn sàng 0%)`);
      }
    } catch {
      setErrorMessage('Không thể chọn tệp tin này.');
    }
  };

  // Hàm tải tệp lên server, cập nhật tiến trình từng bước và chuyển tới màn hình tóm tắt
  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Vui lòng chạm vào khung bên trên để chọn một tệp tài liệu (PDF, DOCX hoặc TXT) trước khi bóc tách.');
      if (Platform.OS !== 'web') {
        Alert.alert('Thông báo', 'Vui lòng chọn một tệp tài liệu (PDF hoặc DOCX)');
      }
      return;
    }

    setErrorMessage('');
    setIsProcessing(true);

    try {
      // Bước 1: Bóc tách văn bản (35%)
      setCurrentStage(1);
      setProgressPercent(35);
      setProcessStep('Đang trích xuất văn bản bằng OCR (35%)...');
      await wait(600);

      // Bước 2: Tạo Vector Embedding & Tóm tắt AI (70%)
      setCurrentStage(2);
      setProgressPercent(70);
      setProcessStep('Đang tạo Gemini Vector Embedding & Tóm tắt (70%)...');

      const { sessionToken, user } = useAuthStore.getState();
      const headers: Record<string, string> = {};
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }
      if (user?.id) {
        headers['X-User-Id'] = user.id;
      }

      const uploadUrl = `${api.defaults.baseURL}/documents/upload`;
      let data: any;

      if (Platform.OS === 'web') {
        const formData = new FormData();
        if ((selectedFile as any).file) {
          formData.append('file', (selectedFile as any).file);
        } else {
          const resp = await fetch(selectedFile.uri);
          const blob = await resp.blob();
          formData.append('file', blob, selectedFile.name);
        }
        formData.append('title', selectedFile.name);
        formData.append('summary_type', summaryType);

        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers,
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.detail || `Lỗi máy chủ (${response.status})`);
        }
        data = await response.json();
      } else {
        // Native Mobile: Dùng FileSystem.uploadAsync để stream native và xử lý chuẩn content:// trên Android
        const mimeType =
          selectedFile.mimeType ||
          (selectedFile.name.endsWith('.docx')
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : selectedFile.name.endsWith('.txt')
            ? 'text/plain'
            : 'application/pdf');

        const uploadResult = await FileSystem.uploadAsync(uploadUrl, selectedFile.uri, {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'file',
          mimeType,
          parameters: {
            title: selectedFile.name,
            summary_type: summaryType,
          },
          headers,
        });

        if (uploadResult.status < 200 || uploadResult.status >= 300) {
          let detail = `Lỗi máy chủ (${uploadResult.status})`;
          try {
            const parsed = JSON.parse(uploadResult.body);
            if (parsed.detail) detail = parsed.detail;
          } catch {}
          throw new Error(detail);
        }

        data = JSON.parse(uploadResult.body);
      }
      const documentId = data.document_id;

      // Hoàn tất 100% (Bỏ qua trích xuất Đồ thị Tri thức theo yêu cầu)
      setCurrentStage(4);
      setProgressPercent(100);
      setProcessStep('Hoàn tất bóc tách & tóm tắt tài liệu (100%)!');

      // Cập nhật bộ nhớ đệm SSOT và làm mới danh sách tài liệu
      try {
        const detailRes = await api.get(`/documents/${documentId}`);
        if (detailRes.data) {
          await sl.documentLocalDataSource.upsertCachedDocument(
            DocumentModel.fromJson(detailRes.data)
          );
        }
      } catch {
        // Ignore cache warm error
      }
      await queryClient.invalidateQueries({ queryKey: ['documents'] });

      await wait(500);
      setIsProcessing(false);
      router.replace(`/document/${documentId}`);
    } catch (err: any) {
      setIsProcessing(false);
      setCurrentStage(0);
      const errorMsg = err?.message || 'Có lỗi xảy ra khi tải lên tài liệu';
      setErrorMessage(errorMsg);
      if (Platform.OS !== 'web') {
        Alert.alert('Lỗi xử lý', errorMsg);
      }
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

          {/* Thông báo lỗi nếu chưa chọn file */}
          {errorMessage ? (
            <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <Text className="text-xs font-semibold text-red-600">{errorMessage}</Text>
            </View>
          ) : null}

          {/* AI Progress Box (Lúc chưa tải file sẽ ở 0%, khi bấm Bắt đầu mới chạy từng bước 0% -> 100%) */}
          <View className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-xs font-bold text-indigo-700 flex-1 mr-2">
                {isProcessing
                  ? processStep
                  : selectedFile
                  ? `Đã chọn: ${selectedFile.name} (Sẵn sàng bóc tách)`
                  : 'Chưa có tài liệu nào đang xử lý (0%)'}
              </Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-[11px] font-bold text-indigo-600">
                  {`${progressPercent}%`}
                </Text>
                {isProcessing && <ActivityIndicator size="small" color="#4F46E5" />}
              </View>
            </View>

            {/* Thanh tiến trình bắt đầu từ 0% */}
            <View className="w-full h-1.5 bg-slate-200 rounded-full mb-4 overflow-hidden">
              <View
                style={{ width: `${progressPercent}%` }}
                className="h-full bg-indigo-600 rounded-full"
              />
            </View>

            <View className="space-y-2">
              {/* Bước 1 */}
              <View className="flex-row items-center mb-1">
                <Text
                  className={`text-xs flex-1 ${
                    currentStage > 1
                      ? 'font-semibold text-emerald-600'
                      : currentStage === 1
                      ? 'font-bold text-indigo-600'
                      : 'font-medium text-slate-400'
                  }`}
                >
                  1. PaddleOCR trích xuất chữ
                </Text>
                {currentStage === 1 ? (
                  <ActivityIndicator size="small" color="#4F46E5" />
                ) : currentStage > 1 ? (
                  <CheckCircle2 size={14} color="#059669" />
                ) : (
                  <Clock size={14} color="#CBD5E1" />
                )}
              </View>

              {/* Bước 2 */}
              <View className="flex-row items-center mb-1">
                <Text
                  className={`text-xs flex-1 ${
                    currentStage > 2
                      ? 'font-semibold text-emerald-600'
                      : currentStage === 2
                      ? 'font-bold text-indigo-600'
                      : 'font-medium text-slate-400'
                  }`}
                >
                  2. Gemini Vector Embedding
                </Text>
                {currentStage === 2 ? (
                  <ActivityIndicator size="small" color="#4F46E5" />
                ) : currentStage > 2 ? (
                  <CheckCircle2 size={14} color="#059669" />
                ) : (
                  <Clock size={14} color="#CBD5E1" />
                )}
              </View>

              {/* Bước 3 (Tạm dừng theo yêu cầu để test nhanh các chức năng chính) */}
              <View className="flex-row items-center">
                <Text className="text-xs flex-1 font-medium text-slate-400">
                  3. Trích xuất Đồ thị Tri thức (Đã tạm dừng để test nhanh)
                </Text>
                <Clock size={14} color="#CBD5E1" />
              </View>
            </View>
          </View>

          {/* Lock status info - chỉ hiện khi đang xử lý */}
          {isProcessing && (
            <View className="flex-row items-center mb-5 px-1">
              <Lock size={14} color="#64748B" className="mr-2" />
              <Text className="text-[11px] text-slate-500 leading-tight flex-1">
                Tạm khóa bắt đầu mới khi đang xử lý. Vui lòng chờ phân tích hoàn tất.
              </Text>
            </View>
          )}

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
          <TouchableOpacity onPress={() => router.back()} className="py-2.5 items-center mb-3">
            <Text className="text-xs text-slate-500 font-bold">Hủy bỏ</Text>
          </TouchableOpacity>

          {/* Lịch sử tài liệu đã tải lên gần đây */}
          {uploadedHistory.length > 0 && (
            <View className="mt-2 pt-4 border-t border-slate-100">
              <Text className="text-xs font-bold text-slate-700 mb-2.5">
                Lịch sử tài liệu đã tải lên ({uploadedHistory.length})
              </Text>
              {uploadedHistory.slice(0, 5).map((doc) => (
                <View
                  key={doc.id}
                  className="flex-row items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl p-3 mb-2"
                >
                  <TouchableOpacity
                    onPress={() => router.replace(`/document/${doc.id}`)}
                    className="flex-row items-center flex-1 mr-2"
                  >
                    <View className="p-2 bg-indigo-50 rounded-lg mr-2.5">
                      <FileText size={16} color="#4F46E5" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-slate-800" numberOfLines={1}>
                        {doc.title}
                      </Text>
                      <Text className="text-[10px] text-slate-400 mt-0.5">
                        {doc.numPages} trang • Đã xử lý hoàn tất
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={async () => {
                        try {
                          await api.delete(`/documents/${doc.id}`);
                        } catch {}
                        await sl.documentLocalDataSource.removeCachedDocument(doc.id);
                        await queryClient.invalidateQueries({ queryKey: ['documents'] });
                      }}
                      className="p-1.5 bg-red-50 rounded-lg border border-red-200"
                    >
                      <Trash2 size={14} color="#EF4444" />
                    </TouchableOpacity>
                    <ChevronRight size={16} color="#64748B" />
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}