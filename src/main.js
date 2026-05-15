import './style.css';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

gsap.registerPlugin(ScrollTrigger);
// --- CINEMATIC LOADER & SCROLL LOCK ---
document.body.style.overflow = 'hidden';

// Animate the 0-100% counter
let loadCounter = { value: 0 };
const percentText = document.getElementById('loading-percentage');

gsap.to(loadCounter, {
    value: 100,
    duration: 2, // Matches the drive-by time
    ease: "power1.inOut",
    onUpdate: () => {
        if (percentText) {
            percentText.innerHTML = Math.round(loadCounter.value) + "%";
        }
    }
});

// Fade out and remove loading screen
gsap.to("#loading-screen", {
    opacity: 0,
    duration: 1.5,
    delay: 2.2, // Waits just a split second after hitting 100%
    ease: "power2.inOut",
    onComplete: () => {
        const loader = document.getElementById('loading-screen');
        if(loader) loader.remove();
        document.body.style.overflow = '';
    }
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, -1, 5);

const canvas = document.querySelector('#webgl-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.3;

const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

let carPivot;

const loader = new GLTFLoader();
loader.load('/models/mercedes_pbr.glb', (gltf) => {
    const rawModel = gltf.scene;
    const box = new THREE.Box3().setFromObject(rawModel);
    const center = box.getCenter(new THREE.Vector3());

    rawModel.position.x += (rawModel.position.x - center.x);
    rawModel.position.y += (rawModel.position.y - center.y);
    rawModel.position.z += (rawModel.position.z - center.z);

    carPivot = new THREE.Group();
    carPivot.add(rawModel);
    carPivot.position.y = -1;
    scene.add(carPivot);

    rawModel.traverse((child) => {
        if (child.isMesh) child.material.envMapIntensity = 1.8;
    });

    setupScrollAnimation();
}, (xhr) => {
    console.log(`${Math.round((xhr.loaded / xhr.total) * 100)}% loaded`);
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function setupScrollAnimation() {
    if (!carPivot) return;

    const tl = gsap.timeline({ paused: true });

    // --- TIMELINE 0s: BOTTOM OF PAGE (Rear Profile / Signature Exhaust) ---
    tl.set(carPivot.rotation, { y: Math.PI * 2.44 });
    tl.set(camera.position, { x: 2, y: 1.5, z: 6 });
    tl.set("#feature-3, #exhaust-pointer", { opacity: 1 });
    tl.set(".line-wing, #specs-hud", { opacity: 1 });

    // --> THIS TRIGGERS THE YELLOW GRADIENT FOR THE EXHAUST STAGE <--
    tl.set("html", { "--bg-color": "#1a1600", "--wing-color": "#ffcc00" });

    // --- TIMELINE 1s - 3s: Animate to Side Profile ---
    tl.to("#feature-3, #exhaust-pointer", { opacity: 0, duration: 1 }, 1);
    tl.to(carPivot.rotation, { y: Math.PI * 2, duration: 2 }, 1);
    tl.to(camera.position, { x: 0, y: -0.5, z: 3.5, duration: 2 }, 1);

    // --- TIMELINE 3s: Side Profile (F1 Tech) Reveal ---
    tl.to("#feature-2, #wheels-pointer", { opacity: 1, duration: 1 }, 3);
    // Red Glow for Tech
    tl.to("html", { "--bg-color": "#1a0000", "--wing-color": "#ff3333", duration: 1 }, 2);

    // --- TIMELINE 5s - 7s: Animate to Front Profile ---
    tl.to("#feature-2, #wheels-pointer", { opacity: 0, duration: 1 }, 5);
    tl.to(carPivot.rotation, { y: Math.PI + Math.PI / 4, duration: 2 }, 5);
    tl.to(camera.position, { x: 0, y: -0.5, z: 4, duration: 2 }, 5);

    // --- TIMELINE 7s: Front Profile (Performance Utility) Reveal ---
    tl.to("#feature-1, #engine-pointer", { opacity: 1, duration: 1 }, 7);
    // Pure White Glow for Performance
    tl.to("html", { "--bg-color": "#111111", "--wing-color": "#ffffff", duration: 1 }, 6);

    // --- TIMELINE 9s - 11s: The Triangle Slam ---
    tl.to("#feature-1, #engine-pointer, #specs-hud, .line-wing", { opacity: 0, duration: 1 }, 9);

    tl.to("#tri-top", { left: "0%", ease: "power4.inOut", duration: 2 }, 9);
    tl.to("#tri-bottom", { right: "0%", ease: "power4.inOut", duration: 2 }, 9);
    tl.to("#final-text", { opacity: 1, scale: 1, duration: 1, ease: "back.out(1.7)" }, 10);
    tl.to(camera.position, { z: 10, duration: 2 }, 9);

    tl.progress(1);

    ScrollTrigger.create({
        trigger: ".scroll-track",
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
            const invertedProgress = 1 - self.progress;
            gsap.to(tl, {
                progress: invertedProgress,
                duration: 1,
                ease: "power2.out",
                overwrite: true
            });
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    if (carPivot) {
        camera.lookAt(carPivot.position);
    }
    renderer.render(scene, camera);
}
animate();