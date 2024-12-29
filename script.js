document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('todo-form');
    const input = document.getElementById('new-task');
    const dueDateInput = document.getElementById('due-date');
    const priorityInput = document.getElementById('priority');
    const categoryInput = document.getElementById('category');
    const todoList = document.getElementById('todo-list');
    const feedback = document.getElementById('feedback');
    const searchInput = document.getElementById('search');
    const filterButtons = document.querySelectorAll('#filters button');
    const progressBar = document.getElementById('progress');
    const toggleThemeButton = document.getElementById('toggle-theme');
 
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let filter = 'all';
    let currentUser = localStorage.getItem('currentUser') || null;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        addTask(input.value, dueDateInput.value, priorityInput.value, categoryInput.value);
        input.value = '';
        dueDateInput.value = '';
        categoryInput.value = '';
    });

    searchInput.addEventListener('input', () => {
        renderTasks();
    });

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filter = button.getAttribute('data-filter');
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            renderTasks();
        });
    });

    toggleThemeButton.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        document.querySelector('.container').classList.toggle('dark-mode');
    });

    loginButton.addEventListener('click', () => {
        currentUser = 'user';  // Simulating a logged-in user
        localStorage.setItem('currentUser', currentUser);
        updateAuthUI();
    });

    logoutButton.addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem('currentUser');
        updateAuthUI();
    });

    function addTask(task, dueDate, priority, category) {
       
        if (task.trim() === '') {
            showFeedback('Task cannot be empty.');
            return;
        }
        const newTask = {
            id: Date.now(),
            text: task,
            dueDate,
            priority,
            category,
            completed: false
        };
        tasks.push(newTask);
        saveTasks();
        renderTasks();
    }

    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
    }

    function toggleTaskCompletion(id) {
        const task = tasks.find(task => task.id === id);
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }

    function editTask(id, newText) {
        const task = tasks.find(task => task.id === id);
        task.text = newText;
        saveTasks();
        renderTasks();
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function renderTasks() {
        todoList.innerHTML = '';
        let filteredTasks = tasks.filter(task => task.text.toLowerCase().includes(searchInput.value.toLowerCase()));
        if (filter === 'active') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        } else if (filter === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        }
        filteredTasks.sort((a, b) => b.priority.localeCompare(a.priority));

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.classList.toggle('completed', task.completed);
            li.dataset.id = task.id;
            li.draggable = true;

            const textSpan = document.createElement('span');
            textSpan.textContent = `${task.text} - ${task.dueDate ? task.dueDate : 'No due date'} - ${task.priority} - ${task.category ? task.category : 'No category'}`;
            textSpan.addEventListener('click', () => {
                li.classList.add('editing');
                const editInput = document.createElement('input');
                editInput.type = 'text';
                editInput.value = task.text;
                editInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        editTask(task.id, editInput.value);
                    }
                });
                editInput.addEventListener('blur', () => {
                    editTask(task.id, editInput.value);
                });
                li.replaceChild(editInput, textSpan);
                editInput.focus();
            });

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => deleteTask(task.id));

            const toggleButton = document.createElement('button');
            toggleButton.textContent = task.completed ? 'Undo' : 'Complete';
            toggleButton.addEventListener('click', () => toggleTaskCompletion(task.id));

            li.appendChild(textSpan);
            li.appendChild(toggleButton);
            li.appendChild(deleteButton);
            todoList.appendChild(li);

            li.addEventListener('dragstart', (e) => {
                li.classList.add('dragging');
                e.dataTransfer.setData('text/plain', task.id);
            });

            li.addEventListener('dragend', () => {
                li.classList.remove('dragging');
            });
        });

        todoList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingElement = document.querySelector('.dragging');
            const afterElement = getDragAfterElement(todoList, e.clientY);
            if (afterElement == null) {
                todoList.appendChild(draggingElement);
            } else {
                todoList.insertBefore(draggingElement, afterElement);
            }
            reorderTasks();
        });

        updateProgressBar();
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function reorderTasks() {
        const reorderedTasks = [];
        todoList.querySelectorAll('li').forEach(li => {
            const id = parseInt(li.dataset.id);
            const task = tasks.find(task => task.id === id);
            reorderedTasks.push(task);
        });
        tasks = reorderedTasks;
        saveTasks();
    }

    function updateProgressBar() {
        const completedTasks = tasks.filter(task => task.completed).length;
        const totalTasks = tasks.length;
        const progressPercentage = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;
        progressBar.style.width = `${progressPercentage}%`;
    }

    function showFeedback(message) {
        feedback.textContent = message;
        setTimeout(() => {
            feedback.textContent = '';
        }, 3000);
    }

    function updateAuthUI() {
        if (currentUser) {
            loginButton.style.display = 'none';
            logoutButton.style.display = 'block';
            form.style.display = 'block';
            feedback.textContent = '';
        } else {
            loginButton.style.display = 'block';
            logoutButton.style.display = 'none';
            form.style.display = 'none';
            feedback.textContent = 'Please log in to manage your tasks.';
        }
    }

    renderTasks();
    updateAuthUI();
});
