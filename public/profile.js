document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    applyTheme();
    loadProfileData();
    loadCachedData();

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    themeToggleBtn.addEventListener('click', toggleTheme);

    const refreshDataBtn = document.getElementById('refresh-data-btn');
    refreshDataBtn.addEventListener('click', loadCachedData);

    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', logout);
});

async function checkAuth() {
    try {
        const response = await fetch('/profile');

        if (!response.ok) {
            // защита, при отсутствии сессии редирект на /
            window.location.href = '/';
            return false;
        }

        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = '/';
        return false;
    }
}

// применение темы
function applyTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.getElementById('current-theme').textContent = currentTheme === 'light' ? 'Светлая' : 'Темная';

    if (currentTheme === 'dark') {
        document.body.classList.add('dark-theme');
        document.getElementById('theme-toggle-btn').textContent = 'Включить светлую тему';
    } else {
        document.body.classList.remove('dark-theme');
        document.getElementById('theme-toggle-btn').textContent = 'Включить темную тему';
    }
}

// переключение темы
async function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    localStorage.setItem('theme', newTheme);


    try {
        await fetch('/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ theme: newTheme })
        });
    } catch (error) {
        console.error('Error updating theme:', error);
    }

    applyTheme();
}


async function loadProfileData() {
    try {
        const response = await fetch('/profile');
        if (!response.ok) return;

        const userData = await response.json();
        document.getElementById('username-display').textContent = userData.username;

    } catch (error) {
        console.error('Error loading profile data:', error);
    }
}


async function loadCachedData() {
    try {
        document.getElementById('data-container').innerHTML = '<p>Загрузка данных...</p>';

        const response = await fetch('/data');
        if (!response.ok) {
            document.getElementById('data-container').innerHTML = '<p>Ошибка загрузки данных</p>';
            return;
        }

        const { data, fromCache, cacheTime } = await response.json();

        document.getElementById('cache-status').textContent = fromCache ? 'Данные из кэша' : 'Свежие данные';
        document.getElementById('cache-time').textContent = new Date(cacheTime).toLocaleString();

        const dataContainer = document.getElementById('data-container');
        dataContainer.innerHTML = '';

        const timestampElement = document.createElement('div');
        timestampElement.className = 'data-item';
        timestampElement.innerHTML = `<strong>Временная метка:</strong> ${data.timestamp}`;
        dataContainer.appendChild(timestampElement);

        const randomValueElement = document.createElement('div');
        randomValueElement.className = 'data-item';
        randomValueElement.innerHTML = `<strong>Случайное значение:</strong> ${data.randomValue}`;
        dataContainer.appendChild(randomValueElement);

        if (data.items && data.items.length) {
            const itemsHeader = document.createElement('div');
            itemsHeader.className = 'data-item';
            itemsHeader.innerHTML = '<strong>Элементы:</strong>';
            dataContainer.appendChild(itemsHeader);

            data.items.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'data-item';
                itemElement.innerHTML = `<strong>${item.name}</strong>: ${item.value}`;
                dataContainer.appendChild(itemElement);
            });
        }
    } catch (error) {
        console.error('Error loading cached data:', error);
        document.getElementById('data-container').innerHTML = '<p>Ошибка загрузки данных</p>';
    }
}


async function logout() {
    try {
        await fetch('/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
    }
}