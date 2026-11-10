/**
 * DocuGraph AI – Network Connectivity Contract & Implementation
 * Course Alignment: Week 9 (Repository Pattern SSOT) & Week 10 (Offline-First Resilience)
 */

export interface NetworkInfo {
  isConnected(): Promise<boolean>;
  setSimulatedOffline(offline: boolean): void;
  isSimulatedOffline(): boolean;
}

export class NetworkInfoImpl implements NetworkInfo {
  private simulatedOffline: boolean = false;

  public setSimulatedOffline(offline: boolean): void {
    this.simulatedOffline = offline;
  }

  public isSimulatedOffline(): boolean {
    return this.simulatedOffline;
  }

  public async isConnected(): Promise<boolean> {
    if (this.simulatedOffline) {
      return false;
    }

    if (typeof window !== "undefined" && typeof navigator !== "undefined" && "onLine" in navigator) {
      return navigator.onLine;
    }

    return true;
  }
}

