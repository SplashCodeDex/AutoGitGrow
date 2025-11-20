import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Stars, Float, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '../lib/state';

interface NetworkGraph3DProps {
    nodes: { id: string; label: string; group: 'me' | 'follower' | 'following' | 'mutual' }[];
}

const Node = ({ position, color, label, isHovered, onHover }: any) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += 0.01;
            meshRef.current.rotation.y += 0.01;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <group position={position}>
                <mesh
                    ref={meshRef}
                    onPointerOver={(e) => { e.stopPropagation(); onHover(true); }}
                    onPointerOut={(e) => onHover(false)}
                >
                    <icosahedronGeometry args={[isHovered ? 0.8 : 0.5, 1]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isHovered ? 2 : 0.5} wireframe />
                </mesh>
                {isHovered && (
                    <Text
                        position={[0, 1.2, 0]}
                        fontSize={0.5}
                        color="white"
                        anchorX="center"
                        anchorY="middle"
                    >
                        {label}
                    </Text>
                )}
            </group>
        </Float>
    );
};



const Connection = ({ start, end, color }: any) => {
    return (
        <Line points={[start, end]} color={color} transparent opacity={0.2} lineWidth={1} />
    );
};

const NetworkGraph3D: React.FC<NetworkGraph3DProps> = ({ nodes }) => {
    const { isDarkMode } = useTheme();
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    // Generate positions in a sphere
    const layout = useMemo(() => {
        return nodes.map((node, i) => {
            const phi = Math.acos(-1 + (2 * i) / nodes.length);
            const theta = Math.sqrt(nodes.length * Math.PI) * phi;
            const r = node.group === 'me' ? 0 : 5; // Me in center, others around

            return {
                ...node,
                position: new THREE.Vector3(
                    r * Math.cos(theta) * Math.sin(phi),
                    r * Math.sin(theta) * Math.sin(phi),
                    r * Math.cos(phi)
                )
            };
        });
    }, [nodes]);

    const meNode = layout.find(n => n.group === 'me');

    return (
        <div className="w-full h-[400px] rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shadow-2xl relative">
            <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-sm p-2 rounded text-xs text-white">
                <p className="font-bold mb-1">Network Galaxy</p>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-indigo-500 rounded-full"></div> You</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Mutual</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> Follower</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-purple-500 rounded-full"></div> Following</div>
            </div>
            <Canvas camera={{ position: [0, 0, 12], fov: 60 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.5} />

                {layout.map((node) => {
                    let color = '#6366f1'; // Me (Indigo)
                    if (node.group === 'mutual') color = '#22c55e'; // Green
                    if (node.group === 'follower') color = '#3b82f6'; // Blue
                    if (node.group === 'following') color = '#a855f7'; // Purple

                    return (
                        <React.Fragment key={node.id}>
                            <Node
                                position={node.position}
                                color={color}
                                label={node.label}
                                isHovered={hoveredNode === node.id}
                                onHover={(hover: boolean) => setHoveredNode(hover ? node.id : null)}
                            />
                            {/* Connect everyone to 'me' for now, or mutuals to each other if we had that data */}
                            {node.group !== 'me' && meNode && (
                                <Connection start={node.position} end={meNode.position} color={color} />
                            )}
                        </React.Fragment>
                    );
                })}
            </Canvas>
        </div>
    );
};

export default NetworkGraph3D;
