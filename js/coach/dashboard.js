// Coach Dashboard/Homepage Logic
import { CoachCalendarManager } from './calendar.js';

let coachCalendarManager = null;

/**
 * Initialize coach-specific functionality
 * @param {SPARouter} router - The SPA router instance
 */
export function initializeCoachApp(router) {
    // Initialize calendar when calendar page is shown
    const originalNavigateTo = router.navigateTo.bind(router);
    router.navigateTo = function(page) {
        originalNavigateTo(page);
        
        // Initialize calendar manager when calendar page is shown
        if (page === 'coach-calendar') {
            setTimeout(() => {
                if (!coachCalendarManager) {
                    coachCalendarManager = new CoachCalendarManager();
                } else {
                    // Re-render if manager already exists
                    coachCalendarManager.renderCalendar();
                }
            }, 100);
        }
    };
}

