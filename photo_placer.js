

import * as THREE from 'three';
import { scene } from './main.js';

const textureLoader = new THREE.TextureLoader();
console.log("TextureLoader создан. (Версия с индивидуальной загрузкой)");

function addPhotoOverlay(options) {
    try {
        const defaults = {
            texturePath: 'images/default.png', width: 1, height: 1,
            position: new THREE.Vector3(0, 1.5, -2), lookAtDirection: new THREE.Vector3(0, 0, 1), offset: 0.01
        };
        const config = { ...defaults, ...options };

        const photoGeometry = new THREE.PlaneGeometry(config.width, config.height);
        let photoMaterial = null;
        const photoTexture = textureLoader.load(
            config.texturePath,
            (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                if (photoMaterial) {
                    photoMaterial.map = texture;
                    photoMaterial.color.set(0xffffff);
                    photoMaterial.needsUpdate = true;
                }
            },
            undefined,
            (error) => console.error(`!!! ОШИБКА загрузки текстуры ${config.texturePath}:`, error)
        );

        photoMaterial = new THREE.MeshBasicMaterial({
             side: THREE.DoubleSide, transparent: true, color: 0xff00ff
        });

        const photoMesh = new THREE.Mesh(photoGeometry, photoMaterial);
        photoMesh.name = `PhotoOverlay_${config.texturePath.split('/').pop()}`;

        const finalPosition = config.position.clone().add(config.lookAtDirection.clone().multiplyScalar(config.offset));
        photoMesh.position.copy(finalPosition);

        const horizontalLookAtDirection = new THREE.Vector3(config.lookAtDirection.x, 0, config.lookAtDirection.z).normalize();
        if (horizontalLookAtDirection.lengthSq() < 0.001) {
            horizontalLookAtDirection.set(0, 0, Math.sign(config.lookAtDirection.z) || 1);
        }
        const lookAtTarget = finalPosition.clone().add(horizontalLookAtDirection);
        photoMesh.lookAt(lookAtTarget);

        const euler = new THREE.Euler().setFromQuaternion(photoMesh.quaternion, 'YXZ');
        euler.z = 0;
        photoMesh.quaternion.setFromEuler(euler);

        if (scene) {
            scene.add(photoMesh);
        } else {
             console.error("[addPhotoOverlay] Не удалось добавить Mesh: переменная 'scene' не доступна.");
        }
    } catch (error) {
        console.error(`[addPhotoOverlay] КРИТИЧЕСКАЯ ОШИБКА при добавлении ${options?.texturePath}:`, error);
    }
}

