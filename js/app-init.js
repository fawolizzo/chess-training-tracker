// Theme Management
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('i');

// Load saved theme preference
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

// Theme toggle handler
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
    themeIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// Profile Management
const profileBtn = document.getElementById('profileBtn');
const profileModal = document.getElementById('profileModal');
const modalSteps = document.querySelectorAll('.modal-step');
const profileName = document.getElementById('profileName');
const profileRating = document.getElementById('profileRating');
const profileGoal = document.getElementById('profileGoal');

// Load saved profile data
let savedProfile = JSON.parse(localStorage.getItem('profile')) || {
    name: 'Player',
    rating: 0,
    goal: 0
};

// Update UI with saved profile data
function updateProfileUI() {
    document.getElementById('userName').textContent = savedProfile.name;
    document.getElementById('currentRating').textContent = savedProfile.rating;
    document.getElementById('ratingGoal').textContent = savedProfile.goal;
}

// Initial UI update
updateProfileUI();

// Profile modal handlers
profileBtn.addEventListener('click', () => {
    // Pre-fill form with current values
    profileName.value = savedProfile.name;
    profileRating.value = savedProfile.rating;
    profileGoal.value = savedProfile.goal;
    
    // Show first step
    showModalStep(1);
    profileModal.style.display = 'block';
});

// Modal step navigation
function showModalStep(stepNumber) {
    modalSteps.forEach(step => {
        step.classList.remove('active');
        if (step.dataset.step === stepNumber.toString()) {
            step.classList.add('active');
        }
    });
}

// Modal button handlers
document.querySelectorAll('.modal-step .next').forEach(button => {
    button.addEventListener('click', () => {
        const currentStep = parseInt(button.closest('.modal-step').dataset.step);
        const nextStep = currentStep + 1;
        
        // Validate current step
        if (currentStep === 1 && !profileName.value.trim()) {
            alert('Please enter your name');
            return;
        }
        if (currentStep === 2 && (!profileRating.value || profileRating.value < 0)) {
            alert('Please enter a valid rating');
            return;
        }
        if (currentStep === 3) {
            if (!profileGoal.value || profileGoal.value < 0) {
                alert('Please enter a valid goal');
                return;
            }
            if (parseInt(profileGoal.value) <= parseInt(profileRating.value)) {
                alert('Goal must be greater than current rating');
                return;
            }
            saveProfile();
            return;
        }
        
        showModalStep(nextStep);
    });
});

document.querySelectorAll('.modal-step .back').forEach(button => {
    button.addEventListener('click', () => {
        const currentStep = parseInt(button.closest('.modal-step').dataset.step);
        showModalStep(currentStep - 1);
    });
});

document.querySelectorAll('.modal-step .cancel').forEach(button => {
    button.addEventListener('click', () => {
        profileModal.style.display = 'none';
    });
});

document.querySelectorAll('.modal-step .save').forEach(button => {
    button.addEventListener('click', () => {
        // Validate current step (Step 3)
        if (!profileGoal.value || profileGoal.value < 0) {
            alert('Please enter a valid goal');
            return;
        }
        if (parseInt(profileGoal.value) <= parseInt(profileRating.value)) {
            alert('Goal must be greater than current rating');
            return;
        }
        saveProfile();
    });
});

// Save profile data
function saveProfile() {
    savedProfile = {
        name: profileName.value.trim(),
        rating: parseInt(profileRating.value),
        goal: parseInt(profileGoal.value)
    };
    
    localStorage.setItem('profile', JSON.stringify(savedProfile));
    
    // Update UI
    updateProfileUI();
    
    // Close modal
    profileModal.style.display = 'none';
    
    // Dispatch event for other modules
    window.dispatchEvent(new CustomEvent('profileUpdated', { detail: savedProfile }));
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === profileModal) {
        profileModal.style.display = 'none';
    }
});

// Export profile validation function for other modules
window.isProfileComplete = function() {
    return savedProfile.name !== 'Player' && 
           savedProfile.rating > 0 && 
           savedProfile.goal > savedProfile.rating;
};

