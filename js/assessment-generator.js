// Update CONFIG for dynamic positioning
const CONFIG_UPDATES = {
    // Submission patterns for better demo mix
    SUBMISSION_PATTERNS: {
        BASE_ON_TIME_PROB: 0.75,     // 75% base for on-time (more realistic)
        BASE_EXTENSION_PROB: 0.15,   // 15% use extensions
        BASE_LATE_PROB: 0.10,        // 10% submit late without extension
        ENGAGEMENT_MULTIPLIER: 0.3   // Reduced impact for more variation
    },
    
    // Extension system
    EXTENSIONS: {
        MAX_PER_YEAR: 4,
        AVAILABILITY_WINDOW_BEFORE: 30, // Days before deadline
        AVAILABILITY_WINDOW_AFTER: 1,   // Days after deadline
        SHORT_EXTENSION_DAYS: 7,
        LONG_EXTENSION_DAYS: 14,
        SHORT_EXTENSION_PROB: 0.7  // 70% get 1 week, 30% get 2 weeks
    }
};

class AssessmentGenerator {
    constructor(calendar) {
        this.calendar = calendar;
    }

    generateForModule(moduleCode, term, studentProfile = null) {
        const numAssessments = Utils.randomBetween(
            CONFIG.ASSESSMENTS_PER_MODULE.MIN,
            CONFIG.ASSESSMENTS_PER_MODULE.MAX
        );
        
        // Use the calendar's optimal date generation
        const assessmentDates = this.calendar.generateOptimalAssessmentDates(moduleCode, term, numAssessments);
        const assessments = [];

        assessmentDates.forEach((dateInfo, i) => {
            const assessment = {
                id: `${moduleCode}_A${i + 1}`,
                title: `${MODULES[moduleCode]} Assessment ${i + 1}`,
                type: Utils.chance(0.6) ? 'Coursework' : Utils.chance(0.7) ? 'Project' : 'Quiz',
                dueDate: dateInfo.dueDate,
                originalDueDate: dateInfo.dueDate, // For mitigation tracking
                hasExtension: false,
                extensionDays: 0,
                extensionReason: null,
                weight: Utils.randomBetween(CONFIG.ASSESSMENT_WEIGHTS.MIN, CONFIG.ASSESSMENT_WEIGHTS.MAX),
                submissionWindow: Utils.randomBetween(
                    CONFIG.SUBMISSION_WINDOW.MIN_DAYS,
                    CONFIG.SUBMISSION_WINDOW.MAX_DAYS
                ),
                // Metadata for demo purposes
                _isPast: dateInfo.isPast,
                _daysFromNow: dateInfo.daysFromNow,
                _termPosition: dateInfo.position
            };

            assessments.push(assessment);
        });

        // Apply extensions to some assessments for demo purposes
        if (studentProfile) {
            this.applyExtensionsToAssessments(assessments, studentProfile);
        }

        Logger.debug('AssessmentGenerator', `Generated ${numAssessments} assessments for ${moduleCode}`, {
            term,
            assessments: assessments.map(a => ({
                id: a.id,
                dueDate: a.dueDate.toISOString().split('T')[0],
                isPast: a._isPast,
                daysFromNow: a._daysFromNow,
                hasExtension: a.hasExtension,
                extensionDays: a.extensionDays
            }))
        });

        return assessments.sort((a, b) => a.dueDate - b.dueDate);
    }

