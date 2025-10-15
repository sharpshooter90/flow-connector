import React, { useState, useCallback } from "react";
import { ConnectionConfig } from "../types";
import { validateBulkProperty, validateBulkProperties } from "../utils/bulkPropertyValidation";

interface BulkPropertyManagerProps {
  onBulkUpdate: (property: keyof ConnectionConfig, value: any) => Promise<void>;
  onBulkUpdateMultiple: (updates: Partial<ConnectionConfig>) => Promise<void>;
  children: (props: BulkPropertyManagerChildProps) => React.ReactNode;
}

interface BulkPropertyManagerChildProps {
  validationErrors: Record<string, string>;
  isValidating: boolean;
  validateProperty: (property: keyof ConnectionConfig, value: any) => boolean;
  validateMultipleProperties: (updates: Partial<ConnectionConfig>) => boolean;
  applyToAll: (property: keyof ConnectionConfig, value: any) => Promise<void>;
  applyMultipleToAll: (updates: Partial<ConnectionConfig>) => Promise<void>;
}

export const BulkPropertyManager: React.FC<BulkPropertyManagerProps> = ({
  onBulkUpdate,
  onBulkUpdateMultiple,
  children,
}) => {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const validateProperty = useCallback((property: keyof ConnectionConfig, value: any): boolean => {
    const validation = validateBulkProperty(property, value);
    
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      if (validation.isValid) {
        delete newErrors[property];
      } else if (validation.error) {
        newErrors[property] = validation.error;
      }
      return newErrors;
    });
    
    return validation.isValid;
  }, []);

  const validateMultipleProperties = useCallback((updates: Partial<ConnectionConfig>): boolean => {
    const validation = validateBulkProperties(updates);
    setValidationErrors(validation.errors);
    return validation.isValid;
  }, []);

  const applyToAll = useCallback(async (property: keyof ConnectionConfig, value: any): Promise<void> => {
    setIsValidating(true);
    try {
      const isValid = validateProperty(property, value);
      if (!isValid) {
        throw new Error(`Invalid value for ${property}`);
      }
      
      await onBulkUpdate(property, value);
      
      // Clear validation error on successful update
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[property];
        return newErrors;
      });
    } catch (error) {
      // Error handling is done by the validation
      throw error;
    } finally {
      setIsValidating(false);
    }
  }, [validateProperty, onBulkUpdate]);

  const applyMultipleToAll = useCallback(async (updates: Partial<ConnectionConfig>): Promise<void> => {
    setIsValidating(true);
    try {
      const isValid = validateMultipleProperties(updates);
      if (!isValid) {
        throw new Error('Invalid property values');
      }
      
      await onBulkUpdateMultiple(updates);
      
      // Clear validation errors on successful update
      setValidationErrors({});
    } catch (error) {
      // Error handling is done by the validation
      throw error;
    } finally {
      setIsValidating(false);
    }
  }, [validateMultipleProperties, onBulkUpdateMultiple]);

  const childProps: BulkPropertyManagerChildProps = {
    validationErrors,
    isValidating,
    validateProperty,
    validateMultipleProperties,
    applyToAll,
    applyMultipleToAll,
  };

  return <>{children(childProps)}</>;
};

export default BulkPropertyManager;