import { LayoutPattern, FrameLayoutAnalysis } from "../types/index";

export class FrameOrderAnalyzer {
  private readonly ALIGNMENT_TOLERANCE = 50; // pixels
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.6;

  /**
   * Analyze frame layout and determine connection order
   */
  analyzeFrameLayout(frames: FrameNode[]): FrameLayoutAnalysis {
    if (frames.length < 2) {
      return this.createScatteredAnalysis(frames);
    }

    // Try different layout patterns and pick the best one
    const horizontalAnalysis = this.analyzeHorizontalLayout(frames);
    const verticalAnalysis = this.analyzeVerticalLayout(frames);
    const gridAnalysis = this.analyzeGridLayout(frames);

    // Select the pattern with highest confidence
    const analyses = [horizontalAnalysis, verticalAnalysis, gridAnalysis];
    const bestAnalysis = analyses.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    // If confidence is too low, treat as scattered
    if (bestAnalysis.confidence < this.MIN_CONFIDENCE_THRESHOLD) {
      return this.createScatteredAnalysis(frames);
    }

    return bestAnalysis;
  }

  /**
   * Detect if frames are in a recognizable pattern
   */
  detectLayoutPattern(frames: FrameNode[]): LayoutPattern {
    const analysis = this.analyzeFrameLayout(frames);
    return analysis.pattern;
  }

  /**
   * Sort frames based on detected pattern
   */
  sortFramesByPattern(
    frames: FrameNode[],
    pattern: LayoutPattern
  ): FrameNode[] {
    switch (pattern.type) {
      case "horizontal":
        return this.sortFramesHorizontally(
          frames,
          pattern.direction === "right-to-left"
        );
      case "vertical":
        return this.sortFramesVertically(
          frames,
          pattern.direction === "bottom-to-top"
        );
      case "grid":
        return this.sortFramesInGrid(frames, pattern.gridDimensions);
      case "scattered":
      default:
        return frames.slice(); // Return original order for scattered
    }
  }

  /**
   * Check if frames are scattered (no clear pattern)
   */
  isScatteredLayout(frames: FrameNode[]): boolean {
    const analysis = this.analyzeFrameLayout(frames);
    return analysis.pattern.type === "scattered";
  }

  /**
   * Analyze horizontal layout pattern
   */
  private analyzeHorizontalLayout(frames: FrameNode[]): FrameLayoutAnalysis {
    const sortedFrames = this.sortFramesHorizontally(frames);
    const yPositions = sortedFrames.map((frame) => frame.y + frame.height / 2);

    // Calculate alignment confidence
    const avgY = yPositions.reduce((sum, y) => sum + y, 0) / yPositions.length;
    const maxDeviation = Math.max.apply(
      Math,
      yPositions.map((y) => Math.abs(y - avgY))
    );
    const confidence = Math.max(0, 1 - maxDeviation / this.ALIGNMENT_TOLERANCE);

    const direction = this.detectHorizontalDirection(sortedFrames);

    return {
      pattern: {
        type: "horizontal",
        direction: direction,
      },
      isOrdered: confidence > this.MIN_CONFIDENCE_THRESHOLD,
      sortedFrames: sortedFrames.map((frame) => ({
        id: frame.id,
        name: frame.name,
      })),
      confidence,
      suggestions: this.generateHorizontalSuggestions(confidence, maxDeviation),
    };
  }

  /**
   * Analyze vertical layout pattern
   */
  private analyzeVerticalLayout(frames: FrameNode[]): FrameLayoutAnalysis {
    const sortedFrames = this.sortFramesVertically(frames);
    const xPositions = sortedFrames.map((frame) => frame.x + frame.width / 2);

    // Calculate alignment confidence
    const avgX = xPositions.reduce((sum, x) => sum + x, 0) / xPositions.length;
    const maxDeviation = Math.max.apply(
      Math,
      xPositions.map((x) => Math.abs(x - avgX))
    );
    const confidence = Math.max(0, 1 - maxDeviation / this.ALIGNMENT_TOLERANCE);

    const direction = this.detectVerticalDirection(sortedFrames);

    return {
      pattern: {
        type: "vertical",
        direction: direction,
      },
      isOrdered: confidence > this.MIN_CONFIDENCE_THRESHOLD,
      sortedFrames: sortedFrames.map((frame) => ({
        id: frame.id,
        name: frame.name,
      })),
      confidence,
      suggestions: this.generateVerticalSuggestions(confidence, maxDeviation),
    };
  }

