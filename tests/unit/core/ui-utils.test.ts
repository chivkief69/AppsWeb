import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  applyGlassEffect,
  fadeIn,
  fadeOut,
  updateActiveNav,
  updateNavigationForRole,
  animateProgressBars,
} from '../../../js/core/ui-utils.js';

describe('UI Utils', () => {
  let element: HTMLElement;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="test-element"></div>
      <div class="nav-item" data-page="home"></div>
      <div class="nav-item" data-page="calendar"></div>
      <div class="athlete-nav-item">
        <div class="nav-item" data-page="athlete-page"></div>
      </div>
      <div class="coach-nav-item">
        <div class="nav-item" data-page="coach-page"></div>
      </div>
      <div class="progress-bar" style="width: 75%"></div>
      <div class="progress-bar" style="width: 50%"></div>
    `;
    element = document.getElementById('test-element')!;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('applyGlassEffect', () => {
    it('should apply standard glass effect', () => {
      applyGlassEffect(element, 'standard');
      expect(element.classList.contains('glass')).toBe(true);
      expect(element.classList.contains('glass-strong')).toBe(false);
    });

    it('should apply strong glass effect', () => {
      applyGlassEffect(element, 'strong');
      expect(element.classList.contains('glass-strong')).toBe(true);
      expect(element.classList.contains('glass')).toBe(false);
    });

    it('should default to standard glass effect', () => {
      applyGlassEffect(element);
      expect(element.classList.contains('glass')).toBe(true);
    });
  });

  describe('fadeIn', () => {
    it('should remove hidden class and set animation', () => {
      element.classList.add('hidden');
      fadeIn(element);
      
      expect(element.classList.contains('hidden')).toBe(false);
      expect(element.style.animation).toBe('fadeIn 0.4s ease-in-out');
    });
  });

  describe('fadeOut', () => {
    it('should fade out element and hide after delay', () => {
      const callback = vi.fn();
      fadeOut(element, callback);
      
      expect(element.style.transition).toBe('opacity 0.3s ease-out');
      expect(element.style.opacity).toBe('0');
      
      vi.advanceTimersByTime(300);
      expect(element.classList.contains('hidden')).toBe(true);
      expect(callback).toHaveBeenCalled();
    });

    it('should work without callback', () => {
      fadeOut(element);
      vi.advanceTimersByTime(300);
      expect(element.classList.contains('hidden')).toBe(true);
    });
  });

  describe('updateActiveNav', () => {
    it('should update active nav item', () => {
      const homeNav = document.querySelector('.nav-item[data-page="home"]')!;
      const calendarNav = document.querySelector('.nav-item[data-page="calendar"]')!;
      
      homeNav.classList.add('active');
      updateActiveNav('calendar');
      
      expect(calendarNav.classList.contains('active')).toBe(true);
      expect(homeNav.classList.contains('active')).toBe(false);
    });

    it('should remove active from all nav items', () => {
      const homeNav = document.querySelector('.nav-item[data-page="home"]')!;
      const calendarNav = document.querySelector('.nav-item[data-page="calendar"]')!;
      
      homeNav.classList.add('active');
      calendarNav.classList.add('active');
      updateActiveNav('home');
      
      expect(homeNav.classList.contains('active')).toBe(true);
      expect(calendarNav.classList.contains('active')).toBe(false);
    });
  });

  describe('updateNavigationForRole', () => {
    it('should show athlete nav items for athlete role', () => {
      const athleteNav = document.querySelector('.athlete-nav-item')!;
      const coachNav = document.querySelector('.coach-nav-item')!;
      
      updateNavigationForRole('athlete');
      
      expect(athleteNav.style.display).toBe('block');
      expect(coachNav.style.display).toBe('none');
    });

    it('should show coach nav items for coach role', () => {
      const athleteNav = document.querySelector('.athlete-nav-item')!;
      const coachNav = document.querySelector('.coach-nav-item')!;
      
      updateNavigationForRole('coach');
      
      expect(athleteNav.style.display).toBe('none');
      expect(coachNav.style.display).toBe('block');
    });

    it('should set first athlete nav as active for athlete role', () => {
      updateNavigationForRole('athlete');
      const firstAthleteNav = document.querySelector('.athlete-nav-item .nav-item')!;
      expect(firstAthleteNav.classList.contains('active')).toBe(true);
    });

    it('should set first coach nav as active for coach role', () => {
      updateNavigationForRole('coach');
      const firstCoachNav = document.querySelector('.coach-nav-item .nav-item')!;
      expect(firstCoachNav.classList.contains('active')).toBe(true);
    });
  });

  describe('animateProgressBars', () => {
    it('should animate progress bars on page load', () => {
      const bars = document.querySelectorAll('.progress-bar');
      const firstBar = bars[0] as HTMLElement;
      const secondBar = bars[1] as HTMLElement;
      
      const originalWidth1 = firstBar.style.width;
      const originalWidth2 = secondBar.style.width;
      
      animateProgressBars();
      
      expect(firstBar.style.width).toBe('0%');
      expect(secondBar.style.width).toBe('0%');
      
      vi.advanceTimersByTime(100);
      expect(firstBar.style.width).toBe(originalWidth1);
      expect(secondBar.style.width).toBe(originalWidth2);
    });
  });
});

