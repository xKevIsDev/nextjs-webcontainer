/**
 * Terminal Monitor - Captures and buffers terminal output for AI analysis
 */

class TerminalMonitor {
  private buffer: string[] = [];
  private readonly maxBufferSize = 500; // Keep last 500 lines
  private listeners: Set<(line: string) => void> = new Set();

  /**
   * Add a line to the buffer
   */
  write(data: string) {
    // Split by newlines and add to buffer
    const lines = data.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        this.buffer.push(line);

        // Notify listeners
        this.listeners.forEach(listener => listener(line));

        // Keep buffer size manageable
        if (this.buffer.length > this.maxBufferSize) {
          this.buffer.shift();
        }
      }
    }
  }

  /**
   * Get recent terminal output
   */
  getRecentOutput(lines: number = 50): string {
    return this.buffer.slice(-lines).join('\n');
  }

  /**
   * Get all terminal output
   */
  getAllOutput(): string {
    return this.buffer.join('\n');
  }

  /**
   * Check if terminal contains errors
   */
  hasErrors(): boolean {
    const recentOutput = this.getRecentOutput(100);
    const errorPatterns = [
      /error/i,
      /failed/i,
      /exception/i,
      /cannot find/i,
      /unexpected token/i,
      /syntax error/i,
      /\[ERROR\]/i,
      /✗/,
      /❌/,
      /⨯/,
    ];

    return errorPatterns.some(pattern => pattern.test(recentOutput));
  }

  /**
   * Get error lines from terminal
   */
  getErrors(): string[] {
    return this.buffer.filter(line => {
      const lowerLine = line.toLowerCase();
      return (
        lowerLine.includes('error') ||
        lowerLine.includes('failed') ||
        lowerLine.includes('exception') ||
        line.includes('✗') ||
        line.includes('❌') ||
        line.includes('⨯')
      );
    });
  }

  /**
   * Check if build is successful
   */
  isBuildSuccessful(): boolean {
    const recentOutput = this.getRecentOutput(50);

    // Check for success indicators
    const hasSuccess = /compiled successfully|ready in|✓ compiled/i.test(recentOutput);

    // Check for error indicators
    const hasErrors = this.hasErrors();

    return hasSuccess && !hasErrors;
  }

  /**
   * Clear the buffer
   */
  clear() {
    this.buffer = [];
  }

  /**
   * Listen to new terminal output
   */
  onData(callback: (line: string) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}

// Create singleton instance
export const terminalMonitor = new TerminalMonitor();
