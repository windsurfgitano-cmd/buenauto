"use client";

import { useEffect, useRef } from "react";

import gsap from "gsap";
import * as THREE from "three";

type Props = {
  className?: string;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function HeroThreeBg({ className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0.8, 4.8);

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(3, 4, 2);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xfecaca, 0.45);
    rim.position.set(-4, 2, -2);
    scene.add(rim);

    const group = new THREE.Group();
    scene.add(group);

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.35,
      metalness: 0.65,
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xe5e7eb,
      roughness: 0.05,
      metalness: 0.05,
      transparent: true,
      opacity: 0.22,
    });

    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x0b0b0f,
      roughness: 0.9,
      metalness: 0.1,
    });

    const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 1.0), bodyMat);
    base.position.y = 0.05;
    group.add(base);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 0.9), bodyMat);
    cabin.position.set(-0.2, 0.45, 0);
    group.add(cabin);

    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.38, 0.85), glassMat);
    glass.position.set(-0.2, 0.48, 0);
    group.add(glass);

    const wheelGeo = new THREE.TorusGeometry(0.22, 0.09, 14, 28);
    const wheelPositions: Array<[number, number, number]> = [
      [0.75, -0.1, 0.45],
      [0.75, -0.1, -0.45],
      [-0.75, -0.1, 0.45],
      [-0.75, -0.1, -0.45],
    ];

    for (const [x, y, z] of wheelPositions) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(x, y, z);
      wheel.rotation.y = Math.PI / 2;
      group.add(wheel);
    }

    group.rotation.y = -0.45;
    group.position.y = 0.1;

    const tl = gsap.timeline({ defaults: { ease: "sine.inOut" } });
    tl.to(group.rotation, { y: group.rotation.y + Math.PI * 2, duration: 22, repeat: -1, ease: "none" }, 0);
    tl.to(group.position, { y: 0.22, duration: 2.8, yoyo: true, repeat: -1 }, 0);

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);

      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.setSize(w, h, false);
    };

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement ?? canvas);

    let raf = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      const t = clock.getElapsedTime();
      base.rotation.z = Math.sin(t * 0.35) * 0.015;
      cabin.rotation.z = Math.sin(t * 0.35) * 0.015;

      renderer.render(scene, camera);
      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
      ro.disconnect();
      tl.kill();

      wheelGeo.dispose();
      base.geometry.dispose();
      cabin.geometry.dispose();
      glass.geometry.dispose();
      bodyMat.dispose();
      glassMat.dispose();
      wheelMat.dispose();

      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={
        className ??
        "pointer-events-none absolute inset-0 h-full w-full opacity-60 [mask-image:radial-gradient(60%_60%_at_50%_40%,black,transparent)]"
      }
    />
  );
}
