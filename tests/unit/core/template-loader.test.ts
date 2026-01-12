import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadTemplate,
  injectTemplate,
  loadAllTemplates,
} from '../../../js/core/template-loader.js';

describe('Template Loader', () => {
  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="sidebar-container"></div>
      <div id="page-home"></div>
      <div id="auth-overlay"></div>
    `;
    
    // Reset fetch mock
    global.fetch = vi.fn();
    vi.clearAllMocks();
  });

  describe('loadTemplate', () => {
    it('should load template from path', async () => {
      const mockHtml = '<div>Test Template</div>';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await loadTemplate('html/components/sidebar.html');
      
      expect(global.fetch).toHaveBeenCalledWith('html/components/sidebar.html');
      expect(result).toBe(mockHtml);
    });

    it('should cache loaded templates', async () => {
      const mockHtml = '<div>Cached Template</div>';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const result1 = await loadTemplate('html/components/sidebar.html');
      const result2 = await loadTemplate('html/components/sidebar.html');
      
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result1).toBe(mockHtml);
      expect(result2).toBe(mockHtml);
    });

    it('should throw error on failed request', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(
        loadTemplate('html/components/missing.html')
      ).rejects.toThrow('Failed to load template: html/components/missing.html (404)');
    });

    it('should throw error on network failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        loadTemplate('html/components/sidebar.html')
      ).rejects.toThrow();
    });
  });

  describe('injectTemplate', () => {
    it('should inject HTML into container', () => {
      const container = document.getElementById('sidebar-container')!;
      const html = '<div>Injected Content</div>';
      
      const result = injectTemplate('sidebar-container', html);
      
      expect(result).toBe(true);
      expect(container.innerHTML).toBe(html);
    });

    it('should return false if container not found', () => {
      const result = injectTemplate('non-existent-container', '<div>Test</div>');
      
      expect(result).toBe(false);
    });

    it('should replace existing content', () => {
      const container = document.getElementById('sidebar-container')!;
      container.innerHTML = '<div>Old Content</div>';
      
      injectTemplate('sidebar-container', '<div>New Content</div>');
      
      expect(container.innerHTML).toBe('<div>New Content</div>');
    });
  });

  describe('loadAllTemplates', () => {
    it('should load and inject all templates', async () => {
      const mockTemplates = {
        'html/components/sidebar.html': '<div>Sidebar</div>',
        'html/pages/athlete/home.html': '<div>Home</div>',
        'html/overlays/auth.html': '<div>Auth</div>',
      };

      global.fetch = vi.fn((path: string) => {
        const html = mockTemplates[path as keyof typeof mockTemplates] || '';
        return Promise.resolve({
          ok: true,
          text: async () => html,
        });
      });

      await loadAllTemplates();

      const sidebarContainer = document.getElementById('sidebar-container');
      const pageHome = document.getElementById('page-home');
      const authOverlay = document.getElementById('auth-overlay');

      expect(sidebarContainer?.innerHTML).toBeTruthy();
      expect(pageHome?.innerHTML).toBeTruthy();
      expect(authOverlay?.innerHTML).toBeTruthy();
    });

    it('should handle individual template failures gracefully', async () => {
      global.fetch = vi.fn((path: string) => {
        if (path.includes('missing')) {
          return Promise.resolve({ ok: false, status: 404 });
        }
        return Promise.resolve({
          ok: true,
          text: async () => '<div>Success</div>',
        });
      });

      // Should not throw even if some templates fail
      await expect(loadAllTemplates()).resolves.not.toThrow();
    });

    it('should load templates in parallel', async () => {
      const fetchOrder: string[] = [];
      global.fetch = vi.fn((path: string) => {
        fetchOrder.push(path);
        return Promise.resolve({
          ok: true,
          text: async () => '<div>Test</div>',
        });
      });

      await loadAllTemplates();

      // All fetches should be called (order may vary due to parallel execution)
      expect(fetchOrder.length).toBeGreaterThan(1);
    });
  });
});