  /**
   * Analyze grid layout pattern
   */
  private analyzeGridLayout(frames: FrameNode[]): FrameLayoutAnalysis {
    if (frames.length < 4) {
      return this.createScatteredAnalysis(frames);
    }

    const gridDimensions = this.detectGridDimensions(frames);
    if (!gridDimensions) {
      return this.createScatteredAnalysis(frames);
    }

    const sortedFrames = this.sortFramesInGrid(frames, gridDimensions);
    const confidence = this.calculateGridConfidence(frames, gridDimensions);

    return {
      pattern: {
        type: "grid",
        gridDimensions: gridDimensions,
      },
      isOrdered: confidence > this.MIN_CONFIDENCE_THRESHOLD,
      sortedFrames: sortedFrames.map((frame) => ({
        id: frame.id,
        name: frame.name,
      })),
      confidence,
      suggestions: this.generateGridSuggestions(confidence, gridDimensions),
    };
  }

  /**
   * Create scattered layout analysis
   */
  private createScatteredAnalysis(frames: FrameNode[]): FrameLayoutAnalysis {
    return {
      pattern: { type: "scattered" },
      isOrdered: false,
      sortedFrames: frames.map((frame) => ({ id: frame.id, name: frame.name })),
      confidence: 0,
      suggestions: [
        "Arrange frames in a line (horizontal/vertical) for sequential connections",
        "Select a center frame for hub-and-spoke connections",
        "Use custom connection mode to manually specify pairs",
      ],
    };
  }

  /**
   * Sort frames horizontally (left to right by default)
   */
  private sortFramesHorizontally(
    frames: FrameNode[],
    reverse = false
  ): FrameNode[] {
    const sorted = frames
      .slice()
      .sort((a, b) => a.x + a.width / 2 - (b.x + b.width / 2));
    return reverse ? sorted.reverse() : sorted;
  }

  /**
   * Sort frames vertically (top to bottom by default)
   */
  private sortFramesVertically(
    frames: FrameNode[],
    reverse = false
  ): FrameNode[] {
    const sorted = frames
      .slice()
      .sort((a, b) => a.y + a.height / 2 - (b.y + b.height / 2));
    return reverse ? sorted.reverse() : sorted;
  }

  /**
   * Sort frames in grid pattern (left to right, top to bottom)
   */
  private sortFramesInGrid(
    frames: FrameNode[],
    gridDimensions?: { rows: number; cols: number }
  ): FrameNode[] {
    if (!gridDimensions) {
      return frames.slice();
    }

    // Sort by row first (Y), then by column (X)
    return frames.slice().sort((a, b) => {
      const rowDiff = a.y + a.height / 2 - (b.y + b.height / 2);
      if (Math.abs(rowDiff) > this.ALIGNMENT_TOLERANCE) {
        return rowDiff;
      }
      return a.x + a.width / 2 - (b.x + b.width / 2);
    });
  }

  /**
   * Detect horizontal reading direction
   */
  private detectHorizontalDirection(
    _sortedFrames: FrameNode[]
  ): "left-to-right" | "right-to-left" {
    // For now, default to left-to-right
    // Could be enhanced to detect based on frame content or user preference
    return "left-to-right";
  }

  /**
   * Detect vertical reading direction
   */
  private detectVerticalDirection(
    _sortedFrames: FrameNode[]
  ): "top-to-bottom" | "bottom-to-top" {
    // For now, default to top-to-bottom
    // Could be enhanced to detect based on frame content or user preference
    return "top-to-bottom";
  }

  /**
   * Detect grid dimensions from frame positions
   */
  private detectGridDimensions(
    frames: FrameNode[]
  ): { rows: number; cols: number } | null {
    // Group frames by approximate Y position (rows)
    const yGroups = this.groupByPosition(frames, "y");
    const rows = yGroups.length;

    if (rows < 2) return null;

    // Group frames by approximate X position (columns)
    const xGroups = this.groupByPosition(frames, "x");
    const cols = xGroups.length;

    if (cols < 2) return null;

    // Verify that rows * cols approximately equals frame count
    const expectedFrames = rows * cols;
    const actualFrames = frames.length;

    if (Math.abs(expectedFrames - actualFrames) / actualFrames > 0.3) {
      return null; // Too many missing frames for a proper grid
    }

    return { rows, cols };
  }

