/**
 * Integration verification utilities for bulk functionality
 * Requirements: 1.1, 2.1, 3.1, 4.1, 5.1 - Integrate all bulk functionality components
 */

import { AppState, BulkOperationResult } from '../types';

export interface IntegrationTestResult {
  testName: string;
  passed: boolean;
  error?: string;
}

/**
 * Verify frame selection to layout analysis integration
 * Requirements: 1.1, 2.1 - Connect frame selection to layout analysis
 */
export function verifyFrameSelectionIntegration(appState: AppState): IntegrationTestResult {
  try {
    // Check if bulk mode is properly activated when multiple frames are selected
    if (appState.selectedFrames.length > 2 && !appState.isBulkMode) {
      return {
        testName: "Frame Selection to Bulk Mode",
        passed: false,
        error: "Bulk mode not activated with multiple frame selection"
      };
    }

    // Check if layout analysis is triggered with bulk selection
    if (appState.isBulkMode && appState.selectedFrames.length > 2 && !appState.frameLayout) {
      return {
        testName: "Frame Selection to Layout Analysis",
        passed: false,
        error: "Layout analysis not triggered with bulk selection"
      };
    }

    return {
      testName: "Frame Selection Integration",
      passed: true
    };
  } catch (error) {
    return {
      testName: "Frame Selection Integration",
      passed: false,
      error: (error as Error).message
    };
  }
}

/**
 * Verify bulk operations to UI controls integration
 * Requirements: 3.1, 4.1 - Wire bulk operations to UI controls
 */
export function verifyBulkOperationsIntegration(appState: AppState): IntegrationTestResult {
  try {
    // Check if bulk action controls are available in bulk mode
    if (appState.isBulkMode && appState.selectedFrames.length > 1) {
      // Verify connection strategy is available
      if (!appState.connectionStrategy) {
        return {
          testName: "Bulk Operations UI Integration",
          passed: false,
          error: "Connection strategy not available in bulk mode"
        };
      }

      // Verify bulk editable properties are set
      if (appState.bulkEditableProperties.size === 0) {
        return {
          testName: "Bulk Operations UI Integration",
          passed: false,
          error: "Bulk editable properties not configured"
        };
      }
    }

    return {
      testName: "Bulk Operations UI Integration",
      passed: true
    };
  } catch (error) {
    return {
      testName: "Bulk Operations UI Integration",
      passed: false,
      error: (error as Error).message
    };
  }
}

/**
 * Verify state management throughout bulk workflows
 * Requirements: 5.1 - Ensure proper state management throughout bulk workflows
 */
export function verifyStateManagementIntegration(appState: AppState): IntegrationTestResult {
  try {
    // Check state consistency in bulk mode
    if (appState.isBulkMode) {
      // Verify selected frames and bulk connections are consistent
      if (appState.selectedFrames.length > 0 && appState.bulkSelectedConnections.length > 0) {
        // State should be consistent - both bulk frames and connections selected
        if (!appState.frameLayout) {
          return {
            testName: "State Management Integration",
            passed: false,
            error: "Frame layout not analyzed with bulk selection"
          };
        }
      }

      // Verify mixed property states are managed
      if (appState.bulkSelectedConnections.length > 1 && appState.mixedPropertyStates.size === 0) {
        // This might be OK if all properties are uniform, but we should at least have the map initialized
        console.warn("Mixed property states not initialized for multiple connections");
      }
    }

    // Check that single-frame editing state is cleared in bulk mode
    if (appState.isBulkMode && appState.isEditingConnection) {
      return {
        testName: "State Management Integration",
        passed: false,
        error: "Single connection editing state not cleared in bulk mode"
      };
    }

    return {
      testName: "State Management Integration",
      passed: true
    };
  } catch (error) {
    return {
      testName: "State Management Integration",
      passed: false,
      error: (error as Error).message
    };
  }
}

/**
 * Verify bulk operation result handling
 * Requirements: 5.3, 5.4, 5.5 - Error handling and progress tracking
 */
export function verifyBulkOperationResultHandling(result: BulkOperationResult): IntegrationTestResult {
  try {
    // Check result structure
    if (typeof result.successful !== 'number' || typeof result.failed !== 'number') {
      return {
        testName: "Bulk Operation Result Handling",
        passed: false,
        error: "Invalid result structure - missing success/failure counts"
      };
    }

    // Check error reporting
    if (result.failed > 0 && (!result.errors || result.errors.length === 0)) {
      return {
        testName: "Bulk Operation Result Handling",
        passed: false,
        error: "Failed operations reported but no error details provided"
      };
    }

    // Check success reporting
    if (result.successful > 0) {
      // Should have created or updated connections
      const hasCreatedConnections = result.createdConnections && result.createdConnections.length > 0;
      const hasUpdatedConnections = result.updatedConnections && result.updatedConnections.length > 0;
      
      if (!hasCreatedConnections && !hasUpdatedConnections) {
        return {
          testName: "Bulk Operation Result Handling",
          passed: false,
          error: "Successful operations reported but no connection IDs provided"
        };
      }
    }

    return {
      testName: "Bulk Operation Result Handling",
      passed: true
    };
  } catch (error) {
    return {
      testName: "Bulk Operation Result Handling",
      passed: false,
      error: (error as Error).message
    };
  }
}

/**
 * Run all integration verification tests
 * Requirements: 1.1, 2.1, 3.1, 4.1, 5.1 - Comprehensive integration testing
 */
export function runIntegrationTests(appState: AppState, bulkResult?: BulkOperationResult): IntegrationTestResult[] {
  const results: IntegrationTestResult[] = [];

  // Test frame selection integration
  results.push(verifyFrameSelectionIntegration(appState));

  // Test bulk operations integration
  results.push(verifyBulkOperationsIntegration(appState));

  // Test state management integration
  results.push(verifyStateManagementIntegration(appState));

  // Test bulk operation result handling if provided
  if (bulkResult) {
    results.push(verifyBulkOperationResultHandling(bulkResult));
  }

  return results;
}

/**
 * Log integration test results
 */
export function logIntegrationResults(results: IntegrationTestResult[]): void {
  console.log("🔍 Bulk Functionality Integration Test Results:");
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.passed ? "✅" : "❌";
    console.log(`  ${status} ${result.testName}`);
    if (!result.passed && result.error) {
      console.log(`     Error: ${result.error}`);
    }
  });
  
  console.log(`\n📊 Integration Test Summary: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log("🎉 All integration tests passed! Bulk functionality is properly integrated.");
  } else {
    console.warn("⚠️  Some integration tests failed. Please review the errors above.");
  }
}