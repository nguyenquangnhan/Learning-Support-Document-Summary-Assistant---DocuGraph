/**
 * DocuGraph AI – Data Layer: DocumentRemoteDataSource
 * Course Alignment: Week 9 Slide 16-17 (RemoteDataSource with explicit ServerException)
 */
import { api } from "../../../../../lib/api";
import { supabase } from "../../../../../utils/supabase";
import { PendingOcrSyncPayload } from "../../domain/entities/document_entity";
import { DocumentModel } from "../models/document_model";

export class ServerException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServerException";
  }
}

export interface DocumentRemoteDataSource {
  fetchDocuments(): Promise<DocumentModel[]>;
  fetchDocumentById(id: string): Promise<DocumentModel>;
  uploadOcrDocument(payload: PendingOcrSyncPayload): Promise<DocumentModel>;
}

export class DocumentRemoteDataSourceImpl implements DocumentRemoteDataSource {
  public async fetchDocuments(): Promise<DocumentModel[]> {
    try {
      const response = await api.get("/documents");
      const list = Array.isArray(response.data) ? response.data : [];
      return list.map((json) => DocumentModel.fromJson(json));
    } catch (error: any) {
      // Fallback directly to Supabase BaaS `documents` table if FastAPI is unreachable
      try {
        const { data: sbDocs, error: sbError } = await supabase
          .from("documents")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(30);

        if (!sbError && Array.isArray(sbDocs)) {
          return sbDocs.map((row) => DocumentModel.fromJson(row));
        }
      } catch {
        // Ignore fallback error and throw primary ServerException
      }
      throw new ServerException(error?.response?.data?.detail || error?.message || "Remote API failed");
    }
  }

  public async fetchDocumentById(id: string): Promise<DocumentModel> {
    try {
      const response = await api.get(`/documents/${id}`);
      return DocumentModel.fromJson(response.data);
    } catch (error: any) {
      throw new ServerException(error?.response?.data?.detail || error?.message || "Document not found on server");
    }
  }

  public async uploadOcrDocument(payload: PendingOcrSyncPayload): Promise<DocumentModel> {
    try {
      const uploadRes = await api.post("/documents/ocr", {
        title: payload.title,
        extracted_text: payload.extractedText,
        confidence: payload.confidence,
        latency_ms: payload.latencyMs,
        device_engine: payload.deviceEngine,
        num_pages: Math.max(1, Math.ceil(payload.extractedText.length / 1200)),
        client_updated_at: payload.updatedAt,
      });

      const docId = uploadRes.data.document_id;
      const detailRes = await api.get(`/documents/${docId}`);

      // Sync to Supabase Cloud BaaS when authenticated
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        if (userId && detailRes.data) {
          await supabase.from("documents").upsert({
            id: detailRes.data.id,
            user_id: userId,
            title: detailRes.data.title,
            file_type: detailRes.data.file_type,
            file_size: detailRes.data.file_size,
            num_pages: detailRes.data.num_pages,
            status: detailRes.data.status,
            summary: detailRes.data.summary,
          });
        }
      } catch {
        // Non-blocking cloud BaaS sync
      }

      return DocumentModel.fromJson({
        ...detailRes.data,
        ocr_latency_ms: payload.latencyMs,
        ocr_confidence: payload.confidence,
      });
    } catch (error: any) {
      throw new ServerException(error?.response?.data?.detail || error?.message || "Failed to upload OCR document");
    }
  }
}

