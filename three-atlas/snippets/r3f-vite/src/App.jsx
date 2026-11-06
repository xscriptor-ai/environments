import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei';
import { useRef, useState } from 'react';

function Box() {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.4;
  });

  return (
    <mesh
      ref={ref}
      position={[-1.1, 0.6, 0]}
      castShadow
      receiveShadow
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[1.1, 1.1, 1.1]} />
      <meshPhysicalMaterial
        color={hovered ? '#ff6b8a' : '#88aaff'}
        metalness={0.1}
        roughness={0.3}
        clearcoat={0.6}
        clearcoatRoughness={0.2}
      />
    </mesh>
  );
}

function Sphere() {
  const ref = useRef();

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = 0.6 + Math.sin(state.clock.elapsedTime * 1.4) * 0.08;
  });

  return (
    <mesh ref={ref} position={[1.1, 0.6, 0]} castShadow receiveShadow>
      <sphereGeometry args={[0.55, 48, 24]} />
      <meshStandardMaterial color="#ffd166" metalness={0.85} roughness={0.25} />
    </mesh>
  );
}

export default function App() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [3, 2.2, 5], fov: 45, near: 0.1, far: 100 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#0b0d12']} />

      <ambientLight intensity={0.35} />
      <directionalLight
        position={[4, 6, 3]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-normalBias={0.02}
      />

      <Box />
      <Sphere />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#151a22" roughness={0.9} metalness={0} />
      </mesh>

      <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={10} blur={2} far={4} />
      <Environment preset="studio" />
      <OrbitControls
        enableDamping
        minDistance={2}
        maxDistance={12}
        maxPolarAngle={Math.PI / 2 - 0.05}
        target={[0, 0.6, 0]}
      />
    </Canvas>
  );
}
