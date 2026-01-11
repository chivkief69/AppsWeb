// Main Application Entry Point
// REGAIN - Movement Engineering System

// Import CSS so Vite processes it through PostCSS/Tailwind
import '../css/styles.css';

import { SPARouter } from './core/router.js';
import { setUserRole, getUserRole } from './core/storage.js';
import { updateNavigationForRole, animateProgressBars } from './core/ui-utils.js';
import { OnboardingManager } from './onboarding/onboarding-manager.js';
import { initializeAthleteApp } from './athlete/dashboard.js';
import { initializeCoachApp } from './coach/dashboard.js';
import { loadAllTemplates } from './core/template-loader.js';
import { initAuthManager, onAuthStateChanged, isAuthenticated } from './core/auth-manager.js';
import { initAuthUI, showAuthOverlay, hideAuthOverlay } from './ui/auth-ui.js';

// Global router instance
let router = null;

// Role Management
function showOnboarding() {
    const overlay = document.getElementById('onboarding-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

async function selectRole(role) {
    console.log('selectRole called with:', role);
    await setUserRole(role);
    if (role === 'coach') {
        // Coach proceeds directly - no onboarding needed
        console.log('Coach selected - hiding overlay and initializing app');
        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) {
            overlay.style.transition = 'opacity 0.3s ease-out';
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.classList.add('hidden');
                overlay.style.display = 'none';
                console.log('Onboarding overlay hidden for coach');
                initializeApp(role);
            }, 300);
        } else {
            console.log('Overlay not found, initializing app directly');
            initializeApp(role);
        }
    } else {
        // STEP 3: Athlete selected - start onboarding questions
        console.log('Athlete selected - starting onboarding flow');
        onboardingManager.startAthleteFlow();
    }
}

