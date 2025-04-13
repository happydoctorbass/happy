// Файл: camera_controller.js

import * as THREE from 'three';
import {
    camera,
    controls,       // OrbitControls
    model,
    renderer,       // Импортируем рендерер для доступа к domElement
    registerAnimationUpdateCallback
} from './main.js';

console.log("Модуль camera_controller.js (WASD + OrbitControls + Manual Touch Rotate) загружен.");

// --- Настройки WASD и коллизий ---
const MOVEMENT_SPEED = 3.0;
const COLLISION_DISTANCE = 0.4;

// --- Настройки ручного вращения касанием ---
const MANUAL_TOUCH_ROTATE_SPEED = 2.5; // Отдельная скорость для ручного вращения пальцем

// --- Переменные состояния ---
const keyState = {};
const raycaster = new THREE.Raycaster();
const movementVector = new THREE.Vector3();
const cameraDirection = new THREE.Vector3();
const rightDirection = new THREE.Vector3();
const nextCameraPosition = new THREE.Vector3();

// Состояние для ручного тач-вращения
let isManualRotating = false;
let previousTouchX = 0;
let previousTouchY = 0;

// --- Функция проверки коллизий WASD (без изменений) ---
function checkCollision(moveVec) {
    if (!model || moveVec.lengthSq() < 0.0001) return false;
    nextCameraPosition.copy(camera.position).add(moveVec);
    const rayOrigin = nextCameraPosition.clone();
    const rayDirection = moveVec.clone().negate().normalize();
    raycaster.set(rayOrigin, rayDirection);
    raycaster.far = moveVec.length() + 0.1;
    const intersects = raycaster.intersectObject(model, true);
    if (intersects.length > 0) {
        for (let i = 0; i < intersects.length; i++) {
            if (intersects[i].distance < moveVec.length() + 0.05) {
                 if (intersects[i].face && intersects[i].face.normal.y > 0.7) continue;
                 return true;
            }
        }
    }
    return false;
}

// --- Функция обновления движения WASD (без изменений) ---
function updateMovementWASD(deltaTime) {
    if (!controls || !controls.enabled) {
        for (const key in keyState) { keyState[key] = false; }
        return;
    }
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();
    rightDirection.crossVectors(camera.up, cameraDirection).normalize();
    movementVector.set(0, 0, 0);
    let moveSpeedFactor = 1.0;
    if (keyState['KeyW']) movementVector.add(cameraDirection);
    if (keyState['KeyS']) movementVector.sub(cameraDirection);
    if (keyState['KeyA']) movementVector.add(rightDirection); // Был add - оставляем, раз работало
    if (keyState['KeyD']) movementVector.sub(rightDirection); // Был sub - оставляем
    if (movementVector.lengthSq() > 0.0001) {
        movementVector.normalize().multiplyScalar(MOVEMENT_SPEED * deltaTime * moveSpeedFactor);
        if (!checkCollision(movementVector)) {
            camera.position.add(movementVector);
            controls.target.add(movementVector);
        }
    }
}

// --- Обработчики событий для ручного тач-вращения ---

function onTouchStart(event) {
    // Начинаем ручное вращение только если ОДНО касание и OrbitControls активны
    if (event.touches.length === 1 && controls && controls.enabled) {
        // event.preventDefault(); // Предотвращаем стандартные действия (например, прокрутку)

        isManualRotating = true;
        previousTouchX = event.touches[0].clientX;
        previousTouchY = event.touches[0].clientY;

        // Скажем OrbitControls НЕ обрабатывать это событие для вращения
        // (хотя он и так не должен без "клика", но для надежности)
        // controls.enabled = false; // Плохая идея, сломает damping и другие жесты

        console.log("Manual Touch Rotate Start");
    } else {
        // Если касаний больше одного или контролы выключены, сбрасываем флаг
        isManualRotating = false;
    }
}

function onTouchMove(event) {
    if (!isManualRotating || event.touches.length !== 1 || !controls || !controls.enabled) {
        // Если вращение не активно, или изменилось число пальцев,
        // или контролы выключились - прекращаем обработку
        isManualRotating = false;
        return;
    }

    // event.preventDefault(); // Предотвращаем прокрутку во время вращения

    const currentX = event.touches[0].clientX;
    const currentY = event.touches[0].clientY;

    const deltaX = currentX - previousTouchX;
    const deltaY = currentY - previousTouchY;

    // --- Вызов внутреннего API OrbitControls для вращения ---
    // Эти методы не являются частью публичного API и могут измениться в будущем,
    // но они часто используются для таких целей.
    // rotateLeft вращает по горизонтали (вокруг оси Y)
    // rotateUp вращает по вертикали (вокруг перпендикулярной оси)
    if (controls.rotateLeft && controls.rotateUp) {
        const rotateScale = MANUAL_TOUCH_ROTATE_SPEED * (Math.PI / renderer.domElement.clientHeight); // Масштаб вращения относительно высоты экрана
        controls.rotateLeft(deltaX * rotateScale);
        controls.rotateUp(deltaY * rotateScale);
        // После ручного изменения нужно обновить контролы
        controls.update(); // Говорим контролам обновить позицию камеры на основе новых углов
    } else {
        console.warn("controls.rotateLeft/rotateUp не найдены. Ручное вращение не сработает.");
        isManualRotating = false; // Отключаем, раз методы не найдены
    }
    // --- Конец вызова внутреннего API ---

    // Обновляем предыдущие координаты
    previousTouchX = currentX;
    previousTouchY = currentY;
}

function onTouchEnd(event) {
    if (isManualRotating) {
        console.log("Manual Touch Rotate End");
    }
    // Сбрасываем флаг при отпускании пальца
    isManualRotating = false;

    // Возвращаем контроль OrbitControls, если мы его забирали
    // if (controls && !controls.enabled) {
    //     controls.enabled = true;
    // }
}


// --- Настройка слушателей событий (WASD + новые для тача) ---
function setupEventListeners() {
    // WASD Listeners
    window.addEventListener('keydown', (event) => {
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {
             keyState[event.code] = true;
        }
    });
    window.addEventListener('keyup', (event) => {
        if (keyState[event.code]) keyState[event.code] = false;
    });
    window.addEventListener('blur', () => {
        for (const key in keyState) { keyState[key] = false; }
    });

    // Manual Touch Rotation Listeners (добавляем к элементу рендерера)
    if (renderer && renderer.domElement) {
        renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false }); // passive: false чтобы разрешить preventDefault
        renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
        renderer.domElement.addEventListener('touchend', onTouchEnd);
        renderer.domElement.addEventListener('touchcancel', onTouchEnd); // Обрабатываем и отмену касания
        console.log("Слушатели для ручного тач-вращения добавлены.");
    } else {
         console.error("Не удалось добавить слушатели тач-событий: renderer.domElement не найден.");
    }

    console.log("Слушатели WASD и Touch для OrbitControls добавлены.");
}

// --- Инициализация модуля ---
function initController() {
    // Проверяем наличие всего необходимого, включая renderer
    if (controls && camera && model && renderer) {
        setupEventListeners();
        // Регистрируем ТОЛЬКО обновление WASD. Ручное вращение происходит по событиям.
        registerAnimationUpdateCallback(updateMovementWASD);
        console.log("Контроллер WASD и ручного тач-вращения инициализирован.");
    } else {
        console.warn("OrbitControls, Camera, Model или Renderer еще не готовы, повторная попытка инициализации контроллера через 100мс.");
        setTimeout(initController, 100);
    }
}

// Запускаем инициализацию нашего контроллера
initController();