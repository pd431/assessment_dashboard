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

const Utils = {
    randomBetween: (min, max) => Math.floor(Math.random() * (max - min + 1) + min),
    
    chance: (probability) => Math.random() < probability,
    
    randomDate: (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())),
    
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    
    addDays: (date, days) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    },

    weightedRandom: (options) => {
        const total = Object.values(options).reduce((a, b) => a + b, 0);
        const threshold = Math.random() * total;
        let sum = 0;
        for (const [key, weight] of Object.entries(options)) {
            sum += weight;
            if (threshold <= sum) return key;
        }
        return Object.keys(options)[0];
    },

    // Date formatting functions
    formatDate: (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    },

    formatDateTime: (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
};

// Make formatDate globally available for backward compatibility
window.formatDate = Utils.formatDate;
window.formatDateTime = Utils.formatDateTime;