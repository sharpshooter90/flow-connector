import { FeedbackMessage } from "../types/index";
import { connectionHighlighter } from "./connectionHighlighter";
import { BulkOperationResult } from "../types/index";

export class VisualFeedbackManager {
  private messages: FeedbackMessage[] = [];
  private messageCallbacks: ((messages: FeedbackMessage[]) => void)[] = [];

  /**
   * Subscribe to feedback message updates
   */
  subscribe(callback: (messages: FeedbackMessage[]) => void): () => void {
    this.messageCallbacks.push(callback);

    // Send current messages immediately
    callback(this.messages.slice());

    // Return unsubscribe function
    return () => {
      const index = this.messageCallbacks.indexOf(callback);
      if (index > -1) {
        this.messageCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Add a feedback message
   */
  addMessage(message: Omit<FeedbackMessage, "id">): string {
    const id = this.generateMessageId();
    const fullMessage: FeedbackMessage = Object.assign({ id }, message);

    this.messages.push(fullMessage);
    this.notifyCallbacks();

    // Highlight connections if specified
    if (message.connectionIds && message.connectionIds.length > 0) {
      connectionHighlighter.highlightConnections(message.connectionIds, {
        color: this.getHighlightColorForType(message.type),
        strokeWidth: 4,
        opacity: 0.8,
        duration: message.duration || 3000,
      });
    }

    return id;
  }

  /**
   * Remove a feedback message
   */
  removeMessage(messageId: string): void {
    const messageIndex = this.messages.findIndex((msg) => msg.id === messageId);
    if (messageIndex > -1) {
      const message = this.messages[messageIndex];

      // Clear highlights if this message had connection highlights
      if (message.connectionIds) {
        message.connectionIds.forEach((connectionId: string) => {
          connectionHighlighter.clearHighlight(connectionId);
        });
      }

      this.messages.splice(messageIndex, 1);
      this.notifyCallbacks();
    }
  }

  /**
   * Clear all messages
   */
  clearAllMessages(): void {
    // Clear all connection highlights
    connectionHighlighter.clearAllHighlights();

    this.messages = [];
    this.notifyCallbacks();
  }

  /**
   * Show bulk operation progress feedback
   */
  showOperationProgress(
    operationType: "create" | "update",
    current: number,
    total: number,
    currentItem?: string
  ): string {
    const operationLabel =
      operationType === "create"
        ? "Creating connections"
        : "Updating connections";
    const progressMessage = currentItem ? ` - ${currentItem}` : "";

    return this.addMessage({
      type: "progress",
      title: `${operationLabel} (${current}/${total})`,
      message: `Progress: ${Math.round(
        (current / total) * 100
      )}%${progressMessage}`,
      duration: 0, // Persistent until manually removed
    });
  }

  /**
   * Show bulk operation completion feedback
   */
  showOperationCompletion(result: BulkOperationResult): string {
    const operationType = result.operationId?.includes("create")
      ? "create"
      : "update";
    const operationLabel =
      operationType === "create" ? "Connection creation" : "Connection update";

    let messageType: FeedbackMessage["type"] = "success";
    let title = `${operationLabel} completed`;
    let message = `${result.successful} successful`;

    if (result.failed > 0) {
      if (result.successful === 0) {
        messageType = "warning";
        title = `${operationLabel} failed`;
        message = `${result.failed} failed`;
      } else {
        messageType = "warning";
        title = `${operationLabel} completed with errors`;
        message = `${result.successful} successful, ${result.failed} failed`;
      }
    }

    const connectionIds = (result.createdConnections || []).concat(
      result.updatedConnections || []
    );

    return this.addMessage({
      type: messageType,
      title,
      message,
      duration: 4000,
      connectionIds: connectionIds.length > 0 ? connectionIds : undefined,
    });
  }

  /**
   * Show layout analysis feedback
   */
  showLayoutAnalysis(
    patternType: string,
    confidence: number,
    frameCount: number
  ): string {
    let messageType: FeedbackMessage["type"] = "info";
    let title = "Layout analysis complete";
    let message = "";

    if (patternType === "scattered") {
      messageType = "warning";
      title = "Scattered layout detected";
      message = `${frameCount} frames appear scattered. Consider rearranging for better connections.`;
    } else if (confidence < 0.5) {
      messageType = "warning";
      title = "Unclear layout pattern";
      message = `Layout confidence is low (${Math.round(
        confidence * 100
      )}%). Consider improving frame alignment.`;
    } else {
      message = `Detected ${patternType} layout with ${Math.round(
        confidence * 100
      )}% confidence.`;
    }

    return this.addMessage({
      type: messageType,
      title,
      message,
      duration: 5000,
    });
  }

  /**
   * Show connection highlighting feedback
   */
  showConnectionHighlight(
    connectionIds: string[],
    reason: string,
    duration: number = 3000
  ): string {
    return this.addMessage({
      type: "info",
      title: "Connections highlighted",
      message: `${connectionIds.length} connection${
        connectionIds.length !== 1 ? "s" : ""
      } ${reason}`,
      duration,
      connectionIds,
    });
  }

  /**
   * Show frame selection feedback
   */
  showFrameSelection(frameCount: number, hasConnections: boolean): string {
    let message = `${frameCount} frame${frameCount !== 1 ? "s" : ""} selected`;

    if (hasConnections) {
      message += " with existing connections";
    }

    return this.addMessage({
      type: "info",
      title: "Bulk mode active",
      message,
      duration: 2000,
    });
  }

  /**
   * Show operation cancellation feedback
   */
  showOperationCancelled(operationType: "create" | "update"): string {
    const operationLabel =
      operationType === "create" ? "Connection creation" : "Connection update";

    return this.addMessage({
      type: "info",
      title: `${operationLabel} cancelled`,
      message: "Operation was cancelled by user",
      duration: 3000,
    });
  }

  /**
   * Show retry operation feedback
   */
  showRetryOperation(
    operationType: "create" | "update",
    retryCount: number
  ): string {
    const operationLabel =
      operationType === "create" ? "connection creation" : "connection update";

    return this.addMessage({
      type: "info",
      title: "Retrying failed operations",
      message: `Retrying ${retryCount} failed ${operationLabel} operation${
        retryCount !== 1 ? "s" : ""
      }`,
      duration: 2000,
    });
  }

  /**
   * Get highlight color for message type
   */
  private getHighlightColorForType(type: FeedbackMessage["type"]): string {
    switch (type) {
      case "success":
        return "#10B981"; // Green
      case "warning":
        return "#F59E0B"; // Amber
      case "info":
        return "#3B82F6"; // Blue
      case "progress":
        return "#8B5CF6"; // Purple
      default:
        return "#6B7280"; // Gray
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Notify all callbacks of message updates
   */
  private notifyCallbacks(): void {
    const messagesCopy = this.messages.slice();
    this.messageCallbacks.forEach((callback) => {
      try {
        callback(messagesCopy);
      } catch (error) {
        console.error("Error in feedback message callback:", error);
      }
    });
  }

  /**
   * Get current messages
   */
  getMessages(): FeedbackMessage[] {
    return this.messages.slice();
  }

  /**
   * Check if there are any active messages
   */
  hasActiveMessages(): boolean {
    return this.messages.length > 0;
  }
}

// Global visual feedback manager instance
export const visualFeedbackManager = new VisualFeedbackManager();
