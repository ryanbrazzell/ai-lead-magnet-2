/**
 * Tests for Zapier webhook integration
 * Task Group 2.1: Focused tests for webhook endpoint
 */

import { describe, it, expect, vi } from 'vitest';
import { sendToZapier } from '../zapier';

describe('sendToZapier', () => {
  it('should send webhook POST with valid payload', async () => {
    // Mock fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response)
    );

    const payload = {
      firstName: 'John',
      lastName: 'Doe',
      title: 'CEO',
      phone: '1234567890',
      source: 'EA Time Freedom Report - Step 1',
      step: 'initial_capture',
      timestamp: new Date().toISOString(),
    };

    await sendToZapier(payload);

    expect(global.fetch).toHaveBeenCalledWith('/api/zapier/simplified', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  });

  it('should not throw error when webhook fails (non-blocking)', async () => {
    // Mock fetch to fail
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    const payload = {
      firstName: 'John',
      lastName: 'Doe',
      title: 'CEO',
      phone: '1234567890',
      source: 'EA Time Freedom Report - Step 1',
      step: 'initial_capture',
      timestamp: new Date().toISOString(),
    };

    // Should not throw
    await expect(sendToZapier(payload)).resolves.not.toThrow();
  });

  it('should log error to console when webhook fails', async () => {
    // Mock console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock fetch to fail
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    const payload = {
      firstName: 'John',
      lastName: 'Doe',
      title: 'CEO',
      phone: '1234567890',
      source: 'EA Time Freedom Report - Step 1',
      step: 'initial_capture',
      timestamp: new Date().toISOString(),
    };

    await sendToZapier(payload);

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should include all required payload fields', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response)
    );

    const payload = {
      firstName: 'Jane',
      lastName: 'Smith',
      title: 'Founder',
      phone: '(555) 123-4567',
      source: 'EA Time Freedom Report - Step 1',
      step: 'initial_capture',
      timestamp: '2025-12-01T12:00:00.000Z',
    };

    await sendToZapier(payload);

    const callArg = (global.fetch as any).mock.calls[0][1];
    const body = JSON.parse(callArg.body);

    expect(body).toHaveProperty('firstName', 'Jane');
    expect(body).toHaveProperty('lastName', 'Smith');
    expect(body).toHaveProperty('title', 'Founder');
    expect(body).toHaveProperty('phone', '(555) 123-4567');
    expect(body).toHaveProperty('source', 'EA Time Freedom Report - Step 1');
    expect(body).toHaveProperty('step', 'initial_capture');
    expect(body).toHaveProperty('timestamp');
  });
});
