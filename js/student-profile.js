// student-profile.js - Student profile generation

class StudentProfile {
    constructor() {
        this.baseAbility = Utils.randomBetween(
            CONFIG.BASE_ABILITY.MIN * 100, 
            CONFIG.BASE_ABILITY.MAX * 100
        ) / 100;
        
        this.consistency = Math.random();
        this.baseEngagement = Utils.clamp(
            this.baseAbility * CONFIG.BASE_ABILITY.WEIGHT + Math.random() * 0.3,
            0, 1
        );

        this.calculateSubmissionPatterns();
        this.calculateGradeRanges();

        Logger.debug('StudentProfile', 'New profile created', {
            baseAbility: this.baseAbility,
            consistency: this.consistency,
            baseEngagement: this.baseEngagement
        });
    }

    calculateSubmissionPatterns() {
        this.submissionPattern = {
            onTimeProb: CONFIG.SUBMISSION_PATTERNS.BASE_ON_TIME_PROB + 
                       (this.baseEngagement * CONFIG.SUBMISSION_PATTERNS.ENGAGEMENT_MULTIPLIER),
            lateProb: CONFIG.SUBMISSION_PATTERNS.BASE_LATE_PROB - 
                     (this.baseEngagement * CONFIG.SUBMISSION_PATTERNS.ENGAGEMENT_MULTIPLIER / 2),
            missingProb: CONFIG.SUBMISSION_PATTERNS.BASE_MISSING_PROB - 
                        (this.baseEngagement * CONFIG.SUBMISSION_PATTERNS.ENGAGEMENT_MULTIPLIER / 2)
        };
    }

    calculateGradeRanges() {
        this.gradeRange = {
            min: Math.round(CONFIG.GRADE_RANGES.MIN_BASE + 
                          (this.baseAbility * CONFIG.GRADE_RANGES.RANGE_MULTIPLIER)),
            max: Math.round(CONFIG.GRADE_RANGES.MAX_BASE + 
                          (this.baseAbility * CONFIG.GRADE_RANGES.RANGE_MULTIPLIER))
        };
    }

    calculateEngagement(termProgress) {
        const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
        return Utils.clamp(this.baseEngagement + variation, 0, 1);
    }
}