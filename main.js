

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import TWEEN from '@tweenjs/tween.js';

import { initPhotoOverlays } from './photo_placer.js';

export let scene;
export let camera;
export let renderer;
export let controls;
export let model;
export let roomBounds;
export let targetBounds;
export let tweenGroup = new TWEEN.Group();
export const clock = new THREE.Clock();

let isAnimatingManualStep = false;
let currentWaypointIndex = -1;
let isAutoTourActive = false;
let autoTourTimeoutId = null;

export const TWEEN_DURATION = 2800; 
export const FLY_IN_DURATION = 3500; 
const AUTO_TOUR_PAUSE_DURATION = 1800; 
const CAMERA_BOUNDS_PADDING = 0.5;
const TARGET_BOUNDS_PADDING = 0.2;

export const waypoints = [
    { cameraPos: new THREE.Vector3(0.1546, 1.7267, -0.0258), targetPos: new THREE.Vector3(-0.1229, 1.7523, -0.1369) },
    { cameraPos: new THREE.Vector3(-1.5995, 2.7991, -0.6406), targetPos: new THREE.Vector3(-1.8870, 2.8247, -0.7225) },
    { cameraPos: new THREE.Vector3(-2.6868, 3.2417, -0.5816), targetPos: new THREE.Vector3(-2.9775, 3.2904, -0.5262) },
    { cameraPos: new THREE.Vector3(0.5377, 1.4693, 1.0411), targetPos: new THREE.Vector3(0.8268, 1.5408, 1.0045) },
    { cameraPos: new THREE.Vector3(2.4732, 1.8933, 0.3814), targetPos: new THREE.Vector3(2.7623, 1.9648, 0.3448) },
    { cameraPos: new THREE.Vector3(2.0884, 2.7534, 0.5873), targetPos: new THREE.Vector3(2.5614, 2.8705, 0.5273) },
    { cameraPos: new THREE.Vector3(2.9341, 2.9760, 0.6030), targetPos: new THREE.Vector3(3.2709, 3.0866, 0.4563) },
    { cameraPos: new THREE.Vector3(2.1693, 1.5308, 1.3365), targetPos: new THREE.Vector3(2.0113, 1.5952, 0.6007) },
    { cameraPos: new THREE.Vector3(1.9051, 2.1284, -0.4975), targetPos: new THREE.Vector3(1.8370, 2.2074, -0.7788) },
    { cameraPos: new THREE.Vector3(1.3600, 2.8665, -1.4539), targetPos: new THREE.Vector3(1.4794, 2.8611, -1.7291) },
    { cameraPos: new THREE.Vector3(1.0857, 2.9407, -1.9464), targetPos: new THREE.Vector3(0.8841, 2.8513, -2.1498) },
    { cameraPos: new THREE.Vector3(0.7520, 2.0762, -1.9000), targetPos: new THREE.Vector3(0.6203, 2.0017, -2.1591) }
];
const finalCameraPos = waypoints[0].cameraPos;
const finalTargetPos = waypoints[0].targetPos;

const animationUpdateCallbacks = [];
export function registerAnimationUpdateCallback(callback) {
    if (typeof callback === 'function') {
        animationUpdateCallbacks.push(callback);
    } else {
        console.error('Попытка зарегистрировать не-функцию как callback анимации.');
    }
}

function animateToFixedWaypoint(index) {
    if (isAnimatingManualStep || !waypoints[index]) return;

    const waypoint = waypoints[index];
    console.log(`Начинаем РУЧНОЙ переход к точке ${index}`);
    isAnimatingManualStep = true;
    if (controls) controls.enabled = false;
    tweenGroup.removeAll();

    new TWEEN.Tween(camera.position, tweenGroup)
        .to(waypoint.cameraPos, TWEEN_DURATION)
        .easing(TWEEN.Easing.Cubic.InOut) // <<< Изменено
        .start();

    new TWEEN.Tween(controls.target, tweenGroup)
        .to(waypoint.targetPos, TWEEN_DURATION)
        .easing(TWEEN.Easing.Cubic.InOut) // <<< Изменено
        .onComplete(() => {
            console.log(`Ручной переход завершен в точке ${index}`);
            isAnimatingManualStep = false;
            currentWaypointIndex = index;
            if (controls) {
                controls.enabled = true;
                controls.update();
            }
            updateTourButtonsUI();
        })
        .start();
}

