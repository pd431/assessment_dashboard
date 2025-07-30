// Configuration constants for easy modification
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
        MIN: 0.3,
        MAX: 1.0,
        WEIGHT: 0.7  // How much base ability affects engagement
    },
    
    GRADE_RANGES: {
        MIN_BASE: 30,
        MAX_BASE: 50,
        RANGE_MULTIPLIER: 50,
        VARIATION: 10
    },
    
    SUBMISSION_PATTERNS: {
        BASE_ON_TIME_PROB: 0.6,
        BASE_LATE_PROB: 0.3,
        BASE_MISSING_PROB: 0.1,
        ENGAGEMENT_MULTIPLIER: 0.4
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
    
    // Similarity checking
    SIMILARITY: {
        MIN: 5,
        MAX: 40,
        HIGH_THRESHOLD: 40
    }
};

// Program and module definitions
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

// Utility functions
const Utils = {
    randomBetween: (min, max) => Math.floor(Math.random() * (max - min + 1) + min),
    chance: (probability) => Math.random() < probability,
    randomDate: (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())),
    clamp: (value, min, max) => Math.max(min, Math.min(max, value))
};

class Logger {
    static debug(component, message, data = null) {
        if (window.DEBUG_MODE) {
            console.log(`[${component}] ${message}`, data || '');
        }
    }

    static warn(component, message, data = null) {
        console.warn(`[${component}] ${message}`, data || '');
    }

