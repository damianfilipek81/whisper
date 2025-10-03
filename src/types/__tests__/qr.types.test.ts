/**
 * Unit tests for QR data validation functions
 * These tests demonstrate how the regex and validation logic works
 */

import {
  isValidHexKey,
  isWhisperQRData,
  getConnectionKey,
  createWhisperQRData,
  KEY_VALIDATION,
  type WhisperQRData,
} from '../qr.types';

describe('QR Types Validation', () => {
  describe('isValidHexKey', () => {
    it('should validate correct 64-character hex keys', () => {
      // Valid public key examples (64 hex characters = 32 bytes)
      const validKeys = [
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
        'ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890',
        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      ];

      validKeys.forEach(key => {
        expect(isValidHexKey(key)).toBe(true);
      });
    });

    it('should reject invalid hex keys', () => {
      const invalidKeys = [
        // Too short
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345',
        // Too long  
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567',
        // Contains invalid characters
        'g1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345z',
        // Empty or special cases
        '',
        ' '.repeat(64),
        '0'.repeat(63) + ' ', // space at end
      ];

      invalidKeys.forEach(key => {
        expect(isValidHexKey(key)).toBe(false);
      });
    });

    it('should validate the regex pattern constants', () => {
      // Test that our constants are correct
      expect(KEY_VALIDATION.HEX_KEY_LENGTH).toBe(64);
      expect(KEY_VALIDATION.HEX_KEY_PATTERN.source).toBe('^[a-fA-F0-9]{64}$');
      
      // Test regex directly
      const testKey = 'a'.repeat(64);
      expect(KEY_VALIDATION.HEX_KEY_PATTERN.test(testKey)).toBe(true);
    });
  });

  describe('isWhisperQRData', () => {
    const validQRData: WhisperQRData = {
      type: 'whisper_p2p',
      publicKey: 'a'.repeat(64),
      peerId: 'b'.repeat(64),
      discoveryKey: 'c'.repeat(64),
      version: '1.0',
    };

    it('should validate correct WhisperQRData', () => {
      expect(isWhisperQRData(validQRData)).toBe(true);
    });

    it('should validate minimal WhisperQRData (only required fields)', () => {
      const minimalData = {
        type: 'whisper_p2p',
        publicKey: 'a'.repeat(64),
        version: '1.0',
      };
      expect(isWhisperQRData(minimalData)).toBe(true);
    });

    it('should reject invalid WhisperQRData', () => {
      const invalidCases = [
        // Wrong type
        { ...validQRData, type: 'invalid_type' },
        // Invalid public key
        { ...validQRData, publicKey: 'invalid_key' },
        // Unsupported version
        { ...validQRData, version: '2.0' },
        // Missing required fields
        { type: 'whisper_p2p', version: '1.0' },
        // Not an object
        null,
        'string',
        123,
        [],
      ];

      invalidCases.forEach(data => {
        expect(isWhisperQRData(data)).toBe(false);
      });
    });
  });

  describe('getConnectionKey', () => {
    it('should prioritize discoveryKey over other keys', () => {
      const qrData: WhisperQRData = {
        type: 'whisper_p2p',
        publicKey: 'public_key',
        peerId: 'peer_id',
        discoveryKey: 'discovery_key',
        version: '1.0',
      };

      expect(getConnectionKey(qrData)).toBe('discovery_key');
    });

    it('should fall back to peerId if no discoveryKey', () => {
      const qrData: WhisperQRData = {
        type: 'whisper_p2p',
        publicKey: 'public_key',
        peerId: 'peer_id',
        version: '1.0',
      };

      expect(getConnectionKey(qrData)).toBe('peer_id');
    });

    it('should use publicKey as last resort', () => {
      const qrData: WhisperQRData = {
        type: 'whisper_p2p',
        publicKey: 'public_key',
        version: '1.0',
      };

      expect(getConnectionKey(qrData)).toBe('public_key');
    });
  });

  describe('createWhisperQRData', () => {
    it('should create valid QR data with all fields', () => {
      const result = createWhisperQRData({
        publicKey: 'a'.repeat(64),
        peerId: 'b'.repeat(64),
        discoveryKey: 'c'.repeat(64),
        version: '1.1',
      });

      expect(result).toEqual({
        type: 'whisper_p2p',
        publicKey: 'a'.repeat(64),
        peerId: 'b'.repeat(64),
        discoveryKey: 'c'.repeat(64),
        version: '1.1',
      });
    });

    it('should use default version when not provided', () => {
      const result = createWhisperQRData({
        publicKey: 'a'.repeat(64),
      });

      expect(result.version).toBe('1.0');
      expect(result.type).toBe('whisper_p2p');
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle QR code scanning simulation', () => {
      // Simulate scanning a proper Whisper QR code
      const qrCodeData = JSON.stringify({
        type: 'whisper_p2p',
        publicKey: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
        discoveryKey: 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
        version: '1.0',
      });

      const parsed = JSON.parse(qrCodeData);
      expect(isWhisperQRData(parsed)).toBe(true);
      
      const connectionKey = getConnectionKey(parsed);
      expect(connectionKey).toBe('fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321');
    });

    it('should handle legacy hex-only QR codes', () => {
      // Simulate scanning an old-style QR code with just a hex key
      const legacyQRData = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';
      
      expect(isValidHexKey(legacyQRData)).toBe(true);
    });
  });
});
