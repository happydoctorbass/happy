

import * as THREE from 'three';
import {
    camera,
    controls,
    model,
    renderer,
    registerAnimationUpdateCallback
} from './main.js';

console.log("Модуль camera_controller.js (WASD + OrbitControls + Manual Touch Rotate) загружен.");

const MOVEMENT_SPEED = 3.0;
const COLLISION_DISTANCE = 0.4;
const MANUAL_TOUCH_ROTATE_SPEED = 2.5;

const keyState = {};
const raycaster = new THREE.Raycaster();
const movementVector = new THREE.Vector3();
const cameraDirection = new THREE.Vector3();
const rightDirection = new THREE.Vector3();
const nextCameraPosition = new THREE.Vector3();

let isManualRotating = false;
let previousTouchX = 0;
let previousTouchY = 0;

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
    if (keyState['KeyA']) movementVector.add(rightDirection);
    if (keyState['KeyD']) movementVector.sub(rightDirection);
    if (movementVector.lengthSq() > 0.0001) {
        movementVector.normalize().multiplyScalar(MOVEMENT_SPEED * deltaTime * moveSpeedFactor);
        if (!checkCollision(movementVector)) {
            camera.position.add(movementVector);
            controls.target.add(movementVector);
        }
    }
}

function onTouchStart(event) {
    if (event.touches.length === 1 && controls && controls.enabled) {
        isManualRotating = true;
        previousTouchX = event.touches[0].clientX;
        previousTouchY = event.touches[0].clientY;
        console.log("Manual Touch Rotate Start");
    } else {
        isManualRotating = false;
    }
}

function onTouchMove(event) {
    if (!isManualRotating || event.touches.length !== 1 || !controls || !controls.enabled) {
        isManualRotating = false;
        return;
    }

    const currentX = event.touches[0].clientX;
    const currentY = event.touches[0].clientY;

    const deltaX = currentX - previousTouchX;
    const deltaY = currentY - previousTouchY;

    if (controls.rotateLeft && controls.rotateUp) {
        const rotateScale = MANUAL_TOUCH_ROTATE_SPEED * (Math.PI / renderer.domElement.clientHeight);
        controls.rotateLeft(deltaX * rotateScale);
        controls.rotateUp(deltaY * rotateScale);
        controls.update();
    } else {
        console.warn("controls.rotateLeft/rotateUp не найдены. Ручное вращение не сработает.");
        isManualRotating = false;
    }

    previousTouchX = currentX;
    previousTouchY = currentY;
}

function onTouchEnd(event) {
    if (isManualRotating) {
        console.log("Manual Touch Rotate End");
    }
    isManualRotating = false;
}

function setupEventListeners() {
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

    if (renderer && renderer.domElement) {
        renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
        renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
        renderer.domElement.addEventListener('touchend', onTouchEnd);
        renderer.domElement.addEventListener('touchcancel', onTouchEnd);
        console.log("Слушатели для ручного тач-вращения добавлены.");
    } else {
         console.error("Не удалось добавить слушатели тач-событий: renderer.domElement не найден.");
    }

    console.log("Слушатели WASD и Touch для OrbitControls добавлены.");
}

function initController() {
    if (controls && camera && model && renderer) {
        setupEventListeners();
        registerAnimationUpdateCallback(updateMovementWASD);
        console.log("Контроллер WASD и ручного тач-вращения инициализирован.");
    } else {
        console.warn("OrbitControls, Camera, Model или Renderer еще не готовы, повторная попытка инициализации контроллера через 100мс.");
        setTimeout(initController, 100);
    }
}

initController();
