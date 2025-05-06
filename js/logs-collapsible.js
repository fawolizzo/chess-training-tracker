// Training Log Management
const logEntries = document.getElementById('logEntries');

// Load saved log collapse states
let logCollapseStates = JSON.parse(localStorage.getItem('logCollapseStates')) || {};

// Log task completion
function logTask(task) {
    const logs = JSON.parse(localStorage.getItem('trainingLogs')) || [];
    const logEntry = {
        text: `Completed: ${task.name} (${task.duration}m)`,
        timestamp: new Date().toISOString()
    };
    
    logs.unshift(logEntry);
    localStorage.setItem('trainingLogs', JSON.stringify(logs));
    
    // Dispatch event for stats update
    window.dispatchEvent(new CustomEvent('taskCompleted'));
    
    // Update log display
    updateLogDisplay();
}

// Update log display
function updateLogDisplay() {
    const logs = JSON.parse(localStorage.getItem('trainingLogs')) || [];
    logEntries.innerHTML = '';
    
    // Group logs by date
    const groupedLogs = groupLogsByDate(logs);
    const dates = Object.keys(groupedLogs);
    
    // Create date groups
    dates.forEach((date, idx) => {
        const entries = groupedLogs[date];
        const dateGroup = document.createElement('div');
        dateGroup.className = 'log-date-group';
        
        const dateHeader = document.createElement('div');
        dateHeader.className = 'log-date-header';
        
        // Auto-collapse all but the most recent date unless user has toggled
        let isCollapsed = logCollapseStates.hasOwnProperty(date)
            ? logCollapseStates[date]
            : (idx !== 0); // Only the most recent (idx 0) is expanded
        
        // Save this default state if not already present
        if (!logCollapseStates.hasOwnProperty(date)) {
            logCollapseStates[date] = isCollapsed;
            localStorage.setItem('logCollapseStates', JSON.stringify(logCollapseStates));
        }
        
        dateHeader.setAttribute('tabindex', '0');
        dateHeader.setAttribute('role', 'button');
        dateHeader.setAttribute('aria-expanded', (!isCollapsed).toString());
        dateHeader.setAttribute('aria-controls', `log-entries-${date}`);
        dateHeader.innerHTML = `
            <span>${formatDateHeader(date)}</span>
            <i class="fas fa-chevron-${isCollapsed ? 'right' : 'down'}"></i>
        `;
        
        const entriesContainer = document.createElement('div');
        entriesContainer.className = 'log-entries-container';
        entriesContainer.id = `log-entries-${date}`;
        entriesContainer.style.display = isCollapsed ? 'none' : 'block';
        
        entries.forEach(entry => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.textContent = `${formatLogTime(entry.timestamp)} - ${entry.text}`;
            entriesContainer.appendChild(logEntry);
        });
        
        function toggleCollapse() {
            logCollapseStates[date] = !logCollapseStates[date];
            localStorage.setItem('logCollapseStates', JSON.stringify(logCollapseStates));
            entriesContainer.style.display = logCollapseStates[date] ? 'none' : 'block';
            dateHeader.querySelector('i').className = `fas fa-chevron-${logCollapseStates[date] ? 'right' : 'down'}`;
            dateHeader.setAttribute('aria-expanded', (!logCollapseStates[date]).toString());
        }
        dateHeader.addEventListener('click', toggleCollapse);
        dateHeader.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleCollapse();
            }
        });
        
        dateGroup.appendChild(dateHeader);
        dateGroup.appendChild(entriesContainer);
        logEntries.appendChild(dateGroup);
    });
}

// Group logs by date
function groupLogsByDate(logs) {
    return logs.reduce((groups, log) => {
        const date = new Date(log.timestamp).toDateString();
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(log);
        return groups;
    }, {});
}

// Format date header
function formatDateHeader(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
}

// Format time
function formatLogTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Initialize logs
function initializeLogs() {
    updateLogDisplay();
}

// Listen for task completion
window.addEventListener('taskCompleted', () => {
    updateLogDisplay();
});

// Initialize on load
document.addEventListener('DOMContentLoaded', initializeLogs); 