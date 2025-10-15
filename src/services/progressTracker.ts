import {
  OperationProgress,
  ProgressCallback,
  OperationSummary,
} from "../types/index";

export class ProgressTracker {
  private operations = new Map<string, OperationProgress>();
  private callbacks = new Map<string, ProgressCallback[]>();
  private cancelTokens = new Map<string, boolean>();

  /**
   * Start tracking a new operation
   */
  startOperation(
    operationId: string,
    type: "create" | "update",
    total: number,
    canCancel: boolean = true
  ): OperationProgress {
    const progress: OperationProgress = {
      operationId,
      type,
      current: 0,
      total,
      status: "pending",
      startTime: Date.now(),
      canCancel,
    };

    this.operations.set(operationId, progress);
    this.cancelTokens.set(operationId, false);
    this.notifyCallbacks(operationId, progress);

    return progress;
  }

  /**
   * Update operation progress
   */
  updateProgress(
    operationId: string,
    current: number,
    currentItem?: string
  ): OperationProgress | null {
    const progress = this.operations.get(operationId);
    if (!progress) return null;

    const updatedProgress: OperationProgress = Object.assign({}, progress, {
      current,
      currentItem,
      status:
        current === 0
          ? "pending"
          : current >= progress.total
          ? "completed"
          : "in-progress",
      estimatedTimeRemaining: this.calculateEstimatedTime(progress, current),
    });

    // Mark as completed if we've processed all items
    if (
      current >= progress.total &&
      progress.status !== "failed" &&
      progress.status !== "cancelled"
    ) {
      updatedProgress.status = "completed";
      updatedProgress.endTime = Date.now();
    }

    this.operations.set(operationId, updatedProgress);
    this.notifyCallbacks(operationId, updatedProgress);

    return updatedProgress;
  }

  /**
   * Mark operation as failed
   */
  markFailed(operationId: string, error?: string): OperationProgress | null {
    const progress = this.operations.get(operationId);
    if (!progress) return null;

    const updatedProgress: OperationProgress = Object.assign({}, progress, {
      status: "failed" as const,
      endTime: Date.now(),
      currentItem: error || "Operation failed",
    });

    this.operations.set(operationId, updatedProgress);
    this.notifyCallbacks(operationId, updatedProgress);

    return updatedProgress;
  }

  /**
   * Cancel an operation
   */
  cancelOperation(operationId: string): boolean {
    const progress = this.operations.get(operationId);
    if (!progress || !progress.canCancel) return false;

    this.cancelTokens.set(operationId, true);

    const updatedProgress: OperationProgress = Object.assign({}, progress, {
      status: "cancelled" as const,
      endTime: Date.now(),
    });

    this.operations.set(operationId, updatedProgress);
    this.notifyCallbacks(operationId, updatedProgress);

    return true;
  }

  /**
   * Check if operation is cancelled
   */
  isCancelled(operationId: string): boolean {
    return this.cancelTokens.get(operationId) || false;
  }

  /**
   * Get current progress for an operation
   */
  getProgress(operationId: string): OperationProgress | null {
    return this.operations.get(operationId) || null;
  }

  /**
   * Get all active operations
   */
  getActiveOperations(): OperationProgress[] {
    return Array.from(this.operations.values()).filter(
      (op) => op.status === "pending" || op.status === "in-progress"
    );
  }

  /**
   * Subscribe to progress updates for an operation
   */
  subscribe(operationId: string, callback: ProgressCallback): () => void {
    if (!this.callbacks.has(operationId)) {
      this.callbacks.set(operationId, []);
    }

    this.callbacks.get(operationId)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.get(operationId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Clean up completed operations
   */
  cleanup(operationId: string): void {
    this.operations.delete(operationId);
    this.callbacks.delete(operationId);
    this.cancelTokens.delete(operationId);
  }

  /**
   * Generate operation summary
   */
  generateSummary(
    operationId: string,
    successful: number,
    failed: number,
    errors: Array<{
      frameIds?: string[];
      connectionId?: string;
      error: string;
    }>,
    createdConnections?: string[],
    updatedConnections?: string[]
  ): OperationSummary | null {
    const progress = this.operations.get(operationId);
    if (!progress) return null;

    const duration = (progress.endTime || Date.now()) - progress.startTime;

    return {
      operationId,
      type: progress.type,
      totalItems: progress.total,
      successful,
      failed,
      duration,
      errors,
      createdConnections,
      updatedConnections,
    };
  }

  /**
   * Calculate estimated time remaining
   */
  private calculateEstimatedTime(
    progress: OperationProgress,
    current: number
  ): number | undefined {
    if (current === 0 || progress.status !== "in-progress") return undefined;

    const elapsed = Date.now() - progress.startTime;
    const rate = current / elapsed; // items per millisecond
    const remaining = progress.total - current;

    return remaining / rate;
  }

  /**
   * Notify all callbacks for an operation
   */
  private notifyCallbacks(
    operationId: string,
    progress: OperationProgress
  ): void {
    const callbacks = this.callbacks.get(operationId);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(progress);
        } catch (error) {
          console.error("Error in progress callback:", error);
        }
      });
    }
  }

  /**
   * Generate a unique operation ID
   */
  static generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global progress tracker instance
export const progressTracker = new ProgressTracker();
