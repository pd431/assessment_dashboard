// assessment-generator.js - Assessment generation with mitigation support

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
        const extensionRate = 0.15; // Hardcoded to avoid config conflicts
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
            // 70% get 1 week, 30% get 2 weeks
            assessment.extensionDays = Utils.chance(0.7) ? 7 : 14;
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

    calculateStudentRiskLevel(student) {
        // Simplified risk calculation based on student profile
        const ability = student.profile?.baseAbility || 0.5;
        const engagement = student.profile?.baseEngagement || 0.5;
        
        const riskScore = (1 - ability) + (1 - engagement);
        
        if (riskScore > 1.2) return 'high';
        if (riskScore > 0.8) return 'medium';
        return 'low';
    }
}
