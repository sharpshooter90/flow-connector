import { ConnectionConfig, ConnectionPoints } from '../types/plugin';
import { ConnectionManager } from './connectionManager';
import { ConnectionCreator } from './connectionCreator';
import { PathCalculator } from './pathCalculator';

export class ConnectionUpdater {
  private connectionManager = new ConnectionManager();
  private connectionCreator = new ConnectionCreator();
  private pathCalculator = new PathCalculator();

  async updateConnection(connectionId: string, newConfig: ConnectionConfig): Promise<GroupNode> {
    const connection = figma.currentPage.findOne(node => node.id === connectionId) as GroupNode;
    if (!connection || !this.connectionManager.isFlowConnection(connection)) {
      throw new Error('Connection not found or invalid');
    }

    const metadata = this.connectionManager.getConnectionMetadata(connection);
    if (!metadata) {
      throw new Error('Connection metadata not found');
    }

    const frame1 = figma.currentPage.findOne(node => node.id === metadata.frame1Id) as FrameNode;
    const frame2 = figma.currentPage.findOne(node => node.id === metadata.frame2Id) as FrameNode;

    if (!frame1 || !frame2) {
      throw new Error('Original frames not found');
    }

    this.connectionManager.removeTrackedConnection(connectionId);
    connection.remove();

    const newConnection = await this.connectionCreator.createConnection(frame1, frame2, newConfig);
    return newConnection;
  }

  async checkAndUpdateConnections(autoUpdateEnabled: boolean) {
    if (!autoUpdateEnabled) return;

    const trackedConnections = this.connectionManager.getTrackedConnections();
    const connectionsToUpdate: Array<{ connection: GroupNode, metadata: any }> = [];

    for (const [connectionId, metadata] of trackedConnections) {
      const connection = figma.currentPage.findOne(node => node.id === connectionId) as GroupNode;
      if (!connection) {
        this.connectionManager.removeTrackedConnection(connectionId);
        continue;
      }

      const frame1 = figma.currentPage.findOne(node => node.id === metadata.frame1Id) as FrameNode;
      const frame2 = figma.currentPage.findOne(node => node.id === metadata.frame2Id) as FrameNode;

      if (!frame1 || !frame2) {
        this.connectionManager.removeTrackedConnection(connectionId);
        continue;
      }

      const currentConnectionPoints = this.pathCalculator.calculateConnectionPoints(frame1, frame2, metadata.config);
      const shouldUpdate = this.connectionNeedsUpdate(connection, currentConnectionPoints, metadata.config);

      if (shouldUpdate) {
        connectionsToUpdate.push({ connection, metadata });
      }
    }

    for (const { connection, metadata } of connectionsToUpdate) {
      try {
        const frame1 = figma.currentPage.findOne(node => node.id === metadata.frame1Id) as FrameNode;
        const frame2 = figma.currentPage.findOne(node => node.id === metadata.frame2Id) as FrameNode;

        if (frame1 && frame2) {
          const currentSelection = figma.currentPage.selection;
          const currentViewport = {
            center: figma.viewport.center,
            zoom: figma.viewport.zoom
          };

          connection.remove();
          const newConnection = await this.connectionCreator.createConnection(frame1, frame2, metadata.config);

          this.connectionManager.removeTrackedConnection(connection.id);
          this.connectionManager.addTrackedConnection(newConnection.id, metadata);

          const wasSelected = currentSelection.some(node => node.id === connection.id);
          if (wasSelected) {
            figma.currentPage.selection = [newConnection];
          } else {
            figma.currentPage.selection = currentSelection;
          }

          setTimeout(() => {
            figma.viewport.center = currentViewport.center;
            figma.viewport.zoom = currentViewport.zoom;
          }, 50);
        }
      } catch (error) {
        console.error('Failed to update connection:', error);
      }
    }
  }

  private connectionNeedsUpdate(connection: GroupNode, newConnectionPoints: ConnectionPoints, config: ConnectionConfig): boolean {
    const line = connection.children.find(child => child.name.startsWith('Connection:')) as VectorNode;
    if (!line || !line.vectorPaths || line.vectorPaths.length === 0) {
      return true;
    }

    const pathData = line.vectorPaths[0].data;
    const pathMatch = pathData.match(/M\s*([\d.-]+)\s*([\d.-]+).*?(?:L|C).*?([\d.-]+)\s*([\d.-]+)(?:\s|$)/);

    if (!pathMatch) {
      return true;
    }

    const currentStart = { x: parseFloat(pathMatch[1]), y: parseFloat(pathMatch[2]) };
    const newStart = newConnectionPoints.startPoint;

    const threshold = 1;
    const startMoved = Math.abs(currentStart.x - newStart.x) > threshold ||
      Math.abs(currentStart.y - newStart.y) > threshold;

    return startMoved;
  }
}