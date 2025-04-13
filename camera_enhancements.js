// Файл: camera_controller.js

import * as THREE from 'three'; // Нужен для векторов
import {
    camera,                 // Импортируем камеру
    controls,               // Импортируем OrbitControls
    targetBounds,           // Импортируем границы для цели
    registerAnimationUpdateCallback // Импортируем функцию регистрации
} from './main.js';          // Убедись, что путь правильный!

console.log("Модуль camera_controller.js загружен.");

// --- Настройки управления ---
const PAN_SPEED = 2.5; // Скорость движения цели (можно настроить)
const keyState = {};   // Объект для хранения состояния нажатых клавиш

// --- Функция обновления панорамирования цели ---
function updateTargetPanning(deltaTime) {
    // Выполняем только если controls существуют, включены и есть камера
    if (!controls || !controls.enabled || !camera) {
        // Сбрасываем состояние клавиш, если управление отключено
        for (const key in keyState) { keyState[key] = false; }
        return;
    }

    const moveDirection = new THREE.Vector3(0, 0, 0);
    if (keyState['KeyW']) moveDirection.z = -1;
    if (keyState['KeyS']) moveDirection.z = 1;
    if (keyState['KeyA']) moveDirection.x = -1;
    if (keyState['KeyD']) moveDirection.x = 1;
    // Можно добавить Q/E для вертикального панорамирования
    // if (keyState['KeyQ']) moveDirection.y = -1;
    // if (keyState['KeyE']) moveDirection.y = 1;

    if (moveDirection.lengthSq() > 0.001) { // Если есть движение
        // Получаем прямое и правое направления камеры в горизонтальной плоскости
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        const forward = new THREE.Vector3(cameraDirection.x, 0, cameraDirection.z).normalize();
        // Обработка случая, если смотрим строго вверх/вниз
        if (forward.lengthSq() < 0.001) {
            forward.set(0, 0, -Math.sign(camera.up.y * cameraDirection.y)); // Направление по Z в зависимости от наклона
        }
        const right = new THREE.Vector3().crossVectors(camera.up, forward).normalize();

        // Собираем вектор смещения на основе нажатых клавиш
        const panOffset = new THREE.Vector3();
        if (keyState['KeyW']) panOffset.add(forward);
        if (keyState['KeyS']) panOffset.sub(forward);
        if (keyState['KeyA']) panOffset.sub(right);
        if (keyState['KeyD']) panOffset.add(right);

        // Добавляем вертикальное смещение, если нужно (KeyQ/KeyE)
        // const verticalOffset = new THREE.Vector3(0, 1, 0);
        // if (keyState['KeyE']) panOffset.add(verticalOffset);
        // if (keyState['KeyQ']) panOffset.sub(verticalOffset);

        // Нормализуем, умножаем на скорость и deltaTime
        panOffset.normalize().multiplyScalar(PAN_SPEED * deltaTime);

        // Применяем смещение к цели controls.target
        controls.target.add(panOffset);

        // Ограничение цели останется в главном цикле animate(),
        // который вызывается после этого колбэка.
        // Это нормально, т.к. controls.target будет ограничен перед рендерингом.
    }
}

// --- Настройка слушателей событий ---
function setupEventListeners() {
    window.addEventListener('keydown', (e) => {
        // Игнорируем ввод в поля ввода
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        // Отслеживаем WASD (и Q/E, если нужно)
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD'/*, 'KeyQ', 'KeyE'*/].includes(e.code)) {
            // Не устанавливаем true, если controls выключены (например, во время тура)
            if (controls && controls.enabled) {
                 keyState[e.code] = true;
            }
            // Предотвращаем прокрутку страницы клавишами W/S (если нужно)
             // e.preventDefault();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (keyState[e.code]) {
            keyState[e.code] = false;
        }
    });

     // Сбрасываем клавиши, если окно теряет фокус
     window.addEventListener('blur', () => {
        for (const key in keyState) { keyState[key] = false; }
     });

    console.log("Слушатели для WASD управления целью камеры добавлены.");
}

// --- Инициализация модуля ---
function initCameraController() {
    // Небольшая проверка, что controls уже созданы (хотя при type=module это обычно так)
    if (controls && camera) {
        setupEventListeners();
        // Регистрируем нашу функцию обновления в основном цикле анимации
        registerAnimationUpdateCallback(updateTargetPanning);
        console.log("Кастомный контроллер камеры инициализирован. Используйте WASD для панорамирования цели.");
    } else {
        // Повторная попытка через короткое время, если controls еще не готовы
        console.warn("Controls или Camera еще не готовы, повторная попытка инициализации контроллера камеры через 100мс.");
        setTimeout(initCameraController, 100);
    }
}

// Запускаем инициализацию нашего контроллера
initCameraController();