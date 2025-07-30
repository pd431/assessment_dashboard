class App {
    constructor() {
        this.data = null;
        this.currentRole = 'student';
        this.selectedStudent = null;
        
        // Store DOM elements
        this.elements = {
            roleButtons: document.querySelectorAll('#roleSelector button'),
            studentSelector: document.getElementById('studentSelector'),
            studentSelect: document.getElementById('studentSelect'),
            views: {
                student: document.getElementById('studentView'),
                teacher: document.getElementById('teacherView'),
                tutor: document.getElementById('tutorView')
            }
        };

        this.initialize();
    }

    initialize() {
        // Generate initial data
        this.data = generateDataset(100);
        
        // Initialize views
        this.studentView = new StudentView(this.elements.views.student);
        this.teacherView = new TeacherView(this.elements.views.teacher);
        this.tutorView = new TutorView(this.elements.views.tutor);

        // Set initial student
        this.selectedStudent = this.data[0];
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Populate student selector
        this.populateStudentSelector();

        // Show initial view
        this.switchToRole('student');

        // Make app globally accessible
        window.app = this;
    }

    setupEventListeners() {
        // Role selection
        this.elements.roleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const role = button.dataset.role;
                if (role) {
                    this.switchToRole(role);
                }
            });
        });

        // Student selection
        this.elements.studentSelect.addEventListener('change', (e) => {
            this.selectedStudent = this.data.find(s => s.id === e.target.value);
            this.updateCurrentView();
        });
    }

    populateStudentSelector() {
        this.elements.studentSelect.innerHTML = this.data.map(student => `
            <option value="${student.id}">
                ${student.name} - ${student.program}
            </option>
        `).join('');
    }

    switchToRole(role) {
        // Update button states
        this.elements.roleButtons.forEach(btn => {
            if (btn.dataset.role === role) {
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-light');
            } else {
                btn.classList.remove('btn-light');
                btn.classList.add('btn-primary');
            }
        });

        // Show/hide student selector
        this.elements.studentSelector.style.display = 
            role === 'student' ? 'block' : 'none';

        // Show/hide views
        Object.entries(this.elements.views).forEach(([viewRole, element]) => {
            element.style.display = viewRole === role ? 'block' : 'none';
        });

        // Update current role and view
        this.currentRole = role;
        this.updateCurrentView();
    }

    updateCurrentView() {
        switch (this.currentRole) {
            case 'student':
                this.studentView.render(this.selectedStudent);
                break;
            case 'teacher':
                this.teacherView.render(this.data);
                break;
            case 'tutor':
                this.tutorView.render(this.data);
                break;
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});