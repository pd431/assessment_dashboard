// academic-calendar.js - Dynamic academic calendar positioning

class AcademicCalendar {
    constructor() {
        this.calculateDynamicTermDates();
    }

    calculateDynamicTermDates() {
        // Always position "now" at 2/3 through the academic year for optimal demo viewing
        const now = new Date();
        
        // Determine current academic year based on actual date
        let academicYear = now.getFullYear();
        if (now.getMonth() < CONFIG.TERM_1_START_MONTH) {
            academicYear = now.getFullYear() - 1;
        }

        // Set up term boundaries
        this.term1Start = new Date(academicYear, CONFIG.TERM_1_START_MONTH, CONFIG.TERM_1_START_DAY);
        this.term1End = new Date(academicYear, CONFIG.TERM_1_END_MONTH, CONFIG.TERM_1_END_DAY);
        
        this.term2Start = new Date(academicYear + 1, CONFIG.TERM_2_START_MONTH, CONFIG.TERM_2_START_DAY);
        this.term2End = new Date(academicYear + 1, CONFIG.TERM_2_END_MONTH, CONFIG.TERM_2_END_DAY);

        // Calculate total academic year duration
        const academicYearDuration = this.term2End.getTime() - this.term1Start.getTime();
        
        // Position current date at 2/3 through the academic year
        const targetPosition = 0.67; // 67% through the year
        this.currentDate = new Date(this.term1Start.getTime() + (academicYearDuration * targetPosition));
        
        // Ensure we're in a valid term period (not in breaks)
        this.adjustForBreaks();

        Logger.debug('AcademicCalendar', 'Dynamic term dates calculated', {
            academicYear: academicYear,
            term1Start: this.term1Start,
            term1End: this.term1End,
            term2Start: this.term2Start,
            term2End: this.term2End,
            currentDate: this.currentDate,
            academicProgress: `${Math.round(targetPosition * 100)}%`
        });
    }

    adjustForBreaks() {
        // If current date falls in winter break, move to start of term 2
        if (this.currentDate > this.term1End && this.currentDate < this.term2Start) {
            // Position at 1/4 through term 2 instead
            const term2Duration = this.term2End.getTime() - this.term2Start.getTime();
            this.currentDate = new Date(this.term2Start.getTime() + (term2Duration * 0.25));
            
            Logger.debug('AcademicCalendar', 'Adjusted for winter break, moved to Term 2');
        }
        
        // If somehow in spring break (Easter), adjust accordingly
        const springBreakStart = new Date(this.term2Start);
        springBreakStart.setMonth(3, 1); // April 1st
        const springBreakEnd = new Date(this.term2Start);
        springBreakEnd.setMonth(3, 15); // April 15th
        
        if (this.currentDate > springBreakStart && this.currentDate < springBreakEnd) {
            this.currentDate = new Date(springBreakEnd.getTime() + (7 * 24 * 60 * 60 * 1000)); // Week after break
            Logger.debug('AcademicCalendar', 'Adjusted for spring break');
        }
    }

    getCurrentTerm() {
        if (this.currentDate >= this.term1Start && this.currentDate <= this.term1End) {
            return 1;
        } else if (this.currentDate >= this.term2Start && this.currentDate <= this.term2End) {
            return 2;
        } else {
            // Default to term 2 if between terms
            return 2;
        }
    }

    getTermProgress(term = null) {
        const currentTerm = term || this.getCurrentTerm();
        const termDates = this.getTermDates(currentTerm);
        
        const termDuration = termDates.end.getTime() - termDates.start.getTime();
        const elapsed = this.currentDate.getTime() - termDates.start.getTime();
        
        return Math.max(0, Math.min(1, elapsed / termDuration));
    }

    isValidAssessmentDate(date) {
        const month = date.getMonth();
        const day = date.getDate();
        
        // Avoid holiday periods
        if (month === 11 && day > 15) return false;  // December break
        if (month === 3 && day > 1 && day < 15) return false;  // Spring break
        
        return true;
    }

    getTermDates(term) {
        return term === 1 ? 
            { start: this.term1Start, end: this.term1End } :
            { start: this.term2Start, end: this.term2End };
    }

    getMarkingDeadline(submissionDate) {
        return Utils.addDays(submissionDate, CONFIG.MARKING.DEADLINE_DAYS);
    }

    // Generate assessment due dates that provide good demo data
    generateOptimalAssessmentDates(moduleCode, term, numAssessments) {
        const termDates = this.getTermDates(term);
        const termDuration = termDates.end.getTime() - termDates.start.getTime();
        const assessments = [];

        for (let i = 0; i < numAssessments; i++) {
            // Spread assessments across the term with some clustering around current date
            let assessmentPosition;
            
            if (term === this.getCurrentTerm()) {
                // For current term, create a good mix relative to current date
                const termProgress = this.getTermProgress(term);
                
                if (i === 0) {
                    // First assessment: definitely in the past (early term)
                    assessmentPosition = Utils.randomBetween(10, Math.max(15, termProgress * 60)) / 100;
                } else if (i === numAssessments - 1) {
                    // Last assessment: mix of near-future and future
                    assessmentPosition = Utils.randomBetween(
                        Math.max(termProgress * 100 - 10, 60), 
                        95
                    ) / 100;
                } else {
                    // Middle assessments: spread around current position
                    assessmentPosition = Utils.randomBetween(
                        Math.max(20, termProgress * 100 - 20),
                        Math.min(90, termProgress * 100 + 30)
                    ) / 100;
                }
            } else {
                // For past terms, spread evenly
                assessmentPosition = (i + 1) / (numAssessments + 1);
            }

            const dueDate = new Date(termDates.start.getTime() + (termDuration * assessmentPosition));
            
            // Ensure valid date (avoid breaks)
            let validDate = dueDate;
            let attempts = 0;
            while (!this.isValidAssessmentDate(validDate) && attempts < 10) {
                validDate = new Date(validDate.getTime() + (3 * 24 * 60 * 60 * 1000)); // Add 3 days
                attempts++;
            }

            assessments.push({
                position: assessmentPosition,
                dueDate: validDate,
                isPast: validDate < this.currentDate,
                daysFromNow: Math.ceil((validDate.getTime() - this.currentDate.getTime()) / (1000 * 60 * 60 * 24))
            });
        }

        Logger.debug('AcademicCalendar', `Generated optimal dates for ${moduleCode}`, {
            term,
            currentTermProgress: `${Math.round(this.getTermProgress() * 100)}%`,
            assessments: assessments.map(a => ({
                date: a.dueDate.toISOString().split('T')[0],
                isPast: a.isPast,
                daysFromNow: a.daysFromNow
            }))
        });

        return assessments.sort((a, b) => a.dueDate - b.dueDate);
    }
}
