// Task Management
const taskForm = document.getElementById('taskForm');
const taskListIncomplete = document.getElementById('taskListIncomplete');

// Data Management Buttons
const exportDataBtn = document.getElementById('exportDataBtn');
const importDataBtn = document.getElementById('importDataBtn');
const importFileInput = document.getElementById('importFileInput');
const resetPlanBtn = document.getElementById('resetPlanBtn');

// Load saved tasks
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let activeTimer = null;
let activeTaskId = null;

// Load saved timer state
let timerState = JSON.parse(localStorage.getItem('timerState')) || null;

// Progress Chart Logic
let progressChart = null;

// Simple Progress Chart: last 7 days, minutes trained, static bar chart
function getTrainingDataForChartSimple(days = 7) {
    const logs = JSON.parse(localStorage.getItem('trainingLogs')) || [];
    const dateMap = {};
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        dateMap[key] = 0;
    }
    logs.forEach(log => {
        const dateKey = new Date(log.timestamp).toISOString().slice(0, 10);
        const match = log.text.match(/\((\d+)m\)/);
        if (dateMap.hasOwnProperty(dateKey) && match) {
            dateMap[dateKey] += parseInt(match[1], 10);
        }
    });
    return {
        labels: Object.keys(dateMap).map(d => {
            const date = new Date(d);
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }),
        data: Object.values(dateMap)
    };
}

function getTrainingDataForChart(days = 7, dataType = 'minutes') {
    const logs = JSON.parse(localStorage.getItem('trainingLogs')) || [];
    const dateMap = {};
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        dateMap[key] = 0;
    }
    logs.forEach(log => {
        const dateKey = new Date(log.timestamp).toISOString().slice(0, 10);
        if (dateMap.hasOwnProperty(dateKey)) {
            if (dataType === 'minutes') {
                const match = log.text.match(/\((\d+)m\)/);
                if (match) dateMap[dateKey] += parseInt(match[1], 10);
            } else if (dataType === 'tasks') {
                dateMap[dateKey] += 1;
            }
        }
    });
    return {
        labels: Object.keys(dateMap).map(d => {
            const date = new Date(d);
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }),
        data: Object.values(dateMap)
    };
}

function renderProgressChart() {
    const chartType = document.getElementById('chartTypeSelect')?.value || 'bar';
    const days = parseInt(document.getElementById('chartRangeSelect')?.value || '7', 10);
    const dataType = document.getElementById('chartDataTypeSelect')?.value || 'minutes';
    const ctx = document.getElementById('progressChart').getContext('2d');
    const chartData = getTrainingDataForChart(days, dataType);
    if (progressChart) progressChart.destroy();
    progressChart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: chartData.labels,
            datasets: [{
                label: dataType === 'minutes' ? 'Minutes Trained' : 'Tasks Completed',
                data: chartData.data,
                backgroundColor: chartType === 'bar' ? 'rgba(52, 152, 219, 0.6)' : 'rgba(52, 152, 219, 0.2)',
                borderColor: 'rgba(41, 128, 185, 1)',
                borderWidth: 2,
                borderRadius: chartType === 'bar' ? 6 : 0,
                fill: chartType === 'line',
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: dataType === 'minutes' ? 'Minutes' : 'Tasks' }
                }
            }
        }
    });
}

// Initialize task lists
function initializeTasks() {
    taskListIncomplete.innerHTML = '';
    tasks.filter(task => task.status === 'incomplete').forEach(task => {
        addTaskToDOM(task, taskListIncomplete);
    });
}

