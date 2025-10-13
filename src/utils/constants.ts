import { ConnectionConfig } from '../types/plugin';

export const DEFAULT_CONFIG: ConnectionConfig = {
  color: '#1976d2',
  strokeWidth: 2,
  strokeStyle: 'solid',
  sloppiness: 'low',
  arrowType: 'straight',
  arrowheads: 'end',
  startPosition: 'auto',
  endPosition: 'auto',
  connectionOffset: 20,
  avoidOverlap: true,
  opacity: 100,
  label: 'Label Text',
  labelPosition: 'center',
  labelOffset: 10,
  labelFontSize: 12,
  labelBg: '#ffffff',
  labelTextColor: '#333333',
  labelBorderColor: '#e0e0e0',
  labelBorderWidth: 1,
  labelBorderRadius: 4,
  labelPadding: 6
};

export const PLUGIN_VERSION = '1.0';
export const CONNECTION_PREFIX = '@Flow Connection:';
export const PLUGIN_DATA_KEY = 'flow-connector-config';
export const STORAGE_CONFIG_KEY = 'flow-connector-config';