    static error(component, message, error = null) {
        console.error(`[${component}] ${message}`, error || '');
    }
}

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
}

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

        if (submissionState < 0.9 * engagement) {
            const isLate = Math.random() < 0.2;
            let submissionDate;

            if (isLate) {
                submissionDate = new Date(dueDate.getTime() + 
                    (Utils.randomBetween(1, 5) * 24 * 60 * 60 * 1000));
                    
                return this.createSubmission('late', submissionDate, profile, assessment);
            } else {
                submissionDate = new Date(dueDate.getTime() - 
                    (Utils.randomBetween(0, 7) * 24 * 60 * 60 * 1000));
                    
                return this.createSubmission('submitted', submissionDate, profile, assessment);
            }
        }

        return this.createSubmission('missing', null, profile, assessment);
    }

    generateFutureSubmission(assessment, profile, engagement) {
        const dueDate = new Date(assessment.dueDate);
        
        if (Math.random() < 0.3 * engagement) {
            const submissionDate = new Date(this.calendar.currentDate.getTime() - 
                (Utils.randomBetween(0, 5) * 24 * 60 * 60 * 1000));
            return this.createSubmission('submitted', submissionDate, profile, assessment);
        }

        return this.createSubmission('pending', null, profile, assessment);
    }

    createSubmission(status, submissionDate, profile, assessment) {
        const submission = {
            assessmentId: assessment.id,
            status: status,
            submissionDate: submissionDate,
            grade: null,
            similarity: status === 'submitted' ? 
                Utils.randomBetween(CONFIG.SIMILARITY.MIN, CONFIG.SIMILARITY.MAX) : null,
            feedbackDate: null,
            feedback: null
        };

        if (status === 'submitted' || status === 'late') {
            if (submissionDate < this.calendar.currentDate) {
                submission.grade = Utils.randomBetween(profile.gradeRange.min, profile.gradeRange.max);
                submission.feedbackDate = new Date(submissionDate.getTime() + 
                    (Utils.randomBetween(3, 10) * 24 * 60 * 60 * 1000));
                submission.feedback = this.generateFeedback(submission.grade, profile.consistency);
            }
        }

        Logger.debug('SubmissionGenerator', `Generated ${status} submission`, submission);
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

class ModuleGenerator {
    constructor(calendar, assessmentGenerator, submissionGenerator) {
        this.calendar = calendar;
        this.assessmentGenerator = assessmentGenerator;
        this.submissionGenerator = submissionGenerator;
    }

    generateForStudent(studentProfile, term) {
        const modulesList = Object.keys(MODULES);
        const startIndex = term === 1 ? 0 : 5;  // Term 1: 0-4, Term 2: 5-9
        const selectedModules = modulesList.slice(startIndex, startIndex + 3);

        return selectedModules.map(moduleCode => {
            const assessments = this.assessmentGenerator.generateForModule(moduleCode, term);
            const submissions = assessments.map(assessment => 
                this.submissionGenerator.generateSubmission(studentProfile, assessment)
            );

            Logger.debug('ModuleGenerator', `Generated module ${moduleCode}`, {
                moduleCode,
                assessmentsCount: assessments.length,
                submissionsCount: submissions.length
            });

            return {
                code: moduleCode,
                name: MODULES[moduleCode],
                term: term,
                assessments: assessments,
                submissions: submissions
            };
        });
    }
}

class DatasetGenerator {
    constructor() {
        this.calendar = new AcademicCalendar();
        this.assessmentGenerator = new AssessmentGenerator(this.calendar);
        this.submissionGenerator = new SubmissionGenerator(this.calendar);
        this.moduleGenerator = new ModuleGenerator(
            this.calendar,
            this.assessmentGenerator,
            this.submissionGenerator
        );
    }

    generateDataset(numStudents = 100) {
        Logger.debug('DatasetGenerator', `Generating dataset for ${numStudents} students`);
        
        const students = Array.from({ length: numStudents }, (_, i) => {
            const studentProfile = new StudentProfile();
            const term1Modules = this.moduleGenerator.generateForStudent(studentProfile, 1);
            const term2Modules = this.moduleGenerator.generateForStudent(studentProfile, 2);

            const student = {
                id: `X${(i + 1).toString(16).padStart(8, '0')}`,
                name: `Student ${i + 1}`,
                year: 2,
                program: PROGRAMS[Utils.randomBetween(0, PROGRAMS.length - 1)],
                profile: studentProfile,
                modules: [...term1Modules, ...term2Modules]
            };

            Logger.debug('DatasetGenerator', `Generated student ${student.id}`, {
                program: student.program,
                modulesCount: student.modules.length
            });

            return student;
        });

        return students;
    }

    analyzeDataset(dataset) {
        const analysis = {
            totalStudents: dataset.length,
            submissionStats: {},
            gradeDistribution: {},
            programDistribution: {},
            riskAnalysis: {
                highRisk: 0,
                mediumRisk: 0,
                lowRisk: 0
            }
        };

        dataset.forEach(student => {
            // Program distribution
            analysis.programDistribution[student.program] = 
                (analysis.programDistribution[student.program] || 0) + 1;

            // Process all submissions
            student.modules.forEach(module => {
                module.submissions.forEach(sub => {
                    // Submission stats
                    analysis.submissionStats[sub.status] = 
                        (analysis.submissionStats[sub.status] || 0) + 1;

                    // Grade distribution
                    if (sub.grade) {
                        const bracket = Math.floor(sub.grade / 10) * 10;
                        analysis.gradeDistribution[bracket] = 
                            (analysis.gradeDistribution[bracket] || 0) + 1;
                    }
                });
            });

            // Risk analysis
            const riskLevel = this.calculateStudentRiskLevel(student);
            analysis.riskAnalysis[riskLevel]++;
        });

        Logger.debug('DatasetGenerator', 'Dataset analysis complete', analysis);
        return analysis;
    }

    calculateStudentRiskLevel(student) {
        let missingCount = 0;
        let lateCount = 0;
        let totalSubmissions = 0;
        let averageGrade = 0;
        let gradedCount = 0;

        student.modules.forEach(module => {
            module.submissions.forEach(sub => {
                totalSubmissions++;
                if (sub.status === 'missing') missingCount++;
                if (sub.status === 'late') lateCount++;
                if (sub.grade) {
                    averageGrade += sub.grade;
                    gradedCount++;
                }
            });
        });

        averageGrade = gradedCount > 0 ? averageGrade / gradedCount : 0;
        const missedSubmissionRate = missingCount / totalSubmissions;
        const lateSubmissionRate = lateCount / totalSubmissions;

        if (missedSubmissionRate > 0.3 || averageGrade < 40) {
            return 'highRisk';
        } else if (missedSubmissionRate > 0.1 || lateSubmissionRate > 0.3 || averageGrade < 55) {
            return 'mediumRisk';
        } else {
            return 'lowRisk';
        }
    }
}

// Export for browser compatibility
window.DatasetGenerator = DatasetGenerator;
window.CONFIG = CONFIG;

// Function to generate data (maintains compatibility with previous implementation)
function generateDataset(numStudents = 100) {
    const generator = new DatasetGenerator();
    return generator.generateDataset(numStudents);
}

// Debug mode toggle
window.DEBUG_MODE = false;
window.toggleDebug = function(enable = true) {
    window.DEBUG_MODE = enable;
    Logger.debug('System', `Debug mode ${enable ? 'enabled' : 'disabled'}`);
};