// Add polyfills for browser environment
if (typeof window !== 'undefined') {
  // Buffer polyfill
  global.Buffer = global.Buffer || require('buffer').Buffer;
} 