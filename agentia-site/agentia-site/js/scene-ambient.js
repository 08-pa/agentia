/* =========================================================
   AGENTIA — scene-ambient.js
   A much quieter version of the marketing hero's 3D scene,
   for pages where people are actually reading/working. Low
   opacity, slow, and positioned off to one side so it never
   competes with page content.
   ========================================================= */
(function () {
  const canvas = document.getElementById('agent-scene-ambient');
  if (!window.THREE || !canvas) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 14);

  const group = new THREE.Group();
  scene.add(group);

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.4, 1),
    new THREE.MeshBasicMaterial({ color: 0x1a2233, wireframe: true, transparent: true, opacity: 0.35 })
  );
  group.add(core);

  function makeNode(color) {
    return new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55 }));
  }
  const nodePlan = makeNode(0x46e0c5);
  const nodeGather = makeNode(0x8b8ff0);
  const nodeSynth = makeNode(0xffb454);
  group.add(nodePlan, nodeGather, nodeSynth);

  // Positioned off to the top-right, out of the way of the text column.
  function layout() {
    const isMobile = window.innerWidth < 860;
    group.position.set(isMobile ? 0 : 4.6, isMobile ? -3.5 : 2.4, -2);
    group.scale.setScalar(isMobile ? 0.55 : 0.75);
  }
  layout();

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    core.rotation.y = t * 0.08;
    core.rotation.x = t * 0.04;
    const r = 1.1;
    nodePlan.position.set(Math.cos(t * 0.2) * r, Math.sin(t * 0.2) * r, 0);
    nodeGather.position.set(Math.cos(t * 0.15 + 2.1) * r, Math.sin(t * 0.15 + 2.1) * r, 0);
    nodeSynth.position.set(Math.cos(t * 0.12 + 4.2) * r, Math.sin(t * 0.12 + 4.2) * r, 0);
    group.rotation.y = Math.sin(t * 0.05) * 0.1;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    layout();
  });
})();
