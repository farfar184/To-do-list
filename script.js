if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Aplikasi siap didownload!'))
      .catch(err => console.log('Gagal mendaftarkan aplikasi', err));
  });
}
let tasks = [];
let currentFilter = 'all';

const taskInput = document.getElementById('task-input');
const priorityInput = document.getElementById('priority-input');
const categoryInput = document.getElementById('category-input');
const deadlineInput = document.getElementById('deadline-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const filterButtons = document.querySelectorAll('.filter-btn');

const totalTasksEl = document.getElementById('total-tasks');
const activeTasksEl = document.getElementById('active-tasks');
const completedTasksEl = document.getElementById('completed-tasks');

addTaskBtn.addEventListener('click', addTask);

function addTask() {
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
        taskList.innerHTML = `<li class="empty-state">Belum ada tugas di dalam daftar ini.</li>`;
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

clearCompletedBtn.addEventListener('click', () => {
    if (confirm('Hapus semua tugas yang selesai?')) {
        tasks = tasks.filter(task => !task.completed);
        renderTasks();
    }
});

filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        filterButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.getAttribute('data-filter');
        renderTasks();
    });
});

function updateStats() {
    const total = tasks.length;
    const active = tasks.filter(t => !t.completed).length;
    const completed = total - active;

    totalTasksEl.textContent = total;
    activeTasksEl.textContent = active;
    completedTasksEl.textContent = completed;
}

themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggleBtn.textContent = '🌙 Mode';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggleBtn.textContent = '☀️ Mode';
    }
});
function bunyikanAlarm() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine'; // jenis suara
    oscillator.frequency.value = 800; // tinggi nada (Hz)
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime); // volume suara

    // Bunyikan suara bleep putus-putus sebanyak 3 kali
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
}

// Set variabel untuk mencatat tugas apa saja yang sudah dibunyikan alarmnya agar tidak berisik berulang kali
let alarmTerpicu = {};

function periksaDeadlineOtomatis() {
    const sekarang = new Date();

    tasks.forEach(task => {
        // Abaikan jika tugas sudah selesai dicentang atau tidak punya deadline
        if (task.completed || !task.deadline) return;

        const waktuDeadline = new Date(task.deadline);
        const selisihWaktu = waktuDeadline - sekarang; // hasil dalam milidetik

        // Konversi selisih ke satuan menit
        const sisaMenit = Math.floor(selisihWaktu / 1000 / 60);

        // LOGIKA: Jika sisa waktu antara 0 sampai 5 menit, DAN belum pernah bunyi alarm untuk tugas ini
        if (sisaMenit >= 0 && sisaMenit <= 5 && !alarmTerpicu[task.id]) {
            
            // 1. Bunyikan Suara Alarm
            bunyikanAlarm();

            // 2. Munculkan Notifikasi Box di Layar Browser
            alert(`⚠️ ALARM DEADLINE!\nTugas: "${task.text}" harus segera diselesaikan dalam waktu ${sisaMenit} menit lagi!`);

            // Tandai tugas ini sudah dibunyikan alarmnya agar tidak berbunyi terus setiap detik
            alarmTerpicu[task.id] = true;
        }
    });
}

// Jalankan fungsi pemeriksaan ini secara otomatis setiap 30 detik sekali
setInterval(periksaDeadlineOtomatis, 30000);