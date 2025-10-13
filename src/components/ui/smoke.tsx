"use client";

import React, { HTMLAttributes } from "react";
import { Canvas } from "@react-three/fiber";
import { Smoke as SmokeEffect } from "react-smoke";

interface SmokeProps extends HTMLAttributes<HTMLDivElement> {
  density?: number;
  color?: string;
  opacity?: number;
  enableRotation?: boolean;
  rotation?: [number, number, number];
  enableWind?: boolean;
  windStrength?: [number, number, number];
  enableTurbulence?: boolean;
  turbulenceStrength?: [number, number, number];
  useSimpleScene?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Smoke({
  density = 50,
  color = "#ffffff",
  opacity = 0.5,
  enableRotation = true,
  rotation = [0, 0, 0.1],
  enableWind = false,
  windStrength = [0.01, 0.01, 0.01],
  enableTurbulence = false,
  turbulenceStrength = [0.01, 0.01, 0.01],
  useSimpleScene = true,
  className,
  children,
  ...props
}: SmokeProps) {
  return (
    <div
      className={`relative h-full w-full ${className}`}
      {...props}
    >
      <Canvas
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      >
        <SmokeEffect
          density={density}
          color={color}
          opacity={opacity}
          enableRotation={enableRotation}
          rotation={rotation}
          enableWind={enableWind}
          windStrength={windStrength}
          enableTurbulence={enableTurbulence}
          turbulenceStrength={turbulenceStrength}
          useSimpleScene={true}
        />
      </Canvas>
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  );
}
