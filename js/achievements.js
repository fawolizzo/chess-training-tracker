// Stats and Achievements Management
const achievementBadges = document.getElementById('achievementBadges');
const streakCount = document.getElementById('streakCount');
const completionRate = document.getElementById('completionRate');
const hoursTrained = document.getElementById('hoursTrained');
const currentStreak = document.getElementById('currentStreak');

// Achievement definitions
const achievements = [
    {
        id: 'streak_7',
        name: '7-Day Streak',
        description: 'Complete tasks for 7 consecutive days',
        icon: '🔥',
        check: (stats) => stats.currentStreak >= 7
    },
    {
        id: 'streak_30',
        name: '30-Day Streak',
        description: 'Complete tasks for 30 consecutive days',
        icon: '⚡',
        check: (stats) => stats.currentStreak >= 30
    },
    {
        id: 'hours_10',
        name: '10 Hours Trained',
        description: 'Complete 10 hours of training',
        icon: '⏱️',
        check: (stats) => stats.totalMinutes >= 600
    },
    {
        id: 'hours_50',
        name: '50 Hours Trained',
        description: 'Complete 50 hours of training',
        icon: '⌛',
        check: (stats) => stats.totalMinutes >= 3000
    },
    {
        id: 'tasks_25',
        name: '25 Tasks Completed',
        description: 'Complete 25 training tasks',
        icon: '✅',
        check: (stats) => stats.completedTasks >= 25
    },
    {
        id: 'tasks_100',
        name: '100 Tasks Completed',
        description: 'Complete 100 training tasks',
        icon: '🏆',
        check: (stats) => stats.completedTasks >= 100
    }
];

// Load saved achievements
let earnedAchievements = JSON.parse(localStorage.getItem('achievements')) || [];

// Calculate stats
function calculateStats() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const logs = JSON.parse(localStorage.getItem('trainingLogs')) || [];
    
    const stats = {
        completedTasks: tasks.filter(t => t.status === 'complete').length,
        totalTasks: tasks.length,
        totalMinutes: tasks.reduce((sum, task) => {
            return sum + (task.status === 'complete' ? task.duration : 0);
        }, 0),
        currentStreak: calculateStreak(logs)
    };
    
    return stats;
}

// Calculate streak
function calculateStreak(logs) {
    if (!logs.length) return 0;
    
    const today = new Date().toDateString();
    const dates = logs.map(log => new Date(log.timestamp).toDateString());
    const uniqueDates = [...new Set(dates)].sort();
    
    // Check if we have an entry for today
    if (uniqueDates[uniqueDates.length - 1] !== today) {
        return 0;
    }
    
    let streak = 1;
    let currentDate = new Date(uniqueDates[uniqueDates.length - 1]);
    
    for (let i = uniqueDates.length - 2; i >= 0; i--) {
        const previousDate = new Date(uniqueDates[i]);
        const diffDays = Math.floor((currentDate - previousDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            streak++;
            currentDate = previousDate;
        } else {
            break;
        }
    }
    
    return streak;
}

// Update stats display
function updateStats() {
    const stats = calculateStats();
    
    // Update streak displays
    streakCount.textContent = stats.currentStreak;
    currentStreak.textContent = stats.currentStreak;
    
    // Update completion rate
    const rate = stats.totalTasks ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
    completionRate.textContent = `${rate}%`;
    
    // Update hours trained
    const hours = Math.floor(stats.totalMinutes / 60);
    const minutes = stats.totalMinutes % 60;
    hoursTrained.textContent = `${hours}h ${minutes}m`;
    
    // Check and update achievements
    checkAchievements(stats);
}

// Check achievements
function checkAchievements(stats) {
    achievements.forEach(achievement => {
        if (!earnedAchievements.includes(achievement.id) && achievement.check(stats)) {
            earnedAchievements.push(achievement.id);
            localStorage.setItem('achievements', JSON.stringify(earnedAchievements));
            showAchievementNotification(achievement);
        }
    });
    
    updateAchievementBadges();
}

// Show achievement notification
function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-info">
            <h4>${achievement.name}</h4>
            <p>${achievement.description}</p>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Update achievement badges
function updateAchievementBadges() {
    achievementBadges.innerHTML = '';
    
    earnedAchievements.forEach(achievementId => {
        const achievement = achievements.find(a => a.id === achievementId);
        if (achievement) {
            const badge = document.createElement('span');
            badge.className = 'achievement-badge';
            badge.title = `${achievement.name}: ${achievement.description}`;
            badge.textContent = achievement.icon;
            achievementBadges.appendChild(badge);
        }
    });
}

// Initialize achievements
function initializeAchievements() {
    updateStats();
    updateAchievementBadges();
}

// Listen for task completion
window.addEventListener('taskCompleted', () => {
    updateStats();
});

// Initialize on load
document.addEventListener('DOMContentLoaded', initializeAchievements); 