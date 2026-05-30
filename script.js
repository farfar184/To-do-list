if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Aplikasi siap didownload!'))
      .catch(err => console.log('Gagal mendaftarkan aplikasi', err));
  });
}

let tasks = JSON.parse(localStorage.getItem('farah_tasks')) || [];
let currentFilter = 'all';

// --- PENGAMBILAN ELEMEN SECARA AMAN ---
const taskInput = document.getElementById('task-input');
const priorityInput = document.getElementById('priority-input');
const categoryInput = document.getElementById('category-input');
const deadlineInput = document.getElementById('deadline-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');

// Mencari tombol tema berdasarkan ID apa saja yang tersedia di HTML
const themeToggleBtn = document.getElementById('theme-toggle') || document.getElementById('theme-toggle-btn');
const themeText = document.getElementById('theme-text');

const clearCompletedBtn = document.getElementById('clear-completed-btn');
const filterButtons = document.querySelectorAll('.filter-btn');

const totalTasksEl = document.getElementById('total-tasks');
const activeTasksEl = document.getElementById('active-tasks');
const completedTasksEl = document.getElementById('completed-tasks');


// --- PENGATURAN TEMA (DARK / LIGHT MODE) ---
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        if (document.body.getAttribute('data-theme') === 'dark') {
            document.body.removeAttribute('data-theme');
            if (themeText) themeText.innerText = 'Dark Mode'; 
            localStorage.setItem('theme', 'light');
        } else {
            document.body.setAttribute('data-theme', 'dark');
            if (themeText) themeText.innerText = 'Light Mode'; 
            localStorage.setItem('theme', 'dark');
        }
    });
}

// Cek memori tema saat pertama kali web dibuka
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
    if (themeText) themeText.innerText = 'Light Mode';
} else {
    document.body.removeAttribute('data-theme');
    if (themeText) themeText.innerText = 'Dark Mode';
}


// --- EVENT LISTENERS TUGAS ---
if (addTaskBtn) {
    addTaskBtn.addEventListener('click', addTask);
}

if (clearCompletedBtn) {
    clearCompletedBtn.addEventListener('click', () => {
        if (confirm('Hapus semua tugas yang selesai?')) {
            tasks = tasks.filter(task => !task.completed);
            renderTasks();
        }
    });
}


// --- FUNGSI MANAJEMEN TUGAS ---
function addTask() {
    if (!taskInput || !priorityInput || !categoryInput || !deadlineInput) return;

    const text = taskInput.value.trim();
    const priority = priorityInput.value;
    const category = categoryInput.value;
    const deadline = deadlineInput.value;

    if (text === '') {
        alert('Tolong isi nama tugas terlebih dahulu!');
        return;
    }

    let formattedDeadline = 'Tidak ada';
    if (deadline) {
        const dateObj = new Date(deadline);
        formattedDeadline = dateObj.toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    }

    const newTask = {
        id: Date.now(),
        text: text,
        priority: priority,
        category: category,
        deadline: deadline,
        formattedDeadline: formattedDeadline,
        completed: false
    };

    tasks.push(newTask);
    taskInput.value = '';
    deadlineInput.value = '';
    renderTasks();
}

function renderTasks() {
    localStorage.setItem('farah_tasks', JSON.stringify(tasks));
    if (!taskList) return;
    taskList.innerHTML = '';

    const filteredTasks = tasks.filter(task => {
        if (currentFilter === 'active') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        if (currentFilter === 'high') return task.priority === 'Tinggi';
        if (currentFilter === 'today') {
            if (!task.deadline) return false;
            const today = new Date().toDateString();
            const taskDate = new Date(task.deadline).toDateString();
            return today === taskDate;
        }
        return true;
    });

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `<li class="empty-state">Gada tugas, saatnya istirahat yeayy.</li>`;
        updateStats();
        return;
    }

    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;

        li.innerHTML = `
            <div class="task-left">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleComplete(${task.id})">
                <div class="task-details">
                    <span class="task-text">${task.text}</span>
                    <span class="task-meta">⏱️ Deadline: ${task.formattedDeadline}</span>
                </div>
            </div>
            <div class="task-right">
                <span class="badge cat">${task.category}</span>
                <span class="badge p-${task.priority}">${task.priority}</span>
                <button class="delete-btn" onclick="deleteTask(${task.id})">✕</button>
            </div>
        `;
        taskList.appendChild(li);
    });

    updateStats();
}

window.toggleComplete = function(id) {
    tasks = tasks.map(task => {
        if (task.id === id) task.completed = !task.completed;
        return task;
    });
    renderTasks();
};

window.deleteTask = function(id) {
    tasks = tasks.filter(task => task.id !== id);
    renderTasks();
};

if (filterButtons) {
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.getAttribute('data-filter');
            renderTasks();
        });
    });
}

function updateStats() {
    const total = tasks.length;
    const active = tasks.filter(t => !t.completed).length;
    const completed = total - active;

    if (totalTasksEl) totalTasksEl.textContent = total;
    if (activeTasksEl) activeTasksEl.textContent = active;
    if (completedTasksEl) completedTasksEl.textContent = completed;
}


// --- FUNGSI ALARM DEADLINE ---
function bunyikanAlarm() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine'; 
        oscillator.frequency.value = 800; 
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime); 

        oscillator.start();
        setTimeout(() => { oscillator.stop(); }, 150);
        
        setTimeout(() => {
            const osc2 = audioCtx.createOscillator();
            osc2.connect(gainNode);
            osc2.type = 'sine';
            osc2.frequency.value = 800;
            osc2.start();
            setTimeout(() => { osc2.stop(); }, 150);
        }, 300);
    } catch (e) {
        console.log("AudioContext belum diizinkan oleh browser");
    }
}

let alarmTerpicu = {};

function periksaDeadlineOtomatis() {
    const sekarang = new Date();

    tasks.forEach(task => {
        if (task.completed || !task.deadline) return;

        const waktuDeadline = new Date(task.deadline);
        const selisihWaktu = waktuDeadline - sekarang; 

        const sisaMenit = Math.floor(selisihWaktu / 1000 / 60);

        if (sisaMenit >= 0 && sisaMenit <= 5 && !alarmTerpicu[task.id]) {
            bunyikanAlarm();
            alert(`⚠️ ALARM DEADLINE!\nTugas: "${task.text}" harus segera diselesaikan dalam waktu ${sisaMenit} menit lagi!`);
            alarmTerpicu[task.id] = true;
        }
    });
}

setInterval(periksaDeadlineOtomatis, 30000);
renderTasks();
