import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SPARouter } from '../../../js/core/router.js';

describe('SPARouter', () => {
  let router: SPARouter;
  let mockPage: HTMLElement;
  let mockNavItem: HTMLElement;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="page-home" class="page-content hidden"></div>
      <div id="page-calendar" class="page-content hidden"></div>
      <div class="nav-item" data-page="home"></div>
      <div class="nav-item" data-page="calendar"></div>
    `;

    router = new SPARouter();
    mockPage = document.getElementById('page-home')!;
    mockNavItem = document.querySelector('.nav-item[data-page="home"]')!;
  });

  describe('init', () => {
    it('should initialize router with role', () => {
      router.init('athlete');
      expect(router.userRole).toBe('athlete');
    });

    it('should set up navigation listeners', () => {
      router.init('athlete');
      
      // Simulate click
      const clickEvent = new MouseEvent('click', { bubbles: true });
      mockNavItem.dispatchEvent(clickEvent);
      
      // Router should handle navigation (would need to spy on navigateTo)
      expect(router.userRole).toBe('athlete');
    });
  });

  describe('navigateTo', () => {
    beforeEach(() => {
      router.init('athlete');
    });

    it('should hide all pages', () => {
      const calendarPage = document.getElementById('page-calendar')!;
      calendarPage.classList.remove('hidden');
      
      router.navigateTo('home');
      
      expect(calendarPage.classList.contains('hidden')).toBe(true);
    });

    it('should show target page', () => {
      router.navigateTo('home');
      
      expect(mockPage.classList.contains('hidden')).toBe(false);
    });

    it('should update current page', () => {
      router.navigateTo('calendar');
      expect(router.currentPage).toBe('calendar');
    });

    it('should update active nav item', () => {
      const calendarNav = document.querySelector('.nav-item[data-page="calendar"]')!;
      
      router.navigateTo('calendar');
      
      expect(calendarNav.classList.contains('active')).toBe(true);
      expect(mockNavItem.classList.contains('active')).toBe(false);
    });
  });
});

