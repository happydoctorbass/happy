

import * as THREE from 'three';
import {
    camera,
    controls,
    targetBounds,
    registerAnimationUpdateCallback
} from './main.js';

console.log("Модуль camera_controller.js загружен.");

const PAN_SPEED = 2.5;
const keyState = {};

function updateTargetPanning(deltaTime) {
    if (!controls || !controls.enabled || !camera) {
        for (const key in keyState) { keyState[key] = false; }
        return;
    }

    const moveDirection = new THREE.Vector3(0, 0, 0);
    if (keyState['KeyW']) moveDirection.z = -1;
    if (keyState['KeyS']) moveDirection.z = 1;
    if (keyState['KeyA']) moveDirection.x = -1;
    if (keyState['KeyD']) moveDirection.x = 1;

    if (moveDirection.lengthSq() > 0.001) {
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        const forward = new THREE.Vector3(cameraDirection.x, 0, cameraDirection.z).normalize();
        if (forward.lengthSq() < 0.001) {
            forward.set(0, 0, -Math.sign(camera.up.y * cameraDirection.y));
        }
        const right = new THREE.Vector3().crossVectors(camera.up, forward).normalize();

        const panOffset = new THREE.Vector3();
        if (keyState['KeyW']) panOffset.add(forward);
        if (keyState['KeyS']) panOffset.sub(forward);
        if (keyState['KeyA']) panOffset.sub(right);
        if (keyState['KeyD']) panOffset.add(right);

        panOffset.normalize().multiplyScalar(PAN_SPEED * deltaTime);

        controls.target.add(panOffset);
    }
}

function setupEventListeners() {
    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
            if (controls && controls.enabled) {
                 keyState[e.code] = true;
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        if (keyState[e.code]) {
            keyState[e.code] = false;
        }
    });

     window.addEventListener('blur', () => {
        for (const key in keyState) { keyState[key] = false; }
     });

    console.log("Слушатели для WASD управления целью камеры добавлены.");
}

function initCameraController() {
    if (controls && camera) {
        setupEventListeners();
        registerAnimationUpdateCallback(updateTargetPanning);
        console.log("Кастомный контроллер камеры инициализирован. Используйте WASD для панорамирования цели.");
    } else {
        console.warn("Controls или Camera еще не готовы, повторная попытка инициализации контроллера камеры через 100мс.");
        setTimeout(initCameraController, 100);
    }
}

initCameraController();
