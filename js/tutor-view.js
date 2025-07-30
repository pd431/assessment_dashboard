class TutorView {
    constructor(container) {
        this.container = container;
        this.currentFilter = 'all';
        this.selectedProgram = 'all';
        this.LATE_SUBMISSION_WINDOW = 14; // Match with StudentView
    }

    render(studentsData) {
        // Process student data for overview stats
        const stats = this.calculateTuteeStats(studentsData);
        const filteredStudents = this.filterStudents(studentsData);

        this.container.innerHTML = `
            <!-- Summary Stats -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card bg-primary text-light">
                        <div class="card-body">
                            <h6 class="card-title">My Tutees</h6>
                            <h2 class="mb-0">${studentsData.length}</h2>
                            <small>across ${stats.programCount} programmes</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card ${stats.needsAttention > 0 ? 'bg-warning' : 'bg-secondary text-light'}">
                        <div class="card-body">
                            <h6 class="card-title">Needs Attention</h6>
                            <h2 class="mb-0">${stats.needsAttention}</h2>
                            <small>showing concerning patterns</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card ${stats.highRisk > 0 ? 'bg-danger text-light' : 'bg-secondary text-light'}">
                        <div class="card-body">
                            <h6 class="card-title">High Risk</h6>
                            <h2 class="mb-0">${stats.highRisk}</h2>
                            <small>multiple missed deadlines</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success text-light">
                        <div class="card-body">
                            <h6 class="card-title">Good Standing</h6>
                            <h2 class="mb-0">${stats.goodStanding}</h2>
                            <small>on track</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Controls -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-4">
                            <select class="form-select" onchange="app.tutorView.setProgram(this.value)">
                                <option value="all">All Programs</option>
                                ${this.getProgramOptions(studentsData)}
                            </select>
                        </div>
                        <div class="col-md-8">
                            <div class="btn-group w-100">
                                <button class="btn btn-outline-primary ${this.currentFilter === 'all' ? 'active' : ''}" 
                                        onclick="app.tutorView.setFilter('all')">
                                    All Students
                                </button>
                                <button class="btn btn-outline-warning ${this.currentFilter === 'attention' ? 'active' : ''}"
                                        onclick="app.tutorView.setFilter('attention')">
                                    Needs Attention
                                </button>
                                <button class="btn btn-outline-danger ${this.currentFilter === 'high-risk' ? 'active' : ''}"
                                        onclick="app.tutorView.setFilter('high-risk')">
                                    High Risk
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Students List -->
            <div class="card mb-4">
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Student</th>
                                <th>Programme</th>
                                <th>Recent Activity</th>
                                <th>Submission Pattern</th>
                                <th>Academic Standing</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.renderStudentRows(filteredStudents)}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Upcoming Deadlines -->
            <div class="card">
                <div class="card-header bg-white d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Upcoming Deadlines</h5>
                </div>
                <div class="table-responsive">
                    <table class="table table-sm mb-0">
                        <thead>
                            <tr>
                                <th>Module</th>
                                <th>Assessment</th>
                                <th>Due Date</th>
                                <th>Submission Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.renderUpcomingDeadlines(this.getUpcomingDeadlines(studentsData))}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    calculateTuteeStats(students) {
        const programs = new Set(students.map(s => s.program));
        const studentStats = students.map(student => {
            const stats = this.calculateStudentStats(student);
            return {
                student,
                stats,
                riskLevel: this.getStudentRiskLevel(stats)
            };
        });

        return {
            programCount: programs.size,
            needsAttention: studentStats.filter(s => s.riskLevel === 'attention').length,
            highRisk: studentStats.filter(s => s.riskLevel === 'high-risk').length,
            goodStanding: studentStats.filter(s => s.riskLevel === 'good').length
        };
    }

    calculateStudentStats(student) {
        let totalSubmissions = 0;
        let missingSubmissions = 0;
        let lateSubmissions = 0;
        let onTimeSubmissions = 0;
        let totalGrades = 0;
        let gradedCount = 0;
        const now = new Date();

        student.modules.forEach(module => {
            module.submissions.forEach((submission, index) => {
                const assessment = module.assessments[index];
                const dueDate = new Date(assessment.dueDate);
                const submissionDate = submission.submissionDate ? new Date(submission.submissionDate) : null;
                totalSubmissions++;

                if (!submissionDate) {
                    // Check if it's past the late submission window
                    const daysOverdue = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));
                    if (daysOverdue > this.LATE_SUBMISSION_WINDOW) {
                        missingSubmissions++;
                    }
                } else {
                    const daysDifference = Math.ceil((submissionDate - dueDate) / (1000 * 60 * 60 * 24));
                    if (daysDifference > 0) {
                        lateSubmissions++;
                    } else {
                        onTimeSubmissions++;
                    }
                }

                if (submission.grade) {
                    totalGrades += submission.grade;
                    gradedCount++;
                }
            });
        });

        return {
            totalSubmissions,
            missingSubmissions,
            lateSubmissions,
            onTimeSubmissions,
            averageGrade: gradedCount > 0 ? Math.round(totalGrades / gradedCount) : null
        };
    }

    renderStudentRows(students) {
        return students.map(student => {
            const stats = this.calculateStudentStats(student);
            const riskLevel = this.getStudentRiskLevel(stats);
            const lastSubmission = this.getLastSubmissionDate(student);

            return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <span class="badge bg-${this.getRiskColor(riskLevel)} me-2">&nbsp;</span>
                            <div>
                                <div class="fw-bold">${student.name}</div>
                                <small class="text-muted">Year ${student.year}</small>
                            </div>
                        </div>
                    </td>
                    <td>${student.program}</td>
                    <td>
                        ${this.renderActivityStatus(stats, lastSubmission)}
                    </td>
                    <td>
                        <div class="d-flex gap-1">
                            <span class="badge bg-success">${stats.onTimeSubmissions} On time</span>
                            ${stats.lateSubmissions > 0 ? 
                                `<span class="badge bg-warning">${stats.lateSubmissions} Late</span>` : ''}
                            ${stats.missingSubmissions > 0 ? 
                                `<span class="badge bg-danger">${stats.missingSubmissions} Missing</span>` : ''}
                        </div>
                    </td>
                    <td>
                        ${this.renderAcademicStanding(stats)}
                    </td>
                    <td>
                        <button class="btn btn-primary btn-sm text-light" 
                                onclick="app.tutorView.viewStudentDetails('${student.id}')">
                            View Details
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderActivityStatus(stats, lastSubmission) {
        if (stats.missingSubmissions > 0) {
            const nonSubmissionRate = (stats.missingSubmissions / stats.totalSubmissions);
            const nonSubmissionPercent = Math.round(nonSubmissionRate * 100);
            return `
                <div class="text-danger">
                    <i class="fas fa-exclamation-triangle me-1"></i>
                    ${nonSubmissionPercent}% non-submission rate
                </div>
                <small class="text-muted">Last submission: ${lastSubmission}</small>
            `;
        }
        if (stats.lateSubmissions > 0) {
            const lateRate = (stats.lateSubmissions / stats.totalSubmissions);
            const latePercent = Math.round(lateRate * 100);
            return `
                <div class="text-warning">
                    <i class="fas fa-clock me-1"></i>
                    ${latePercent}% late submissions
                </div>
                <small class="text-muted">Last submission: ${lastSubmission}</small>
            `;
        }
        return `
            <div class="text-success">
                <i class="fas fa-check me-1"></i>
                All submissions up to date
            </div>
            <small class="text-muted">Last submission: ${lastSubmission}</small>
        `;
	}

    renderAcademicStanding(stats) {
        if (!stats.averageGrade) return 'No grades yet';

        return `
            <div class="d-flex align-items-center">
                <div class="progress flex-grow-1 me-2" style="height: 8px;">
                    <div class="progress-bar ${this.getGradeColor(stats.averageGrade)}" 
                         style="width: ${stats.averageGrade}%">
                    </div>
                </div>
                <span>${stats.averageGrade}%</span>
            </div>
        `;
    }

    getUpcomingDeadlines(students) {
        const deadlines = new Map();
        const now = new Date();

        students.forEach(student => {
            student.modules.forEach(module => {
                module.assessments.forEach((assessment, index) => {
                    const dueDate = new Date(assessment.dueDate);
                    if (dueDate > now) {
                        const key = `${module.code}_${assessment.id}`;
                        if (!deadlines.has(key)) {
                            deadlines.set(key, {
                                moduleCode: module.code,
                                title: assessment.title,
                                dueDate: dueDate,
                                notSubmitted: 0,
                                totalStudents: 0
                            });
                        }
                        
                        const deadline = deadlines.get(key);
                        deadline.totalStudents++;
                        
                        const submission = module.submissions[index];
                        if (!submission?.submissionDate) {
                            deadline.notSubmitted++;
                        }
                    }
                });
            });
        });

        return Array.from(deadlines.values())
            .sort((a, b) => a.dueDate - b.dueDate)
            .map(deadline => ({
                ...deadline,
                submissionRate: Math.round(((deadline.totalStudents - deadline.notSubmitted) / deadline.totalStudents) * 100)
            }))
            .slice(0, 5);
    }

    renderUpcomingDeadlines(deadlines) {
        return deadlines.map(deadline => `
            <tr>
                <td>${deadline.moduleCode}</td>
                <td>${deadline.title}</td>
                <td>${formatDate(deadline.dueDate)}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="progress flex-grow-1 me-2" style="height: 8px;">
                            <div class="progress-bar ${deadline.submissionRate < 50 ? 'bg-danger' : 
                                                     deadline.submissionRate < 80 ? 'bg-warning' : 
                                                     'bg-success'}" 
                                 style="width: ${deadline.submissionRate}%">
                            </div>
                        </div>
                        <small>${deadline.notSubmitted} remaining</small>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getStudentRiskLevel(stats) {
        if (!stats) return 'good';

        const missedRate = stats.missingSubmissions / stats.totalSubmissions;
        const lateRate = stats.lateSubmissions / stats.totalSubmissions;
        const averageGrade = stats.averageGrade || 0;

        if (missedRate > 0.3 || averageGrade < 40) {
            return 'high-risk';
        } else if (missedRate > 0.1 || lateRate > 0.3 || averageGrade < 55) {
            return 'attention';
        }
        return 'good';
    }

    getRiskColor(risk) {
        switch (risk) {
            case 'high-risk': return 'danger';
            case 'attention': return 'warning';
            default: return 'success';
        }
    }

    getGradeColor(grade) {
        if (grade >= 70) return 'bg-success';
        if (grade >= 60) return 'bg-primary';
        if (grade >= 50) return 'bg-warning';
        return 'bg-danger';
    }

    getLastSubmissionDate(student) {
        const submissions = student.modules
            .flatMap(m => m.submissions)
            .filter(s => s.submissionDate)
            .map(s => new Date(s.submissionDate));
        
        if (submissions.length === 0) return 'No submissions';
        
        const lastDate = new Date(Math.max(...submissions));
        const days = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
        
        return days === 0 ? 'Today' : 
               days === 1 ? 'Yesterday' : 
               `${days} days ago`;
    }

    getProgramOptions(students) {
        const programs = [...new Set(students.map(s => s.program))];
        return programs.map(program => 
            `<option value="${program}" ${this.selectedProgram === program ? 'selected' : ''}>
                ${program}
            </option>`
        ).join('');
    }

    filterStudents(students) {
        return students.filter(student => {
            if (this.selectedProgram !== 'all' && student.program !== this.selectedProgram) {
                return false;
            }

            const stats = this.calculateStudentStats(student);
            const risk = this.getStudentRiskLevel(stats);

            switch (this.currentFilter) {
                case 'attention':
                    return risk === 'attention';
                case 'high-risk':
                    return risk === 'high-risk';
                default:
                    return true;
            }
        });
    }

    // Event handlers
    setFilter(filter) {
        this.currentFilter = filter;
        app.updateCurrentView();
    }

    setProgram(program) {
        this.selectedProgram = program;
        app.updateCurrentView();
    }

    viewStudentDetails(studentId) {
        const student = app.data.find(s => s.id === studentId);
        if (student) {
            // Select the student in the app
            app.selectedStudent = student;
            // Switch to student view
            app.switchToRole('student');
        }
    }
}