// --- Share Progress Modal Logic ---
const shareProgressBtn = document.getElementById('shareProgressBtn');
const shareProgressModal = document.getElementById('shareProgressModal');
const closeShareModal = document.getElementById('closeShareModal');
const downloadShareCardBtn = document.getElementById('downloadShareCard');
const copyShareCardBtn = document.getElementById('copyShareCard');

// Ensure Share Progress button is always enabled
shareProgressBtn.removeAttribute('disabled');
shareProgressBtn.style.opacity = '1';
shareProgressBtn.style.pointerEvents = 'auto';

shareProgressBtn.addEventListener('click', () => {
    setTimeout(() => {
        populateShareCard();
    }, 0);
    shareProgressModal.style.display = 'block';
    setTimeout(() => {
        document.getElementById('shareCard').focus();
    }, 100);
});

downloadShareCardBtn.addEventListener('click', () => {
    html2canvas(document.getElementById('shareCard'), { backgroundColor: null, scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'chess-training-progress.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }).catch(() => {
        alert('Failed to generate image.');
    });
});

copyShareCardBtn.addEventListener('click', () => {
    html2canvas(document.getElementById('shareCard'), { backgroundColor: null, scale: 2 }).then(canvas => {
        canvas.toBlob(blob => {
            if (navigator.clipboard && window.ClipboardItem) {
                const item = new window.ClipboardItem({ 'image/png': blob });
                navigator.clipboard.write([item]).then(() => {
                    alert('Image copied to clipboard!');
                }, () => {
                    alert('Failed to copy image.');
                });
            } else {
                alert('Clipboard API not supported.');
            }
        });
    }).catch(() => {
        alert('Failed to generate image.');
    });
});

closeShareModal.addEventListener('click', () => {
    shareProgressModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === shareProgressModal) {
        shareProgressModal.style.display = 'none';
    }
});

let shareCardChartInstance = null;

function populateShareCard() {
    // Header
    document.getElementById('shareCardDate').textContent = new Date().toLocaleDateString();
    // Profile
    document.getElementById('shareCardName').textContent = savedProfile.name;
    document.getElementById('shareCardRating').textContent = savedProfile.rating;
    document.getElementById('shareCardGoal').textContent = savedProfile.goal;
    // Stats
    document.getElementById('shareCardStreak').textContent = document.getElementById('streakCount').textContent + ' days';
    document.getElementById('shareCardCompletion').textContent = document.getElementById('completionRate').textContent;
    document.getElementById('shareCardHours').textContent = document.getElementById('hoursTrained').textContent;
    // Mini 7-day chart (Minutes Trained)
    const shareCardChartDiv = document.getElementById('shareCardChart');
    shareCardChartDiv.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 80;
    shareCardChartDiv.appendChild(canvas);
    if (shareCardChartInstance) {
        shareCardChartInstance.destroy();
        shareCardChartInstance = null;
    }
    // Get chart data (last 7 days, minutes trained)
    const logs = JSON.parse(localStorage.getItem('trainingLogs')) || [];
    const dateMap = {};
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        dateMap[key] = 0;
    }
    logs.forEach(log => {
        const dateKey = new Date(log.timestamp).toISOString().slice(0, 10);
        if (dateMap.hasOwnProperty(dateKey)) {
            const match = log.text.match(/\((\d+)m\)/);
            if (match) dateMap[dateKey] += parseInt(match[1], 10);
        }
    });
    const labels = Object.keys(dateMap).map(d => {
        const date = new Date(d);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    });
    const data = Object.values(dateMap);
    shareCardChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Minutes Trained',
                data: data,
                backgroundColor: 'rgba(59, 130, 246, 0.85)',
                borderColor: 'rgba(30, 64, 175, 1)',
                borderWidth: 2,
                borderRadius: 8,
                maxBarThickness: 22
            }]
        },
        options: {
            responsive: false,
            plugins: {
                legend: { display: false },
                title: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#a5b4fc', font: { size: 11 } } },
                y: { beginAtZero: true, grid: { display: false }, ticks: { color: '#a5b4fc', font: { size: 11 }, stepSize: 1 } }
            },
            animation: {
                duration: 900,
                easing: 'easeOutQuart'
            },
            events: [] // disables all interactivity
        }
    });
} 