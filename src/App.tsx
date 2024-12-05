import React, { useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Funktion für leuchtende Lampen
function RoofLamps({ path, position, scale }: { path: string; position: [number, number, number]; scale: [number, number, number] }) {
    const { scene, materials } = useGLTF(path);

    React.useEffect(() => {
        if (materials) {
            Object.values(materials).forEach((material) => {
                if (material instanceof THREE.MeshStandardMaterial) {
                    material.emissive = new THREE.Color("white"); // Weißes Leuchten
                    material.emissiveIntensity = 10; // Intensität des Lichts
                }
            });
        }
    }, [materials]);

    return <primitive object={scene} position={position} scale={scale} />;
}

// Funktion zum Laden eines 3D-Modells mit Hover-Highlight und Klick-Interaktion
function HighlightableModel({ 
    path, 
    position, 
    scale, 
    rotation, 
    name, 
    materialProps,
    onClick
}: { 
    path: string; 
    position: [number, number, number]; 
    scale: [number, number, number]; 
    rotation?: [number, number, number]; 
    name: string; 
    materialProps?: THREE.MeshStandardMaterialParameters;
    onClick: () => void;
}) {
    const { scene, materials } = useGLTF(path);
    const [hovered, setHovered] = useState(false);

    // Anwenden von Materialeigenschaften
    if (materials && materialProps) {
        Object.values(materials).forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial) {
                Object.assign(material, materialProps);
            }
        });
    }

    // Dynamische Materialänderung für Highlight
    if (hovered && materials) {
        Object.values(materials).forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial) {
                material.emissive = new THREE.Color(1, 1, 0); // Gelb
                material.emissiveIntensity = 0.5;
            }
        });
    } else if (materials) {
        Object.values(materials).forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial) {
                material.emissive = new THREE.Color(0, 0, 0); // Kein Highlight
                material.emissiveIntensity = 0;
            }
        });
    }

    return (
        <primitive 
            object={scene} 
            position={position} 
            scale={scale} 
            rotation={rotation} 
            castShadow 
            onPointerOver={(e: React.PointerEvent) => {
                e.stopPropagation(); // Stoppt das Hover-Ereignis für darunterliegende Objekte
                setHovered(true);
            }}
            onPointerOut={() => setHovered(false)} 
            onClick={(e: React.PointerEvent) => {
                e.stopPropagation(); // Stoppt das Klick-Ereignis für darunterliegende Objekte
                onClick();
            }}
        />
    );
}

// Boden ohne Highlight und Klick
function Model({ path, position, scale, rotation }: { 
    path: string; 
    position: [number, number, number]; 
    scale: [number, number, number]; 
    rotation?: [number, number, number]; 
}) {
    const { scene } = useGLTF(path);
    return <primitive object={scene} position={position} scale={scale} rotation={rotation} receiveShadow />;
}

function Licht({ path, position, scale }: { path: string; position: [number, number, number]; scale: [number, number, number] }) {
    const { scene, materials } = useGLTF(path);

    React.useEffect(() => {
        if (materials) {
            Object.values(materials).forEach((material) => {
                if (material instanceof THREE.MeshStandardMaterial) {
                    material.emissive = new THREE.Color("white"); // Weißes Leuchten
                    material.emissiveIntensity = 10; // Reduzierte Lichtintensität
                }
            });
        }
    }, [materials]);

    React.useEffect(() => {
        scene.traverse((object) => {
            if (object instanceof THREE.Light) { // Prüfen, ob das Objekt ein Licht ist
                object.intensity = 4 // Helligkeit der Lichtquellen im Modell reduzieren
            }
        });
    }, [scene]);

    return <primitive object={scene} position={position} scale={scale} />;
}



