// config.js - Configuration constants for data generation

const CONFIG = {
    // Academic calendar settings
    TERM_1_START_MONTH: 8,  // September (0-based)
    TERM_1_START_DAY: 23,
    TERM_1_END_MONTH: 11,   // December
    TERM_1_END_DAY: 15,
    TERM_2_START_MONTH: 0,  // January
    TERM_2_START_DAY: 13,
    TERM_2_END_MONTH: 4,    // May
    TERM_2_END_DAY: 15,
    
    // Student profile parameters
    BASE_ABILITY: {
        MIN: 0.2,    // Allow for lower base ability
        MAX: 1.0,    // Keep maximum potential
        WEIGHT: 0.4  // Reduced weight to allow more variation in engagement
    },
    
    GRADE_RANGES: {
        MIN_BASE: 35,             // Slightly higher minimum
        MAX_BASE: 45,             // Lower maximum base
        RANGE_MULTIPLIER: 55,     // Increased range for more variation
        VARIATION: 15             // More variation within range
    },
    
    SUBMISSION_PATTERNS: {
        BASE_ON_TIME_PROB: 0.75,     // 75% base for on-time (more realistic)
        BASE_LATE_PROB: 0.10,        // 10% submit late without extension
        BASE_MISSING_PROB: 0.05,     // 5% miss submissions entirely
        ENGAGEMENT_MULTIPLIER: 0.2   // Reduced impact for more variation
    },
    
    // Assessment generation
    ASSESSMENTS_PER_MODULE: {
        MIN: 2,
        MAX: 3
    },
    
    ASSESSMENT_WEIGHTS: {
        MIN: 20,
        MAX: 50
    },
    
    SUBMISSION_WINDOW: {
        MIN_DAYS: 14,
        MAX_DAYS: 21
    },

    // Marking patterns
    MARKING: {
        DEADLINE_DAYS: 21,           // 3 weeks marking deadline
        ON_TIME_MARKING_PROB: 0.85,  // 85% chance of marking within deadline
        LATE_MARKING_PROB: 0.12,     // 12% chance of marking up to a week late
        VERY_LATE_MARKING_PROB: 0.03 // 3% chance of marking more than a week late
    },
    
    // Extension/Mitigation system
    EXTENSIONS: {
        AVAILABILITY_WINDOW_BEFORE: 30, // Days before deadline mitigation available
        AVAILABILITY_WINDOW_AFTER: 1,   // Days after deadline mitigation available
        SHORT_EXTENSION_DAYS: 7,        // 1 week extension
        LONG_EXTENSION_DAYS: 14,        // 2 week extension
        SHORT_EXTENSION_PROB: 0.7       // 70% get 1 week, 30% get 2 weeks
    },
    
    // Similarity checking
    SIMILARITY: {
        MIN: 5,
        MAX: 40,
        HIGH_THRESHOLD: 40
    }
};

// Academic Programs and Modules
const PROGRAMS = ['Computer Science', 'Data Science', 'Applied AI'];

const MODULES = {
    // Term 1 Modules
    'ECM1400': 'Programming',
    'ECM1401': 'Discrete Mathematics',
    'ECM1402': 'Computer Systems',
    'ECM1403': 'Data Structures',
    'ECM1404': 'Professional Development',
    // Term 2 Modules
    'ECM2410': 'Algorithms',
    'ECM2411': 'Database Systems',
    'ECM2412': 'Software Engineering',
    'ECM2413': 'Artificial Intelligence',
    'ECM2414': 'Web Development'
};

// Debug mode toggle
window.DEBUG_MODE = false;
window.toggleDebug = function(enable = true) {
    window.DEBUG_MODE = enable;
    Logger.debug('System', `Debug mode ${enable ? 'enabled' : 'disabled'}`);
};
