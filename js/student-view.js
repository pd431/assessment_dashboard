class StudentView {
    constructor(container) {
        this.container = container;
        this.LATE_SUBMISSION_WINDOW = 14; // Days after which submission is no longer allowed
    }

    render(studentData) {
        if (!studentData) return;

        // Process and categorize all assessments
        const assessments = studentData.modules.flatMap(module => {
            return module.assessments.map(assessment => {
                const submission = module.submissions.find(s => s.assessmentId === assessment.id);
                const dueDate = new Date(assessment.dueDate);
                const now = new Date();
                const daysUntil = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
                const daysOverdue = -daysUntil;
                
                return {
                    ...assessment,
                    moduleCode: module.code,
                    moduleName: module.name,
                    submission,
                    daysUntil,
                    isPast: daysUntil < 0,
                    isLate: daysUntil < 0 && daysOverdue <= this.LATE_SUBMISSION_WINDOW && 
                           (!submission || submission.status === 'missing'),
                    isSubmittable: daysOverdue <= this.LATE_SUBMISSION_WINDOW
                };
            });
        });

        // Categorize assessments
        const categorizedAssessments = {
            late: assessments.filter(a => a.isLate && a.isSubmittable)
                          .sort((a, b) => b.daysUntil - a.daysUntil),
            upcoming: assessments.filter(a => !a.isPast)
                              .sort((a, b) => a.daysUntil - b.daysUntil),
            past: assessments.filter(a => a.isPast && (!a.isLate || !a.isSubmittable))
                          .sort((a, b) => b.dueDate - a.dueDate)
        };

        // Calculate overall progress
        const totalAssessments = assessments.length;
        const completedAssessments = assessments.filter(a => 
            a.submission?.status === 'submitted' || a.submission?.status === 'late'
        ).length;
        const progressPercentage = Math.round((completedAssessments / totalAssessments) * 100);

        this.container.innerHTML = `
            <!-- Progress Overview -->
            <div class="mb-4">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title mb-3">Overall Progress</h6>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="text-muted">Completion</span>
                            <span class="fw-medium">${progressPercentage}%</span>
                        </div>
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar bg-primary" style="width: ${progressPercentage}%"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Late Submissions Section -->
            ${categorizedAssessments.late.length > 0 ? `
                <div class="card mb-3 border-danger">
                    <div class="card-header bg-danger text-white d-flex justify-content-between align-items-center py-2">
                        <h6 class="mb-0">Overdue Submissions</h6>
                        <span class="badge bg-white text-danger">${categorizedAssessments.late.length}</span>
                    </div>
                    <div class="list-group list-group-flush">
                        ${this.renderAssessmentsList(categorizedAssessments.late)}
                    </div>
                </div>
            ` : ''}

            <!-- Upcoming Section -->
            <div class="card mb-3">
                <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center py-2">
                    <h6 class="mb-0">Upcoming Submissions</h6>
                    <span class="badge bg-white text-primary">${categorizedAssessments.upcoming.length}</span>
                </div>
                <div class="list-group list-group-flush">
                    ${categorizedAssessments.upcoming.length > 0 ? 
                        this.renderAssessmentsList(categorizedAssessments.upcoming) :
                        '<div class="list-group-item text-muted">No upcoming submissions</div>'}
                </div>
            </div>

            <!-- Past Section -->
            <div class="card">
                <div class="card-header bg-secondary text-white d-flex justify-content-between align-items-center py-2">
                    <h6 class="mb-0">Past Submissions</h6>
                    <span class="badge bg-white text-secondary">${categorizedAssessments.past.length}</span>
                </div>
                <div class="list-group list-group-flush">
                    ${categorizedAssessments.past.length > 0 ? 
                        this.renderAssessmentsList(categorizedAssessments.past) :
                        '<div class="list-group-item text-muted">No past submissions</div>'}
                </div>
            </div>
        `;
    }

    renderAssessmentsList(assessments) {
        return assessments.map(assessment => {
            const dueDate = new Date(assessment.dueDate);
            const hasSubmission = assessment.submission?.status === 'submitted' || 
                                assessment.submission?.status === 'late';
            const isLate = assessment.isLate;
            const isPastSubmittable = !assessment.isSubmittable && !hasSubmission;
            
            return `
                <div class="list-group-item p-2">
                    <div class="row align-items-center g-2">
                        <div class="col-md-5">
                            <div class="d-flex align-items-center">
                                <div class="me-2">
                                    <i class="fas fa-${hasSubmission ? 'check-circle text-success' : 
                                                   isPastSubmittable ? 'times-circle text-secondary' :
                                                   isLate ? 'exclamation-circle text-danger' : 
                                                   'circle text-primary'} fa-lg"></i>
                                </div>
                                <div>
                                    <div class="mb-0 fw-medium">${assessment.title}</div>
                                    <small class="text-muted">${assessment.moduleCode} - ${assessment.moduleName}</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-calendar-alt text-muted me-2"></i>
                                <div>
                                    <small class="text-muted">Due: ${formatDate(dueDate)}</small>
                                    ${this.renderDaysIndicator(assessment.daysUntil, assessment.submission, assessment)}
                                </div>
                            </div>
                        </div>
                        <div class="col-md-2">
                            ${this.renderSubmissionStatus(assessment.submission, isPastSubmittable)}
                        </div>
                        <div class="col-md-2 text-end">
                            ${this.renderActionButton(assessment.submission, assessment.isSubmittable)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderDaysIndicator(daysUntil, submission, assessment) {
        if (submission?.status === 'submitted' || submission?.status === 'late') {
            const submissionDate = new Date(submission.submissionDate);
            const dueDate = new Date(assessment.dueDate);
            const daysDifference = Math.round((submissionDate - dueDate) / (1000 * 60 * 60 * 24));
            
            if (daysDifference < 0) {
                return `<div class="text-success"><small>Submitted ${Math.abs(daysDifference)} days early</small></div>`;
            } else if (daysDifference === 0) {
                return `<div class="text-success"><small>Submitted on due date</small></div>`;
            } else {
                return `<div class="text-warning"><small>Submitted ${daysDifference} days late</small></div>`;
            }
        } else {
            const isPastSubmittable = Math.abs(daysUntil) > this.LATE_SUBMISSION_WINDOW;
            
            if (daysUntil < 0) {
                if (isPastSubmittable) {
                    return `<div class="text-secondary"><small>Submission closed</small></div>`;
                }
                return `<div class="text-danger"><small>Overdue by ${Math.abs(daysUntil)} days</small></div>`;
            }
            if (daysUntil === 0) {
                return `<div class="text-danger"><small>Due today</small></div>`;
            }
            if (daysUntil === 1) {
                return `<div class="text-warning"><small>Due tomorrow</small></div>`;
            }
            if (daysUntil <= 7) {
                return `<div class="text-warning"><small>Due in ${daysUntil} days</small></div>`;
            }
            return `<div class="text-muted"><small>Due in ${daysUntil} days</small></div>`;
        }
    }

    renderSubmissionStatus(submission, isPastSubmittable) {
        if (!submission) {
            if (isPastSubmittable) {
                return `
                    <div class="text-secondary">
                        <small>
                            <i class="fas fa-times me-1"></i>
                            Not Submitted
                        </small>
                    </div>
                `;
            }
            return '';
        }
        
        if (submission.grade) {
            return `
                <div class="text-success">
                    <small>
                        <i class="fas fa-check me-1"></i>
                        Grade: ${submission.grade}%
                    </small>
                </div>
            `;
        }

        if (submission.status === 'submitted' || submission.status === 'late') {
            return `
                <div class="text-success">
                    <small>
                        <i class="fas fa-check me-1"></i>
                        Submitted
                    </small>
                </div>
            `;
        }

        if (submission.status === 'missing' && !isPastSubmittable) {
            return `
                <div class="text-danger">
                    <small>
                        <i class="fas fa-exclamation-circle me-1"></i>
                        Not Submitted
                    </small>
                </div>
            `;
        }

        return '';
    }

    renderActionButton(submission, isSubmittable) {
        if (submission?.status === 'submitted' || submission?.status === 'late') {
            return `
                <button class="btn btn-sm btn-outline-primary">
                    <i class="fas fa-eye me-1"></i>View
                </button>
            `;
        }
        
        if (!isSubmittable) {
            return ''; // No button for past-submittable assignments
        }

        return `
            <button class="btn btn-sm btn-primary text-light">
                <i class="fas fa-upload me-1"></i>Submit
            </button>
        `;
    }
}