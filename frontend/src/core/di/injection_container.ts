/**
 * DocuGraph AI – Centralized Dependency Injection Container (Service Locator)
 * Course Alignment: Week 9 Slide 28-29 (Service Locator Pattern with LazySingleton & Factory)
 * Decouples UI/Presentation layer from concrete Repository and DataSource instantiations.
 */
import { NetworkInfo, NetworkInfoImpl } from "../network/network_info";
import {
  MlKitOcrDataSource,
  MlKitOcrDataSourceImpl,
} from "../../features/scanner/data/datasources/mlkit_ocr_datasource";
import { ScannerRepository } from "../../features/scanner/domain/repositories/scanner_repository";
import { ScannerRepositoryImpl } from "../../features/scanner/data/repositories/scanner_repository_impl";
import { ScanDocumentUseCase } from "../../features/scanner/domain/usecases/scan_document_usecase";
import {
  DocumentRemoteDataSource,
  DocumentRemoteDataSourceImpl,
} from "../../features/documents/data/datasources/document_remote_datasource";
import {
  DocumentLocalDataSource,
  DocumentLocalDataSourceImpl,
} from "../../features/documents/data/datasources/document_local_datasource";
import { DocumentRepository } from "../../features/documents/domain/repositories/document_repository";
import { DocumentRepositoryImpl } from "../../features/documents/data/repositories/document_repository_impl";
import { GetDocumentsUseCase } from "../../features/documents/domain/usecases/get_documents_usecase";
import { GetDocumentDetailUseCase } from "../../features/documents/domain/usecases/get_document_detail_usecase";
import { SubmitOcrDocumentUseCase } from "../../features/documents/domain/usecases/submit_ocr_document_usecase";
import { SyncOfflineDocumentsUseCase } from "../../features/documents/domain/usecases/sync_offline_documents_usecase";
import {
  AskQuestionUseCase,
  ChatRepository,
  ChatRepositoryImpl,
} from "../../features/chat/chat_slice";
import {
  GetDocumentQuizUseCase,
  QuizRepository,
  QuizRepositoryImpl,
} from "../../features/quiz/quiz_slice";

class ServiceLocator {
  private static _instance: ServiceLocator;

  // Core Infrastructure
  public readonly networkInfo: NetworkInfo;

  // Data Sources
  public readonly mlKitOcrDataSource: MlKitOcrDataSource;
  public readonly documentRemoteDataSource: DocumentRemoteDataSource;
  public readonly documentLocalDataSource: DocumentLocalDataSource;

  // Repositories
  public readonly scannerRepository: ScannerRepository;
  public readonly documentRepository: DocumentRepository;
  public readonly chatRepository: ChatRepository;
  public readonly quizRepository: QuizRepository;

  // Domain Use Cases
  public readonly scanDocumentUseCase: ScanDocumentUseCase;
  public readonly getDocumentsUseCase: GetDocumentsUseCase;
  public readonly getDocumentDetailUseCase: GetDocumentDetailUseCase;
  public readonly submitOcrDocumentUseCase: SubmitOcrDocumentUseCase;
  public readonly syncOfflineDocumentsUseCase: SyncOfflineDocumentsUseCase;
  public readonly askQuestionUseCase: AskQuestionUseCase;
  public readonly getDocumentQuizUseCase: GetDocumentQuizUseCase;

  private constructor() {
    // 1. External Drivers & Network Info
    this.networkInfo = new NetworkInfoImpl();

    // 2. Data Sources (LazySingletons)
    this.mlKitOcrDataSource = new MlKitOcrDataSourceImpl();
    this.documentRemoteDataSource = new DocumentRemoteDataSourceImpl();
    this.documentLocalDataSource = new DocumentLocalDataSourceImpl();

    // 3. Repositories (LazySingletons conforming to Domain Contracts)
    this.scannerRepository = new ScannerRepositoryImpl(this.mlKitOcrDataSource);
    this.documentRepository = new DocumentRepositoryImpl({
      remoteDataSource: this.documentRemoteDataSource,
      localDataSource: this.documentLocalDataSource,
      networkInfo: this.networkInfo,
    });
    this.chatRepository = new ChatRepositoryImpl(this.networkInfo);
    this.quizRepository = new QuizRepositoryImpl(this.networkInfo);

    // 4. Domain Use Cases
    this.scanDocumentUseCase = new ScanDocumentUseCase(this.scannerRepository);
    this.getDocumentsUseCase = new GetDocumentsUseCase(this.documentRepository);
    this.getDocumentDetailUseCase = new GetDocumentDetailUseCase(this.documentRepository);
    this.submitOcrDocumentUseCase = new SubmitOcrDocumentUseCase(this.documentRepository);
    this.syncOfflineDocumentsUseCase = new SyncOfflineDocumentsUseCase(this.documentRepository);
    this.askQuestionUseCase = new AskQuestionUseCase(this.chatRepository);
    this.getDocumentQuizUseCase = new GetDocumentQuizUseCase(this.quizRepository);
  }

  public static get instance(): ServiceLocator {
    if (!ServiceLocator._instance) {
      ServiceLocator._instance = new ServiceLocator();
    }
    return ServiceLocator._instance;
  }
}

export const sl = ServiceLocator.instance;