function initializeApp(role) {
    // Make sure onboarding overlay is hidden
    const overlay = document.getElementById('onboarding-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
    
    // Initialize router
    router = new SPARouter();
    router.init(role);
    
    // Update navigation based on role
    updateNavigationForRole(role);
    
    // Initialize role-specific functionality
    if (role === 'athlete') {
        initializeAthleteApp(router);
    } else if (role === 'coach') {
        initializeCoachApp(router);
    }
    
    // Show appropriate home page
    const homePage = role === 'coach' ? 'coach-home' : 'home';
    router.navigateTo(homePage);
}

// Initialize onboarding manager with callbacks
const onboardingManager = new OnboardingManager(
    selectRole,  // onRoleSelect callback
    initializeApp // onComplete callback
);

// Always show onboarding on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Load all templates first
    try {
        await loadAllTemplates();
        console.log('Templates loaded successfully');
    } catch (error) {
        console.error('Failed to load templates:', error);
        // Continue execution even if templates fail to load
        // This allows the app to function with minimal degradation
    }
    
    // Initialize authentication
    // FIX: Wait for auth manager to initialize (which waits for persistence)
    await initAuthManager();
    initAuthUI();
    
    // Hide all pages first
    document.querySelectorAll('[id^="page-"]').forEach(page => {
        page.classList.add('hidden');
    });
    
    // CRITICAL: Ensure templates are loaded and overlay exists before subscribing
    // The onAuthStateChanged callback fires immediately, so we need the overlay to exist
    const authOverlayCheck = document.getElementById('auth-overlay');
    if (!authOverlayCheck) {
        console.error('[DEBUG] CRITICAL: Auth overlay not found after template loading!');
        console.error('[DEBUG] This means templates may not have loaded correctly');
    } else {
        console.log('[DEBUG] Auth overlay exists, ready to subscribe to auth state');
    }
    
    // Check authentication state
    // This will fire immediately with currentUser (which should be null in E2E mode)
    onAuthStateChanged(async (user) => {
        // #region agent log
        const appAuthStateTime = Date.now();
        fetch('http://127.0.0.1:7244/ingest/915a47a4-1527-472d-b5cb-4d7f3b093620',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:109',message:'app onAuthStateChanged fired',data:{userId:user ? user.uid : null,hasUser:!!user,overlayExists:!!document.getElementById('auth-overlay')},timestamp:appAuthStateTime,sessionId:'debug-session',runId:'post-fix',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        
        console.log('[DEBUG] app.js onAuthStateChanged fired, user:', user ? user.uid : 'null');
        console.log('[DEBUG] Auth overlay exists:', !!document.getElementById('auth-overlay'));
        
        if (!user) {
            // STEP 1: User not authenticated - show login
            console.log('[DEBUG] User not authenticated, showing login overlay');
            
            // #region agent log
            fetch('http://127.0.0.1:7244/ingest/915a47a4-1527-472d-b5cb-4d7f3b093620',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:111',message:'User not authenticated - calling showAuthOverlay',data:{overlayExists:!!document.getElementById('auth-overlay')},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'E'})}).catch(()=>{});
            // #endregion
            
            // Ensure onboarding overlay is hidden
            const onboardingOverlay = document.getElementById('onboarding-overlay');
            if (onboardingOverlay) {
                onboardingOverlay.classList.add('hidden');
            }
            
            // Ensure auth overlay element exists (templates should be loaded by now)
            const authOverlay = document.getElementById('auth-overlay');
            if (!authOverlay) {
                console.error('[DEBUG] CRITICAL: Auth overlay not found when trying to show it!');
                console.error('[DEBUG] This means templates may not have loaded properly');
                // Try to wait a bit and retry (defensive)
                setTimeout(() => {
                    const retryOverlay = document.getElementById('auth-overlay');
                    if (retryOverlay) {
                        console.log('[DEBUG] Auth overlay found on retry, showing now');
                        showAuthOverlay('login');
                    } else {
                        console.error('[DEBUG] Auth overlay still not found after retry');
                    }
                }, 100);
                return;
            }
            
            showAuthOverlay('login');
            return;
        }
        
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/915a47a4-1527-472d-b5cb-4d7f3b093620',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:123',message:'User authenticated - calling hideAuthOverlay',data:{userId:user.uid},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        
        // User is authenticated - hide auth overlay
        hideAuthOverlay();
        
        // Get user role
        const role = await getUserRole();
        
        if (!role) {
            // STEP 2: No role set - show role selection (Athlete or Coach)
            console.log('User authenticated but no role set, showing role selection');
            const overlay = document.getElementById('onboarding-overlay');
            if (overlay) {
                overlay.classList.remove('hidden');
                overlay.style.zIndex = '100';
                overlay.style.display = 'flex';
            }
            // Only show role selection, don't start athlete flow yet
            onboardingManager.showRoleSelection();
        } else {
            // Role exists - initialize app
            console.log('User authenticated with role:', role);
            // Ensure onboarding overlay is hidden
            const overlay = document.getElementById('onboarding-overlay');
            if (overlay) {
                overlay.classList.add('hidden');
            }
            initializeApp(role);
        }
    });
    
    // Initialize onboarding manager (sets up event listeners only, doesn't show anything)
    // The manager will only show UI when explicitly called after authentication
    onboardingManager.init();
    
    // Voice FAB click handler (if element exists)
    const voiceFab = document.getElementById('voiceFab');
    if (voiceFab) {
        voiceFab.addEventListener('click', function() {
            console.log('Voice command feature coming soon!');
            // Future: Voice command integration
        });
    }
});

// Animate progress bars on page load
window.addEventListener('load', () => {
    animateProgressBars();
});

// Save exercise functionality (event delegation)
document.addEventListener('click', function(e) {
    // Handle Save Exercise button clicks
    if (e.target.textContent === 'Save Exercise' || e.target.textContent === 'Saved') {
        const btn = e.target;
        const card = btn.closest('.explore-card');
        if (card) {
            const bookmark = card.querySelector('.fa-bookmark');
            const saveBtn = card.querySelector('button:last-child');
            if (bookmark) {
                bookmark.classList.toggle('fas');
                bookmark.classList.toggle('far');
                if (saveBtn) {
                    saveBtn.textContent = bookmark.classList.contains('fas') ? 'Saved' : 'Save Exercise';
                }
            }
        }
    }
    // Handle bookmark icon clicks
    if (e.target.classList.contains('fa-bookmark')) {
        const bookmark = e.target;
        const card = bookmark.closest('.explore-card');
        if (card) {
            const saveBtn = card.querySelector('button:last-child');
            bookmark.classList.toggle('fas');
            bookmark.classList.toggle('far');
            if (saveBtn) {
                saveBtn.textContent = bookmark.classList.contains('fas') ? 'Saved' : 'Save Exercise';
            }
        }
    }
});