  /**
   * Group frames by position (X or Y coordinate)
   */
  private groupByPosition(frames: FrameNode[], axis: "x" | "y"): FrameNode[][] {
    const groups: FrameNode[][] = [];

    for (const frame of frames) {
      const position =
        axis === "x" ? frame.x + frame.width / 2 : frame.y + frame.height / 2;

      // Find existing group within tolerance
      let foundGroup = false;
      for (const group of groups) {
        const groupPosition =
          axis === "x"
            ? group[0].x + group[0].width / 2
            : group[0].y + group[0].height / 2;

        if (Math.abs(position - groupPosition) <= this.ALIGNMENT_TOLERANCE) {
          group.push(frame);
          foundGroup = true;
          break;
        }
      }

      if (!foundGroup) {
        groups.push([frame]);
      }
    }

    return groups;
  }

  /**
   * Calculate confidence score for grid layout
   */
  private calculateGridConfidence(
    frames: FrameNode[],
    gridDimensions: { rows: number; cols: number }
  ): number {
    const expectedFrames = gridDimensions.rows * gridDimensions.cols;
    const actualFrames = frames.length;

    // Base confidence on how close we are to expected grid size
    const sizeConfidence =
      1 - Math.abs(expectedFrames - actualFrames) / expectedFrames;

    // Check alignment within rows and columns
    const yGroups = this.groupByPosition(frames, "y");
    const xGroups = this.groupByPosition(frames, "x");

    // Calculate alignment confidence
    let alignmentScore = 0;
    let totalChecks = 0;

    // Check row alignment
    for (const group of yGroups) {
      if (group.length > 1) {
        const yPositions = group.map((frame) => frame.y + frame.height / 2);
        const avgY =
          yPositions.reduce((sum, y) => sum + y, 0) / yPositions.length;
        const maxDeviation = Math.max.apply(
          Math,
          yPositions.map((y) => Math.abs(y - avgY))
        );
        alignmentScore += Math.max(
          0,
          1 - maxDeviation / this.ALIGNMENT_TOLERANCE
        );
        totalChecks++;
      }
    }

    // Check column alignment
    for (const group of xGroups) {
      if (group.length > 1) {
        const xPositions = group.map((frame) => frame.x + frame.width / 2);
        const avgX =
          xPositions.reduce((sum, x) => sum + x, 0) / xPositions.length;
        const maxDeviation = Math.max.apply(
          Math,
          xPositions.map((x) => Math.abs(x - avgX))
        );
        alignmentScore += Math.max(
          0,
          1 - maxDeviation / this.ALIGNMENT_TOLERANCE
        );
        totalChecks++;
      }
    }

    const alignmentConfidence =
      totalChecks > 0 ? alignmentScore / totalChecks : 0;

    // Combine size and alignment confidence
    return (sizeConfidence + alignmentConfidence) / 2;
  }

  /**
   * Generate suggestions for horizontal layout
   */
  private generateHorizontalSuggestions(
    confidence: number,
    maxDeviation: number
  ): string[] {
    const suggestions: string[] = [];

    if (confidence < this.MIN_CONFIDENCE_THRESHOLD) {
      suggestions.push(
        "Align frames horizontally for better sequential connections"
      );

      if (maxDeviation > this.ALIGNMENT_TOLERANCE) {
        suggestions.push(
          `Frames are misaligned by ${Math.round(maxDeviation)}px vertically`
        );
      }
    }

    if (confidence > 0.8) {
      suggestions.push("Frames are well-aligned for sequential connections");
    }

    return suggestions;
  }

  /**
   * Generate suggestions for vertical layout
   */
  private generateVerticalSuggestions(
    confidence: number,
    maxDeviation: number
  ): string[] {
    const suggestions: string[] = [];

    if (confidence < this.MIN_CONFIDENCE_THRESHOLD) {
      suggestions.push(
        "Align frames vertically for better sequential connections"
      );

      if (maxDeviation > this.ALIGNMENT_TOLERANCE) {
        suggestions.push(
          `Frames are misaligned by ${Math.round(maxDeviation)}px horizontally`
        );
      }
    }

    if (confidence > 0.8) {
      suggestions.push("Frames are well-aligned for sequential connections");
    }

    return suggestions;
  }

  /**
   * Generate suggestions for grid layout
   */
  private generateGridSuggestions(
    confidence: number,
    gridDimensions: { rows: number; cols: number }
  ): string[] {
    const suggestions: string[] = [];

    if (confidence < this.MIN_CONFIDENCE_THRESHOLD) {
      suggestions.push("Improve grid alignment for better connection patterns");
      suggestions.push(
        `Detected ${gridDimensions.rows}×${gridDimensions.cols} grid pattern`
      );
    } else {
      suggestions.push(
        `Well-organized ${gridDimensions.rows}×${gridDimensions.cols} grid layout`
      );
      suggestions.push("Consider hub-and-spoke or sequential connections");
    }

    return suggestions;
  }
}