// Kamera-Controller für Bewegung entlang der Z-Achse und Aktualisierung des Targets
function CameraController({ controlsRef }: { controlsRef: React.RefObject<any> }) {
    const { camera } = useThree();
    const zPositionRef = useRef(camera.position.z);

    const handleWheel = (event: WheelEvent) => {
        // Passe die Z-Achsen-Position der Kamera an
        zPositionRef.current += event.deltaY * 0.025; // Reduzierte Schrittgröße
        camera.position.set(0, 3, zPositionRef.current); // Bewegt die Kamera entlang der Z-Achse

        // Aktualisiere das Target der OrbitControls
        if (controlsRef.current) {
            controlsRef.current.target.set(camera.position.x, camera.position.y, camera.position.z - 1); // Beispiel Offset
            controlsRef.current.update();
        }

        camera.updateProjectionMatrix();
    };

    React.useEffect(() => {
        window.addEventListener("wheel", handleWheel);
        return () => window.removeEventListener("wheel", handleWheel);
    }, []);

    return null;
}

const App = () => {
    const controlsRef = useRef<any>(null);
    const [message, setMessage] = useState<string | null>(null);

    return (
        <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
            <Canvas 
                shadows 
                camera={{ position: [0, 2.1, 0], fov: 75 }}
                gl={{
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 0.27, // Hier die Helligkeit anpassen
                }}
                style={{ display: "block" }}
            >
                <CameraController controlsRef={controlsRef} />
                
                {/* Orbit Controls */}
                <OrbitControls 
                    ref={controlsRef} 
                    minPolarAngle={0} 
                    maxPolarAngle={Math.PI} 
                    enableZoom={false} 
                />
                
                <Environment background preset="park" />
                <Environment preset="warehouse" />
                
                {/* Modelle */}
                <Model path="/models/officeRoomRoofless.glb" position={[0, 1, 0]} scale={[1.5, 1.5, 1.5]} />
                <RoofLamps path="/models/roofLamps.glb" position={[0, 1, 0]} scale={[1.5, 1.5, 1.5]} />
                <Model path="/models/roofHoles.glb" position={[0, 1, 0]} scale={[1.5, 1.5, 1.5]} />
                <Licht path="models/Licht.glb" position={[0, 1, 0]} scale={[1.5, 1.5, 1.5]} />
                <Model path="/models/chair.glb" position={[-5.63, 4.37, 3.75]} scale={[0.1, 0.1, 0.1]} />
                <HighlightableModel 
                    path="/models/officeChair.glb" 
                    position={[0, 1, 0]} 
                    scale={[1.5, 1.5, 1.5]}
                    name="Chair"
                    materialProps={{
                        roughness: 0.8,
                        metalness: 0.0,
                    }}
                    onClick={() => setMessage("Der Stuhl muss richtig eingestellt sein um Rückenprobleme zu vermeiden")}
                />
                <HighlightableModel 
                    path="/models/woodTable.glb" 
                    position={[0, 1, 0]} 
                    scale={[1.5, 1.5, 1.5]}
                    name="Tisch"
                    materialProps={{
                        roughness: 1.0,
                        metalness: 0.0,
                    }}
                    onClick={() => setMessage("Wenn man viel am Computer sitzt, sollte man sich alle 150 Minuten bewegen. Hilfreich ist es auch im Stehen zu arbeiten")}
                />
                <HighlightableModel 
                    path="/models/Lichtschalter.glb" 
                    position={[0, 1, 0]} 
                    scale={[1.5, 1.5, 1.5]}
                    name="Lichschalter"
                    materialProps={{
                        roughness: 1.0,
                        metalness: 0.75,
                    }}
                    onClick={() => setMessage("Wenn keiner mehr im Raum ist, muss das Licht nicht brennen")}
                />
                <HighlightableModel 
                    path="/models/logo.glb" 
                    position={[0, 1, 0]} 
                    scale={[1.5, 1.5, 1.5]}
                    name="Logo"
                    materialProps={{
                        roughness: 1.0,
                        metalness: 0.75,
                    }}
                    onClick={() => setMessage("Made for Siemens")}
                />
                <HighlightableModel 
                    path="/models/coffee.glb" 
                    position={[0, 1, 0]} 
                    scale={[1.5, 1.5, 1.5]}
                    name="Kaffeemaschiene"
                    materialProps={{
                        roughness: 0.5,
                        metalness: 1,
                    }}
                    onClick={() => setMessage("Laute und störende Geräusche, wie durch eine Kaffeemühle, sollten entfernt von arbeitenden Kollegen vermieden werden")}
                />
                <HighlightableModel 
                    path="/models/cable.glb" 
                    position={[0, 1, 0]} 
                    scale={[1.5, 1.5, 1.5]}
                    name="Kabel"
                    materialProps={{
                        roughness: 1.0,
                        metalness: 0.75,
                    }}
                    onClick={() => setMessage("Es sollte darauf geachtet werden mögliche Stolperfallen zu vermeiden")}
                />
                <HighlightableModel 
                    path="/models/laptop.glb" 
                    position={[0, 1, 0]} 
                    scale={[1.5, 1.5, 1.5]}
                    name="Laptop"
                    materialProps={{
                        roughness: 1.0,
                        metalness: 0.75,
                    }}
                    onClick={() => setMessage("Computer sollten bei nicht Benutzung gesperrt sein und nicht einfach rumstehen um Diebstähle zu vermeiden")}
                />
                <HighlightableModel 
                    path="/models/fire.glb" 
                    position={[0, 1, 0]} 
                    scale={[1.5, 1.5, 1.5]}
                    name="Feuerlöschen"
                    materialProps={{
                        roughness: 1.0,
                        metalness: 0.75,
                    }}
                    onClick={() => setMessage("Feuerlöscher müssen aus Sicherheitsgründen an ihren Plätzen stehen")}
                />
                <HighlightableModel 
                    path="/models/books.glb" 
                    position={[0, 1, 0]} 
                    scale={[1.5, 1.5, 1.5]}
                    name="Bücher"
                    materialProps={{
                        roughness: 1.0,
                        metalness: 0.2,
                    }}
                    onClick={() => setMessage("Falls etwas kaputt geht, sollte es richtig repariert werden oder ersetzt werden")}
                />
                <HighlightableModel 
                    path="/models/powerStrip.glb" 
                    position={[0, 1, 0]} 
                    scale={[1.5, 1.5, 1.5]}
                    name="Steckdosenleiste"
                    materialProps={{
                        roughness: 1.0,
                        metalness: 0.75,
                    }}
                    onClick={() => setMessage("Es dürfen nicht mehrere Steckdosenleisten ineinandergesteckt werden, da sonst die vorgegebene Belastung überschritten werden kann")}
                />
                <HighlightableModel 
                    path="/models/whiteTable.glb" 
                    position={[0, 1, 0]} 
                    scale={[1.5, 1.5, 1.5]}
                    name="Weißer Tisch"
                    materialProps={{
                        roughness: 0.5,
                        metalness: 1.0,
                    }}
                    onClick={() => setMessage("Wenn man viel am Computer sitzt, sollte man sich alle 150 Minuten bewegen. Hilfreich ist es auch im Stehen zu arbeiten")}
                />
                <HighlightableModel 
                    path="/models/monitors.glb" 
                    position={[0, 1, 0]} 
                    scale={[1.5, 1.5, 1.5]}
                    name="Bildschirm"
                    materialProps={{
                        roughness: 1.0,
                        metalness: 1.0,
                    }}
                    onClick={() => setMessage("Der Bildschirm sollte augenschonend sein. Die richtige Einstellung ist auch wichtig")}
                />
            </Canvas>

            {/* Nachricht */}
            {message && (
                <div 
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        backgroundColor: "white",
                        padding: "20px",
                        border: "1px solid black",
                        borderRadius: "10px",
                        textAlign: "center",
                        zIndex: 1000,
                    }}
                >
                    <p>{message}</p>
                    <button 
                        onClick={() => setMessage(null)} 
                        style={{
                            marginTop: "10px",
                            padding: "5px 10px",
                            border: "none",
                            borderRadius: "5px",
                            backgroundColor: "#007BFF",
                            color: "white",
                            cursor: "pointer",
                        }}
                    >
                        OK
                    </button>
                </div>
            )}
        </div>
    );
};

export default App;
