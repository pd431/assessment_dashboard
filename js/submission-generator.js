class SubmissionGenerator {
    constructor(calendar) {
        this.calendar = calendar;
    }

    generateSubmission(studentProfile, assessment) {
        const dueDate = new Date(assessment.dueDate);
        const isTermOne = dueDate < this.calendar.term1End;
        const termDates = this.calendar.getTermDates(isTermOne ? 1 : 2);
        const termProgress = (dueDate - termDates.start) / (termDates.end - termDates.start);
        const currentEngagement = studentProfile.calculateEngagement(termProgress);

        // Generate submission based on whether it's past or future
        if (dueDate <= this.calendar.currentDate) {
            return this.generatePastSubmission(assessment, studentProfile, currentEngagement);
        } else {
            return this.generateFutureSubmission(assessment, studentProfile, currentEngagement);
        }
    }

    generatePastSubmission(assessment, profile, engagement) {
        const submissionState = Math.random();
        const dueDate = new Date(assessment.dueDate);

        // Calculate actual probabilities based on profile and config
        const onTimeProb = CONFIG.SUBMISSION_PATTERNS.BASE_ON_TIME_PROB + 
                          (engagement * CONFIG.SUBMISSION_PATTERNS.ENGAGEMENT_MULTIPLIER);
        const lateProb = CONFIG.SUBMISSION_PATTERNS.BASE_LATE_PROB;
        const missingProb = CONFIG.SUBMISSION_PATTERNS.BASE_MISSING_PROB;

        // Normalize probabilities to ensure they sum to 1
        const total = onTimeProb + lateProb + missingProb;
        const normalizedOnTime = onTimeProb / total;
        const normalizedLate = lateProb / total;

        Logger.debug('SubmissionGenerator', 'Submission probabilities', {
            onTime: normalizedOnTime,
            late: normalizedLate,
            missing: missingProb / total,
            engagement,
            studentProfile: profile
        });

        if (submissionState < normalizedOnTime) {
            // On-time submission: 0-7 days before due date
            const submissionDate = Utils.addDays(dueDate, -Utils.randomBetween(0, 7));
            const submission = this.createSubmission('submitted', submissionDate, profile, assessment);
            return this.addMarkingDetails(submission, submissionDate, profile, false);
        } else if (submissionState < normalizedOnTime + normalizedLate) {
            // Late submission: 1-5 days after due date
            const submissionDate = Utils.addDays(dueDate, Utils.randomBetween(1, 5));
            const submission = this.createSubmission('late', submissionDate, profile, assessment);
            return this.addMarkingDetails(submission, submissionDate, profile, true);
        } else {
            // Missing submission
            return this.createSubmission('missing', null, profile, assessment);
        }
    }

    generateFutureSubmission(assessment, profile, engagement) {
        const dueDate = new Date(assessment.dueDate);
        
        // Use the same probability calculation for consistency
        const earlySubmissionChance = CONFIG.SUBMISSION_PATTERNS.BASE_ON_TIME_PROB * 0.3 * engagement;
        
        if (Math.random() < earlySubmissionChance) {
            const submissionDate = Utils.addDays(this.calendar.currentDate, -Utils.randomBetween(0, 5));
            const submission = this.createSubmission('submitted', submissionDate, profile, assessment);
            // Early submissions should not be marked yet as they are too recent
            return submission;
        }

        return this.createSubmission('pending', null, profile, assessment);
    }

    createSubmission(status, submissionDate, profile, assessment) {
        return {
            assessmentId: assessment.id,
            status: status,
            submissionDate: submissionDate,
            grade: null,
            similarity: status === 'submitted' || status === 'late' ? 
                Utils.randomBetween(CONFIG.SIMILARITY.MIN, CONFIG.SIMILARITY.MAX) : null,
            feedbackDate: null,
            feedback: null
        };
    }

    addMarkingDetails(submission, submissionDate, profile, isLate) {
        // Only add marking details for past submissions
        if (!submissionDate || submissionDate >= this.calendar.currentDate) {
            return submission;
        }

        const markingDeadline = Utils.addDays(submissionDate, CONFIG.MARKING.DEADLINE_DAYS);
        
        // Determine if and when the submission will be marked
        const markingStatus = Utils.weightedRandom({
            onTime: CONFIG.MARKING.ON_TIME_MARKING_PROB,
            late: CONFIG.MARKING.LATE_MARKING_PROB,
            veryLate: CONFIG.MARKING.VERY_LATE_MARKING_PROB
        });

        let feedbackDate;
        switch (markingStatus) {
            case 'onTime':
                // Mark between submission and marking deadline
                feedbackDate = Utils.randomDate(
                    Utils.addDays(submissionDate, 1),
                    markingDeadline
                );
                break;
            case 'late':
                // Mark up to a week after deadline
                feedbackDate = Utils.randomDate(
                    markingDeadline,
                    Utils.addDays(markingDeadline, 7)
                );
                break;
            case 'veryLate':
                // Mark between 1-2 weeks after deadline
                feedbackDate = Utils.randomDate(
                    Utils.addDays(markingDeadline, 7),
                    Utils.addDays(markingDeadline, 14)
                );
                break;
        }

        // Only add grade and feedback if the feedback date has passed
        if (feedbackDate <= this.calendar.currentDate) {
            // Calculate grade based on profile and submission timing
            const minGrade = isLate ? 
                Math.max(40, profile.gradeRange.min - 10) : 
                profile.gradeRange.min;
            
            submission.grade = Utils.randomBetween(minGrade, profile.gradeRange.max);
            submission.feedbackDate = feedbackDate;
            submission.feedback = this.generateFeedback(submission.grade, profile.consistency);
        }

        return submission;
    }

    generateFeedback(grade, consistency) {
        const feedbackTemplates = {
            high: [
                "Excellent work! Clear understanding demonstrated throughout.",
                "Very well structured and thoroughly researched.",
                "Outstanding analysis with strong supporting evidence."
            ],
            medium: [
                "Good effort with some room for improvement.",
                "Demonstrates understanding but could expand analysis.",
                "Solid work overall, consider developing points further."
            ],
            low: [
                "Basic understanding shown but needs more depth.",
                "More analysis and critical thinking needed.",
                "Please review core concepts and develop arguments further."
            ]
        };

        const consistencyComment = consistency > 0.7 ? 
            " Maintains consistent quality across submissions." :
            consistency < 0.3 ?
            " Shows variable quality compared to previous work." : "";

        const templates = grade >= 70 ? feedbackTemplates.high :
                         grade >= 50 ? feedbackTemplates.medium :
                         feedbackTemplates.low;

        return templates[Math.floor(Math.random() * templates.length)] + consistencyComment;
    }
}