// On page load, check for active timer and resume if needed
window.addEventListener('DOMContentLoaded', () => {
    initializeTasks();
    if (timerState && timerState.taskId) {
        const task = tasks.find(t => t.id === timerState.taskId && t.status === 'incomplete');
        if (task) {
            if (timerState.endTime) {
                // Timer was running
                const now = Date.now();
                let timeLeft = Math.max(0, Math.floor((timerState.endTime - now) / 1000));
                if (timeLeft > 0) {
                    task.remainingTime = timeLeft;
                    setTimeout(() => {
                        const taskElement = document.querySelector(`.task-item[data-id="${task.id}"]`);
                        if (taskElement) {
                            const startBtn = taskElement.querySelector('.start-timer');
                            const pauseBtn = taskElement.querySelector('.pause-timer');
                            handleStartPauseResume(task.id, startBtn, pauseBtn);
                        }
                    }, 100);
                } else {
                    completeTask(task.id);
                }
            } else if (timerState.remainingTime > 0) {
                // Timer was paused
                task.remainingTime = timerState.remainingTime;
                // No need to auto-resume
            }
        }
        // Clean up timerState
        localStorage.removeItem('timerState');
    }
    renderProgressChart();
});

// Add new task
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (!window.isProfileComplete()) {
        alert('Please complete your profile before adding tasks');
        return;
    }
    
    const taskName = document.getElementById('taskName').value.trim();
    const taskDuration = parseInt(document.getElementById('taskDuration').value);
    
    if (!taskName || !taskDuration || taskDuration < 1) {
        alert('Please enter valid task details');
        return;
    }
    
    const task = {
        id: Date.now().toString(),
        name: taskName,
        duration: taskDuration,
        remainingTime: taskDuration * 60, // in seconds
        status: 'incomplete'
    };
    
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    addTaskToDOM(task, taskListIncomplete);
    taskForm.reset();
    renderProgressChart();
});

// Add task to DOM
function addTaskToDOM(task, container) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-item ${task.status}`;
    taskElement.dataset.id = task.id;
    // Always show correct timer in MM:SS
    let displayTime = task.remainingTime;
    if (task.status === 'complete') displayTime = 0;
    taskElement.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.status === 'complete' ? 'checked disabled' : ''}>
        <span class="task-name">${task.name} (${task.duration}m)</span>
        <span class="task-timer">${formatTime(displayTime)}</span>
        <button class="btn primary start-timer" ${task.status === 'complete' ? 'disabled' : ''}>Start</button>
        <button class="btn pause-timer" disabled>Pause</button>
    `;
    const checkbox = taskElement.querySelector('.task-checkbox');
    const startBtn = taskElement.querySelector('.start-timer');
    const pauseBtn = taskElement.querySelector('.pause-timer');
    checkbox.addEventListener('change', () => completeTask(task.id));
    startBtn.addEventListener('click', () => handleStartPauseResume(task.id, startBtn, pauseBtn));
    pauseBtn.addEventListener('click', () => handlePause(task.id, startBtn, pauseBtn));
    container.appendChild(taskElement);
    // Disable start buttons if another timer is running
    if (activeTimer && activeTaskId !== task.id) {
        startBtn.disabled = true;
    }
}

function handleStartPauseResume(taskId, startBtn, pauseBtn) {
    if (activeTimer && activeTaskId !== taskId) {
        alert('Please complete or pause the current task first');
        return;
    }
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === 'complete') return;
    if (activeTimer && activeTaskId === taskId) {
        // Resume
        startTimer(taskId, startBtn, pauseBtn);
        return;
    }
    // Start
    startTimer(taskId, startBtn, pauseBtn);
    // Disable all other start buttons
    document.querySelectorAll('.start-timer').forEach(btn => {
        if (btn !== startBtn) btn.disabled = true;
    });
}

