import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { api } from '../../services/api';
import type { GlobeGraphData, GlobeNode } from '../../types';
import {
  RotateCcw,
  Compass,
  Crosshair,
  Sparkles,
} from 'lucide-react';

export const GlobeGraph: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [graphData, setGraphData] = useState<GlobeGraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<GlobeNode | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [hopDepth, setHopDepth] = useState<number>(2);
  const [statePreview, setStatePreview] = useState<'populated' | 'focused' | 'forming' | 'preindex'>('populated');

  // Filter toggles
  const [filterTaxonomy, setFilterTaxonomy] = useState({
    functions: true,
    classes: true,
    types: true,
    files: true,
    hubs: true,
  });

  const [filterArcs, setFilterArcs] = useState({
    calls: true,
    defines: true,
    imports: true,
  });

  // Scene references for interaction controls
  const controlsRef = useRef<{
    resetView: () => void;
    viewTopPole: () => void;
    focusNode: (node: GlobeNode) => void;
    toggleRotate: () => boolean;
  }>({
    resetView: () => {},
    viewTopPole: () => {},
    focusNode: () => {},
    toggleRotate: () => true,
  });

  useEffect(() => {
    api.getGlobeGraph().then((data) => {
      setGraphData(data);
      if (data.nodes.length > 0) {
        setSelectedNode(data.nodes[1] || data.nodes[0]);
      }
    });
  }, []);

  // Three.js Mount & Render Loop
  useEffect(() => {
    if (!mountRef.current || !graphData) return;

    const container = mountRef.current;
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(0, 30, 240);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Master Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const SPHERE_RADIUS = 72;

    // 1. Dark Glass / Holographic Core Sphere
    const coreGeo = new THREE.SphereGeometry(SPHERE_RADIUS * 0.98, 48, 48);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x07090e,
      emissive: 0x050c18,
      specular: 0x38bdf8,
      shininess: 90,
      transparent: true,
      opacity: 0.88,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    globeGroup.add(coreMesh);

    // 2. Lat / Lon Coordinate Grid Rings
    const gridGroup = new THREE.Group();
    const ringMat = new THREE.LineBasicMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });

    for (let lat = -60; lat <= 60; lat += 30) {
      const phi = (90 - lat) * (Math.PI / 180);
      const r = SPHERE_RADIUS * Math.sin(phi);
      const y = SPHERE_RADIUS * Math.cos(phi);
      const pts = [];
      const segs = 64;
      for (let i = 0; i <= segs; i++) {
        const theta = (i / segs) * Math.PI * 2;
        pts.push(new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta)));
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(pts);
      gridGroup.add(new THREE.Line(ringGeo, ringMat));
    }

    for (let lon = 0; lon < 360; lon += 45) {
      const theta = lon * (Math.PI / 180);
      const pts = [];
      const segs = 64;
      for (let i = 0; i <= segs; i++) {
        const phi = (i / segs) * Math.PI;
        pts.push(
          new THREE.Vector3(
            SPHERE_RADIUS * Math.sin(phi) * Math.cos(theta),
            SPHERE_RADIUS * Math.cos(phi),
            SPHERE_RADIUS * Math.sin(phi) * Math.sin(theta)
          )
        );
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(pts);
      gridGroup.add(new THREE.Line(ringGeo, ringMat));
    }
    globeGroup.add(gridGroup);

    // 3. Atmospheric Outer Glow
    const auraGeo = new THREE.SphereGeometry(SPHERE_RADIUS * 1.03, 32, 32);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.05,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    globeGroup.add(auraMesh);

    // 4. Nodes Generation
    const nodeMeshes: THREE.Mesh[] = [];
    const nodeGroup = new THREE.Group();
    globeGroup.add(nodeGroup);

    const communityPalette = [0x38bdf8, 0x818cf8, 0xc084fc, 0x34d399, 0xfbbf24, 0xf43f5e];

    graphData.nodes.forEach((node) => {
      const size = node.active
        ? 3.4
        : node.importance > 0.85
        ? 2.3
        : node.importance > 0.6
        ? 1.5
        : 1.0;

      let geo: THREE.BufferGeometry;
      if (node.kind === 'file') {
        geo = new THREE.BoxGeometry(size * 1.1, size * 1.1, size * 1.1);
      } else if (node.kind === 'class' || node.kind === 'struct') {
        geo = new THREE.OctahedronGeometry(size * 1.2, 0);
      } else if (node.kind === 'type' || node.kind === 'interface') {
        geo = new THREE.TetrahedronGeometry(size * 1.1, 0);
      } else {
        geo = new THREE.SphereGeometry(size, 12, 12);
      }

      const col = node.active ? 0x38bdf8 : communityPalette[node.comm % communityPalette.length];
      const mat = new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: node.active ? 0.95 : 0.45,
        roughness: 0.2,
        metalness: 0.4,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(node.x, node.y, node.z);
      mesh.lookAt(0, 0, 0);
      mesh.userData = { node };
      nodeMeshes.push(mesh);
      nodeGroup.add(mesh);

      // Selected active target ring
      if (node.active) {
        const ringGeo = new THREE.RingGeometry(size * 1.8, size * 2.3, 32);
        const beaconMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
        });
        const beacon = new THREE.Mesh(ringGeo, beaconMat);
        beacon.position.set(node.x * 1.02, node.y * 1.02, node.z * 1.02);
        beacon.lookAt(0, 0, 0);
        globeGroup.add(beacon);
      }
    });

    // 5. Relational Great-Circle Curved Arcs
    const edgeGroup = new THREE.Group();
    globeGroup.add(edgeGroup);

    function createCurvedArc(pA: THREE.Vector3, pB: THREE.Vector3, altitude: number) {
      const points = [];
      const segs = 24;
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const p = new THREE.Vector3().lerpVectors(pA, pB, t);
        const dist = pA.distanceTo(pB);
        const arcH = Math.sin(t * Math.PI) * (dist * 0.22 + altitude);
        p.normalize().multiplyScalar(SPHERE_RADIUS + arcH);
        points.push(p);
      }
      return new THREE.BufferGeometry().setFromPoints(points);
    }

    graphData.edges.forEach((edge) => {
      const nA = graphData.nodes[edge.from];
      const nB = graphData.nodes[edge.to];
      if (!nA || !nB) return;

      const pA = new THREE.Vector3(nA.x, nA.y, nA.z);
      const pB = new THREE.Vector3(nB.x, nB.y, nB.z);

      const isPrimary = edge.from === 1 || edge.to === 1;
      const geo = createCurvedArc(pA, pB, isPrimary ? 3.5 : 1.0);

      const arcColor =
        edge.type === 'CALLS' ? 0x38bdf8 : edge.type === 'DEFINES' ? 0xa855f7 : 0x64748b;

      const edgeMat = new THREE.LineBasicMaterial({
        color: isPrimary ? 0x38bdf8 : arcColor,
        transparent: true,
        opacity: isPrimary ? 0.95 : 0.25,
        blending: isPrimary ? THREE.AdditiveBlending : THREE.NormalBlending,
      });

      edgeGroup.add(new THREE.Line(geo, edgeMat));
    });

    // Lights
    const ambientLight = new THREE.AmbientLight(0x0f172a, 2.5);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 2.2);
    dirLight1.position.set(120, 100, 150);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 1.5);
    dirLight2.position.set(-150, -80, -100);
    scene.add(dirLight2);

    // Mouse Interaction (Full 360 Sphere Orbiting & Zooming)
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let targetRotationX = 0.25;
    let targetRotationY = -0.55;
    let currentRotationX = 0.25;
    let currentRotationY = -0.55;
    let isAutoRotating = true;

    const dom = renderer.domElement;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      isAutoRotating = false;
      setAutoRotate(false);
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;
      targetRotationY += deltaX * 0.005;
      targetRotationX += deltaY * 0.005;
      targetRotationX = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, targetRotationX));
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.15;
      camera.position.z = Math.max(110, Math.min(420, camera.position.z));
    };

    // Raycast on Click for Node Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = dom.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const n = hit.userData?.node as GlobeNode;
        if (n) {
          setSelectedNode(n);
        }
      }
    };

    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('click', onClick);

    // Expose Controls
    controlsRef.current = {
      resetView: () => {
        targetRotationX = 0.25;
        targetRotationY = -0.55;
        camera.position.set(0, 30, 240);
        isAutoRotating = false;
        setAutoRotate(false);
      },
      viewTopPole: () => {
        targetRotationX = Math.PI / 2.2;
        targetRotationY = 0;
        camera.position.set(0, 40, 230);
        isAutoRotating = false;
        setAutoRotate(false);
      },
      focusNode: (node: GlobeNode) => {
        targetRotationX = -(node.lat * (Math.PI / 180));
        targetRotationY = (node.lon * (Math.PI / 180));
        camera.position.set(0, 15, 175);
        isAutoRotating = false;
        setAutoRotate(false);
      },
      toggleRotate: () => {
        isAutoRotating = !isAutoRotating;
        setAutoRotate(isAutoRotating);
        return isAutoRotating;
      },
    };

    // Resize Handler
    const onResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      if (isAutoRotating && !isDragging) {
        targetRotationY += delta * 0.08;
      }

      currentRotationX += (targetRotationX - currentRotationX) * 0.08;
      currentRotationY += (targetRotationY - currentRotationY) * 0.08;

      globeGroup.rotation.x = currentRotationX;
      globeGroup.rotation.y = currentRotationY;

      auraMesh.scale.setScalar(1 + Math.sin(time * 1.5) * 0.008);
      ringMat.opacity = 0.28 + Math.sin(time * 2.0) * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('mousedown', onMouseDown);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('click', onClick);
      renderer.dispose();
    };
  }, [graphData]);

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] overflow-hidden flex bg-[#0c0e14]">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* LEFT SPHERICAL FILTERS DRAWER */}
      {/* ───────────────────────────────────────────────────────────── */}
      <aside className="w-[280px] shrink-0 h-full bg-[#11141d] border-r border-[#1e293b] flex flex-col z-20 shadow-xl select-none">
        <div className="h-10 px-4 flex items-center justify-between bg-[#161b26] border-b border-[#1e293b]">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-white">Spherical Filters</span>
          </div>
          <button
            onClick={() => controlsRef.current.resetView()}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 transition"
          >
            Reset
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Node Taxonomy */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#64748b] uppercase tracking-wider pb-1">
              <span>Node Taxonomy</span>
              <span className="text-cyan-400">{graphData?.meta.total_nodes ?? 126} Active</span>
            </div>

            <label className="flex items-center justify-between p-2 rounded bg-[#161b26] hover:bg-[#1e2536] text-xs cursor-pointer transition">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filterTaxonomy.functions}
                  onChange={(e) =>
                    setFilterTaxonomy({ ...filterTaxonomy, functions: e.target.checked })
                  }
                  className="rounded text-cyan-500 focus:ring-0"
                />
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span>Functions & Methods</span>
              </div>
              <span className="font-mono text-[#64748b]">64</span>
            </label>

            <label className="flex items-center justify-between p-2 rounded bg-[#161b26] hover:bg-[#1e2536] text-xs cursor-pointer transition">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filterTaxonomy.classes}
                  onChange={(e) =>
                    setFilterTaxonomy({ ...filterTaxonomy, classes: e.target.checked })
                  }
                  className="rounded text-indigo-500 focus:ring-0"
                />
                <span className="w-2 h-2 rounded-sm bg-purple-400 rotate-45"></span>
                <span>Classes & Structs</span>
              </div>
              <span className="font-mono text-[#64748b]">28</span>
            </label>

            <label className="flex items-center justify-between p-2 rounded bg-[#161b26] hover:bg-[#1e2536] text-xs cursor-pointer transition">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filterTaxonomy.types}
                  onChange={(e) =>
                    setFilterTaxonomy({ ...filterTaxonomy, types: e.target.checked })
                  }
                  className="rounded text-purple-500 focus:ring-0"
                />
                <span className="w-2 h-2 rounded-xs bg-indigo-400"></span>
                <span>Types & Interfaces</span>
              </div>
              <span className="font-mono text-[#64748b]">24</span>
            </label>

            <label className="flex items-center justify-between p-2 rounded bg-[#161b26] hover:bg-[#1e2536] text-xs cursor-pointer transition">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filterTaxonomy.hubs}
                  onChange={(e) =>
                    setFilterTaxonomy({ ...filterTaxonomy, hubs: e.target.checked })
                  }
                  className="rounded text-emerald-500 focus:ring-0"
                />
                <span className="w-2 h-2 rounded-full border border-emerald-400 animate-pulse"></span>
                <span>Community Hubs</span>
              </div>
              <span className="font-mono text-emerald-400">8</span>
            </label>
          </div>

          {/* Relational Arcs */}
          <div className="space-y-1.5 pt-2 border-t border-[#1e293b]">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#64748b] uppercase tracking-wider pb-1">
              <span>Relational Arcs</span>
              <span className="text-cyan-400">{graphData?.meta.total_edges ?? 284} Total</span>
            </div>

            <label className="flex items-center justify-between p-2 rounded bg-[#161b26] hover:bg-[#1e2536] text-xs cursor-pointer transition">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filterArcs.calls}
                  onChange={(e) => setFilterArcs({ ...filterArcs, calls: e.target.checked })}
                  className="rounded text-cyan-500"
                />
                <span className="w-3 h-0.5 bg-cyan-400"></span>
                <span className="font-mono">CALLS</span>
              </div>
              <span className="font-mono text-cyan-400">142</span>
            </label>

            <label className="flex items-center justify-between p-2 rounded bg-[#161b26] hover:bg-[#1e2536] text-xs cursor-pointer transition">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filterArcs.defines}
                  onChange={(e) => setFilterArcs({ ...filterArcs, defines: e.target.checked })}
                  className="rounded text-purple-500"
                />
                <span className="w-3 h-0.5 bg-purple-400"></span>
                <span className="font-mono">DEFINES</span>
              </div>
              <span className="font-mono text-purple-400">86</span>
            </label>

            <label className="flex items-center justify-between p-2 rounded bg-[#161b26] hover:bg-[#1e2536] text-xs cursor-pointer transition">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filterArcs.imports}
                  onChange={(e) => setFilterArcs({ ...filterArcs, imports: e.target.checked })}
                  className="rounded text-slate-500"
                />
                <span className="w-3 h-0.5 bg-slate-500"></span>
                <span className="font-mono">IMPORTS</span>
              </div>
              <span className="font-mono text-[#64748b]">56</span>
            </label>
          </div>

          {/* Communities Legend */}
          <div className="space-y-1.5 pt-2 border-t border-[#1e293b]">
            <div className="text-[11px] font-mono text-[#64748b] uppercase tracking-wider pb-1">
              Communities (Louvain)
            </div>
            {graphData?.communities.map((comm) => (
              <div
                key={comm.id}
                className="flex items-center justify-between p-1.5 rounded text-xs bg-[#161b26]/60"
              >
                <div className="flex items-center space-x-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: typeof comm.color === 'string' ? comm.color : '#38bdf8' }}
                  ></span>
                  <span className="text-[#cbd5e1] truncate">{comm.name}</span>
                </div>
                <span className="text-[10px] font-mono text-[#64748b]">#{comm.id}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3D CANVAS VIEWPORT */}
      {/* ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* TOP CANVAS HUD BAR */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
          {/* Left Telemetry */}
          <div className="pointer-events-auto flex items-center space-x-3 px-3 py-1.5 rounded-xl bg-[#161b26]/90 backdrop-blur-md border border-[#232b3e] shadow-xl text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-white">Planet Topology</span>
            </div>
            <span className="text-[#64748b]">•</span>
            <span className="font-mono text-[#94a3b8]">
              {graphData?.meta.total_nodes ?? 126} Nodes • {graphData?.meta.total_edges ?? 284} Arcs
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold">
              Q=0.84
            </span>
          </div>

          {/* Center Hop Depth */}
          <div className="pointer-events-auto flex items-center p-0.5 rounded-xl bg-[#161b26]/90 backdrop-blur-md border border-[#232b3e] shadow-xl text-xs">
            {[1, 2, 3, 4].map((h) => (
              <button
                key={h}
                onClick={() => setHopDepth(h)}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  hopDepth === h
                    ? 'bg-cyan-500 text-[#090d14] font-bold shadow-sm'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                {h === 4 ? 'Full Sphere' : `${h} Hop${h > 1 ? 's' : ''}`}
              </button>
            ))}
          </div>

          {/* Right Camera Controls */}
          <div className="pointer-events-auto flex items-center space-x-2">
            <div className="flex items-center p-0.5 rounded-xl bg-[#161b26]/90 backdrop-blur-md border border-[#232b3e] shadow-xl text-xs">
              <button
                onClick={() => controlsRef.current.toggleRotate()}
                className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 transition ${
                  autoRotate ? 'bg-cyan-500/20 text-cyan-400' : 'text-[#94a3b8] hover:text-white'
                }`}
                title="Toggle continuous globe rotation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Orbit</span>
              </button>
              <button
                onClick={() => controlsRef.current.viewTopPole()}
                className="px-2.5 py-1 rounded-lg text-[#94a3b8] hover:text-white flex items-center space-x-1 transition"
                title="View northern polar projection"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Poles</span>
              </button>
              <button
                onClick={() => controlsRef.current.resetView()}
                className="px-2.5 py-1 rounded-lg text-[#94a3b8] hover:text-white flex items-center space-x-1 transition"
                title="Recenter camera"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Recenter</span>
              </button>
            </div>
          </div>
        </div>

        {/* STATE SWITCHER PILL (Matching Stitch Design) */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#161b26]/95 backdrop-blur-md border border-[#28334a] shadow-xl text-xs font-mono">
            <span className="text-[10px] text-[#64748b] uppercase tracking-wider pr-1">State:</span>
            <button
              onClick={() => setStatePreview('populated')}
              className={`px-2 py-0.5 rounded-full transition ${
                statePreview === 'populated'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              Populated
            </button>
            <button
              onClick={() => {
                setStatePreview('focused');
                if (selectedNode) controlsRef.current.focusNode(selectedNode);
              }}
              className={`px-2 py-0.5 rounded-full transition ${
                statePreview === 'focused'
                  ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              Focused (1-Hop)
            </button>
            <button
              onClick={() => setStatePreview('forming')}
              className={`px-2 py-0.5 rounded-full transition ${
                statePreview === 'forming'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              Index Forming
            </button>
          </div>
        </div>

        {/* THREE.JS MOUNT CONTAINER */}
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* BOTTOM HUD TOOLTIP */}
        <div className="absolute bottom-4 left-6 z-10 pointer-events-none text-[11px] text-[#64748b] font-mono">
          <span>Click node to inspect • Drag to rotate 360° sphere • Scroll to zoom</span>
        </div>
      </main>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* RIGHT SPHERICAL INSPECTOR DRAWER */}
      {/* ───────────────────────────────────────────────────────────── */}
      <aside className="w-[330px] shrink-0 h-full bg-[#11141d] border-l border-[#1e293b] flex flex-col z-20 shadow-2xl select-none">
        <div className="h-10 px-4 flex items-center justify-between bg-[#161b26] border-b border-[#1e293b]">
          <div className="flex items-center space-x-2">
            <Crosshair className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold text-white">Spherical Inspector</span>
          </div>
          <button
            onClick={() => selectedNode && controlsRef.current.focusNode(selectedNode)}
            className="text-[11px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition font-mono"
          >
            Center on Node
          </button>
        </div>

        {selectedNode ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Symbol Hero Card */}
            <div className="p-3.5 rounded-xl bg-[#161b26] border border-[#232b3e] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 uppercase font-semibold border border-cyan-500/20">
                  {selectedNode.kind} • Lines {selectedNode.lines}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">Active In Index</span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white font-mono break-all leading-tight">
                  {selectedNode.name}
                </h3>
                <div className="text-[11px] font-mono text-[#64748b] mt-0.5 break-all">
                  {selectedNode.file}
                </div>
              </div>

              {/* Coordinates Grid */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2 rounded bg-[#0b0d13] border border-[#1e293b]">
                  <div className="text-[10px] uppercase text-[#64748b]">Spherical Pos</div>
                  <div className="text-xs font-mono text-cyan-400">
                    Lat {selectedNode.lat}° | {selectedNode.lon}°
                  </div>
                </div>
                <div className="p-2 rounded bg-[#0b0d13] border border-[#1e293b]">
                  <div className="text-[10px] uppercase text-[#64748b]">Centrality</div>
                  <div className="text-xs font-mono text-emerald-400">
                    {(selectedNode.importance * 0.9).toFixed(2)} (High Hub)
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Box */}
            <div className="p-3 rounded-lg bg-[#0b0d13] border border-[#1e293b] space-y-1">
              <div className="text-[10px] font-mono uppercase text-[#64748b]">Normalized Signature</div>
              <code className="text-[11px] font-mono text-cyan-300 block break-words">
                {selectedNode.signature || `pub fn ${selectedNode.name}()`}
              </code>
            </div>

            {/* Inferred Semantic Intent */}
            <div className="p-3 rounded-lg bg-[#161b26] border border-[#232b3e] space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#64748b] uppercase">
                <span>Semantic Purpose</span>
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <p className="text-xs text-[#cbd5e1] leading-relaxed">
                Core computational symbol participating in AST fact extraction, call hierarchy resolution,
                and bounded neighborhood traversal for AI agent context retrieval.
              </p>
            </div>

            {/* Neighborhood Callers / Callees */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono uppercase text-[#64748b]">Neighboring Arcs</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between p-2 rounded bg-[#161b26] text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                      ▲ IN
                    </span>
                    <span className="font-mono text-white">ASTVisitorEngine</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#64748b]">DEFINES</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#161b26] text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      ▼ OUT
                    </span>
                    <span className="font-mono text-white">executeGraphQuery</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">CALLS</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#161b26] text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      ▼ OUT
                    </span>
                    <span className="font-mono text-white">retrieveContextSlice</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">CALLS</span>
                </div>
              </div>
            </div>

            {/* Direct MCP Command Box */}
            <div className="pt-2">
              <div className="text-[10px] font-mono text-[#64748b] uppercase mb-1.5">
                Agent Query Copy
              </div>
              <div className="p-2.5 rounded bg-[#0b0d13] border border-[#1e293b] font-mono text-[11px] text-[#cbd5e1] break-all">
                <span className="text-purple-400">fastast</span> get_call_graph{' '}
                <span className="text-cyan-400">--symbol</span> "{selectedNode.name}"
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center text-xs text-[#64748b]">
            Select any node on the 3D globe to inspect coordinates and call hierarchies.
          </div>
        )}
      </aside>
    </div>
  );
};