export function initPhotoOverlays() {
    console.log("[initPhotoOverlays] Начало инициализации (индивидуальная загрузка)...");

    console.log("--- Настройка Картины 1 ---");
    const targetPosVec1 = new THREE.Vector3(3.5798, 2.1698, 0.2825);
    const cameraPosVec1 = new THREE.Vector3(3.2938, 2.1675, 0.3732);
    const planeNormal1 = new THREE.Vector3().subVectors(cameraPosVec1, targetPosVec1).normalize();
    const photo1_aspectRatio = 1.1;
    const photo1_desiredWidth = 1.1;
    const photo1_height = photo1_desiredWidth / photo1_aspectRatio;
    const photo1_offset = 0.07;
    addPhotoOverlay({
        texturePath: 'images/photo1.jpg', width: photo1_desiredWidth, height: photo1_height,
        position: targetPosVec1, lookAtDirection: planeNormal1, offset: photo1_offset
    });

    console.log("--- Настройка Картины 2 ---");
    const targetPosVec2 = new THREE.Vector3(-2.7927, 2.6393, -1.3992);
    const cameraPosVec2 = new THREE.Vector3(-2.6867, 2.6602, -1.1193);
    const planeNormal2 = new THREE.Vector3().subVectors(cameraPosVec2, targetPosVec2).normalize();
    const photo2_aspectRatio = 298 / 546;
    const photo2_desiredWidth = 1.0;
    const photo2_height = photo2_desiredWidth / photo2_aspectRatio;
    const photo2_offset = -0.10;
    addPhotoOverlay({
        texturePath: 'images/first_1.jpg', width: photo2_desiredWidth, height: photo2_height,
        position: targetPosVec2, lookAtDirection: planeNormal2, offset: photo2_offset
    });

    console.log("--- Настройка Картины 3 ---");
    const targetPosVec3 = new THREE.Vector3(3.7107, 3.2000, 0.2681);
    const cameraPosVec3 = new THREE.Vector3(3.4327, 3.3935, 0.3807);
    const planeNormal3 = new THREE.Vector3().subVectors(cameraPosVec3, targetPosVec3).normalize();
    const photo3_aspectRatio = 677 / 872;
    const photo3_desiredWidth = 0.7;
    const photo3_height = photo3_desiredWidth / photo3_aspectRatio;
    const photo3_offset = 0.1;
    addPhotoOverlay({
        texturePath: 'images/3.jpg', width: photo3_desiredWidth, height: photo3_height,
        position: targetPosVec3, lookAtDirection: planeNormal3, offset: photo3_offset
    });

    console.log("--- Настройка Картины 4 ---");
    const targetPosVec4 = new THREE.Vector3(1.7000, 2.9044, -2.3531);
    const cameraPosVec4 = new THREE.Vector3(1.9150, 2.8955, -2.8248);
    const planeNormal4 = new THREE.Vector3().subVectors(cameraPosVec4, targetPosVec4).normalize();
    const photo4_aspectRatio = 1906 / 1595;
    const photo4_desiredWidth = 1.4;
    const photo4_height = photo4_desiredWidth / photo4_aspectRatio;
    const photo4_offset = 0.21;
    addPhotoOverlay({
        texturePath: 'images/4.jpg', width: photo4_desiredWidth, height: photo4_height,
        position: targetPosVec4, lookAtDirection: planeNormal4, offset: photo4_offset
    });

    console.log("--- Настройка Картины 5 ---");
    const targetPosVec5 = new THREE.Vector3(0.4774, 2.6670, -2.8344);
    const cameraPosVec5 = new THREE.Vector3(0.6063, 2.7802, -2.5638);
    const planeNormal5 = new THREE.Vector3().subVectors(cameraPosVec5, targetPosVec5).normalize();
    const photo5_aspectRatio = 1484 / 1747;
    const photo5_desiredWidth = 0.6;
    const photo5_height = photo5_desiredWidth / photo5_aspectRatio;
    const photo5_offset = 0.06;
    addPhotoOverlay({
        texturePath: 'images/5.jpg', width: photo5_desiredWidth, height: photo5_height,
        position: targetPosVec5, lookAtDirection: planeNormal5, offset: photo5_offset
    });

    console.log("--- Настройка Картины 6 ---");
    const targetPosVec6 = new THREE.Vector3(0.3900, 1.9000, -2.6500);
    const cameraPosVec6 = new THREE.Vector3(0.5, 1.9045, -2.4023);
    const planeNormal6 = new THREE.Vector3().subVectors(cameraPosVec6, targetPosVec6).normalize();
    const photo6_aspectRatio = 1080 / 1845;
    const photo6_desiredWidth = 0.4;
    const photo6_height = photo6_desiredWidth / photo6_aspectRatio;
    const photo6_offset = -0.04;
    addPhotoOverlay({
        texturePath: 'images/6.jpg', width: photo6_desiredWidth, height: photo6_height,
        position: targetPosVec6, lookAtDirection: planeNormal6, offset: photo6_offset
    });

    console.log("--- Настройка Картины 7 ---");
    const targetPosVec7 = new THREE.Vector3(-3.3758, 3.4091, -0.4700);
    const cameraPosVec7 = new THREE.Vector3(-3.0967, 3.4146, -0.5838);
    const planeNormal7 = new THREE.Vector3().subVectors(cameraPosVec7, targetPosVec7).normalize();
    console.log("[Картина 7] Позиция на стене:", targetPosVec7);
    console.log("[Картина 7] Нормаль от стены:", planeNormal7);
    const photo7_aspectRatio = 1755 / 2177;
    const photo7_desiredWidth = 0.6;
    const photo7_height = photo7_desiredWidth / photo7_aspectRatio;
    const photo7_offset = -0.18;
    addPhotoOverlay({
        texturePath: 'images/7.jpg',
        width: photo7_desiredWidth,
        height: photo7_height,
        position: targetPosVec7,
        lookAtDirection: planeNormal7,
        offset: photo7_offset
    });
    console.log(`[Картина 7] Финальный размер плашки: ${photo7_desiredWidth.toFixed(3)}x${photo7_height.toFixed(3)}`);

    console.log("[initPhotoOverlays] Завершение инициализации.");
}
