import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface FacePosition {
  x: number;
  y: number;
  z: number;
}

interface PortalgraphSceneProps {
  modelUrl?: string;
  modelType?: 'obj' | 'gltf' | 'primitive';
}

export function PortalgraphScene({ modelUrl, modelType = 'primitive' }: PortalgraphSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Detect mobile device
  const isMobile = useRef<boolean>(
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.matchMedia && window.matchMedia('(max-width: 768px)').matches)
  );
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    model: THREE.Object3D | null;
    animationId: number;
    facePosition: FacePosition;
  } | null>(null);
  
  const [isTracking, setIsTracking] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [manualMode, setManualMode] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [modelRotation, setModelRotation] = useState({ x: 0, y: 0, z: 0 });
  const [modelScale, setModelScale] = useState(1);
  const mousePosition = useRef({ x: 0, y: 0 });

  // Simple face detection using color/motion tracking
  const detectFace = useCallback((video: HTMLVideoElement, canvas: HTMLCanvasElement): FacePosition | null => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    // Set canvas size to match video
    const vw = video.videoWidth || 320;
    const vh = video.videoHeight || 240;
    
    if (canvas.width !== vw || canvas.height !== vh) {
      canvas.width = vw;
      canvas.height = vh;
    }
    
    // Draw video frame to canvas (this also shows preview)
    ctx.drawImage(video, 0, 0, vw, vh);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Simple skin color detection for face tracking
    let sumX = 0, sumY = 0, count = 0;
    
    // Step through pixels (every 4th pixel for performance)
    for (let y = 0; y < canvas.height; y += 4) {
      for (let x = 0; x < canvas.width; x += 4) {
        const i = (y * canvas.width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Detect skin-like colors (works for various skin tones)
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        
        // Skin detection algorithm
        if (r > 60 && g > 40 && b > 20 &&
            r > g && r > b &&
            (max - min) > 15 &&
            Math.abs(r - g) > 15) {
          sumX += x;
          sumY += y;
          count++;
          
          // Mark detected pixels for visualization (optional debug)
          // data[i] = 0; data[i+1] = 255; data[i+2] = 0;
        }
      }
    }
    
    // Draw tracking indicator on canvas
    if (count > 50) {
      const avgX = sumX / count;
      const avgY = sumY / count;
      
      // Draw crosshair at detected face position
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(avgX, avgY, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(avgX - 40, avgY);
      ctx.lineTo(avgX + 40, avgY);
      ctx.moveTo(avgX, avgY - 40);
      ctx.lineTo(avgX, avgY + 40);
      ctx.stroke();
      
      // Normalize to -1 to 1
      const normalizedX = (avgX / canvas.width - 0.5) * 2;
      const normalizedY = (avgY / canvas.height - 0.5) * 2;
      
      // Estimate Z based on amount of skin detected (closer = more pixels)
      const normalizedZ = Math.min(1, Math.max(-1, (count - 3000) / 8000));
      
      return {
        x: -normalizedX * 2, // Invert X for mirror effect
        y: -normalizedY * 1.5,
        z: 3 + normalizedZ
      };
    }
    
    return null;
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);

    // Camera with perspective
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0x00ffff, 2);
    spotLight.position.set(5, 5, 5);
    spotLight.castShadow = true;
    scene.add(spotLight);

    const spotLight2 = new THREE.SpotLight(0xff00ff, 1.5);
    spotLight2.position.set(-5, 3, 5);
    scene.add(spotLight2);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);

    // No background walls - clean transparent background for hologram effect

    // Grid floor for depth reference
    const gridHelper = new THREE.GridHelper(10, 20, 0x00ffff, 0x003344);
    gridHelper.position.y = -1.5;
    gridHelper.position.z = -1;
    scene.add(gridHelper);

    // Create default model or load external
    let model: THREE.Object3D | null = null;

    const createDefaultModel = () => {
      const group = new THREE.Group();

      // Body
      const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1, 32);
      const bodyMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x00aaff,
        metalness: 0.3,
        roughness: 0.4,
        clearcoat: 0.5,
        transparent: true,
        opacity: 0.9,
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = -0.3;
      group.add(body);

      // Head
      const headGeometry = new THREE.SphereGeometry(0.35, 32, 32);
      const headMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffcc99,
        metalness: 0.1,
        roughness: 0.5,
      });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 0.5;
      group.add(head);

      // Eyes
      const eyeGeometry = new THREE.SphereGeometry(0.08, 16, 16);
      const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
      
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.12, 0.55, 0.28);
      group.add(leftEye);

      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(0.12, 0.55, 0.28);
      group.add(rightEye);

      // Arms
      const armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 16);
      const armMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x00aaff,
        metalness: 0.3,
        roughness: 0.4,
      });

      const leftArm = new THREE.Mesh(armGeometry, armMaterial);
      leftArm.position.set(-0.5, -0.1, 0);
      leftArm.rotation.z = Math.PI / 4;
      group.add(leftArm);

      const rightArm = new THREE.Mesh(armGeometry, armMaterial);
      rightArm.position.set(0.5, -0.1, 0);
      rightArm.rotation.z = -Math.PI / 4;
      group.add(rightArm);

      // Hologram effect ring
      const ringGeometry = new THREE.TorusGeometry(0.7, 0.02, 16, 100);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.6,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.y = -0.8;
      ring.rotation.x = Math.PI / 2;
      group.add(ring);

      // Platform
      const platformGeometry = new THREE.CylinderGeometry(0.8, 0.9, 0.1, 32);
      const platformMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x1a1a3e,
        metalness: 0.9,
        roughness: 0.1,
      });
      const platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.position.y = -1;
      group.add(platform);

      return group;
    };

    // Auto-scale function to fit any model to standard size
    const autoScaleModel = (obj: THREE.Object3D, targetSize: number = 2.5) => {
      // Calculate bounding box
      const box = new THREE.Box3().setFromObject(obj);
      const size = new THREE.Vector3();
      box.getSize(size);
      
      // Get the largest dimension
      const maxDim = Math.max(size.x, size.y, size.z);
      
      // Calculate scale to fit target size
      const scale = targetSize / maxDim;
      obj.scale.set(scale, scale, scale);
      
      // Store base scale for later adjustments
      obj.userData.baseScale = scale;
      
      // Recalculate bounding box after scaling
      const newBox = new THREE.Box3().setFromObject(obj);
      const center = new THREE.Vector3();
      newBox.getCenter(center);
      
      // Center the model
      obj.position.x = -center.x;
      obj.position.y = -center.y;
      obj.position.z = -center.z;
      
      console.log(`Model auto-scaled: original size ${maxDim.toFixed(2)}, scale factor ${scale.toFixed(4)}`);
    };

    if (modelType === 'primitive' || !modelUrl) {
      model = createDefaultModel();
      scene.add(model);
    } else if (modelType === 'obj' && modelUrl) {
      const loader = new OBJLoader();
      loader.load(
        modelUrl,
        (obj) => {
          // Auto-scale to fit screen
          autoScaleModel(obj);
          
          obj.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              // Keep original material if exists, otherwise apply default
              if (!child.material || (child.material as THREE.Material).type === 'MeshBasicMaterial') {
                child.material = new THREE.MeshPhysicalMaterial({
                  color: 0x00aaff,
                  metalness: 0.3,
                  roughness: 0.4,
                  clearcoat: 0.5,
                });
              }
            }
          });
          model = obj;
          sceneRef.current!.model = obj;
          scene.add(obj);
        },
        undefined,
        (error) => {
          console.error('Error loading OBJ:', error);
          model = createDefaultModel();
          scene.add(model);
        }
      );
    } else if (modelType === 'gltf' && modelUrl) {
      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          // Auto-scale to fit screen
          autoScaleModel(gltf.scene);
          
          model = gltf.scene;
          sceneRef.current!.model = gltf.scene;
          scene.add(gltf.scene);
        },
        undefined,
        (error) => {
          console.error('Error loading GLTF:', error);
          model = createDefaultModel();
          scene.add(model);
        }
      );
    }

    // Store refs
    sceneRef.current = {
      scene,
      camera,
      renderer,
      model,
      animationId: 0,
      facePosition: { x: 0, y: 0, z: 5 },
    };

    // Animation loop
    let time = 0;
    
    const animate = () => {
      sceneRef.current!.animationId = requestAnimationFrame(animate);
      time += 0.016;

      const currentModel = sceneRef.current?.model || model;
      if (currentModel) {
        // Subtle floating animation
        currentModel.position.y = Math.sin(time * 2) * 0.05;
        // Add subtle Y rotation animation
        currentModel.rotation.y = Math.sin(time * 0.5) * 0.1;
      }

      // Get face position for off-axis projection
      const facePos = sceneRef.current!.facePosition;
      
      // Update camera for parallax/off-axis projection effect
      // This creates the "looking through a window" effect
      const screenWidth = 6;
      const screenHeight = 4;
      const screenZ = -2;
      
      // Off-axis projection matrix calculation
      const eyeX = facePos.x;
      const eyeY = facePos.y;
      const eyeZ = facePos.z;
      
      // Calculate frustum for off-axis projection
      // IMPORTANT: Flip Y axis to correct the upside-down issue
      const nearPlane = 0.1;
      const farPlane = 100;
      
      const left = (-screenWidth / 2 - eyeX) * nearPlane / eyeZ;
      const right = (screenWidth / 2 - eyeX) * nearPlane / eyeZ;
      // Swap top and bottom to flip Y axis
      const bottom = (screenHeight / 2 + eyeY) * nearPlane / eyeZ;
      const top = (-screenHeight / 2 + eyeY) * nearPlane / eyeZ;
      
      camera.projectionMatrix.makePerspective(left, right, bottom, top, nearPlane, farPlane);
      camera.position.set(eyeX, -eyeY, eyeZ);
      camera.lookAt(0, 0, screenZ);

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
      }
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [modelUrl, modelType]);

  // Tracking active ref (to avoid closure issues)
  const trackingActiveRef = useRef(false);

  // Start face tracking
  const startTracking = useCallback(async () => {
    try {
      // Use front camera (user-facing) for mobile devices
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: 320 },
        height: { ideal: 240 },
        facingMode: 'user'
      };
      
      // For mobile, explicitly request front camera
      if (isMobile.current) {
        console.log('📱 Mobile device detected - using front camera');
        videoConstraints.facingMode = { exact: 'user' };
      }
      
      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints
      });
      
      console.log('Camera stream obtained:', stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
        };
        
        await videoRef.current.play();
        console.log('Video playing');
        
        setIsTracking(true);
        trackingActiveRef.current = true;
        setCameraError(null);
        setShowInstructions(false);
        setManualMode(false);
        
        // Start face tracking loop with ref-based check
        const trackingLoop = () => {
          // Use ref instead of state to avoid closure issues
          if (!trackingActiveRef.current) {
            console.log('Tracking stopped');
            return;
          }
          
          if (videoRef.current && canvasRef.current && sceneRef.current) {
            // Check if video is actually playing
            if (videoRef.current.readyState >= 2) {
              const facePos = detectFace(videoRef.current, canvasRef.current);
              if (facePos) {
                // Smooth the movement
                sceneRef.current.facePosition.x += (facePos.x - sceneRef.current.facePosition.x) * 0.15;
                sceneRef.current.facePosition.y += (facePos.y - sceneRef.current.facePosition.y) * 0.15;
                sceneRef.current.facePosition.z += (facePos.z - sceneRef.current.facePosition.z) * 0.1;
              }
            }
          }
          requestAnimationFrame(trackingLoop);
        };
        
        // Small delay to ensure video is ready
        setTimeout(() => {
          console.log('Starting tracking loop');
          trackingLoop();
        }, 500);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('دسترسی به دوربین امکان‌پذیر نیست. از حالت دستی استفاده کنید.');
    }
  }, [detectFace]);

  // Manual mouse/touch tracking mode
  const enableManualMode = useCallback(() => {
    setManualMode(true);
    setShowInstructions(false);
    
    const updatePosition = (clientX: number, clientY: number) => {
      if (!containerRef.current || !sceneRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width - 0.5) * 4;
      const y = -((clientY - rect.top) / rect.height - 0.5) * 3;
      
      mousePosition.current = { x, y };
      
      // Smooth update
      sceneRef.current.facePosition.x += (x - sceneRef.current.facePosition.x) * 0.15;
      sceneRef.current.facePosition.y += (y - sceneRef.current.facePosition.y) * 0.15;
    };

    const handleMouseMove = (e: MouseEvent) => {
      updatePosition(e.clientX, e.clientY);
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updatePosition(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Stop tracking
  const stopTracking = useCallback(() => {
    trackingActiveRef.current = false;
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsTracking(false);
    setManualMode(false);
    setShowInstructions(true);
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Main 3D Scene */}
      <div 
        ref={containerRef} 
        className="w-full h-full rounded-xl overflow-hidden shadow-2xl"
        style={{ 
          background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%)',
          boxShadow: '0 0 50px rgba(0, 255, 255, 0.3), inset 0 0 100px rgba(0, 0, 0, 0.5)'
        }}
      />
      
      {/* Hidden video for face detection */}
      <video ref={videoRef} className="hidden" playsInline muted autoPlay />
      
      {/* Instructions overlay - responsive */}
      {showInstructions && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl p-4">
          <div className="text-center p-4 sm:p-8 max-w-md w-full">
            <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🔮</div>
            <h2 className="text-xl sm:text-2xl font-bold text-cyan-400 mb-3 sm:mb-4">SETI@Portalgraph</h2>
            <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6" dir="rtl">
              این دمو یک افکت هولوگرام سه‌بعدی ایجاد می‌کند. با ردیابی موقعیت شما، 
              پرسپکتیو تصویر به صورت زنده تغییر می‌کند.
            </p>
            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={startTracking}
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/30 text-sm sm:text-base"
              >
                📷 شروع با دوربین {isMobile.current ? '(دوربین جلو)' : ''}
              </button>
              {isMobile.current && (
                <div className="text-xs text-cyan-300 mt-1">
                  📱 موبایل شناسایی شد - دوربین جلو فعال می‌شود
                </div>
              )}
              <button
                onClick={enableManualMode}
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-400 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/30 text-sm sm:text-base"
              >
                🖱️ حالت دستی (ماوس/لمسی)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera preview (when tracking) - using separate preview element */}
      {isTracking && (
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 w-32 sm:w-40 h-24 sm:h-30 rounded-lg overflow-hidden border-2 border-cyan-400 shadow-lg shadow-cyan-500/30 bg-black">
          <canvas 
            ref={canvasRef}
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
          <div className="absolute bottom-1 left-1 right-1 text-center">
            <span className="text-[10px] sm:text-xs text-cyan-400 bg-black/70 px-1.5 sm:px-2 py-0.5 rounded">
              {isMobile.current ? '📱 Front Cam' : '🎥 Tracking'}
            </span>
          </div>
        </div>
      )}

      {/* Mode indicator */}
      {manualMode && (
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 px-2 sm:px-4 py-1.5 sm:py-2 bg-purple-600/80 text-white text-xs sm:text-sm rounded-lg backdrop-blur-sm">
          🖱️ حالت دستی
        </div>
      )}

      {/* Error message */}
      {cameraError && (
        <div className="absolute top-4 left-4 right-4 px-4 py-2 bg-red-500/80 text-white rounded-lg text-center" dir="rtl">
          {cameraError}
        </div>
      )}

      {/* Controls */}
      {(isTracking || manualMode) && (
        <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 flex justify-center">
          <button
            onClick={stopTracking}
            className="px-4 sm:px-6 py-1.5 sm:py-2 bg-red-500/80 text-white text-sm sm:text-base rounded-lg hover:bg-red-600 transition-all backdrop-blur-sm"
          >
            ⏹️ توقف
          </button>
        </div>
      )}

      {/* Info panel - responsive */}
      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 text-right text-xs sm:text-sm space-y-0.5 sm:space-y-1 bg-black/50 p-2 sm:p-3 rounded-lg backdrop-blur-sm max-w-[150px] sm:max-w-none" dir="rtl">
        <div className="text-cyan-400 font-bold text-xs sm:text-sm">راهنما:</div>
        <div className="text-gray-300 text-[10px] sm:text-sm">• حرکت چپ/راست</div>
        <div className="text-gray-300 text-[10px] sm:text-sm">• بالا/پایین</div>
        <div className="text-gray-300 text-[10px] sm:text-sm hidden sm:block">• نزدیک/دور شوید</div>
      </div>

      {/* Model Controls Toggle */}
      {(isTracking || manualMode) && modelUrl && (
        <button
          onClick={() => setShowControls(!showControls)}
          className="absolute bottom-14 sm:bottom-16 right-2 sm:right-4 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-800/80 text-white text-xs sm:text-sm rounded-lg backdrop-blur-sm hover:bg-gray-700/80 transition-all"
        >
          ⚙️ <span className="hidden sm:inline">{showControls ? 'بستن تنظیمات' : 'تنظیمات مدل'}</span>
        </button>
      )}

      {/* Model Controls Panel */}
      {showControls && (isTracking || manualMode) && modelUrl && (
        <div className="absolute bottom-24 sm:bottom-28 right-2 sm:right-4 w-56 sm:w-64 bg-gray-900/90 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-cyan-500/30 max-h-[60vh] overflow-auto" dir="rtl">
          <h4 className="text-cyan-400 font-bold mb-3 text-sm">تنظیمات مدل</h4>
          
          {/* Rotation X */}
          <div className="mb-3">
            <label className="text-xs text-gray-400 block mb-1">چرخش X: {modelRotation.x}°</label>
            <input
              type="range"
              min="0"
              max="360"
              value={modelRotation.x}
              onChange={(e) => {
                const newRotX = parseInt(e.target.value);
                setModelRotation(prev => ({ ...prev, x: newRotX }));
                if (sceneRef.current?.model) {
                  sceneRef.current.model.rotation.x = (newRotX * Math.PI) / 180;
                }
              }}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Rotation Y */}
          <div className="mb-3">
            <label className="text-xs text-gray-400 block mb-1">چرخش Y: {modelRotation.y}°</label>
            <input
              type="range"
              min="0"
              max="360"
              value={modelRotation.y}
              onChange={(e) => {
                const newRotY = parseInt(e.target.value);
                setModelRotation(prev => ({ ...prev, y: newRotY }));
                if (sceneRef.current?.model) {
                  sceneRef.current.model.rotation.y = (newRotY * Math.PI) / 180;
                }
              }}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Rotation Z */}
          <div className="mb-3">
            <label className="text-xs text-gray-400 block mb-1">چرخش Z: {modelRotation.z}°</label>
            <input
              type="range"
              min="0"
              max="360"
              value={modelRotation.z}
              onChange={(e) => {
                const newRotZ = parseInt(e.target.value);
                setModelRotation(prev => ({ ...prev, z: newRotZ }));
                if (sceneRef.current?.model) {
                  sceneRef.current.model.rotation.z = (newRotZ * Math.PI) / 180;
                }
              }}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Scale Multiplier */}
          <div className="mb-3">
            <label className="text-xs text-gray-400 block mb-1">ضریب مقیاس: {modelScale.toFixed(2)}x</label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.05"
              value={modelScale}
              onChange={(e) => {
                const multiplier = parseFloat(e.target.value);
                setModelScale(multiplier);
                if (sceneRef.current?.model) {
                  const baseScale = sceneRef.current.model.userData.baseScale || 1;
                  const newScale = baseScale * multiplier;
                  sceneRef.current.model.scale.set(newScale, newScale, newScale);
                }
              }}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Reset button */}
          <button
            onClick={() => {
              setModelRotation({ x: 0, y: 0, z: 0 });
              setModelScale(1);
              if (sceneRef.current?.model) {
                sceneRef.current.model.rotation.set(0, 0, 0);
                // Don't reset scale as it was auto-calculated
              }
            }}
            className="w-full mt-2 px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-all text-xs"
          >
            🔄 بازنشانی
          </button>
        </div>
      )}
    </div>
  );
}
