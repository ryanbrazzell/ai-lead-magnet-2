/**
 * Tests for Close CRM API Routes
 * Task Group 1: Close CRM Integration & API Routes
 *
 * Tests cover:
 * - Lead creation with valid name data
 * - Lead update with email data
 * - Lead update with phone data
 * - Error handling for invalid lead_id
 * - API key authentication failure handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as createLead } from '../create-lead/route';
import { PUT as updateLead } from '../update-lead/route';
import { NextRequest } from 'next/server';

// Mock environment variable
beforeEach(() => {
  vi.stubEnv('CLOSE_API_KEY', 'test_api_key_12345');
});

describe('Close API Routes', () => {
  describe('POST /api/close/create-lead', () => {
    it('should create a lead with valid name data', async () => {
      // Mock fetch to Close API
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'lead_abc123', name: 'John Doe' }),
      });

      const request = new NextRequest('http://localhost:3000/api/close/create-lead', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
        }),
      });

      const response = await createLead(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.leadId).toBe('lead_abc123');
    });

    it('should handle missing API key gracefully', async () => {
      vi.stubEnv('CLOSE_API_KEY', '');

      const request = new NextRequest('http://localhost:3000/api/close/create-lead', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
        }),
      });

      const response = await createLead(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('API key');
    });
  });

  describe('PUT /api/close/update-lead', () => {
    it('should update lead with email data', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'lead_abc123' }),
      });

      const request = new NextRequest('http://localhost:3000/api/close/update-lead', {
        method: 'PUT',
        body: JSON.stringify({
          leadId: 'lead_abc123',
          email: 'john@example.com',
        }),
      });

      const response = await updateLead(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should update lead with phone data', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'lead_abc123' }),
      });

      const request = new NextRequest('http://localhost:3000/api/close/update-lead', {
        method: 'PUT',
        body: JSON.stringify({
          leadId: 'lead_abc123',
          phone: '+11234567890',
        }),
      });

      const response = await updateLead(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle invalid lead_id with non-blocking error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const request = new NextRequest('http://localhost:3000/api/close/update-lead', {
        method: 'PUT',
        body: JSON.stringify({
          leadId: 'invalid_lead_id',
          email: 'john@example.com',
        }),
      });

      const response = await updateLead(request);
      const data = await response.json();

      // Non-blocking: returns success true but logs error
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
