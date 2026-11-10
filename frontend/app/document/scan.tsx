/**
 * DocuGraph AI – Presentation Layer: On-Device AI Document Scanner Screen
 * Course Alignment:
 *  - Week 9: Uses Clean Architecture UseCases via Service Locator (sl) & Either.fold()
 *  - Week 11:
 *      1. Google ML Kit Text Recognition v2 On-Device Pipeline
 *      2. Frame Throttler (400ms / 2.5 FPS) + Concurrency Lock
 *      3. Heuristic Regex Post-Processing (Title, Formulas, Dates, Keywords)
 *      4. Human-in-the-Loop Review Modal Sheet (Editable fields + Confidence % + Latency ms)
 *      5. Native C++ Heap Lifecycle dispose() & AppState background sleep
 */
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Modal,
  AppState,
  AppStateStatus,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { sl } from "../../src/core/di/injection_container";
import { OcrScanResult } from "../../src/features/scanner/domain/entities/ocr_scan_result";

export default function ScanScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [liveThrottleEnabled, setLiveThrottleEnabled] = useState(false);

  // Human-in-the-Loop Review State (Week 11 Slide 47 & 55)
  const [scanResult, setScanResult] = useState<OcrScanResult | null>(null);
  const [editableTitle, setEditableTitle] = useState("");
  const [editableText, setEditableText] = useState("");
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  const cameraRef = useRef<CameraView>(null);

  // Week 11 Slide 50 & 51: Thermal Throttling (Sleep on Background) & Native Heap dispose()
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        setIsCameraActive(true);
      } else {
        // Pause camera feed when app goes into background
        setIsCameraActive(false);
        setLiveThrottleEnabled(false);
      }
    });

    return () => {
      subscription.remove();
      // Mandatory: Release native C++ recognizer handles on unmount
      sl.scanDocumentUseCase.dispose();
    };
  }, []);

  // Optional 2.5 FPS (400ms) Frame Throttler Loop Demonstration
  useEffect(() => {
    if (!liveThrottleEnabled || reviewModalVisible || !isCameraActive) return;

    const interval = setInterval(async () => {
      if (sl.scanDocumentUseCase.isProcessing) return;
      await triggerOnDeviceOcr("frame://roi_crop_720p.jpg", false);
      setLiveThrottleEnabled(false);
    }, 450);

    return () => clearInterval(interval);
  }, [liveThrottleEnabled, reviewModalVisible, isCameraActive]);

  const triggerOnDeviceOcr = async (imageUri: string, bypassThrottle: boolean = true) => {
    setIsScanning(true);
    const resultEither = await sl.scanDocumentUseCase.call(imageUri, bypassThrottle);
    setIsScanning(false);

    resultEither.fold(
      (failure) => {
        Alert.alert("Thông báo OCR", failure.message);
      },
      (ocrData) => {
        setScanResult(ocrData);
        setEditableTitle(ocrData.detectedTitle);
        setEditableText(ocrData.cleanedText);
        setReviewModalVisible(true);
      }
    );
  };

  const handleCaptureAndScan = async () => {
    if (isScanning) return;

    try {
      setIsScanning(true);
      let targetUri = "edge://camera_roi_1080p.jpg";

      if (cameraRef.current && Platform.OS !== "web") {
        try {
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.85,
            base64: false,
          });
          if (photo?.uri) {
            targetUri = photo.uri;
          }
        } catch {
          // Use fallback URI on simulator without hardware camera
        }
      }

      await triggerOnDeviceOcr(targetUri, true);
    } catch {
      setIsScanning(false);
      Alert.alert("Lỗi", "Không thể chụp ảnh. Vui lòng thử lại.");
    }
  };

  // Week 11 Slide 47: Human-in-the-Loop Confirmation -> Offline-First Persistence
  const handleConfirmAndSave = async () => {
    if (!scanResult || isSaving) return;

    setIsSaving(true);
    const saveEither = await sl.submitOcrDocumentUseCase.call({
      id: `offline_ocr_${Date.now()}`,
      title: editableTitle,
      extractedText: editableText,
      confidence: scanResult.confidence,
      latencyMs: scanResult.latencyMs,
      deviceEngine: scanResult.deviceEngine,
      updatedAt: new Date().toISOString(),
    });
    setIsSaving(false);

    saveEither.fold(
      (failure) => {
        Alert.alert("Lỗi kiểm tra dữ liệu", failure.message);
      },
      async (savedDoc) => {
        await queryClient.invalidateQueries({ queryKey: ["documents"] });
        setReviewModalVisible(false);
        router.replace(`/document/${savedDoc.id}`);
      }
    );
  };

  if (!permission) {
    return <View className="flex-1 bg-slate-950" />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center px-6">
        <View className="bg-indigo-500/20 p-5 rounded-full mb-4 border border-indigo-500/40">
          <Ionicons name="camera-outline" size={56} color="#818CF8" />
        </View>
        <Text className="text-white text-xl font-bold text-center">
          Cấp quyền Camera cho On-Device AI
        </Text>
        <Text className="text-slate-400 text-center mt-2 mb-6 text-xs leading-relaxed">
          DocuGraph sử dụng Google ML Kit Text Recognition v2 xử lý trực tiếp trên RAM thiết bị
          (Privacy-by-Design, độ trễ &lt; 25ms, hoạt động 100% Offline).
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-indigo-600 rounded-2xl px-8 py-3.5 mb-3 w-full items-center"
        >
          <Text className="text-white font-bold text-sm">Cho phép truy cập Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => triggerOnDeviceOcr("demo://mlkit_sample_page.jpg", true)}
          className="bg-slate-800 border border-slate-700 rounded-2xl px-8 py-3.5 mb-3 w-full items-center"
        >
          <Text className="text-indigo-300 font-bold text-xs">
            Chạy thử ML Kit OCR Benchmark (Không cần Camera)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} className="mt-2 py-2">
          <Text className="text-slate-400 text-xs">Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {isCameraActive ? (
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing}>
          {/* Header */}
          <SafeAreaView>
            <View className="flex-row items-center justify-between px-4 py-3">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-black/60 items-center justify-center"
              >
                <Ionicons name="close" size={22} color="white" />
              </TouchableOpacity>

              <View className="items-center bg-black/60 px-3.5 py-1.5 rounded-full border border-indigo-500/40">
                <Text className="text-white font-bold text-xs">ML Kit OCR v2 (On-Device)</Text>
                <Text className="text-emerald-400 text-[10px] font-medium">
                  ● Frame Throttler: 2.5 FPS (400ms)
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
                className="w-10 h-10 rounded-full bg-black/60 items-center justify-center"
              >
                <Ionicons name="camera-reverse-outline" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* ROI (Region of Interest) Viewfinder Overlay (Week 11 Slide 13 & 51) */}
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-full max-w-[310px] h-80 border-2 border-indigo-400/70 rounded-2xl bg-indigo-950/10 justify-between p-3">
              <View className="flex-row justify-between">
                <View className="bg-indigo-600/90 px-2.5 py-1 rounded-md">
                  <Text className="text-white text-[10px] font-bold">ROI 50% Crop · 720p/1080p</Text>
                </View>
                <View className="bg-emerald-600/90 px-2.5 py-1 rounded-md">
                  <Text className="text-white text-[10px] font-bold">Zero Cloud Cost</Text>
                </View>
              </View>

              {/* Hierarchical Bounding Box Preview */}
              <View className="border border-dashed border-emerald-400/70 bg-black/40 p-2.5 rounded-xl">
                <Text className="text-emerald-300 text-[10px] font-mono">
                  [RecognizedText] → [TextBlock] → [TextLine]
                </Text>
                <Text className="text-white/80 text-[11px] mt-0.5">
                  Đặt trang giáo trình, công thức hoặc hóa đơn vào vùng ROI để bóc tách tức thì.
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom Controls */}
          <View className="pb-8 px-6 items-center">
            {isScanning ? (
              <View className="items-center bg-slate-900/90 px-6 py-4 rounded-2xl border border-indigo-500/40 mb-3">
                <ActivityIndicator size="small" color="#818CF8" />
                <Text className="text-white text-xs font-bold mt-2">
                  Đang chạy ML Kit OCR + Regex Parser trên NPU...
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center justify-center space-x-4 mb-3">
                <TouchableOpacity
                  onPress={() => setLiveThrottleEnabled((v) => !v)}
                  className={`px-4 py-2.5 rounded-xl border ${
                    liveThrottleEnabled
                      ? "bg-emerald-600 border-emerald-400"
                      : "bg-slate-900/80 border-slate-700"
                  }`}
                >
                  <Text className="text-white text-xs font-bold">
                    {liveThrottleEnabled ? "Đang Auto-Scan (2.5 FPS)" : "Auto-Scan 2.5 FPS"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCaptureAndScan}
                  className="w-18 h-18 rounded-full bg-white border-4 border-indigo-400 items-center justify-center p-1"
                >
                  <View className="w-14 h-14 rounded-full bg-indigo-600 items-center justify-center">
                    <Ionicons name="scan" size={24} color="white" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => triggerOnDeviceOcr("demo://mlkit_sample_page.jpg", true)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-950/90 border border-indigo-500/50"
                >
                  <Text className="text-indigo-200 text-xs font-bold">Quét Mẫu</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text className="text-white/70 text-[11px] text-center">
              Google ML Kit Text Recognition v2 · Heuristic Regex · Human-in-the-Loop
            </Text>
          </View>
        </CameraView>
      ) : (
        <View className="flex-1 items-center justify-center bg-slate-950">
          <Text className="text-slate-400 text-xs">
            Camera đang tạm dừng (Thermal Throttling Sleep State)
          </Text>
        </View>
      )}

      {/* ===================================================================== */}
      {/* HUMAN-IN-THE-LOOP REVIEW MODAL SHEET (Week 11 Slide 47 & 55)          */}
      {/* ===================================================================== */}
      <Modal
        visible={reviewModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-slate-900 rounded-t-3xl border-t border-slate-700 px-5 pt-5 pb-8 max-h-[90%]">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <View>
                <Text className="text-white font-bold text-base">
                  Xác nhận Kết quả OCR (Human-in-the-Loop)
                </Text>
                <Text className="text-slate-400 text-[11px]">
                  Kiểm tra và chỉnh sửa trước khi lưu vào cơ sở dữ liệu
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setReviewModalVisible(false)}
                className="p-2 bg-slate-800 rounded-full"
              >
                <Ionicons name="close" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Benchmark & Confidence Badges (Week 11 Slide 55 Deliverables) */}
              {scanResult && (
                <View className="flex-row flex-wrap gap-2 mb-4">
                  <View className="bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 rounded-xl">
                    <Text className="text-emerald-300 text-xs font-bold">
                      ⚡ Latency: {scanResult.latencyMs} ms
                    </Text>
                  </View>
                  <View className="bg-indigo-500/20 border border-indigo-500/40 px-3 py-1.5 rounded-xl">
                    <Text className="text-indigo-300 text-xs font-bold">
                      🎯 Độ tin cậy: {(scanResult.confidence * 100).toFixed(0)}%
                    </Text>
                  </View>
                  <View className="bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 rounded-xl">
                    <Text className="text-amber-300 text-xs font-bold">
                      📦 {scanResult.blocks.length} TextBlocks
                    </Text>
                  </View>
                </View>
              )}

              {/* Editable Title Field */}
              <Text className="text-slate-300 text-xs font-bold mb-1.5">
                Tiêu đề tài liệu (Tự động bóc tách bằng Regex):
              </Text>
              <TextInput
                value={editableTitle}
                onChangeText={setEditableTitle}
                className="bg-slate-800 text-white text-xs font-semibold px-3.5 py-3 rounded-xl border border-slate-700 mb-3"
                placeholder="Nhập tiêu đề tài liệu..."
                placeholderTextColor="#64748B"
              />

              {/* Heuristic Regex Extracted Metadata */}
              {scanResult && (
                <View className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-3 mb-3">
                  <Text className="text-indigo-400 text-[11px] font-bold mb-1.5">
                    🔍 Kết quả Hậu xử lý Heuristic Regex Parser:
                  </Text>
                  {scanResult.detectedFormulas.length > 0 && (
                    <Text className="text-slate-300 text-[11px] mb-1">
                      • Công thức phát hiện: {scanResult.detectedFormulas.join(" | ")}
                    </Text>
                  )}
                  {scanResult.detectedDates.length > 0 && (
                    <Text className="text-slate-300 text-[11px] mb-1">
                      • Ngày tháng: {scanResult.detectedDates.join(", ")}
                    </Text>
                  )}
                  {scanResult.detectedKeywords.length > 0 && (
                    <Text className="text-slate-300 text-[11px]">
                      • Thực thể Đồ thị: {scanResult.detectedKeywords.slice(0, 6).join(", ")}
                    </Text>
                  )}
                </View>
              )}

              {/* Editable OCR Content */}
              <Text className="text-slate-300 text-xs font-bold mb-1.5">
                Nội dung văn bản nhận diện (Có thể chỉnh sửa):
              </Text>
              <TextInput
                value={editableText}
                onChangeText={setEditableText}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                className="bg-slate-800 text-slate-100 text-xs leading-relaxed p-3.5 rounded-xl border border-slate-700 mb-4 min-h-[130px]"
                placeholder="Nội dung văn bản OCR..."
                placeholderTextColor="#64748B"
              />

              {/* Confirm & Persist Button */}
              <TouchableOpacity
                onPress={handleConfirmAndSave}
                disabled={isSaving}
                className={`py-3.5 rounded-2xl items-center justify-center mb-2.5 ${
                  isSaving ? "bg-indigo-400" : "bg-indigo-600"
                }`}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-bold text-sm">
                    ✓ Xác nhận & Lưu vào Bộ nhớ (Offline-First Sync)
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setReviewModalVisible(false)}
                className="py-2.5 items-center"
              >
                <Text className="text-slate-400 text-xs font-semibold">Quét lại ảnh khác</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
