// LocalStorage helpers for roles, stats, and preferences

/**
 * Get the current user role from localStorage
 * @returns {string|null} 'athlete', 'coach', or null
 */
export function getUserRole() {
    return localStorage.getItem('userRole');
}

/**
 * Set the user role in localStorage
 * @param {string} role - 'athlete' or 'coach'
 */
export function setUserRole(role) {
    localStorage.setItem('userRole', role);
}

/**
 * Get onboarding data from localStorage
 * @returns {Object|null} Onboarding answers object or null
 */
export function getOnboardingData() {
    const data = localStorage.getItem('onboardingData');
    return data ? JSON.parse(data) : null;
}

/**
 * Save onboarding data to localStorage
 * @param {Object} data - Onboarding answers object
 */
export function saveOnboardingData(data) {
    localStorage.setItem('onboardingData', JSON.stringify(data));
}

/**
 * Get calendar view preference for a specific calendar type
 * @param {string} calendarType - 'athlete' or 'coach'
 * @returns {string} 'weekly' or 'monthly'
 */
export function getCalendarViewPreference(calendarType) {
    const stored = localStorage.getItem(`calendarView-${calendarType}`);
    return stored || 'weekly';
}

/**
 * Save calendar view preference for a specific calendar type
 * @param {string} calendarType - 'athlete' or 'coach'
 * @param {string} view - 'weekly' or 'monthly'
 */
export function saveCalendarViewPreference(calendarType, view) {
    localStorage.setItem(`calendarView-${calendarType}`, view);
}

/**
 * Clear all user data from localStorage
 */
export function clearUserData() {
    localStorage.removeItem('userRole');
    localStorage.removeItem('onboardingData');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('trainingSystem');
}

/**
 * Get user profile (merge onboarding data with training data)
 * @returns {Object} User profile object
 */
export function getUserProfile() {
    const onboardingData = getOnboardingData();
    const storedProfile = localStorage.getItem('userProfile');
    
    const baseProfile = {
        currentMilestones: {},
        goals: [],
        equipment: [],
        discomforts: [],
        preferredDisciplines: []
    };
    
    // Merge onboarding data
    if (onboardingData) {
        baseProfile.discomforts = onboardingData.discomforts || [];
        baseProfile.preferredDisciplines = onboardingData.primaryDiscipline || [];
    }
    
    // Merge stored profile
    if (storedProfile) {
        try {
            const parsed = JSON.parse(storedProfile);
            return { ...baseProfile, ...parsed };
        } catch (e) {
            console.error('Error parsing userProfile:', e);
        }
    }
    
    return baseProfile;
}

/**
 * Save user profile
 * @param {Object} profile - User profile object
 */
export function saveUserProfile(profile) {
    localStorage.setItem('userProfile', JSON.stringify(profile));
}

/**
 * Get training system
 * @returns {Object|null} Training system object or null
 */
export function getTrainingSystem() {
    const stored = localStorage.getItem('trainingSystem');
    return stored ? JSON.parse(stored) : null;
}

/**
 * Save training system
 * @param {Object} system - Training system object
 */
export function saveTrainingSystem(system) {
    localStorage.setItem('trainingSystem', JSON.stringify(system));
}

/**
 * Save session progress
 * @param {Object} progress - Session progress object
 */
export function saveSessionProgress(progress) {
    localStorage.setItem('sessionProgress', JSON.stringify(progress));
}

/**
 * Get session progress
 * @returns {Object|null} Session progress or null
 */
export function getSessionProgress() {
    const stored = localStorage.getItem('sessionProgress');
    return stored ? JSON.parse(stored) : null;
}

/**
 * Clear session progress
 */
export function clearSessionProgress() {
    localStorage.removeItem('sessionProgress');
}

