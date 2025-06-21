// components/AnimatedBackground.jsx
import React, { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadFull } from "tsparticles";

export default function AnimatedBackground() {
  const [engineReady, setEngineReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadFull(engine);
    }).then(() => setEngineReady(true));
  }, []);

  if (!engineReady) return null;

  return (
    <Particles
      id="tsparticles"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
      }}
      options={{
        background: { color: "#f0f4f8" },
        fpsLimit: 60,
        interactivity: {
          events: {
            onHover: { enable: true, mode: "repulse" },
            resize: true,
          },
          modes: {
            repulse: { distance: 120, duration: 0.4 },
          },
        },
        particles: {
          color: { value: ["#ff6b6b", "#1e90ff", "#ffd93d", "#4caf50", "#fff"] },
          links: {
            enable: true,
            color: "#cccccc",
            distance: 150,
            opacity: 0.4,
            width: 1,
          },
          move: {
            enable: true,
            speed: 2,
            direction: "none",
            outModes: { default: "bounce" },
          },
          number: {
            value: 60,
            density: { enable: true, area: 800 },
          },
          opacity: { value: 0.7 },
          shape: { type: ["circle", "square", "triangle"] },
          size: { value: { min: 5, max: 12 } },
        },
        detectRetina: true,
      }}
    />
  );
}
