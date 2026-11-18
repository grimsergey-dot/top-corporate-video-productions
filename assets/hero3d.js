import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Hero: a generic cinema camera (no brand marks) in the site palette.
// Intro: loader line -> blueprint wires draw in -> solid model fades in.
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
    const model = new THREE.Group(); rig.add(model);

    // ---- materials (site palette)
    const phys = (o) => new THREE.MeshPhysicalMaterial(o);
    const M = {
      body:   phys({ color: 0x24105C, metalness: 0.55, roughness: 0.34, clearcoat: 0.7, clearcoatRoughness: 0.22 }),
      dark:   phys({ color: 0x110529, metalness: 0.3, roughness: 0.6 }),
      plate:  phys({ color: 0x3A1E8C, metalness: 0.6, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2 }),
      accent: phys({ color: 0x5B3BEB, metalness: 0.55, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 }),
      lilac:  phys({ color: 0xB9A9FF, metalness: 0.9, roughness: 0.18 }),
      mark:   new THREE.MeshStandardMaterial({ color: 0xEDE7FF, metalness: 0.3, roughness: 0.4 }),
      glass:  phys({ color: 0x2A1470, metalness: 0.2, roughness: 0.05, clearcoat: 1, iridescence: 0.9, iridescenceIOR: 1.6, sheen: 0.4, sheenColor: new THREE.Color(0xB9A9FF) }),
    };

    // ---- geometry helpers
    const rrect = (w, h, r) => { const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
      s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
    function rbox(w, h, d, b, rc, mat, x = 0, y = 0, z = 0, parent = model) {
      const g = new THREE.ExtrudeGeometry(rrect(w - 2 * b, h - 2 * b, rc), { depth: Math.max(0.001, d - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 6 });
      g.center(); const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); parent.add(m);
      m.userData.wire = new THREE.EdgesGeometry(g, 30); return m;
    }
    // cylinder along the X axis; rFront at -X (lens side)
    function cyl(rF, rB, len, mat, x, parent = model, seg = 72, open = false) {
      const g = new THREE.CylinderGeometry(rF, rB, len, seg, 1, open); g.rotateZ(Math.PI / 2);
      const m = new THREE.Mesh(g, mat); m.position.x = x; parent.add(m);
      const wg = new THREE.CylinderGeometry(rF, rB, len, 18, 1); wg.rotateZ(Math.PI / 2);
      m.userData.wire = new THREE.EdgesGeometry(wg, 1); return m;
    }
    // gear teeth / scale ticks around a ring on the X axis
    function ringOf(n, r, size, mat, x, parent, every = 0, long = 1) {
      const g = new THREE.BoxGeometry(size[0], size[1], size[2]);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, t = new THREE.Mesh(g, mat);
        t.position.set(x, Math.cos(a) * r, Math.sin(a) * r); t.rotation.x = -a;
        if (every && i % every === 0) t.scale.y = long;
        t.userData.small = true; parent.add(t);
      }
    }

    // ---- body
    rbox(2.3, 2.05, 1.85, 0.07, 0.16, M.body, 0.55, 0, 0);
    // side panel facing the viewer + its mirror
    [1, -1].forEach(sd => {
      rbox(1.55, 1.0, 0.08, 0.02, 0.1, M.plate, 0.5, -0.28, sd * 0.94);
      rbox(0.95, 0.34, 0.22, 0.05, 0.12, M.body, -0.05, 0.6, sd * 0.97);           // brow over the lens
      [0.05, 0.5, 0.95].forEach(x => rbox(0.18, 0.5, 0.1, 0.02, 0.05, M.dark, x, -0.78, sd * 0.97)); // grip ribs
      [[-0.2, 0.17], [1.2, 0.17], [-0.2, -0.73], [1.2, -0.73]].forEach(([x, y]) => {           // screws
        const s = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16).rotateX(Math.PI / 2), M.lilac);
        s.position.set(x, y, sd * 0.995); s.userData.small = true; model.add(s);
      });
    });
    // record LED
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), new THREE.MeshBasicMaterial({ color: 0xB9A9FF }));
    led.position.set(1.45, 0.78, 0.95); led.userData.small = true; model.add(led);
    // top plate with mounting holes
    rbox(2.15, 0.08, 1.62, 0.02, 0.05, M.dark, 0.55, 1.07, 0);
    for (let i = 0; i < 5; i++) for (let j = -1; j <= 1; j += 2) {
      const h = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 14), M.lilac);
      h.position.set(0.0 + i * 0.32, 1.115, j * 0.5); h.userData.small = true; model.add(h);
    }
    // rear battery block + accent band
    rbox(0.42, 1.95, 1.72, 0.05, 0.12, M.dark, 1.93, 0, 0);
    rbox(0.46, 0.1, 1.76, 0.02, 0.03, M.accent, 1.93, 0.62, 0);
    rbox(0.46, 0.1, 1.76, 0.02, 0.03, M.accent, 1.93, -0.62, 0);

    // ---- lens (points to -X)
    cyl(0.84, 0.84, 0.16, M.lilac, -0.66);          // mount
    cyl(0.88, 0.88, 0.07, M.accent, -0.77);         // accent ring
    cyl(0.74, 0.74, 0.42, M.body, -1.0);
    const iris = new THREE.Group(); model.add(iris);
    cyl(0.79, 0.79, 0.22, M.dark, -1.32, iris);
    ringOf(56, 0.8, [0.18, 0.03, 0.022], M.dark, -1.32, iris);
    cyl(0.76, 0.76, 0.56, M.body, -1.71);
    ringOf(36, 0.765, [0.025, 0.012, 0.11], M.mark, -1.66, model, 4, 1.0);  // focus scale ticks
    ringOf(9, 0.765, [0.1, 0.012, 0.03], M.lilac, -1.86, model);
    const focus = new THREE.Group(); model.add(focus);
    cyl(0.84, 0.84, 0.36, M.dark, -2.17, focus);
    ringOf(64, 0.85, [0.3, 0.035, 0.024], M.dark, -2.17, focus);
    cyl(0.95, 0.82, 0.34, M.body, -2.52, model, 72, true);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.78, 0.34, 72, 1, true).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x0B0320, roughness: 0.8, side: THREE.BackSide }));
    inner.position.x = -2.52; inner.userData.small = true; model.add(inner);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.045, 16, 96).rotateY(Math.PI / 2), M.lilac);
    rim.position.x = -2.69; model.add(rim);
    rim.userData.wire = new THREE.EdgesGeometry(new THREE.TorusGeometry(0.9, 0.045, 6, 48).rotateY(Math.PI / 2), 1);

    // aperture inside the front element (opens on hover / scroll)
    const ap = new THREE.Group(); ap.position.x = -2.4; ap.rotation.y = -Math.PI / 2; ap.scale.setScalar(0.36); model.add(ap);
    const back = new THREE.Mesh(new THREE.RingGeometry(0.2, 2.35, 72), M.dark); back.position.z = -0.18; ap.add(back);
    const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
      const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(245,242,255,1)'); gr.addColorStop(.35, 'rgba(185,169,255,.85)'); gr.addColorStop(1, 'rgba(91,59,235,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c); })();
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false }));
    glow.position.z = -0.15; ap.add(glow);
    const N = 9, R = 2.12, blades = [];
    const shape = new THREE.Shape();
    shape.moveTo(0.05, -0.42);
    shape.bezierCurveTo(-0.9, -0.62, -1.9, -0.5, -2.75, -0.05);
    shape.bezierCurveTo(-2.8, 0.25, -2.7, 0.5, -2.55, 0.62);
    shape.bezierCurveTo(-1.8, 0.28, -0.9, 0.3, 0.05, 0.5);
    shape.lineTo(0.05, -0.42);
    const bgeo = new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 24 });
    for (let i = 0; i < N; i++) {
      const hue = i / N;
      const mat = phys({ color: new THREE.Color().setHSL(0.70 + hue * 0.03, 0.75, 0.24 + 0.2 * Math.sin(hue * Math.PI)), metalness: 0.55, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08, iridescence: 0.55, iridescenceIOR: 1.4 });
      const pivot = new THREE.Group(), a = (i / N) * Math.PI * 2;
      pivot.position.set(Math.cos(a) * R, Math.sin(a) * R, i * 0.012); pivot.rotation.z = a + Math.PI * 0.08;
      const m = new THREE.Mesh(bgeo, mat); m.userData.small = true; pivot.add(m); ap.add(pivot); blades.push(pivot);
    }
    
    // ---- monitor on an arm (top, over the lens)
    const post = cyl(0.07, 0.07, 0.42, M.lilac, 0, model, 24); post.rotation.z = Math.PI / 2; post.position.set(-0.25, 1.3, 0.25);
    const knuckle = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 16), M.dark); knuckle.position.set(-0.25, 1.55, 0.25); model.add(knuckle);
    knuckle.userData.wire = new THREE.EdgesGeometry(new THREE.SphereGeometry(0.12, 8, 6), 1);
    const mon = new THREE.Group(); mon.position.set(-0.35, 1.95, 0.3); mon.rotation.set(-0.42, -0.3, 0.05); model.add(mon);
    rbox(1.32, 0.82, 0.13, 0.03, 0.07, M.body, 0, 0, 0, mon);
    rbox(1.38, 0.88, 0.05, 0.015, 0.08, M.accent, 0, 0, -0.07, mon);
    const scrTex = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 300; const g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 512, 300); gr.addColorStop(0, '#2B1470'); gr.addColorStop(.55, '#5B3BEB'); gr.addColorStop(1, '#B9A9FF');
      g.fillStyle = gr; g.fillRect(0, 0, 512, 300);
      const rg = g.createRadialGradient(330, 120, 0, 330, 120, 220); rg.addColorStop(0, 'rgba(245,242,255,.55)'); rg.addColorStop(1, 'rgba(245,242,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, 512, 300);
      g.strokeStyle = 'rgba(237,231,255,.9)'; g.lineWidth = 5; const k = 34, m = 26;
      [[m, m, 1, 1], [512 - m, m, -1, 1], [m, 300 - m, 1, -1], [512 - m, 300 - m, -1, -1]].forEach(([x, y, sx, sy]) => { g.beginPath(); g.moveTo(x, y + sy * k); g.lineTo(x, y); g.lineTo(x + sx * k, y); g.stroke(); });
      g.lineWidth = 2; g.strokeStyle = 'rgba(237,231,255,.5)'; g.beginPath(); g.moveTo(246, 150); g.lineTo(266, 150); g.moveTo(256, 140); g.lineTo(256, 160); g.stroke();
      g.fillStyle = '#EDE7FF'; g.beginPath(); g.arc(470, 46, 9, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(237,231,255,.55)'; for (let i = 0; i < 26; i++) { const h = 8 + 34 * Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.23)); g.fillRect(40 + i * 7, 262 - h, 4, h); }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.16, 0.68), new THREE.MeshBasicMaterial({ map: scrTex, toneMapped: false }));
    screen.position.z = 0.068; mon.add(screen);

    // centre and fit the model
    const box = new THREE.Box3().setFromObject(model), ctr = box.getCenter(new THREE.Vector3());
    model.position.sub(ctr);
    const fit = 2.95 / box.getBoundingSphere(new THREE.Sphere()).radius; model.scale.setScalar(fit); model.position.multiplyScalar(fit);

    // ---- lights
    const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 4, 6); scene.add(key);
    const rimL = new THREE.DirectionalLight(0x8F7BFF, 3); rimL.position.set(-5, -2, -3); scene.add(rimL);
    const fill = new THREE.DirectionalLight(0xB9A9FF, 0.8); fill.position.set(-4, 2, 5); scene.add(fill);

    // ---- blueprint intro (igloo.inc style)
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const SPEED = +(new URLSearchParams(location.search).get('introspeed') || 1);  // QA only
    const solids = [], wires = [];
    const wireMat = (o) => new THREE.LineBasicMaterial({ color: 0x4B2AD8, transparent: true, opacity: o, depthWrite: false });
    function wireFor(mesh, geo, delay, dur, op) {
      const l = new THREE.LineSegments(geo, wireMat(op)); mesh.add(l);
      const n = geo.attributes.position.count; geo.setDrawRange(0, 0);
      wires.push({ l, n, delay, dur, op });
    }
    model.updateMatrixWorld(true);
    const wp = new THREE.Vector3(), span = box.max.x - box.min.x;
    model.traverse(o => {
      if (!o.isMesh) return;
      solids.push(o); o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0; o.material.depthWrite = false;
      if (o === glow || o === screen || o.userData.glass) return;
      o.getWorldPosition(wp);
      const k = clampN((wp.x / fit + span / 2) / span);          // draw from the lens back to the battery
      const g = o.userData.wire || new THREE.EdgesGeometry(o.geometry, 25);
      if (o.userData.small) wireFor(o, g, 0.55 + k * 1.0, 0.3, 0.6);
      else wireFor(o, g, 0.35 + k * 0.9, 0.95, 0.85);
    });
    function clampN(x) { return Math.max(0, Math.min(1, x)); }
    // surrounding constellation + dust
    const net = new THREE.Group(); scene.add(net);
    const rnd = (a, b) => a + Math.random() * (b - a);
    const nodes = []; for (let i = 0; i < 64; i++) { const r = rnd(3.2, 6.5), a = rnd(0, Math.PI * 2); nodes.push(new THREE.Vector3(Math.cos(a) * r * 1.35, Math.sin(a) * r * 0.62, rnd(-4.5, 0.8))); }
    const segs = []; nodes.forEach((p, i) => { nodes.map((q, j) => [p.distanceTo(q), j]).filter(d => d[1] !== i).sort((a, b) => a[0] - b[0]).slice(0, 2).forEach(([d, j]) => { if (j > i || d > 2.6) segs.push(p.x, p.y, p.z, nodes[j].x, nodes[j].y, nodes[j].z); }); });
    const netGeo = new THREE.BufferGeometry(); netGeo.setAttribute('position', new THREE.Float32BufferAttribute(segs, 3));
    const netLines = new THREE.LineSegments(netGeo, new THREE.LineBasicMaterial({ color: 0x8F7BFF, transparent: true, opacity: 0.0, depthWrite: false })); net.add(netLines);
    const netN = netGeo.attributes.position.count; netGeo.setDrawRange(0, 0);
    const nodePts = new THREE.Points(new THREE.BufferGeometry().setFromPoints(nodes), new THREE.PointsMaterial({ color: 0x5B3BEB, size: 0.06, transparent: true, opacity: 0 })); net.add(nodePts);
    const dust = []; for (let i = 0; i < 700; i++) { const u = rnd(0, Math.PI * 2), v = Math.acos(rnd(-1, 1)), r = Math.cbrt(Math.random()) * 3.3; dust.push(Math.sin(v) * Math.cos(u) * r * 1.2, Math.sin(v) * Math.sin(u) * r * 0.8, Math.cos(v) * r * 0.7); }
    const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(dust, 3));
    const dustPts = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x7C63F5, size: 0.022, transparent: true, opacity: 0, depthWrite: false })); rig.add(dustPts);
    const loader = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.012), new THREE.MeshBasicMaterial({ color: 0x4B2AD8, transparent: true, opacity: 1 }));
    loader.scale.x = 0.001; scene.add(loader);
    const clamp = clampN, ease = (x) => 1 - Math.pow(1 - clamp(x), 3), inout = (x) => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
    let solidDone = false;
    function blueprint(t) {
      if (reduce) t = 99;
      loader.scale.x = 0.001 + ease(t / 0.55); loader.material.opacity = 1 - clamp((t - 0.45) / 0.35); loader.visible = loader.material.opacity > 0.01;
      wires.forEach(w => { const p = ease((t - w.delay) / w.dur); w.l.geometry.setDrawRange(0, Math.floor(w.n * p / 2) * 2); w.l.material.opacity = w.op * (1 - inout((t - 2.65) / 0.8)); w.l.visible = w.l.material.opacity > 0.01; });
      netGeo.setDrawRange(0, Math.floor(netN * ease((t - 0.5) / 1.6) / 2) * 2);
      netLines.material.opacity = 0.55 * clamp((t - 0.5) / 0.4) - 0.43 * inout((t - 2.5) / 1.0);
      nodePts.material.opacity = 0.9 * clamp((t - 0.6) / 0.5) - 0.7 * inout((t - 2.5) / 1.0);
      dustPts.material.opacity = 0.6 * clamp((t - 0.9) / 0.6) * (1 - inout((t - 2.4) / 0.9));
      const sp = inout((t - 2.15) / 1.1);
      if (!solidDone) { solids.forEach(m => { m.material.opacity = m.userData.glass ? sp * 0.28 : sp; }); if (sp >= 1) { solids.forEach(m => { const keep = m === glow || m.userData.glass; m.material.transparent = keep; m.material.depthWrite = !keep; m.material.opacity = m.userData.glass ? 0.28 : 1; m.material.needsUpdate = true; }); solidDone = true; } }
      return sp;
    }

    // ---- interaction
    const BASE_X = 0.16, BASE_Y = 0.62;
    let tx = BASE_X, ty = BASE_Y, rx = BASE_X, ry = BASE_Y, open = 0.15, openT = 0.15, t0 = null, frames = 0;
    const hero = document.querySelector('[data-hero]') || host;
    hero.addEventListener('mousemove', e => { const r = hero.getBoundingClientRect(); tx = BASE_X + ((e.clientY - r.top) / r.height - 0.5) * 0.5; ty = BASE_Y + ((e.clientX - r.left) / r.width - 0.5) * 0.9; openT = 0.75; });
    hero.addEventListener('mouseleave', () => { tx = BASE_X; ty = BASE_Y; openT = 0.15; });
    addEventListener('resize', () => { renderer.setSize(W(), H()); camera.aspect = W() / H(); camera.updateProjectionMatrix(); });

    function frame(now) {
      if (t0 === null || frames < 2) { t0 = now; frames++; }  // start the intro once rendering is warm
      const t = (now - t0) / 1000;
      const sp = blueprint(t * SPEED);
      const e = 0.84 + 0.16 * sp;
      const sc = Math.min(1, Math.max(0, 1 - scrollY / 700));
      open += ((openT * sc + (1 - sc) * 0.95) - open) * 0.06;
      blades.forEach((b, i) => { b.children[0].rotation.z = 0.25 - open * 0.75 + Math.sin(t * 0.8 + i) * 0.015; });
      rx += (tx - rx) * 0.06; ry += (ty - ry) * 0.06;
      rig.rotation.x = rx; rig.rotation.y = ry + Math.sin(t * 0.3) * 0.06 - (1 - e) * 1.4;
      focus.rotation.x = (ry - BASE_Y) * 2.4 + t * 0.05; iris.rotation.x = -(rx - BASE_X) * 1.6;
      led.material.opacity = solidDone ? 0.55 + 0.45 * (Math.sin(t * 3) > 0 ? 1 : 0.2) : led.material.opacity;
      led.material.transparent = true;
      rig.position.y = Math.sin(t * 0.9) * 0.1;
      rig.scale.setScalar(e);
      net.rotation.y = Math.sin(t * 0.07) * 0.25 + (ry - BASE_Y) * 0.4; net.rotation.x = (rx - BASE_X) * 0.4;
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
}
