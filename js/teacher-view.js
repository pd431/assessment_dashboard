class TeacherView {
    constructor(container) {
        this.container = container;
        this.MARKING_DEADLINE_DAYS = 21; // 3 weeks marking deadline
        this.MARKING_DEADLINE_WARNING = 7; // Warning when within 7 days of deadline
    }

    processAssessmentData(studentsData) {
        const now = new Date();
        const assessmentMap = new Map();

        // Process all students' modules and assessments
        studentsData.forEach(student => {
            student.modules.forEach(module => {
                module.assessments.forEach((assessment, index) => {
                    const dueDate = new Date(assessment.dueDate);
                    if (dueDate > now) return; // Skip future assessments

                    const submission = module.submissions[index];
                    const key = `${module.code}_${assessment.id}`;

                    if (!assessmentMap.has(key)) {
                        const markingDeadline = new Date(dueDate);
                        markingDeadline.setDate(markingDeadline.getDate() + this.MARKING_DEADLINE_DAYS);

                        assessmentMap.set(key, {
                            id: assessment.id,
                            moduleCode: module.code,
                            moduleName: module.name,
                            title: assessment.title,
                            dueDate: dueDate,
                            markingDeadline: markingDeadline,
                            totalSubmissions: 0,
                            markedSubmissions: 0,
                            submissions: []
                        });
                    }

                    const assessmentData = assessmentMap.get(key);
                    
                    // Only count actual submissions
                    if (submission?.submissionDate && 
                        (submission.status === 'submitted' || submission.status === 'late')) {
                        assessmentData.totalSubmissions++;
                        if (submission.grade) {
                            assessmentData.markedSubmissions++;
                        }
                        
                        assessmentData.submissions.push({
                            studentId: student.id,
                            studentName: student.name,
                            submissionDate: new Date(submission.submissionDate),
                            grade: submission.grade,
                            feedback: submission.feedback
                        });
                    }
                });
            });
        });

        // Convert to array and sort
        const assessments = Array.from(assessmentMap.values());

        // Split into incomplete and completed
        const incompleteAssessments = assessments
            .filter(a => a.markedSubmissions < a.totalSubmissions)
            .sort((a, b) => {
                // Sort by marking deadline
                return a.markingDeadline - b.markingDeadline;
            });

        const completedAssessments = assessments
            .filter(a => a.markedSubmissions === a.totalSubmissions && a.totalSubmissions > 0)
            .sort((a, b) => {
                // Sort by due date, most recent first
                return b.dueDate - a.dueDate;
            });

        return {
            incompleteAssessments,
            completedAssessments
        };
    }

    calculateMarkingStats(assessmentData) {
        const now = new Date();
        const warningDate = new Date(now.getTime() + (this.MARKING_DEADLINE_WARNING * 24 * 60 * 60 * 1000));

        let toMark = 0;
        let completed = 0;
        let approachingDeadline = 0;

        assessmentData.incompleteAssessments.forEach(assessment => {
            const unmarkedCount = assessment.totalSubmissions - assessment.markedSubmissions;
            toMark += unmarkedCount;

            if (assessment.markingDeadline <= warningDate) {
                approachingDeadline += unmarkedCount;
            }
        });

        assessmentData.completedAssessments.forEach(assessment => {
            completed += assessment.markedSubmissions;
        });

        return {
            toMark,
            completed,
            approachingDeadline,
            incompleteAssessments: assessmentData.incompleteAssessments.length
        };
    }

    renderAssessmentSection(title, assessments, type) {
        if (assessments.length === 0) return '';

        return `
            <div class="card mb-4">
                <div class="card-header bg-white">
                    <h5 class="mb-0">${title}</h5>
                </div>
                <div class="list-group list-group-flush">
                    ${assessments.map(assessment => this.renderAssessmentItem(assessment, type)).join('')}
                </div>
            </div>
        `;
    }

    renderAssessmentItem(assessment, type) {
        const now = new Date();
        const isOverdue = assessment.markingDeadline < now;
        const progressPercentage = Math.round((assessment.markedSubmissions / assessment.totalSubmissions) * 100);
        const remainingToMark = assessment.totalSubmissions - assessment.markedSubmissions;

        return `
            <div class="list-group-item p-3">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <div class="d-flex align-items-center">
                            <div class="me-3">
                                ${type === 'incomplete' ? `
                                    <span class="badge rounded-pill ${isOverdue ? 'bg-danger' : 'bg-warning'} p-2">
                                        <i class="fas fa-${isOverdue ? 'exclamation' : 'clock'} fa-lg"></i>
                                    </span>
                                ` : `
                                    <span class="badge rounded-pill bg-success p-2">
                                        <i class="fas fa-check fa-lg"></i>
                                    </span>
                                `}
                            </div>
                            <div>
                                <h6 class="mb-1">${assessment.title}</h6>
                                <small class="text-muted">${assessment.moduleCode} - ${assessment.moduleName}</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="d-flex flex-column">
                            <small class="text-muted mb-1">
                                Due: ${Utils.formatDate(assessment.dueDate)}
                            </small>
                            ${type === 'incomplete' ? `
                                <small class="${isOverdue ? 'text-danger' : 'text-warning'}">
                                    Marking deadline: ${Utils.formatDate(assessment.markingDeadline)}
                                </small>
                            ` : ''}
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="text-end">
                            ${type === 'incomplete' && remainingToMark > 0 ? `
                                <div class="text-muted small mb-1">${remainingToMark} to mark</div>
                            ` : ''}
                            <div class="d-flex align-items-center justify-content-end">
                                <div class="progress flex-grow-1 me-2" style="height: 6px;">
                                    <div class="progress-bar ${this.getProgressBarColor(progressPercentage)}" 
                                         style="width: ${progressPercentage}%">
                                    </div>
                                </div>
                                <small class="text-muted">${progressPercentage}%</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getProgressBarColor(percentage) {
        if (percentage === 100) return 'bg-success';
        if (percentage >= 75) return 'bg-primary';
        if (percentage >= 50) return 'bg-warning';
        return 'bg-danger';
    }

    render(studentsData) {
        const assessmentData = this.processAssessmentData(studentsData);
        const stats = this.calculateMarkingStats(assessmentData);

        this.container.innerHTML = `
            <!-- Marking Overview -->
            <div class="row mb-4">
                <div class="col-md-4">
                    <div class="card ${stats.toMark > 0 ? 'border-primary' : ''}">
                        <div class="card-body text-center">
                            <h6 class="text-muted mb-2">Submissions to Mark</h6>
                            <h2 class="mb-0">${stats.toMark}</h2>
                            <small class="text-muted">across ${stats.incompleteAssessments} assessments</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card ${stats.approachingDeadline > 0 ? 'border-warning' : ''}">
                        <div class="card-body text-center">
                            <h6 class="text-muted mb-2">Approaching Deadlines</h6>
                            <h2 class="mb-0">${stats.approachingDeadline}</h2>
                            <small class="text-muted">due within 7 days</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body text-center">
                            <h6 class="text-muted mb-2">Completed Marking</h6>
                            <h2 class="mb-0">${stats.completed}</h2>
                            <small class="text-muted">with feedback provided</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Incomplete Assessments Section -->
            ${this.renderAssessmentSection(
                'Incomplete Marking',
                assessmentData.incompleteAssessments,
                'incomplete'
            )}

            <!-- Completed Assessments Section -->
            ${this.renderAssessmentSection(
                'Completed Assessments',
                assessmentData.completedAssessments,
                'completed'
            )}
        `;
    }
}