function animateAutoTourStep(index) {
    if (!isAutoTourActive || !waypoints[index]) {
        console.log("animateAutoTourStep: Авто-тур не активен или индекс некорректен, выход.");
        if (!isAutoTourActive && controls) controls.enabled = true;
        return;
    }

    const waypoint = waypoints[index];
    console.log(`Авто-тур: Переход к точке ${index}`);
    isAnimatingManualStep = false;
    if (controls) controls.enabled = false;
    tweenGroup.removeAll();

    new TWEEN.Tween(camera.position, tweenGroup)
        .to(waypoint.cameraPos, TWEEN_DURATION)
        .easing(TWEEN.Easing.Cubic.InOut) 
        .start();

    new TWEEN.Tween(controls.target, tweenGroup)
        .to(waypoint.targetPos, TWEEN_DURATION)
        .easing(TWEEN.Easing.Cubic.InOut) 
        .onComplete(() => {
            if (!isAutoTourActive) return;

            console.log(`Авто-тур: Достигнута точка ${index}`);
            currentWaypointIndex = index;

            const nextIndex = (index + 1) % waypoints.length;
            console.log(`Авто-тур: Планируем переход к точке ${nextIndex} через ${AUTO_TOUR_PAUSE_DURATION} мс`);

            if (autoTourTimeoutId) {
                clearTimeout(autoTourTimeoutId);
            }

            autoTourTimeoutId = setTimeout(() => {
                if (isAutoTourActive) {
                    animateAutoTourStep(nextIndex);
                }
            }, AUTO_TOUR_PAUSE_DURATION);
        })
        .start();
}

export function startAutoTour() {
    if (isAutoTourActive) {
        console.log("Авто-тур уже запущен.");
        return;
    }
    if (isAnimatingManualStep) {
         tweenGroup.removeAll();
         isAnimatingManualStep = false;
    }

    console.log("Запуск авто-тура...");
    isAutoTourActive = true;
    if (controls) controls.enabled = false;
    const startIndex = (currentWaypointIndex + 1) % waypoints.length;
    animateAutoTourStep(startIndex);
    updateTourButtonsUI();
}

export function stopAutoTour() {
    if (!isAutoTourActive) {
        console.log("Авто-тур не был запущен.");
        return;
    }
    console.log("Остановка авто-тура...");
    isAutoTourActive = false;
    if (autoTourTimeoutId) {
        clearTimeout(autoTourTimeoutId);
        autoTourTimeoutId = null;
    }
    tweenGroup.removeAll();
    if (controls) {
        controls.enabled = true;
    }
    isAnimatingManualStep = false;
    updateTourButtonsUI();
}

export function goToNextWaypoint() {
    console.log("Нажата кнопка 'Далее'");
    if (isAutoTourActive) {
        stopAutoTour();
    }
    const nextIndex = (currentWaypointIndex + 1) % waypoints.length;
    animateToFixedWaypoint(nextIndex);
}

export function goToPrevWaypoint() {
    console.log("Нажата кнопка 'Назад'");
    if (isAutoTourActive) {
        stopAutoTour();
    }
    const prevIndex = (currentWaypointIndex - 1 + waypoints.length) % waypoints.length;
    animateToFixedWaypoint(prevIndex);
}

function updateTourButtonsUI() {
    const startButton = document.getElementById('startTourButton');
    const stopButton = document.getElementById('stopTourButton');
    const nextButton = document.getElementById('nextTourButton');
    const prevButton = document.getElementById('prevTourButton');

    if (!startButton || !stopButton || !nextButton || !prevButton) {
        return;
    }

    if (isAutoTourActive) {
        startButton.style.display = 'none';
        stopButton.style.display = 'inline-block';
    } else {
        startButton.style.display = 'inline-block';
        stopButton.style.display = 'none';
    }

    nextButton.style.display = 'inline-block';
    prevButton.style.display = 'inline-block';

    const disableNavButtons = isAutoTourActive || isAnimatingManualStep;
    nextButton.disabled = disableNavButtons;
    prevButton.disabled = disableNavButtons;
    startButton.disabled = disableNavButtons;
}