function startTimer(taskId, startBtn, pauseBtn) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    if (activeTimer) clearInterval(activeTimer);
    activeTaskId = taskId;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    startBtn.textContent = 'Start';
    pauseBtn.textContent = 'Pause';
    const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);
    const checkbox = taskElement.querySelector('.task-checkbox');
    checkbox.disabled = true;
    // Calculate endTime and save to localStorage
    const endTime = Date.now() + task.remainingTime * 1000;
    localStorage.setItem('timerState', JSON.stringify({ taskId, endTime }));
    // Immediately show the current time (do not decrement yet)
    let lastDisplayed = task.remainingTime;
    taskElement.querySelector('.task-timer').textContent = formatTime(lastDisplayed);
    activeTimer = setInterval(() => {
        let now = Date.now();
        let timeLeft = Math.max(0, Math.round((endTime - now) / 1000));
        if (timeLeft !== lastDisplayed) {
            task.remainingTime = timeLeft;
            taskElement.querySelector('.task-timer').textContent = formatTime(timeLeft);
            lastDisplayed = timeLeft;
        }
        if (timeLeft <= 0) {
            clearInterval(activeTimer);
            activeTimer = null;
            activeTaskId = null;
            localStorage.removeItem('timerState');
            completeTask(taskId);
            document.querySelectorAll('.start-timer').forEach(btn => btn.disabled = false);
        }
    }, 250);
}

function handlePause(taskId, startBtn, pauseBtn) {
    if (!activeTimer || activeTaskId !== taskId) return;
    clearInterval(activeTimer);
    activeTimer = null;
    activeTaskId = null;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    startBtn.textContent = 'Resume';
    pauseBtn.textContent = 'Pause';
    const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);
    const checkbox = taskElement.querySelector('.task-checkbox');
    checkbox.disabled = false;
    // Save remainingTime to localStorage (paused state)
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        localStorage.setItem('timerState', JSON.stringify({ taskId, remainingTime: task.remainingTime }));
    }
    document.querySelectorAll('.start-timer').forEach(btn => btn.disabled = false);
}

function completeTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === 'complete') return;
    if (activeTimer && activeTaskId === taskId) {
        clearInterval(activeTimer);
        activeTimer = null;
        activeTaskId = null;
    }
    localStorage.removeItem('timerState');
    task.status = 'complete';
    task.remainingTime = 0;
    localStorage.setItem('tasks', JSON.stringify(tasks));
    const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);
    if (taskElement && taskListIncomplete.contains(taskElement)) {
        taskListIncomplete.removeChild(taskElement);
    }
    logTask(task);
    updateStats();
    document.querySelectorAll('.start-timer').forEach(btn => btn.disabled = false);
    renderProgressChart();
}

// Helper functions
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Export Data
exportDataBtn.addEventListener('click', () => {
    const data = {
        profile: JSON.parse(localStorage.getItem('profile') || '{}'),
        tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
        trainingLogs: JSON.parse(localStorage.getItem('trainingLogs') || '[]'),
        achievements: JSON.parse(localStorage.getItem('achievements') || '[]'),
        logCollapseStates: JSON.parse(localStorage.getItem('logCollapseStates') || '{}')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chess_training_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Import Data
importDataBtn.addEventListener('click', () => {
    importFileInput.click();
});

importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);
            if (data.profile) localStorage.setItem('profile', JSON.stringify(data.profile));
            if (data.tasks) localStorage.setItem('tasks', JSON.stringify(data.tasks));
            if (data.trainingLogs) localStorage.setItem('trainingLogs', JSON.stringify(data.trainingLogs));
            if (data.achievements) localStorage.setItem('achievements', JSON.stringify(data.achievements));
            if (data.logCollapseStates) localStorage.setItem('logCollapseStates', JSON.stringify(data.logCollapseStates));
            window.location.reload();
        } catch (err) {
            alert('Invalid file format.');
        }
    };
    reader.readAsText(file);
});

// Reset Training Plan
resetPlanBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset your training plan? This will delete all your data.')) {
        localStorage.clear();
        window.location.reload();
    }
});

// Attach event listeners for chart controls if they exist
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('chartTypeSelect'))
        document.getElementById('chartTypeSelect').addEventListener('change', renderProgressChart);
    if (document.getElementById('chartRangeSelect'))
        document.getElementById('chartRangeSelect').addEventListener('change', renderProgressChart);
    if (document.getElementById('chartDataTypeSelect'))
        document.getElementById('chartDataTypeSelect').addEventListener('change', renderProgressChart);
    renderProgressChart();
});
window.addEventListener('taskCompleted', renderProgressChart); 