    applyExtensionsToAssessments(assessments, studentProfile) {
        // Apply realistic extension patterns (15% of assessments get extensions)
        const extensionRate = CONFIG_UPDATES.SUBMISSION_PATTERNS.BASE_EXTENSION_PROB;
        const assessmentsToExtend = Math.floor(assessments.length * extensionRate);
        
        if (assessmentsToExtend === 0) return;

        // Prefer extending assessments that are closer to current date for better demo
        const sortedByRelevance = [...assessments]
            .filter(a => Math.abs(a._daysFromNow) <= 45) // Within 45 days of current date
            .sort((a, b) => Math.abs(a._daysFromNow) - Math.abs(b._daysFromNow));

        for (let i = 0; i < Math.min(assessmentsToExtend, sortedByRelevance.length); i++) {
            const assessment = sortedByRelevance[i];
            
            // Apply extension
            assessment.hasExtension = true;
            assessment.extensionDays = Utils.chance(CONFIG_UPDATES.EXTENSIONS.SHORT_EXTENSION_PROB) ? 
                CONFIG_UPDATES.EXTENSIONS.SHORT_EXTENSION_DAYS : 
                CONFIG_UPDATES.EXTENSIONS.LONG_EXTENSION_DAYS;
            assessment.extensionReason = this.generateExtensionReason();
            
            // Update the effective due date
            const newDueDate = new Date(assessment.originalDueDate);
            newDueDate.setDate(newDueDate.getDate() + assessment.extensionDays);
            assessment.dueDate = newDueDate;
            
            // Recalculate metadata
            const now = this.calendar.currentDate;
            assessment._daysFromNow = Math.ceil((newDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            assessment._isPast = newDueDate < now;
            
            Logger.debug('AssessmentGenerator', `Applied ${assessment.extensionDays}-day extension`, {
                assessment: assessment.id,
                originalDue: assessment.originalDueDate.toISOString().split('T')[0],
                newDue: assessment.dueDate.toISOString().split('T')[0],
                reason: assessment.extensionReason
            });
        }
    }

    // Generate realistic extension patterns
    generateExtensionPattern(student, assessments) {
        // Students get 4 extensions per year - determine usage pattern
        const extensionBudget = 4;
        const studentRisk = this.calculateStudentRiskLevel(student);
        
        // Risk-based extension usage probability
        let extensionUsageRate;
        switch (studentRisk) {
            case 'high':
                extensionUsageRate = 0.8; // High-risk students use more extensions
                break;
            case 'medium':
                extensionUsageRate = 0.4;
                break;
            default:
                extensionUsageRate = 0.15; // Low-risk students rarely use extensions
        }

        const availableAssessments = assessments.filter(a => {
            const dueDate = new Date(a.originalDueDate || a.dueDate);
            const now = this.calendar.currentDate;
            const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            // Extension available from 30 days before to 1 day after original deadline
            return daysDiff >= -1 && daysDiff <= 30 && !a.hasExtension;
        });

        let extensionsUsed = 0;
        const maxExtensions = Math.min(extensionBudget, Math.floor(availableAssessments.length * extensionUsageRate));

        // Randomly assign extensions, favoring assessments closer to deadline
        const assessmentsToExtend = [...availableAssessments]
            .sort(() => Math.random() - 0.5) // Shuffle
            .slice(0, maxExtensions);

        assessmentsToExtend.forEach(assessment => {
            if (extensionsUsed < extensionBudget) {
                assessment.hasExtension = true;
                assessment.extensionDays = Utils.chance(0.7) ? 7 : 14; // 70% get 1 week, 30% get 2 weeks
                assessment.extensionReason = this.generateExtensionReason();
                
                // Update the effective due date
                const newDueDate = new Date(assessment.originalDueDate);
                newDueDate.setDate(newDueDate.getDate() + assessment.extensionDays);
                assessment.dueDate = newDueDate;
                
                extensionsUsed++;
                
                Logger.debug('AssessmentGenerator', `Granted ${assessment.extensionDays}-day extension`, {
                    assessment: assessment.id,
                    originalDue: assessment.originalDueDate.toISOString().split('T')[0],
                    newDue: assessment.dueDate.toISOString().split('T')[0],
                    reason: assessment.extensionReason
                });
            }
        });

        return { extensionsUsed, extensionBudget };
    }

    generateExtensionReason() {
        const reasons = [
            'Technical difficulties',
            'Personal circumstances',
            'Illness',
            'Family emergency',
            'Work commitments',
            'Other coursework conflicts',
            'Bereavement',
            'Computer failure',
            'Internet connectivity issues'
        ];
        return reasons[Math.floor(Math.random() * reasons.length)];
    }