function handleControlStart() {
    if (isAnimatingManualStep) {
        console.log('OrbitControls: Interaction Start - Stopping manual animation.');
        tweenGroup.removeAll();
        isAnimatingManualStep = false;
        if (controls) controls.enabled = true;
        currentWaypointIndex = -1;
        updateTourButtonsUI();
    } else if (isAutoTourActive) {
        console.log('OrbitControls: Interaction Start - Stopping AUTO tour.');
        stopAutoTour();
        currentWaypointIndex = -1;
    } else {
         console.log('OrbitControls: Interaction Start (no active tour)');
         if(currentWaypointIndex !== -1) {
            currentWaypointIndex = -1;
         }
    }
}

function handleKeyPress(event) {
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;

    if (!isAutoTourActive && (event.code === 'Space' || event.code === 'Enter')) {
        event.preventDefault();
        if (isAnimatingManualStep || !controls || !controls.enabled) return;

        console.log(`Нажата клавиша ${event.code}. Ручной переход.`);
        goToNextWaypoint();
    }
}

function onLoadModel(gltf) {
    console.log('Модель успешно загружена');
    model = gltf.scene;
    scene.add(model);

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const minBounds = box.min.clone().subScalar(CAMERA_BOUNDS_PADDING);
    const maxBounds = box.max.clone().addScalar(CAMERA_BOUNDS_PADDING);
    minBounds.y = Math.max(minBounds.y, 0.1);
    maxBounds.y += CAMERA_BOUNDS_PADDING * 2;
    roomBounds = new THREE.Box3(minBounds, maxBounds);

    const targetMin = box.min.clone().addScalar(TARGET_BOUNDS_PADDING);
    const targetMax = box.max.clone().subScalar(TARGET_BOUNDS_PADDING);
    targetMin.y = Math.max(targetMin.y, 0.2);
    targetMax.y = Math.min(targetMax.y, box.max.y - TARGET_BOUNDS_PADDING * 0.5);
    targetBounds = new THREE.Box3(targetMin, targetMax);

    if (controls) {
        controls.maxDistance = size.length() * 1.5;
        controls.minDistance = 0.3;
        controls.target.copy(finalTargetPos);
        console.log('Начальная цель OrbitControls установлена на точку 0.');
        controls.update();
    }

    const startFlyInPos = new THREE.Vector3(center.x, center.y + size.y, center.z + size.length() * 1.2);
    camera.position.copy(startFlyInPos);
    currentWaypointIndex = -1;
    if (controls) controls.enabled = false;

    console.log('Начало анимации прилета к точке 0...');
    tweenGroup.removeAll();

    new TWEEN.Tween(camera.position, tweenGroup)
        .to(finalCameraPos, FLY_IN_DURATION)
        .easing(TWEEN.Easing.Cubic.InOut) 
        .start();

    new TWEEN.Tween(controls.target, tweenGroup)
        .to(finalTargetPos, FLY_IN_DURATION)
        .easing(TWEEN.Easing.Cubic.InOut) 
        .onComplete(() => {
            console.log('Анимация прилета завершена в точке 0.');
            currentWaypointIndex = 0;
            if (controls) {
                controls.enabled = true;
                controls.update();
            }
            isAnimatingManualStep = false;

            console.log("main.js: Вызов initPhotoOverlays() после прилета...");
            initPhotoOverlays();

            updateTourButtonsUI();

        })
        .start();

}

function onProgress(xhr) { console.log((xhr.loaded / xhr.total * 100) + '% loaded'); }
function onError(error) { console.error('Ошибка загрузки модели:', error); }

function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight1.position.set(5, 10, 7.5);
    scene.add(directionalLight1);
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight2.position.set(-5, -8, -5);
    scene.add(directionalLight2);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.screenSpacePanning = true;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.enableTouch = true;
    controls.rotateSpeed = 2.5;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 1.0;
    controls.touchDollySpeed = 1.8;
    controls.touchPanSpeed = 1.0;
    controls.enableKeys = false;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;

    controls.addEventListener('start', handleControlStart);
    controls.addEventListener('end', () => { console.log('OrbitControls: Interaction End'); });
    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('resize', onWindowResize);

    const loader = new GLTFLoader();
    loader.load(
        'Model/scene.gltf',
        onLoadModel,
        onProgress,
        onError
    );

    animate();
}

function animate(time) {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    tweenGroup.update(time);

    for (const callback of animationUpdateCallbacks) {
        callback(delta);
    }

    if (controls && controls.enabled) {
        controls.update(delta);

        if (targetBounds && controls.target) {
            controls.target.clamp(targetBounds.min, targetBounds.max);
        }
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

init();
