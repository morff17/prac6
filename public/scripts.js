document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    });

    registerTab.addEventListener('click', () => {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    });

    const loginButton = document.getElementById('login-button');
    const loginUsername = document.getElementById('login-username');
    const loginPassword = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');

    loginButton.addEventListener('click', async () => {
        loginError.textContent = '';

        if (!loginUsername.value || !loginPassword.value) {
            loginError.textContent = 'Пожалуйста, заполните все поля';
            return;
        }

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: loginUsername.value,
                    password: loginPassword.value
                })
            });

            const data = await response.json();

            if (!response.ok) {
                loginError.textContent = data.error;
                return;
            }

            localStorage.setItem('theme', data.theme || 'light');

            window.location.href = '/profile.html';
        } catch (error) {
            loginError.textContent = 'Ошибка соединения с сервером';
            console.error('Login error:', error);
        }
    });

    const registerButton = document.getElementById('register-button');
    const registerUsername = document.getElementById('register-username');
    const registerPassword = document.getElementById('register-password');
    const registerConfirm = document.getElementById('register-confirm');
    const registerError = document.getElementById('register-error');
    const registerSuccess = document.getElementById('register-success');

    registerButton.addEventListener('click', async () => {
        registerError.textContent = '';
        registerSuccess.textContent = '';

        if (!registerUsername.value || !registerPassword.value || !registerConfirm.value) {
            registerError.textContent = 'Пожалуйста, заполните все поля';
            return;
        }

        if (registerPassword.value !== registerConfirm.value) {
            registerError.textContent = 'Пароли не совпадают';
            return;
        }

        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: registerUsername.value,
                    password: registerPassword.value
                })
            });

            const data = await response.json();

            if (!response.ok) {
                registerError.textContent = data.error;
                return;
            }

            registerSuccess.textContent = 'Регистрация успешна! Теперь вы можете войти.';
            registerUsername.value = '';
            registerPassword.value = '';
            registerConfirm.value = '';

            setTimeout(() => {
                loginTab.click();
            }, 1500);
        } catch (error) {
            registerError.textContent = 'Ошибка соединения с сервером';
            console.error('Registration error:', error);
        }
    });
});

async function checkAuth() {
    try {
        const response = await fetch('/profile');
        if (response.ok) {
            window.location.href = '/profile.html';
        }
    } catch (error) {
        console.error('Auth check error:', error);
    }
}