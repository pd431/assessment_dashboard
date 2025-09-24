// dataset-generator.js - Main dataset generation


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
            const assessments = this.assessmentGenerator.generateForModule(moduleCode, term, studentProfile);
            const submissions = assessments.map(assessment => 
                this.submissionGenerator.generateSubmission(studentProfile, assessment)
            );

            Logger.debug('ModuleGenerator', `Generated module ${moduleCode}`, {
                moduleCode,
                assessmentsCount: assessments.length,
                submissionsCount: submissions.length,
                extensionsCount: assessments.filter(a => a.hasExtension).length
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
}

// Export for browser compatibility
window.DatasetGenerator = DatasetGenerator;

// Function to generate data (maintains compatibility with previous implementation)
function generateDataset(numStudents = 100) {
    const generator = new DatasetGenerator();
    return generator.generateDataset(numStudents);
}
