import { ConnectionConfig } from '../types/plugin';
import { STORAGE_CONFIG_KEY } from '../utils/constants';

export class StorageManager {
  async saveConfig(config: ConnectionConfig): Promise<void> {
    try {
      await figma.clientStorage.setAsync(STORAGE_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  }

  async loadConfig(): Promise<ConnectionConfig | null> {
    try {
      const savedConfig = await figma.clientStorage.getAsync(STORAGE_CONFIG_KEY);
      if (savedConfig) {
        return JSON.parse(savedConfig) as ConnectionConfig;
      }
      return null;
    } catch (error) {
      console.error('Failed to load config:', error);
      return null;
    }
  }

  async clearCache(): Promise<void> {
    try {
      await figma.clientStorage.deleteAsync(STORAGE_CONFIG_KEY);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }
}