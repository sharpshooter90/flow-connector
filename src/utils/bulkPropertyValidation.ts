import { ConnectionConfig } from "../types";

/**
 * Validates a property value for bulk updates
 */
export function validateBulkProperty(
  property: keyof ConnectionConfig,
  value: any
): { isValid: boolean; error?: string } {
  switch (property) {
    case 'strokeWidth':
      if (typeof value !== 'number' || value < 1 || value > 10) {
        return { isValid: false, error: 'Stroke width must be between 1 and 10' };
      }
      break;
    
    case 'opacity':
      if (typeof value !== 'number' || value < 0 || value > 100) {
        return { isValid: false, error: 'Opacity must be between 0 and 100' };
      }
      break;
    
    case 'connectionOffset':
      if (typeof value !== 'number' || value < 0 || value > 50) {
        return { isValid: false, error: 'Connection offset must be between 0 and 50' };
      }
      break;
    
    case 'labelOffset':
      if (typeof value !== 'number' || value < 0 || value > 30) {
        return { isValid: false, error: 'Label offset must be between 0 and 30' };
      }
      break;
    
    case 'labelFontSize':
      if (typeof value !== 'number' || value < 8 || value > 24) {
        return { isValid: false, error: 'Font size must be between 8 and 24' };
      }
      break;
    
    case 'labelBorderWidth':
      if (typeof value !== 'number' || value < 0 || value > 3) {
        return { isValid: false, error: 'Border width must be between 0 and 3' };
      }
      break;
    
    case 'labelBorderRadius':
      if (typeof value !== 'number' || value < 0 || value > 12) {
        return { isValid: false, error: 'Border radius must be between 0 and 12' };
      }
      break;
    
    case 'labelPadding':
      if (typeof value !== 'number' || value < 2 || value > 12) {
        return { isValid: false, error: 'Padding must be between 2 and 12' };
      }
      break;
    
    case 'color':
    case 'labelBg':
    case 'labelTextColor':
    case 'labelBorderColor':
      if (typeof value !== 'string' || !isValidColor(value)) {
        return { isValid: false, error: 'Invalid color format' };
      }
      break;
    
    case 'label':
      if (typeof value !== 'string') {
        return { isValid: false, error: 'Label must be a string' };
      }
      break;
    
    case 'strokeStyle':
      if (!['solid', 'dashed', 'dotted'].includes(value)) {
        return { isValid: false, error: 'Invalid stroke style' };
      }
      break;
    
    case 'strokeAlign':
      if (!['center', 'inside', 'outside'].includes(value)) {
        return { isValid: false, error: 'Invalid stroke alignment' };
      }
      break;
    
    case 'strokeCap':
      if (!['none', 'round', 'square'].includes(value)) {
        return { isValid: false, error: 'Invalid stroke cap' };
      }
      break;
    
    case 'strokeJoin':
      if (!['miter', 'round', 'bevel'].includes(value)) {
        return { isValid: false, error: 'Invalid stroke join' };
      }
      break;
    
    case 'sloppiness':
      if (!['none', 'low', 'high'].includes(value)) {
        return { isValid: false, error: 'Invalid sloppiness value' };
      }
      break;
    
    case 'arrowType':
      if (!['straight', 'curved', 'elbow'].includes(value)) {
        return { isValid: false, error: 'Invalid arrow type' };
      }
      break;
    
    case 'arrowheads':
      if (!['none', 'end', 'both'].includes(value)) {
        return { isValid: false, error: 'Invalid arrowheads value' };
      }
      break;
    
    case 'startPosition':
    case 'endPosition':
      if (!['auto', 'top', 'right', 'bottom', 'left'].includes(value)) {
        return { isValid: false, error: 'Invalid position value' };
      }
      break;
    
    case 'labelPosition':
      if (!['center', 'top', 'bottom'].includes(value)) {
        return { isValid: false, error: 'Invalid label position' };
      }
      break;
    
    case 'avoidOverlap':
      if (typeof value !== 'boolean') {
        return { isValid: false, error: 'Avoid overlap must be a boolean' };
      }
      break;
    
    default:
      return { isValid: false, error: 'Unknown property' };
  }
  
  return { isValid: true };
}

/**
 * Validates multiple properties for bulk update
 */
export function validateBulkProperties(
  properties: Partial<ConnectionConfig>
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  for (const [property, value] of Object.entries(properties)) {
    const validation = validateBulkProperty(property as keyof ConnectionConfig, value);
    if (!validation.isValid && validation.error) {
      errors[property] = validation.error;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Simple color validation (hex colors)
 */
function isValidColor(color: string): boolean {
  // Check for hex color format
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
}

/**
 * Calculate mixed property states from multiple connection configs
 */
export function calculateMixedPropertyStates(
  configs: ConnectionConfig[]
): Map<keyof ConnectionConfig, boolean> {
  const mixedStates = new Map<keyof ConnectionConfig, boolean>();
  
  if (configs.length <= 1) {
    return mixedStates;
  }
  
  const firstConfig = configs[0];
  const properties = Object.keys(firstConfig) as (keyof ConnectionConfig)[];
  
  for (const property of properties) {
    const firstValue = firstConfig[property];
    const hasMixedValues = configs.some(config => {
      const currentValue = config[property];
      // Deep comparison for objects, simple comparison for primitives
      if (typeof firstValue === 'object' && typeof currentValue === 'object') {
        return JSON.stringify(firstValue) !== JSON.stringify(currentValue);
      }
      return firstValue !== currentValue;
    });
    
    mixedStates.set(property, hasMixedValues);
  }
  
  return mixedStates;
}

/**
 * Get the most common value for a property across multiple configs
 */
export function getMostCommonValue<T>(
  configs: ConnectionConfig[],
  property: keyof ConnectionConfig
): T {
  const values = configs.map(config => config[property]);
  const valueCounts = new Map();
  
  for (const value of values) {
    const key = typeof value === 'object' ? JSON.stringify(value) : value;
    valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
  }
  
  let mostCommonKey = '';
  let maxCount = 0;
  
  for (const [key, count] of valueCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonKey = key;
    }
  }
  
  // Try to parse back if it was stringified
  try {
    return JSON.parse(mostCommonKey);
  } catch {
    return mostCommonKey as T;
  }
}