const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Создаем папку для кэша, если её нет
const cacheDir = path.join(__dirname, 'cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir);
}
// мидлвари
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// сессия
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 86400000
  }
}));

// тут храним пользователей
const users = {};

// проверка аутентификации
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  res.status(401).json({ error: 'Требуется авторизация' });
};


app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Требуются имя пользователя и пароль' });
  }
  
  if (users[username]) {
    return res.status(400).json({ error: 'Пользователь уже существует' });
  }
  
  try {
    // хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);
    users[username] = {
      username,
      password: hashedPassword,
      theme: 'light' 
    };
    
    res.status(201).json({ message: 'Пользователь успешно зарегистрирован' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Требуются имя пользователя и пароль' });
  }
  
  const user = users[username];
  if (!user) {
    return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
  }
  
  try {
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      req.session.userId = username;
      return res.json({ 
        message: 'Вход выполнен успешно',
        theme: user.theme
      });
    } else {
      return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/profile', isAuthenticated, (req, res) => {
  const user = users[req.session.userId];
  res.json({
    username: user.username,
    theme: user.theme
  });
});

app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка при выходе' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Выход выполнен успешно' });
  });
});

// эндпоинт для изменения темы
app.post('/settings', isAuthenticated, (req, res) => {
  const { theme } = req.body;
  
  if (theme && (theme === 'light' || theme === 'dark')) {
    users[req.session.userId].theme = theme;
    res.json({ message: 'Настройки обновлены' });
  } else {
    res.status(400).json({ error: 'Недопустимый параметр темы' });
  }
});

// тут кэшируем данные
app.get('/data', (req, res) => {
  const cacheFile = path.join(cacheDir, 'data.json');
  
  // проверка кэша
  if (fs.existsSync(cacheFile)) {
    const stats = fs.statSync(cacheFile);
    const currentTime = new Date().getTime();
    const fileTime = stats.mtime.getTime();
    
    // кэш на 1 минуту 
    if (currentTime - fileTime < 60000) {
      const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      return res.json({
        data,
        fromCache: true,
        cacheTime: new Date(fileTime).toISOString()
      });
    }
  }
  
  // генерируем новые данные
  const newData = {
    timestamp: new Date().toISOString(),
    randomValue: Math.random(),
    items: Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      name: `Элемент ${i + 1}`,
      value: Math.floor(Math.random() * 100)
    }))
  };
  
  fs.writeFileSync(cacheFile, JSON.stringify(newData, null, 2));
  
  res.json({
    data: newData,
    fromCache: false,
    cacheTime: newData.timestamp
  });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
}); 