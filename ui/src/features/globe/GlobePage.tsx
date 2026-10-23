import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { fastAstApi } from '../../services/api';
import type { GlobeNode, GlobeTopology } from '../../types';

interface GlobePageProps {
  onNavigateToExplore?: (symbolName?: string, filePath?: string) => void;
}

export const GlobePage: React.FC<GlobePageProps> = ({ onNavigateToExplore }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Data states
  const [topology, setTopology] = useState<GlobeTopology | null>(null);
  const [selectedNode, setSelectedNode] = useState<GlobeNode | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [activeHop, setActiveHop] = useState<number | 'full'>(2);
  const [previewState, setPreviewState] = useState<'populated' | 'focused' | 'forming' | 'preindex'>('populated');

  // Filter toggles
  const [filterTaxonomy, setFilterTaxonomy] = useState({
    functions: true,
    classes: true,
    types: true,
    files: true,
    communities: true,
  });

  const [filterEdges, setFilterEdges] = useState({
    calls: true,
    imports: true,
    defines: true,
    inherits: true,
    similar: true,
  });

  const [curvature, setCurvature] = useState(65);
  const [glowEnabled, setGlowEnabled] = useState(true);
  const [azimuthText, setAzimuthText] = useState('Azimuth 42° • El 18°');
  const [copiedBundle, setCopiedBundle] = useState(false);
  const [callers, setCallers] = useState<Array<{ caller: string; file_path: string; line_number: number }>>([]);
  const [callees, setCallees] = useState<Array<{ callee: string; file_path: string; line_number: number }>>([]);
  const [isLoadingCalls, setIsLoadingCalls] = useState(false);

  // References to three.js scene controls
  const controlsRef = useRef<{
    recenter: () => void;
    focusNode: (node: GlobeNode) => void;
    viewPoles: () => void;
    toggleOrbit: () => void;
    applyFilters: (
      tax: typeof filterTaxonomy,
      edg: typeof filterEdges,
      hop: number | 'full',
      selected: GlobeNode | null
    ) => void;
    sceneNodes: THREE.Mesh[];
  } | null>(null);

  // 1. Fetch live topology from FastAST backend
  useEffect(() => {
    let isMounted = true;
    fastAstApi.getGlobeTopology(150).then((data) => {
      if (isMounted) {
        setTopology(data);
        if (data.nodes.length > 0) {
          setSelectedNode(data.nodes[0]);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch callers & callees when selected node changes
  useEffect(() => {
    if (!selectedNode) {
      setCallers([]);
      setCallees([]);
      return;
    }
    setIsLoadingCalls(true);
    fastAstApi
      .getCallGraph(selectedNode.name)
      .then((cg) => {
        setCallers(cg.callers || []);
        setCallees(cg.callees || []);
        setIsLoadingCalls(false);
      })
      .catch(() => setIsLoadingCalls(false));
  }, [selectedNode]);

  // Reactivity for taxonomy, edge filters and active hop
  useEffect(() => {
    controlsRef.current?.applyFilters(
      filterTaxonomy,
      filterEdges,
      activeHop,
      selectedNode
    );
  }, [filterTaxonomy, filterEdges, activeHop, selectedNode]);

  // 2. Initialize 3D Three.js Spherical Planet
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !topology) return;

    // Clear previous canvas if any
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2500);
    camera.position.set(0, 30, 240);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const SPHERE_RADIUS = 72;

    // A. Dark Glass Core
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

    // B. Meridian & Latitudinal Grid Rings
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
      const segments = 64;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        pts.push(new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta)));
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(pts);
      gridGroup.add(new THREE.Line(ringGeo, ringMat));
    }

    for (let lon = 0; lon < 360; lon += 45) {
      const theta = lon * (Math.PI / 180);
      const pts = [];
      const segments = 64;
      for (let i = 0; i <= segments; i++) {
        const phi = (i / segments) * Math.PI;
        const x = SPHERE_RADIUS * Math.sin(phi) * Math.cos(theta);
        const y = SPHERE_RADIUS * Math.cos(phi);
        const z = SPHERE_RADIUS * Math.sin(phi) * Math.sin(theta);
        pts.push(new THREE.Vector3(x, y, z));
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(pts);
      gridGroup.add(new THREE.Line(ringGeo, ringMat));
    }
    globeGroup.add(gridGroup);

    // C. Atmosphere Halo Shell
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

    // Lat/Lon to 3D Vector
    function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    }

    // D. Compute positions & Render Nodes
    const nodeMeshes: THREE.Mesh[] = [];
    const nodePositions: THREE.Vector3[] = [];
    const nodeGroup = new THREE.Group();
    globeGroup.add(nodeGroup);

    topology.nodes.forEach((node, idx) => {
      const pos = latLonToVec3(node.lat, node.lon, SPHERE_RADIUS + (node.active ? 1.6 : 0.8));
      nodePositions.push(pos);

      const size = node.active
        ? 3.6
        : node.importance > 0.8
        ? 2.4
        : node.importance > 0.5
        ? 1.6
        : 1.0;

      let geom: THREE.BufferGeometry;
      if (node.kind === 'file') {
        geom = new THREE.BoxGeometry(size * 1.1, size * 1.1, size * 1.1);
      } else if (node.kind === 'class') {
        geom = new THREE.OctahedronGeometry(size * 1.2, 0);
      } else if (node.kind === 'type' || node.kind === 'struct') {
        geom = new THREE.TetrahedronGeometry(size * 1.1, 0);
      } else {
        geom = new THREE.SphereGeometry(size, 14, 14);
      }

      const col = new THREE.Color(node.comm_color || '#38bdf8');
      const mat = new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: node.active ? 0.95 : 0.45,
        roughness: 0.25,
        metalness: 0.5,
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(pos);
      mesh.lookAt(new THREE.Vector3(0, 0, 0));
      mesh.userData = { id: node.id, idx, data: node };
      nodeMeshes.push(mesh);
      nodeGroup.add(mesh);
    });

    // E. Beacon for selected node
    const beaconGroup = new THREE.Group();
    globeGroup.add(beaconGroup);

    function updateBeacon(pos: THREE.Vector3) {
      while (beaconGroup.children.length > 0) {
        beaconGroup.remove(beaconGroup.children[0]);
      }
      const ringGeo = new THREE.RingGeometry(5.0, 6.2, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      const beacon = new THREE.Mesh(ringGeo, ringMat);
      beacon.position.copy(pos.clone().multiplyScalar(1.02));
      beacon.lookAt(new THREE.Vector3(0, 0, 0));
      beaconGroup.add(beacon);

      const haloGeo = new THREE.RingGeometry(7.5, 8.5, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0x818cf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.copy(pos.clone().multiplyScalar(1.025));
      halo.lookAt(new THREE.Vector3(0, 0, 0));
      beaconGroup.add(halo);
    }

    if (nodePositions.length > 0) {
      updateBeacon(nodePositions[0]);
    }

    // F. Curved Great-Circle Relational Arcs
    const edgeGroup = new THREE.Group();
    globeGroup.add(edgeGroup);
    const edgeLines: Array<{ line: THREE.Line; edge: any }> = [];

    function createCurvedArc(pA: THREE.Vector3, pB: THREE.Vector3, altitude: number) {
      const points = [];
      const segments = 24;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const p = new THREE.Vector3().lerpVectors(pA, pB, t);
        const dist = pA.distanceTo(pB);
        const arcHeight = Math.sin(t * Math.PI) * (dist * 0.22 + altitude);
        p.normalize().multiplyScalar(SPHERE_RADIUS + arcHeight);
        points.push(p);
      }
      return new THREE.BufferGeometry().setFromPoints(points);
    }

    topology.edges.forEach((rel) => {
      const pA = nodePositions[rel.from];
      const pB = nodePositions[rel.to];
      if (!pA || !pB) return;

      const isPrimary = rel.from === 0 || rel.to === 0;
      const geo = createCurvedArc(pA, pB, isPrimary ? 3.5 : 1.2);
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(rel.color || '#38bdf8'),
        transparent: true,
        opacity: isPrimary ? 0.95 : 0.28,
        blending: isPrimary ? THREE.AdditiveBlending : THREE.NormalBlending,
      });
      const line = new THREE.Line(geo, mat);
      line.userData = { edge: rel };
      edgeLines.push({ line, edge: rel });
      edgeGroup.add(line);
    });

    // G. Lighting
    const ambientLight = new THREE.AmbientLight(0x0f172a, 2.5);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 2.0);
    dirLight1.position.set(120, 100, 150);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 1.4);
    dirLight2.position.set(-150, -80, -100);
    scene.add(dirLight2);

    // H. Mouse drag, Zoom, and Raycasting
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let targetRotX = 0.25;
    let targetRotY = -0.55;
    let curRotX = 0.25;
    let curRotY = -0.55;
    let localAutoOrbit = true;

    const dom = renderer.domElement;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      localAutoOrbit = false;
      setAutoRotate(false);
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      targetRotY += dx * 0.005;
      targetRotX += dy * 0.005;
      targetRotX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, targetRotX));
      prevMouse = { x: e.clientX, y: e.clientY };

      const az = Math.round(((targetRotY * 180) / Math.PI) % 360);
      const el = Math.round((targetRotX * 180) / Math.PI);
      setAzimuthText(`Azimuth ${Math.abs(az)}° • El ${el}°`);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.15;
      camera.position.z = Math.max(120, Math.min(480, camera.position.z));
    };

    // Raycast click selection
    const raycaster = new THREE.Raycaster();
    const mouseCoord = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = dom.getBoundingClientRect();
      mouseCoord.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseCoord.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseCoord, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const nodeData = hit.userData.data as GlobeNode;
        setSelectedNode(nodeData);
        updateBeacon(hit.position);
      }
    };

    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('click', onClick);

    // Expose control actions
    controlsRef.current = {
      recenter: () => {
        targetRotX = 0.25;
        targetRotY = -0.55;
        camera.position.set(0, 30, 240);
        localAutoOrbit = false;
        setAutoRotate(false);
      },
      focusNode: (node: GlobeNode) => {
        const phi = (90 - node.lat) * (Math.PI / 180);
        const theta = (node.lon + 180) * (Math.PI / 180);
        targetRotX = -(phi - Math.PI / 2);
        targetRotY = -theta + Math.PI / 2;
        camera.position.set(0, 15, 175);
        localAutoOrbit = false;
        setAutoRotate(false);
        const idx = topology.nodes.findIndex((n) => n.id === node.id);
        if (idx >= 0 && nodePositions[idx]) {
          updateBeacon(nodePositions[idx]);
        }
      },
      viewPoles: () => {
        targetRotX = Math.PI / 2.2;
        targetRotY = 0;
        localAutoOrbit = false;
        setAutoRotate(false);
      },
      toggleOrbit: () => {
        localAutoOrbit = !localAutoOrbit;
        setAutoRotate(localAutoOrbit);
      },
      applyFilters: (
        tax: typeof filterTaxonomy,
        edg: typeof filterEdges,
        hop: number | 'full',
        selected: GlobeNode | null
      ) => {
        const selectedName = selected?.name;
        const neighborNames = new Set<string>();
        if (selectedName) {
          neighborNames.add(selectedName);
          topology.edges.forEach((e) => {
            if (e.src === selectedName) neighborNames.add(e.dst);
            if (e.dst === selectedName) neighborNames.add(e.src);
          });
        }

        nodeMeshes.forEach((mesh) => {
          const node = mesh.userData.data as GlobeNode;
          let visible = true;
          const kind = (node.kind || '').toLowerCase();
          if (kind.includes('func') || kind === 'method') {
            visible = tax.functions;
          } else if (kind === 'class' || kind === 'struct') {
            visible = tax.classes;
          } else if (kind === 'type' || kind === 'interface') {
            visible = tax.types;
          } else if (kind === 'file') {
            visible = tax.files;
          }

          if (visible && hop === 1 && selectedName) {
            visible = neighborNames.has(node.name);
          }
          mesh.visible = visible;
        });

        edgeLines.forEach(({ line, edge }) => {
          let visible = true;
          const relType = (edge.type || '').toUpperCase();
          if (relType === 'CALLS') visible = edg.calls;
          else if (relType === 'IMPORTS') visible = edg.imports;
          else if (relType === 'DEFINES') visible = edg.defines;
          else if (relType === 'INHERITS') visible = edg.inherits;
          else if (relType === 'SIMILAR_TO' || relType === 'SIMILAR') visible = edg.similar;

          const touchesSelected =
            selectedName && (edge.src === selectedName || edge.dst === selectedName);

          if (visible && hop === 1 && selectedName) {
            visible = !!touchesSelected;
          }
          line.visible = visible;

          const mat = line.material as THREE.LineBasicMaterial;
          if (touchesSelected) {
            mat.opacity = 0.95;
          } else {
            mat.opacity = selectedName ? 0.15 : 0.28;
          }
        });
      },
      sceneNodes: nodeMeshes,
    };

    // Resize handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      if (localAutoOrbit && !isDragging) {
        targetRotY += delta * 0.08;
      }

      curRotX += (targetRotX - curRotX) * 0.08;
      curRotY += (targetRotY - curRotY) * 0.08;

      globeGroup.rotation.x = curRotX;
      globeGroup.rotation.y = curRotY;

      if (glowEnabled) {
        auraMesh.scale.setScalar(1 + Math.sin(time * 1.5) * 0.008);
      }
      ringMat.opacity = 0.28 + Math.sin(time * 2.0) * 0.06;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, [topology, glowEnabled]);

  const handleCopyBundle = () => {
    if (!selectedNode) return;
    const bundleText = JSON.stringify(
      {
        symbol: selectedNode.name,
        kind: selectedNode.kind,
        file: selectedNode.file_path,
        signature: selectedNode.signature,
        community: selectedNode.comm_name,
        spherical_coordinates: { lat: selectedNode.lat, lon: selectedNode.lon },
        in_degree: selectedNode.in_degree,
        out_degree: selectedNode.out_degree,
        callers: callers,
        callees: callees,
      },
      null,
      2
    );
    navigator.clipboard.writeText(bundleText);
    setCopiedBundle(true);
    setTimeout(() => setCopiedBundle(false), 2000);
  };

  return (
    <div className="globe-page-layout">
      {/* 1. LEFT FILTER & SPHERICAL CONTROL PANEL (300px) */}
      <aside className="globe-left-panel">
        <div className="panel-header">
          <div className="panel-title-wrap">
            <span className="material-symbols-outlined text-primary">public</span>
            <span className="panel-title">Spherical Filters</span>
          </div>
          <button
            className="btn-reset"
            onClick={() => {
              setFilterTaxonomy({
                functions: true,
                classes: true,
                types: true,
                files: true,
                communities: true,
              });
              setFilterEdges({
                calls: true,
                imports: true,
                defines: true,
                inherits: true,
                similar: true,
              });
              controlsRef.current?.recenter();
            }}
          >
            Reset All
          </button>
        </div>

        <div className="panel-scrollable">
          {/* Projection Scope Switcher */}
          <div className="scope-switcher">
            <button className="scope-btn scope-btn-active">Full Repo Globe</button>
            <button className="scope-btn" onClick={() => setActiveHop(1)}>
              Focused Sphere
            </button>
          </div>

          {/* Node Taxonomy Selection */}
          <div className="filter-section">
            <div className="filter-section-header">
              <span className="filter-title">Node Taxonomy</span>
              <span className="filter-meta">{topology?.nodes.length ?? 142} Active</span>
            </div>

            <label className="filter-item">
              <div className="filter-item-left">
                <input
                  type="checkbox"
                  checked={filterTaxonomy.functions}
                  onChange={(e) =>
                    setFilterTaxonomy({ ...filterTaxonomy, functions: e.target.checked })
                  }
                />
                <span className="kind-dot kind-dot-cyan" />
                <span className="kind-label">Functions & Methods</span>
              </div>
              <span className="kind-count">64</span>
            </label>

            <label className="filter-item">
              <div className="filter-item-left">
                <input
                  type="checkbox"
                  checked={filterTaxonomy.classes}
                  onChange={(e) =>
                    setFilterTaxonomy({ ...filterTaxonomy, classes: e.target.checked })
                  }
                />
                <span className="kind-dot kind-dot-purple" />
                <span className="kind-label">Classes & Structs</span>
              </div>
              <span className="kind-count">28</span>
            </label>

            <label className="filter-item">
              <div className="filter-item-left">
                <input
                  type="checkbox"
                  checked={filterTaxonomy.types}
                  onChange={(e) =>
                    setFilterTaxonomy({ ...filterTaxonomy, types: e.target.checked })
                  }
                />
                <span className="kind-dot kind-dot-blue" />
                <span className="kind-label">Types & Interfaces</span>
              </div>
              <span className="kind-count">24</span>
            </label>

            <label className="filter-item">
              <div className="filter-item-left">
                <input
                  type="checkbox"
                  checked={filterTaxonomy.files}
                  onChange={(e) =>
                    setFilterTaxonomy({ ...filterTaxonomy, files: e.target.checked })
                  }
                />
                <span className="kind-dot kind-dot-gray" />
                <span className="kind-label">Files & Modules</span>
              </div>
              <span className="kind-count">18</span>
            </label>

            <label className="filter-item">
              <div className="filter-item-left">
                <input
                  type="checkbox"
                  checked={filterTaxonomy.communities}
                  onChange={(e) =>
                    setFilterTaxonomy({ ...filterTaxonomy, communities: e.target.checked })
                  }
                />
                <span className="kind-dot kind-dot-emerald" />
                <span className="kind-label">Community Hubs</span>
              </div>
              <span className="kind-count text-tertiary">8</span>
            </label>
          </div>

          {/* Relational Arcs Selection */}
          <div className="filter-section">
            <div className="filter-section-header">
              <span className="filter-title">Relational Arcs</span>
              <span className="filter-meta">{topology?.edges.length ?? 284} Total</span>
            </div>

            <label className="filter-item">
              <div className="filter-item-left">
                <input
                  type="checkbox"
                  checked={filterEdges.calls}
                  onChange={(e) => setFilterEdges({ ...filterEdges, calls: e.target.checked })}
                />
                <span className="arc-line arc-cyan" />
                <span className="font-code text-xs">CALLS</span>
              </div>
              <span className="kind-count text-primary">142</span>
            </label>

            <label className="filter-item">
              <div className="filter-item-left">
                <input
                  type="checkbox"
                  checked={filterEdges.imports}
                  onChange={(e) => setFilterEdges({ ...filterEdges, imports: e.target.checked })}
                />
                <span className="arc-line arc-dashed" />
                <span className="font-code text-xs">IMPORTS</span>
              </div>
              <span className="kind-count text-outline">68</span>
            </label>

            <label className="filter-item">
              <div className="filter-item-left">
                <input
                  type="checkbox"
                  checked={filterEdges.defines}
                  onChange={(e) => setFilterEdges({ ...filterEdges, defines: e.target.checked })}
                />
                <span className="arc-line arc-purple" />
                <span className="font-code text-xs">DEFINES</span>
              </div>
              <span className="kind-count text-secondary">44</span>
            </label>

            <label className="filter-item">
              <div className="filter-item-left">
                <input
                  type="checkbox"
                  checked={filterEdges.similar}
                  onChange={(e) => setFilterEdges({ ...filterEdges, similar: e.target.checked })}
                />
                <span className="arc-line arc-dotted" />
                <span className="font-code text-xs">SIMILAR_TO</span>
              </div>
              <span className="kind-count text-outline">32</span>
            </label>
          </div>

          {/* Louvain Community Clusters */}
          <div className="filter-section">
            <div className="filter-section-header">
              <span className="filter-title">Louvain Clusters (Q=0.82)</span>
              <span className="material-symbols-outlined text-xs text-outline">bubble_chart</span>
            </div>

            <div className="community-list">
              {(topology?.communities || []).slice(0, 5).map((comm) => (
                <div
                  key={comm.id}
                  className="community-row"
                  onClick={() => {
                    const target = topology?.nodes.find((n) => n.comm === comm.id);
                    if (target) {
                      setSelectedNode(target);
                      controlsRef.current?.focusNode(target);
                    }
                  }}
                >
                  <div className="community-row-left">
                    <span
                      className="comm-color-dot"
                      style={{ backgroundColor: comm.color }}
                    />
                    <span className="comm-name truncate">{comm.name}</span>
                  </div>
                  <span className="comm-sym-count">{comm.member_count} sym</span>
                </div>
              ))}
            </div>
          </div>

          {/* Projection Controls */}
          <div className="projection-controls">
            <span className="filter-title">Projection Controls</span>
            <div className="slider-row">
              <div className="slider-label">
                <span>Arc Curvature</span>
                <span>{curvature}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={curvature}
                onChange={(e) => setCurvature(Number(e.target.value))}
                className="slider-input"
              />
            </div>

            <div className="toggle-row">
              <span className="toggle-label">Atmospheric Glow</span>
              <button
                className={`glow-toggle ${glowEnabled ? 'glow-toggle-on' : ''}`}
                onClick={() => setGlowEnabled(!glowEnabled)}
              >
                <span className="glow-knob" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. CENTER CANVAS (THE 3D GLOBE VIEWPORT) */}
      <main className="globe-viewport">
        {/* Subtle coordinate dot grid */}
        <div className="cosmic-grid-overlay" />

        {/* Pure Three.js Canvas Container */}
        <div ref={containerRef} className="threejs-canvas-wrapper" />

        {/* Top Canvas HUD Bar */}
        <div className="top-hud-bar">
          {/* Topology Telemetry */}
          <div className="hud-pill">
            <div className="live-ping">
              <span className="ping-dot" />
              <span className="hud-heading">Planet Topology</span>
            </div>
            <span className="hud-sub">
              {topology?.total_nodes ?? 142} Nodes • {topology?.total_edges ?? 284} Arcs
            </span>
            <span className="louvain-badge">Louvain Q=0.82</span>
          </div>

          {/* Hop Depth Toggles */}
          <div className="hud-pill hop-selector">
            <button
              className={`hop-btn ${activeHop === 1 ? 'hop-btn-active' : ''}`}
              onClick={() => setActiveHop(1)}
            >
              1 Hop
            </button>
            <button
              className={`hop-btn ${activeHop === 2 ? 'hop-btn-active' : ''}`}
              onClick={() => setActiveHop(2)}
            >
              2 Hops (Active)
            </button>
            <button
              className={`hop-btn ${activeHop === 3 ? 'hop-btn-active' : ''}`}
              onClick={() => setActiveHop(3)}
            >
              3 Hops
            </button>
            <button
              className={`hop-btn ${activeHop === 'full' ? 'hop-btn-active' : ''}`}
              onClick={() => setActiveHop('full')}
            >
              Full Sphere
            </button>
          </div>

          {/* Camera View Mode Toggles */}
          <div className="hud-actions">
            <button
              className={`hud-btn ${autoRotate ? 'hud-btn-active' : ''}`}
              onClick={() => controlsRef.current?.toggleOrbit()}
            >
              <span className="material-symbols-outlined text-sm">rotate_right</span>
              <span>Auto Orbit</span>
            </button>
            <button className="hud-btn" onClick={() => controlsRef.current?.viewPoles()}>
              <span className="material-symbols-outlined text-sm">explore</span>
              <span>Poles</span>
            </button>
            <button className="hud-btn" onClick={() => controlsRef.current?.recenter()}>
              <span className="material-symbols-outlined text-sm">center_focus_strong</span>
              <span>Recenter</span>
            </button>
          </div>
        </div>

        {/* State Preview Switcher Pill */}
        <div className="state-switcher-container">
          <div className="state-switcher-pill">
            <span className="state-label">State Preview:</span>
            <button
              className={`state-btn ${previewState === 'populated' ? 'state-btn-active' : ''}`}
              onClick={() => setPreviewState('populated')}
            >
              <span className="dot dot-cyan" /> Populated
            </button>
            <button
              className={`state-btn ${previewState === 'focused' ? 'state-btn-active' : ''}`}
              onClick={() => {
                setPreviewState('focused');
                setActiveHop(1);
              }}
            >
              <span className="dot dot-purple" /> Focused (1-Hop)
            </button>
            <button
              className={`state-btn ${previewState === 'forming' ? 'state-btn-active' : ''}`}
              onClick={() => setPreviewState('forming')}
            >
              <span className="material-symbols-outlined text-xs animate-spin">sync</span> Index Forming
            </button>
            <button
              className={`state-btn ${previewState === 'preindex' ? 'state-btn-active' : ''}`}
              onClick={() => setPreviewState('preindex')}
            >
              <span className="dot dot-red" /> Pre-index
            </button>
          </div>
        </div>

        {/* In-Canvas Floating Quick Action Bar */}
        <div className="floating-actions-bar">
          <button
            className="canvas-action-btn"
            onClick={() => {
              if (selectedNode) controlsRef.current?.focusNode(selectedNode);
            }}
          >
            <span className="material-symbols-outlined text-primary text-sm">scatter_plot</span>
            <span>Expand 1-Hop Neighbors</span>
          </button>
          <button
            className="canvas-action-btn"
            onClick={() => {
              if (selectedNode) controlsRef.current?.focusNode(selectedNode);
            }}
          >
            <span className="material-symbols-outlined text-secondary text-sm">my_location</span>
            <span>Recenter Selected</span>
          </button>
          <button className="canvas-action-btn btn-export" onClick={handleCopyBundle}>
            <span className="material-symbols-outlined text-sm">dataset</span>
            <span>{copiedBundle ? 'Copied Bundle!' : 'Export Evidence Slice'}</span>
          </button>
        </div>

        {/* Floating Spherical Radar / Tilt Readout */}
        <div className="floating-radar">
          <div className="radar-circle">
            <div className="radar-outer" />
            <div className="radar-dashed" />
            <div className="radar-center-dot" />
          </div>
          <div className="radar-readout">
            <span className="radar-degrees">{azimuthText}</span>
            <span className="radar-zoom">Zoom 1.00x • Equator</span>
          </div>
        </div>

        {/* Bottom Legend Bar */}
        <div className="bottom-legend-bar">
          <div className="legend-group">
            <span className="legend-title">Nodes:</span>
            <div className="legend-item">
              <span className="kind-dot kind-dot-cyan" />
              <span>Function</span>
            </div>
            <div className="legend-item">
              <span className="kind-dot kind-dot-purple" />
              <span>Class</span>
            </div>
            <div className="legend-item">
              <span className="kind-dot kind-dot-blue" />
              <span>Type</span>
            </div>
            <div className="legend-item">
              <span className="kind-dot kind-dot-gray" />
              <span>File</span>
            </div>
            <div className="legend-item">
              <span className="kind-dot kind-dot-emerald" />
              <span>Community Hub</span>
            </div>
          </div>

          <div className="legend-group">
            <span className="legend-title">Arcs:</span>
            <div className="legend-item">
              <span className="arc-line arc-cyan" />
              <span>CALLS</span>
            </div>
            <div className="legend-item">
              <span className="arc-line arc-dashed" />
              <span>IMPORTS</span>
            </div>
            <div className="legend-item">
              <span className="arc-line arc-purple" />
              <span>DEFINES</span>
            </div>
            <div className="legend-item">
              <span className="arc-line arc-dotted" />
              <span>SIMILAR_TO</span>
            </div>
          </div>
        </div>
      </main>

      {/* 3. RIGHT INSPECTOR PANEL (SELECTED NODE INSPECTOR - 320px) */}
      <aside className="globe-right-panel">
        <div className="panel-header">
          <div className="panel-title-wrap">
            <span className="material-symbols-outlined text-secondary">travel_explore</span>
            <span className="panel-title">Spherical Inspector</span>
          </div>
          <div className="inspector-top-btns">
            <button className="icon-btn" title="Bookmark">
              <span className="material-symbols-outlined text-sm">bookmark_border</span>
            </button>
          </div>
        </div>

        {selectedNode ? (
          <div className="panel-scrollable">
            {/* Node Hero Card */}
            <div className="hero-card">
              <div className="hero-card-tags">
                <span className="kind-badge">
                  {selectedNode.kind.toUpperCase()} • Lines {selectedNode.start_line ?? 1}-
                  {selectedNode.end_line || ((selectedNode.start_line ?? 1) + 25)}
                </span>
                <span className="access-tag">Public Async</span>
              </div>

              <div className="node-names">
                <span className="node-symbol-name">{selectedNode.name}</span>
                <span className="node-file-path">{selectedNode.file_path}</span>
              </div>

              <div className="metric-grid">
                <div className="metric-box">
                  <span className="metric-label">Spherical Pos</span>
                  <span className="metric-val text-primary font-code">
                    {selectedNode.lat > 0 ? `+${selectedNode.lat}` : selectedNode.lat}° | {selectedNode.lon}°
                  </span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">Degree Centrality</span>
                  <span className="metric-val text-tertiary font-code">
                    {selectedNode.importance} (Top 5%)
                  </span>
                </div>
              </div>

              <div className="arc-count-pill">
                <span>
                  In/Out Arcs: <strong>{selectedNode.in_degree ?? 4} in / {selectedNode.out_degree ?? 3} out</strong>
                </span>
                <span>
                  Cluster: <strong className="text-primary">{selectedNode.comm_name}</strong>
                </span>
              </div>
            </div>

            {/* Semantic Intent */}
            <div className="section-card">
              <div className="section-card-header">
                <span className="section-card-title">Semantic Intent</span>
                <span className="material-symbols-outlined text-xs text-tertiary">psychology</span>
              </div>
              <p className="intent-text">
                {selectedNode.signature ||
                  `Traverses outgoing AST edge references up to depth hops and computes neighborhood degree weights for semantic ranking in downstream evidence retrieval.`}
              </p>
            </div>

            {/* Community Membership Context */}
            <div className="community-context-card">
              <div className="comm-ctx-left">
                <span
                  className="comm-ctx-dot"
                  style={{ backgroundColor: selectedNode.comm_color }}
                />
                <div className="comm-ctx-text">
                  <span className="comm-ctx-title">
                    Community #{selectedNode.comm}: {selectedNode.comm_name}
                  </span>
                  <span className="comm-ctx-sub">Equatorial Dense Sector</span>
                </div>
              </div>
              <button
                className="icon-btn"
                title="Filter by Community"
                onClick={() => controlsRef.current?.focusNode(selectedNode)}
              >
                <span className="material-symbols-outlined text-sm">filter_center_focus</span>
              </button>
            </div>

            {/* Inbound Callers on Planet */}
            <div className="callers-section">
              <div className="callers-header">
                <span>Spherical Inbound Callers ({callers.length})</span>
                <span className="text-outline">SQLite Edges</span>
              </div>

              {isLoadingCalls ? (
                <div className="p-2 text-xs text-outline font-code">Loading callers...</div>
              ) : callers.length > 0 ? (
                callers.map((c, idx) => (
                  <div
                    key={idx}
                    className="caller-item cursor-pointer hover:bg-surface-high transition-colors"
                    onClick={() => {
                      const found = topology?.nodes.find((n) => n.name === c.caller);
                      if (found) {
                        setSelectedNode(found);
                        controlsRef.current?.focusNode(found);
                      } else {
                        onNavigateToExplore?.(c.caller, c.file_path);
                      }
                    }}
                    title={`Focus ${c.caller} on globe or explore`}
                  >
                    <div className="caller-info">
                      <span className="caller-name text-primary font-code truncate">{c.caller}</span>
                      <span className="caller-sub">
                        {c.file_path ? c.file_path.split('/').pop() : 'file'}:{c.line_number || 1}
                      </span>
                    </div>
                    <span className="arc-deg-pill">CALLS</span>
                  </div>
                ))
              ) : (
                <div className="p-2 text-xs text-outline font-code">
                  No inbound callers recorded in SQLite graph
                </div>
              )}
            </div>

            {/* Outbound Callees */}
            <div className="callers-section">
              <div className="callers-header">
                <span>Spherical Outbound Callees ({callees.length})</span>
                <span className="text-outline">SQLite Edges</span>
              </div>

              {isLoadingCalls ? (
                <div className="p-2 text-xs text-outline font-code">Loading callees...</div>
              ) : callees.length > 0 ? (
                callees.map((c, idx) => (
                  <div
                    key={idx}
                    className="caller-item cursor-pointer hover:bg-surface-high transition-colors"
                    onClick={() => {
                      const found = topology?.nodes.find((n) => n.name === c.callee);
                      if (found) {
                        setSelectedNode(found);
                        controlsRef.current?.focusNode(found);
                      } else {
                        onNavigateToExplore?.(c.callee, c.file_path);
                      }
                    }}
                    title={`Focus ${c.callee} on globe or explore`}
                  >
                    <div className="caller-info">
                      <span className="caller-name text-secondary font-code truncate">{c.callee}</span>
                      <span className="caller-sub">
                        {c.file_path ? c.file_path.split('/').pop() : 'file'}:{c.line_number || 1}
                      </span>
                    </div>
                    <span className="arc-deg-pill">INVOKES</span>
                  </div>
                ))
              ) : (
                <div className="p-2 text-xs text-outline font-code">
                  No outbound invocations recorded in SQLite graph
                </div>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="action-buttons-wrap">
              <button
                className="btn-action btn-action-primary"
                onClick={() => controlsRef.current?.focusNode(selectedNode)}
              >
                <span className="material-symbols-outlined text-sm">my_location</span>
                <span>Center Globe on Node</span>
              </button>

              <button
                className="btn-action btn-action-secondary"
                onClick={() => onNavigateToExplore?.(selectedNode.name, selectedNode.file_path)}
              >
                <span className="material-symbols-outlined text-sm text-outline">account_tree</span>
                <span>Open in Explore Tree</span>
              </button>

              <button className="btn-action btn-action-copy" onClick={handleCopyBundle}>
                <span className="material-symbols-outlined text-sm">content_copy</span>
                <span>{copiedBundle ? 'Copied to Clipboard!' : 'Copy Evidence Bundle (320 tok)'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-inspector">
            <span className="material-symbols-outlined text-2xl text-outline mb-2">public</span>
            <span>Click any node on the 3D globe to inspect relationships</span>
          </div>
        )}
      </aside>

      <style>{`
        .globe-page-layout {
          position: relative;
          width: 100%;
          height: calc(100vh - 56px);
          display: flex;
          background: var(--surface-lowest);
          overflow: hidden;
        }

        /* 1. Left Panel */
        .globe-left-panel {
          width: 300px;
          flex-shrink: 0;
          height: 100%;
          background: var(--surface-low);
          border-right: 1px solid var(--hairline);
          display: flex;
          flex-direction: column;
          z-index: 20;
          box-shadow: 2px 0 16px rgba(0, 0, 0, 0.4);
        }
        .panel-header {
          height: 44px;
          padding: 0 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--surface);
          border-bottom: 1px solid var(--hairline);
        }
        .panel-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .panel-title {
          font-weight: 600;
          font-size: 13px;
          color: var(--on-surface);
        }
        .btn-reset {
          background: transparent;
          border: none;
          color: var(--primary);
          font-size: 11px;
          cursor: pointer;
          font-family: var(--font-body);
        }
        .btn-reset:hover {
          text-decoration: underline;
        }
        .panel-scrollable {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .scope-switcher {
          display: flex;
          background: var(--surface-container);
          padding: 3px;
          border-radius: 4px;
          gap: 3px;
        }
        .scope-btn {
          flex: 1;
          background: transparent;
          border: none;
          padding: 5px;
          border-radius: 3px;
          color: var(--outline);
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .scope-btn-active {
          background: var(--surface-high);
          color: var(--primary);
          font-weight: 600;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        }
        .filter-section {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .filter-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2px 4px;
        }
        .filter-title {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--outline);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .filter-meta {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--outline);
        }
        .filter-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 5px 8px;
          border-radius: 4px;
          background: rgba(30, 31, 38, 0.5);
          cursor: pointer;
          transition: background 0.15s;
        }
        .filter-item:hover {
          background: var(--surface-container);
        }
        .filter-item-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .kind-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }
        .kind-dot-cyan { background: var(--primary); box-shadow: 0 0 6px rgba(56, 189, 248, 0.5); }
        .kind-dot-purple { background: var(--secondary); border-radius: 2px; }
        .kind-dot-blue { background: #818cf8; }
        .kind-dot-gray { background: var(--outline); border-radius: 2px; }
        .kind-dot-emerald { background: var(--tertiary-light); }
        .kind-label {
          font-size: 12px;
          color: var(--on-surface);
        }
        .kind-count {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--outline);
        }
        .arc-line {
          width: 14px;
          height: 2px;
          display: inline-block;
        }
        .arc-cyan { background: var(--primary); }
        .arc-dashed { border-top: 2px dashed var(--outline); background: transparent; }
        .arc-purple { background: var(--secondary); }
        .arc-dotted { border-top: 2px dotted var(--outline); background: transparent; }

        .community-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .community-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px;
          border-radius: 4px;
          background: var(--surface-container);
          cursor: pointer;
          transition: background 0.15s;
        }
        .community-row:hover {
          background: var(--surface-high);
        }
        .community-row-left {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow: hidden;
        }
        .comm-color-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .comm-name {
          font-size: 12px;
          color: var(--on-surface);
        }
        .comm-sym-count {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--outline);
        }

        .projection-controls {
          margin-top: auto;
          background: var(--surface-container);
          padding: 10px;
          border-radius: 6px;
          border: 1px solid var(--hairline);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .slider-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .slider-label {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--outline);
        }
        .slider-input {
          width: 100%;
          height: 4px;
          accent-color: var(--primary);
        }
        .toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 4px;
        }
        .toggle-label {
          font-size: 12px;
          color: var(--on-surface);
        }
        .glow-toggle {
          width: 32px;
          height: 18px;
          border-radius: 9px;
          background: var(--surface-high);
          border: none;
          cursor: pointer;
          position: relative;
          transition: background 0.2s;
        }
        .glow-toggle-on {
          background: var(--primary);
        }
        .glow-knob {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--surface-lowest);
          position: absolute;
          top: 2px;
          left: 2px;
          transition: transform 0.2s;
        }
        .glow-toggle-on .glow-knob {
          transform: translateX(14px);
        }

        /* 2. Center Viewport */
        .globe-viewport {
          flex: 1;
          position: relative;
          height: 100%;
          overflow: hidden;
          background: var(--surface-lowest);
        }
        .cosmic-grid-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.18;
          background-image: radial-gradient(#38bdf8 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .threejs-canvas-wrapper {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .top-hud-bar {
          position: absolute;
          top: 14px;
          left: 18px;
          right: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          pointer-events: none;
          z-index: 10;
        }
        .hud-pill {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 14px;
          border-radius: 8px;
          background: rgba(30, 31, 38, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid var(--hairline);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        }
        .live-ping {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ping-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--tertiary-light);
          box-shadow: 0 0 8px var(--tertiary-light);
          animation: pulseGlow 1.8s infinite;
        }
        .hud-heading {
          font-weight: 600;
          font-size: 13px;
          color: var(--on-surface);
        }
        .hud-sub {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--outline);
        }
        .louvain-badge {
          font-family: var(--font-mono);
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(16, 185, 129, 0.15);
          color: var(--tertiary-light);
          font-weight: 600;
        }
        .hop-selector {
          gap: 4px;
          padding: 3px 6px;
        }
        .hop-btn {
          background: transparent;
          border: none;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          color: var(--outline);
          cursor: pointer;
          transition: all 0.15s;
        }
        .hop-btn-active {
          background: var(--primary);
          color: var(--surface-lowest);
          font-weight: 600;
        }
        .hud-actions {
          pointer-events: auto;
          display: flex;
          gap: 4px;
          background: rgba(30, 31, 38, 0.85);
          backdrop-filter: blur(12px);
          padding: 3px 6px;
          border-radius: 8px;
          border: 1px solid var(--hairline);
        }
        .hud-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          color: var(--outline);
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .hud-btn:hover {
          color: var(--on-surface);
          background: var(--surface-high);
        }
        .hud-btn-active {
          background: var(--surface-high);
          color: var(--primary);
        }

        .state-switcher-container {
          position: absolute;
          top: 64px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          pointer-events: none;
          z-index: 10;
        }
        .state-switcher-pill {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 20px;
          background: rgba(40, 42, 48, 0.9);
          backdrop-filter: blur(12px);
          border: 1px solid var(--hairline);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }
        .state-label {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--outline);
          text-transform: uppercase;
        }
        .state-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          background: transparent;
          border: none;
          padding: 3px 8px;
          border-radius: 12px;
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--outline);
          cursor: pointer;
          transition: all 0.15s;
        }
        .state-btn-active {
          background: rgba(56, 189, 248, 0.2);
          color: var(--primary);
          font-weight: 500;
        }
        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .dot-cyan { background: var(--primary); }
        .dot-purple { background: var(--secondary); }
        .dot-red { background: var(--error); }

        .floating-actions-bar {
          position: absolute;
          bottom: 50px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 6px;
          background: rgba(40, 42, 48, 0.95);
          backdrop-filter: blur(16px);
          border-radius: 8px;
          border: 1px solid var(--hairline);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
          z-index: 10;
        }
        .canvas-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--surface-container);
          border: 1px solid var(--hairline);
          color: var(--on-surface);
          padding: 5px 12px;
          border-radius: 4px;
          font-size: 11.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        .canvas-action-btn:hover {
          background: var(--surface-bright);
          color: #fff;
        }
        .btn-export {
          background: var(--primary);
          color: var(--surface-lowest);
          font-weight: 600;
          border-color: transparent;
        }
        .btn-export:hover {
          background: var(--primary-light);
          color: var(--surface-lowest);
        }

        .floating-radar {
          position: absolute;
          bottom: 50px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 8px;
          background: rgba(30, 31, 38, 0.9);
          backdrop-filter: blur(12px);
          border: 1px solid var(--hairline);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          z-index: 10;
        }
        .radar-circle {
          position: relative;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--surface-lowest);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .radar-outer {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(56, 189, 248, 0.3);
        }
        .radar-dashed {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1px dashed rgba(135, 146, 154, 0.4);
        }
        .radar-center-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--primary);
          box-shadow: 0 0 6px var(--primary);
        }
        .radar-readout {
          display: flex;
          flex-direction: column;
        }
        .radar-degrees {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--on-surface);
        }
        .radar-zoom {
          font-size: 10px;
          color: var(--outline);
        }

        .bottom-legend-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 36px;
          background: rgba(30, 31, 38, 0.92);
          backdrop-filter: blur(12px);
          border-top: 1px solid var(--hairline);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          z-index: 10;
        }
        .legend-group {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .legend-title {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--outline);
          text-transform: uppercase;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--on-surface);
        }

        /* 3. Right Inspector Panel */
        .globe-right-panel {
          width: 320px;
          flex-shrink: 0;
          height: 100%;
          background: var(--surface-low);
          border-left: 1px solid var(--hairline);
          display: flex;
          flex-direction: column;
          z-index: 20;
          box-shadow: -2px 0 16px rgba(0, 0, 0, 0.4);
        }
        .inspector-top-btns {
          display: flex;
          gap: 4px;
        }
        .icon-btn {
          background: transparent;
          border: none;
          color: var(--outline);
          padding: 4px;
          border-radius: 4px;
          cursor: pointer;
        }
        .icon-btn:hover {
          color: var(--on-surface);
          background: var(--surface-high);
        }

        .hero-card {
          background: var(--surface-container);
          padding: 12px;
          border-radius: 6px;
          border: 1px solid var(--hairline);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .hero-card-tags {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .kind-badge {
          font-family: var(--font-mono);
          font-size: 10px;
          background: rgba(56, 189, 248, 0.12);
          color: var(--primary);
          padding: 2px 6px;
          border-radius: 3px;
          font-weight: 600;
        }
        .access-tag {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--tertiary-light);
        }
        .node-names {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .node-symbol-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--on-surface);
          word-break: break-all;
        }
        .node-file-path {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--outline);
        }
        .metric-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          padding-top: 4px;
        }
        .metric-box {
          background: var(--surface-lowest);
          padding: 6px 8px;
          border-radius: 4px;
          border: 1px solid var(--hairline);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .metric-label {
          font-size: 9px;
          color: var(--outline);
          text-transform: uppercase;
        }
        .metric-val {
          font-size: 11px;
          font-weight: 600;
        }
        .arc-count-pill {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px;
          border-radius: 4px;
          background: var(--surface-low);
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--outline);
        }

        .section-card {
          background: var(--surface-container);
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid var(--hairline);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .section-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .section-card-title {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--outline);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .intent-text {
          margin: 0;
          font-size: 12px;
          line-height: 1.5;
          color: var(--on-surface-variant);
        }

        .community-context-card {
          background: rgba(30, 31, 38, 0.7);
          padding: 8px 10px;
          border-radius: 6px;
          border: 1px solid var(--hairline);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .comm-ctx-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .comm-ctx-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          box-shadow: 0 0 6px rgba(56, 189, 248, 0.5);
        }
        .comm-ctx-text {
          display: flex;
          flex-direction: column;
        }
        .comm-ctx-title {
          font-size: 11.5px;
          font-weight: 500;
          color: var(--on-surface);
        }
        .comm-ctx-sub {
          font-size: 10px;
          color: var(--outline);
        }

        .callers-section {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .callers-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--outline);
          text-transform: uppercase;
          padding: 0 2px;
        }
        .caller-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px;
          border-radius: 4px;
          background: var(--surface-container);
          cursor: pointer;
          transition: background 0.15s;
        }
        .caller-item:hover {
          background: var(--surface-high);
        }
        .caller-info {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding-right: 6px;
        }
        .caller-name {
          font-size: 11.5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .caller-sub {
          font-size: 10px;
          color: var(--outline);
        }
        .arc-deg-pill {
          font-family: var(--font-mono);
          font-size: 10px;
          background: var(--surface-lowest);
          color: var(--on-surface);
          padding: 2px 6px;
          border-radius: 3px;
          border: 1px solid var(--hairline);
        }

        .action-buttons-wrap {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: auto;
          padding-top: 8px;
        }
        .btn-action {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-action-primary {
          background: var(--primary);
          color: var(--surface-lowest);
          border: 1px solid transparent;
        }
        .btn-action-primary:hover {
          background: var(--primary-light);
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
        }
        .btn-action-secondary {
          background: var(--surface-container);
          border: 1px solid var(--hairline);
          color: var(--on-surface);
        }
        .btn-action-secondary:hover {
          background: var(--surface-high);
        }
        .btn-action-copy {
          background: var(--secondary-container);
          border: 1px solid rgba(168, 85, 247, 0.3);
          color: var(--secondary-light);
        }
        .btn-action-copy:hover {
          background: rgba(168, 85, 247, 0.25);
        }

        .empty-inspector {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--outline);
          text-align: center;
          padding: 20px;
        }
      `}</style>
    </div>
  );
};
