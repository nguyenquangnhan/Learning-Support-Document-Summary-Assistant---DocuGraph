import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import api from '../../lib/api';

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center px-6">
        <Ionicons name="camera-outline" size={64} color="white" />
        <Text className="text-white text-xl font-bold mt-4 text-center">
          Cần quyền truy cập Camera
        </Text>
        <Text className="text-gray-400 text-center mt-2 mb-6">
          DocuGraph cần quyền camera để chụp và OCR tài liệu của bạn
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-indigo-600 rounded-xl px-8 py-3"
        >
          <Text className="text-white font-semibold">Cho phép truy cập</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-gray-400">Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: false,
      });

      if (photo?.uri) {
        setCapturedUri(photo.uri);
        await uploadAndOCR(photo.uri);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
      setIsProcessing(false);
    }
  };

  const uploadAndOCR = async (uri: string) => {
    try {
      const filename = uri.split('/').pop() ?? 'scan.jpg';
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: filename,
        type: 'image/jpeg',
      } as unknown as Blob);
      formData.append('source_type', 'ocr_scan');

      const response = await api.post('/api/v1/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const documentId: string = response.data.id;
      router.replace(`/document/${documentId}`);
    } catch (error) {
      Alert.alert('Lỗi OCR', 'Không thể xử lý ảnh. Vui lòng thử lại.');
      setCapturedUri(null);
      setIsProcessing(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
      >
        {/* Header */}
        <SafeAreaView>
          <View className="flex-row items-center justify-between px-4 py-3">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white font-semibold text-base">
              Chụp tài liệu
            </Text>
            <TouchableOpacity
              onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}
              className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
            >
              <Ionicons name="camera-reverse-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Scan frame overlay */}
        <View className="flex-1 items-center justify-center">
          <View className="w-72 h-96 border-2 border-white/60 rounded-2xl">
            {/* Corner indicators */}
            <View className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
            <View className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
            <View className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
            <View className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />
          </View>
          <Text className="text-white/70 text-sm mt-4">
            Đặt tài liệu trong khung và chụp
          </Text>
        </View>

        {/* Bottom controls */}
        <View className="pb-10 items-center gap-4">
          {isProcessing ? (
            <View className="items-center gap-2">
              <ActivityIndicator size="large" color="#6366f1" />
              <Text className="text-white">Đang xử lý OCR...</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleCapture}
              className="w-20 h-20 rounded-full bg-white border-4 border-indigo-400 items-center justify-center"
            >
              <View className="w-14 h-14 rounded-full bg-indigo-600" />
            </TouchableOpacity>
          )}
          <Text className="text-white/60 text-xs">
            Hỗ trợ tiếng Việt · PaddleOCR v4
          </Text>
        </View>
      </CameraView>
    </View>
  );
}
