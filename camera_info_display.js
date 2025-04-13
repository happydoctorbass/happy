// Файл: camera_info_display.js

import {
    camera,      // Импортируем камеру
    controls,    // Импортируем OrbitControls (для target)
    registerAnimationUpdateCallback // Импортируем функцию регистрации
} from './main.js'; // Убедись, что путь правильный!

console.log("Модуль camera_info_display.js загружен.");

// --- Переменные модуля ---
let displayElement = null; // Ссылка на HTML-элемент для вывода информации
const DECIMAL_PLACES = 4;  // Количество знаков после запятой для координат

// --- Функция обновления информации на экране ---
function updateCameraInfoDisplay(deltaTime) {
    // Выполняем только если элемент найден, камера и контролы существуют
    if (!displayElement || !camera || !controls || !controls.target) return;

    // Получаем позицию камеры
    const camPos = camera.position;
    // Получаем позицию цели (точки вращения)
    const targetPos = controls.target;

    // Форматируем строку для вывода
    const infoText = `
        Pos: (${camPos.x.toFixed(DECIMAL_PLACES)}, ${camPos.y.toFixed(DECIMAL_PLACES)}, ${camPos.z.toFixed(DECIMAL_PLACES)})<br>
        Tgt: (${targetPos.x.toFixed(DECIMAL_PLACES)}, ${targetPos.y.toFixed(DECIMAL_PLACES)}, ${targetPos.z.toFixed(DECIMAL_PLACES)})
    `;

    // Обновляем содержимое HTML-элемента
    // Используем innerHTML, так как у нас есть тег <br>
    displayElement.innerHTML = infoText;
}

// --- Инициализация дисплея ---
function initCameraInfoDisplay() {
    // Находим HTML-элемент по ID (убедись, что он есть в index.html)
    displayElement = document.getElementById('cameraInfoDisplay');

    if (!displayElement) {
        console.error("Элемент с ID 'cameraInfoDisplay' не найден в HTML!");
        return; // Не можем продолжить без элемента
    }

    // Проверяем готовность camera и controls (с небольшой задержкой на всякий случай)
    setTimeout(() => {
        if (camera && controls) {
            // Регистрируем функцию обновления в основном цикле анимации
            registerAnimationUpdateCallback(updateCameraInfoDisplay);
            console.log("Дисплей информации о камере инициализирован.");
            // Вызываем один раз сразу, чтобы убрать надпись "loading..."
            updateCameraInfoDisplay(0);
        } else {
            console.warn("Camera или Controls еще не готовы, повторная попытка инициализации дисплея через 100мс.");
            setTimeout(initCameraInfoDisplay, 100); // Повторяем попытку
        }
    }, 50); // Небольшая задержка
}

// Запускаем инициализацию нашего дисплея
initCameraInfoDisplay();