// academic-calendar.js - Academic calendar management

class AcademicCalendar {
    constructor() {
        this.currentDate = new Date();
        this.calculateTermDates();
    }

    calculateTermDates() {
        this.academicYearStart = new Date(this.currentDate);
        
        // Set academic year start
        if (this.currentDate.getMonth() < CONFIG.TERM_1_START_MONTH) {
            this.academicYearStart.setFullYear(this.currentDate.getFullYear() - 1);
        }
        this.academicYearStart.setMonth(CONFIG.TERM_1_START_MONTH);
        this.academicYearStart.setDate(CONFIG.TERM_1_START_DAY);

        // Calculate term dates
        this.term1Start = new Date(this.academicYearStart);
        this.term1End = new Date(this.academicYearStart);
        this.term1End.setMonth(CONFIG.TERM_1_END_MONTH);
        this.term1End.setDate(CONFIG.TERM_1_END_DAY);

        this.term2Start = new Date(this.term1End);
        this.term2Start.setMonth(CONFIG.TERM_2_START_MONTH);
        this.term2Start.setDate(CONFIG.TERM_2_START_DAY);
        this.term2Start.setFullYear(this.term2Start.getFullYear() + 1);

        this.term2End = new Date(this.term2Start);
        this.term2End.setMonth(CONFIG.TERM_2_END_MONTH);
        this.term2End.setDate(CONFIG.TERM_2_END_DAY);

        Logger.debug('AcademicCalendar', 'Term dates calculated', {
            term1Start: this.term1Start,
            term1End: this.term1End,
            term2Start: this.term2Start,
            term2End: this.term2End
        });
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
}