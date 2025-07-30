// assessment-generator.js - Assessment generation

class AssessmentGenerator {
    constructor(calendar) {
        this.calendar = calendar;
    }

    generateForModule(moduleCode, term) {
        const numAssessments = Utils.randomBetween(
            CONFIG.ASSESSMENTS_PER_MODULE.MIN,
            CONFIG.ASSESSMENTS_PER_MODULE.MAX
        );
        
        const termDates = this.calendar.getTermDates(term);
        const assessments = [];

        for (let i = 0; i < numAssessments; i++) {
            let validDate = false;
            let dueDate;

            while (!validDate) {
                const periodStart = new Date(termDates.start);
                const periodEnd = new Date(termDates.end);
                
                periodStart.setTime(periodStart.getTime() + (i * 21 * 24 * 60 * 60 * 1000));
                periodEnd.setTime(Math.min(
                    periodEnd.getTime(),
                    periodStart.getTime() + (28 * 24 * 60 * 60 * 1000)
                ));

                dueDate = Utils.randomDate(periodStart, periodEnd);
                validDate = this.calendar.isValidAssessmentDate(dueDate);
            }

            assessments.push({
                id: `${moduleCode}_A${i + 1}`,
                title: `${MODULES[moduleCode]} Assessment ${i + 1}`,
                type: Utils.chance(0.6) ? 'Coursework' : Utils.chance(0.7) ? 'Project' : 'Quiz',
                dueDate,
                weight: Utils.randomBetween(CONFIG.ASSESSMENT_WEIGHTS.MIN, CONFIG.ASSESSMENT_WEIGHTS.MAX),
                submissionWindow: Utils.randomBetween(
                    CONFIG.SUBMISSION_WINDOW.MIN_DAYS,
                    CONFIG.SUBMISSION_WINDOW.MAX_DAYS
                )
            });
        }

        Logger.debug('AssessmentGenerator', `Generated ${numAssessments} assessments for ${moduleCode}`, assessments);
        return assessments.sort((a, b) => a.dueDate - b.dueDate);
    }
}