import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const host = document.getElementById('hero3d');
if (host) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
  catch (e) { host.classList.add('nogl'); }
  if (renderer) init();

  function init() {
    const W = () => host.clientWidth, H = () => host.clientHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio, W() < 600 ? 1.5 : 2));
    renderer.setSize(W(), H());
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(32, W() / H(), 0.1, 100);
    camera.position.set(0, 0, W() < 600 ? 12.5 : 10.6);

    const rig = new THREE.Group(); scene.add(rig);
    const lens = new THREE.Group(); rig.add(lens);

    // ---- lens barrel rings
    const ringMat = new THREE.MeshPhysicalMaterial({ color: 0x1C0A45, metalness: 0.65, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.18, 0.2, 48, 160), ringMat); lens.add(ring);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.06, 24, 160), new THREE.MeshPhysicalMaterial({ color: 0xB9A9FF, metalness: 0.9, roughness: 0.2 }));
    ring2.position.z = -0.12; lens.add(ring2);
    // tick marks on the outer ring (like a focus scale)
    const tickGeo = new THREE.BoxGeometry(0.03, 0.16, 0.04), tickMat = new THREE.MeshStandardMaterial({ color: 0xEDE7FF, metalness: 0.4, roughness: 0.4 });
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2, t = new THREE.Mesh(tickGeo, tickMat);
      t.position.set(Math.cos(a) * 2.82, Math.sin(a) * 2.82, -0.1); t.rotation.z = a - Math.PI / 2;
      if (i % 5 === 0) t.scale.y = 1.9; lens.add(t);
    }

    // ---- aperture blades
    const N = 9, R = 2.12;
    const blades = [];
    const shape = new THREE.Shape();
    shape.moveTo(0.05, -0.42);
    shape.bezierCurveTo(-0.9, -0.62, -1.9, -0.5, -2.75, -0.05);
    shape.bezierCurveTo(-2.8, 0.25, -2.7, 0.5, -2.55, 0.62);
    shape.bezierCurveTo(-1.8, 0.28, -0.9, 0.3, 0.05, 0.5);
    shape.lineTo(0.05, -0.42);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3, curveSegments: 32 });
    for (let i = 0; i < N; i++) {
      const hue = i / N;
      const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color().setHSL(0.70 + hue * 0.03, 0.75, 0.24 + 0.2 * Math.sin(hue * Math.PI)),
        metalness: 0.55, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08, iridescence: 0.55, iridescenceIOR: 1.4, sheen: 0.3, sheenColor: new THREE.Color(0xB9A9FF)
      });
      const pivot = new THREE.Group();
      const a = (i / N) * Math.PI * 2;
      pivot.position.set(Math.cos(a) * R, Math.sin(a) * R, i * 0.012);
      pivot.rotation.z = a + Math.PI * 0.08;
      const m = new THREE.Mesh(geo, mat); pivot.add(m);
      lens.add(pivot); blades.push(pivot);
    }
    // inner glow disc (light through the aperture)
    const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
      const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(245,242,255,1)'); gr.addColorStop(.35, 'rgba(185,169,255,.85)'); gr.addColorStop(1, 'rgba(91,59,235,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c); })();
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false }));
    glow.position.z = -0.25; lens.add(glow);
    const back = new THREE.Mesh(new THREE.RingGeometry(1.25, 2.2, 96), new THREE.MeshStandardMaterial({ color: 0x140733, metalness: 0.3, roughness: 0.6 }));
    back.position.z = -0.18; lens.add(back);

    // ---- lights
    const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 4, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0x8F7BFF, 3); rim.position.set(-5, -2, -3); scene.add(rim);

    // ---- blueprint intro (igloo.inc style): line drawing first, then the solid lens
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const SPEED = +(new URLSearchParams(location.search).get('introspeed') || 1);  // QA only
    const solids = [], wires = [];
    const wireMat = (o) => new THREE.LineBasicMaterial({ color: 0x4B2AD8, transparent: true, opacity: o, depthWrite: false });
    function wireFor(mesh, geo, delay, dur, op) {
      const g = geo || new THREE.EdgesGeometry(mesh.geometry, 18);
      const l = new THREE.LineSegments(g, wireMat(op || 0.85));
      mesh.add(l);  // child of the mesh, so it follows blade motion
      const n = g.attributes.position.count; l.geometry.setDrawRange(0, 0);
      wires.push({ l, n, delay, dur, op: op || 0.85 });
    }
    lens.traverse(o => { if (o.isMesh) { solids.push(o); o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0; o.material.depthWrite = false; } });
    // rings as a light grid, blades as outlines, ticks staggered around the dial
    wireFor(ring, new THREE.WireframeGeometry(new THREE.TorusGeometry(2.18, 0.2, 10, 72)), 0.35, 1.1, 0.55);
    wireFor(ring2, new THREE.EdgesGeometry(new THREE.TorusGeometry(2.55, 0.06, 6, 120), 1), 0.55, 0.9, 0.7);
    wireFor(back, new THREE.WireframeGeometry(new THREE.RingGeometry(1.25, 2.2, 54, 3)), 0.5, 1.2, 0.35);
    blades.forEach((b, i) => wireFor(b.children[0], null, 0.75 + i * 0.09, 0.8, 0.95));
    lens.children.filter(o => o.isMesh && o.geometry === tickGeo).forEach((t, i) => wireFor(t, null, 0.6 + i * 0.012, 0.25, 0.6));
    // surrounding constellation: nodes + nearest-neighbour links + dust
    const net = new THREE.Group(); scene.add(net);
    const rnd = (a, b) => a + Math.random() * (b - a);
    const nodes = []; for (let i = 0; i < 64; i++) { const r = rnd(3.2, 6.5), a = rnd(0, Math.PI * 2); nodes.push(new THREE.Vector3(Math.cos(a) * r * 1.35, Math.sin(a) * r * 0.62, rnd(-4.5, 0.8))); }
    const segs = []; nodes.forEach((p, i) => { nodes.map((q, j) => [p.distanceTo(q), j]).filter(d => d[1] !== i).sort((a, b) => a[0] - b[0]).slice(0, 2).forEach(([d, j]) => { if (j > i || d > 2.6) segs.push(p.x, p.y, p.z, nodes[j].x, nodes[j].y, nodes[j].z); }); });
    const netGeo = new THREE.BufferGeometry(); netGeo.setAttribute('position', new THREE.Float32BufferAttribute(segs, 3));
    const netLines = new THREE.LineSegments(netGeo, new THREE.LineBasicMaterial({ color: 0x8F7BFF, transparent: true, opacity: 0.0, depthWrite: false })); net.add(netLines);
    const netN = netGeo.attributes.position.count; netGeo.setDrawRange(0, 0);
    const nodeGeo = new THREE.BufferGeometry().setFromPoints(nodes);
    const nodePts = new THREE.Points(nodeGeo, new THREE.PointsMaterial({ color: 0x5B3BEB, size: 0.06, transparent: true, opacity: 0 })); net.add(nodePts);
    const dust = []; for (let i = 0; i < 700; i++) { const a = rnd(0, Math.PI * 2), r = Math.sqrt(Math.random()) * 3.4; dust.push(Math.cos(a) * r, Math.sin(a) * r, rnd(-0.6, 0.4)); }
    const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(dust, 3));
    const dustPts = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x7C63F5, size: 0.022, transparent: true, opacity: 0, depthWrite: false })); lens.add(dustPts);
    // loader line
    const loader = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.012), new THREE.MeshBasicMaterial({ color: 0x4B2AD8, transparent: true, opacity: 1 }));
    loader.scale.x = 0.001; scene.add(loader);
    const clamp = (x) => Math.max(0, Math.min(1, x)), ease = (x) => 1 - Math.pow(1 - clamp(x), 3), inout = (x) => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
    let solidDone = false;
    function blueprint(t) {
      if (reduce) t = 99;
      loader.scale.x = 0.001 + ease(t / 0.55); loader.material.opacity = 1 - clamp((t - 0.45) / 0.35); loader.visible = loader.material.opacity > 0.01;
      wires.forEach(w => { const p = ease((t - w.delay) / w.dur); w.l.geometry.setDrawRange(0, Math.floor(w.n * p / 2) * 2); w.l.material.opacity = w.op * (1 - inout((t - 2.55) / 0.8)); w.l.visible = w.l.material.opacity > 0.01; });
      netGeo.setDrawRange(0, Math.floor(netN * ease((t - 0.5) / 1.6) / 2) * 2);
      netLines.material.opacity = 0.55 * clamp((t - 0.5) / 0.4) - 0.43 * inout((t - 2.5) / 1.0);
      nodePts.material.opacity = 0.9 * clamp((t - 0.6) / 0.5) - 0.7 * inout((t - 2.5) / 1.0);
      dustPts.material.opacity = 0.7 * clamp((t - 0.9) / 0.6) * (1 - inout((t - 2.4) / 0.9));
      const sp = inout((t - 2.05) / 1.1);
      if (!solidDone) { solids.forEach(m => { m.material.opacity = sp; }); if (sp >= 1) { solids.forEach(m => { m.material.transparent = m === glow; m.material.depthWrite = m !== glow; m.material.opacity = 1; m.material.needsUpdate = true; }); solidDone = true; } }
      return sp;
    }

    // ---- interaction
    let tx = -0.18, ty = 0.32, rx = 0, ry = 0, open = 0.15, openT = 0.15, t0 = null, frames = 0;
    const hero = document.querySelector('[data-hero]') || host;
    hero.addEventListener('mousemove', e => { const r = hero.getBoundingClientRect(); tx = ((e.clientY - r.top) / r.height - 0.5) * 0.7; ty = ((e.clientX - r.left) / r.width - 0.5) * 0.9; openT = 0.75; });
    hero.addEventListener('mouseleave', () => { tx = -0.18; ty = 0.32; openT = 0.15; });
    addEventListener('resize', () => { renderer.setSize(W(), H()); camera.aspect = W() / H(); camera.updateProjectionMatrix(); });

    const intro = { s: 0 };
    function frame(now) {
      if (t0 === null || frames < 2) { t0 = now; frames++; }  // start the intro once rendering is warm
      const t = (now - t0) / 1000;
      const sp = blueprint(t * SPEED);
      const e = 0.82 + 0.18 * sp;
      const sc = Math.min(1, Math.max(0, 1 - scrollY / 700));
      open += ((openT * sc + (1 - sc) * 0.95) - open) * 0.06;
      blades.forEach((b, i) => { b.children[0].rotation.z = 0.25 - open * 0.75 + Math.sin(t * 0.8 + i) * 0.015; });
      rx += (tx - rx) * 0.06; ry += (ty - ry) * 0.06;
      rig.rotation.x = rx; rig.rotation.y = ry;
      lens.rotation.z = t * 0.12 - (1 - e) * 1.2;
      rig.position.y = Math.sin(t * 0.9) * 0.12;
      rig.scale.setScalar(e);
      net.rotation.y = Math.sin(t * 0.07) * 0.25 + ry * 0.4; net.rotation.x = rx * 0.4;
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
}
