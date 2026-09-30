/* =========================================================
   AGENTIA — behavior
   1. persistent three.js agent-node scene
   2. hero console: typed query + pipeline stage animation
   3. scroll reveal
   4. mobile nav
   ========================================================= */

document.getElementById('year').textContent = new Date().getFullYear();

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------
   1. THREE.JS PERSISTENT SCENE
   Three glowing nodes (Plan / Gather / Synthesize) orbit a
   central core, linked by lines that pulse in sequence —
   the same pipeline the hero console narrates, running
   quietly behind every section.
--------------------------------------------------------- */
(function initScene(){
  const canvas = document.getElementById('agent-scene');
  if (!window.THREE || !canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 13);

  const group = new THREE.Group();
  scene.add(group);

  // colors matched to CSS tokens
  const COL_TEAL   = 0x46e0c5;
  const COL_VIOLET = 0x8b8ff0;
  const COL_AMBER  = 0xffb454;

  // central core
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.55, 1),
    new THREE.MeshBasicMaterial({ color: 0x1a2233, wireframe:true, transparent:true, opacity:0.9 })
  );
  group.add(core);

  const coreGlow = new THREE.PointLight(0x46e0c5, 2, 8);
  coreGlow.position.set(0,0,0.5);
  group.add(coreGlow);

  // three orbiting agent nodes
  function makeNode(color){
    const g = new THREE.Group();
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 20, 20),
      new THREE.MeshBasicMaterial({ color })
    );
    g.add(sphere);
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 20, 20),
      new THREE.MeshBasicMaterial({ color, transparent:true, opacity:0.18 })
    );
    halo.scale.setScalar(2.6);
    g.add(halo);
    return g;
  }

  const nodePlan   = makeNode(COL_TEAL);
  const nodeGather = makeNode(COL_VIOLET);
  const nodeSynth  = makeNode(COL_AMBER);
  group.add(nodePlan, nodeGather, nodeSynth);

  // connecting lines (updated each frame)
  function makeLine(color){
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const mat = new THREE.LineBasicMaterial({ color, transparent:true, opacity:0.35 });
    return new THREE.Line(geo, mat);
  }
  const linePlan   = makeLine(COL_TEAL);
  const lineGather = makeLine(COL_VIOLET);
  const lineSynth  = makeLine(COL_AMBER);
  group.add(linePlan, lineGather, lineSynth);

  // faint particle field for depth
  const particleCount = 220;
  const positions = new Float32Array(particleCount * 3);
  for (let i=0;i<particleCount;i++){
    positions[i*3]   = (Math.random()-0.5) * 26;
    positions[i*3+1] = (Math.random()-0.5) * 16;
    positions[i*3+2] = (Math.random()-0.5) * 14 - 4;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({ color:0x2a3350, size:0.045, transparent:true, opacity:0.7 });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // placement: hero sits right-of-center on desktop, so bias scene slightly right
  function layout(){
    const isMobile = window.innerWidth < 760;
    group.position.set(isMobile ? 0 : 3.0, isMobile ? -1 : 0.4, 0);
    group.scale.setScalar(isMobile ? 0.78 : 1);
  }
  layout();

  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', (e)=>{
    mouseX = (e.clientX / window.innerWidth - 0.5);
    mouseY = (e.clientY / window.innerHeight - 0.5);
  });

  let scrollY = 0;
  window.addEventListener('scroll', ()=>{ scrollY = window.scrollY; }, { passive:true });

  const clock = new THREE.Clock();

  function animate(){
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    core.rotation.y = t * 0.15;
    core.rotation.x = t * 0.08;

    const r1 = 1.9, r2 = 2.5, r3 = 2.2;
    nodePlan.position.set(Math.cos(t*0.35) * r1, Math.sin(t*0.35) * r1, Math.sin(t*0.5) * 0.6);
    nodeGather.position.set(Math.cos(t*0.27 + 2.1) * r2, Math.sin(t*0.27 + 2.1) * r2, Math.sin(t*0.4 + 1) * 0.6);
    nodeSynth.position.set(Math.cos(t*0.22 + 4.2) * r3, Math.sin(t*0.22 + 4.2) * r3, Math.sin(t*0.3 + 2) * 0.6);

    function updateLine(line, node){
      const pos = line.geometry.attributes.position;
      pos.setXYZ(0, 0,0,0);
      pos.setXYZ(1, node.position.x, node.position.y, node.position.z);
      pos.needsUpdate = true;
    }
    updateLine(linePlan, nodePlan);
    updateLine(lineGather, nodeGather);
    updateLine(lineSynth, nodeSynth);

    // pulse opacity in sequence: plan -> gather -> synth -> repeat (mirrors the hero console)
    const cycle = (t % 6);
    linePlan.material.opacity   = cycle < 2 ? 0.55 : 0.15;
    lineGather.material.opacity = (cycle >= 2 && cycle < 4) ? 0.55 : 0.15;
    lineSynth.material.opacity  = cycle >= 4 ? 0.55 : 0.15;

    particles.rotation.y = t * 0.01;

    if (!prefersReducedMotion){
      group.rotation.y += (mouseX * 0.4 - group.rotation.y) * 0.02;
      group.rotation.x += (mouseY * 0.2 - group.rotation.x) * 0.02;
    }
    camera.position.y = 0 - scrollY * 0.0012;

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    layout();
  });
})();

/* ---------------------------------------------------------
   2. HERO CONSOLE — typed query + pipeline stages
--------------------------------------------------------- */
(function initConsole(){
  const typedEl = document.getElementById('typed-query');
  const rows = Array.from(document.querySelectorAll('.pipeline-row'));
  const footline = document.getElementById('console-footline');
  const cachePill = document.getElementById('cache-pill');
  if (!typedEl || !rows.length) return;

  const queries = [
    'What are the grid-scale risks of small modular reactors?',
    'How is the EU regulating agentic AI systems in 2026?',
    'Compare Redis vs Memcached for LLM response caching'
  ];

  let qIndex = 0;

  function typeText(text, cb){
    let i = 0;
    typedEl.textContent = '';
    const speed = 28;
    (function step(){
      if (i <= text.length){
        typedEl.textContent = text.slice(0, i);
        i++;
        setTimeout(step, speed);
      } else {
        cb();
      }
    })();
  }

  function resetStages(){
    rows.forEach(r => { r.classList.remove('active','done'); });
  }

  function runPipeline(onDone){
    let i = 0;
    cachePill.textContent = '● live run';
    cachePill.classList.remove('hit');
    (function next(){
      if (i > 0) rows[i-1].classList.add('done');
      if (i < rows.length){
        rows[i].classList.remove('done');
        rows[i].classList.add('active');
        i++;
        setTimeout(next, 1100);
      } else {
        onDone();
      }
    })();
  }

  function cycle(){
    resetStages();
    typeText(queries[qIndex], () => {
      setTimeout(() => {
        runPipeline(() => {
          setTimeout(() => {
            cachePill.innerHTML = '<span class="blip">●</span> cached — next identical query returns instantly';
            cachePill.classList.add('hit');
            setTimeout(() => {
              qIndex = (qIndex + 1) % queries.length;
              cycle();
            }, 2600);
          }, 300);
        });
      }, 400);
    });
  }

  if (prefersReducedMotion){
    typedEl.textContent = queries[0];
    rows.forEach(r => r.classList.add('active'));
  } else {
    cycle();
  }
})();

/* ---------------------------------------------------------
   3. SCROLL REVEAL
--------------------------------------------------------- */
(function initReveal(){
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || prefersReducedMotion){
    items.forEach(i => i.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold:0.15, rootMargin:'0px 0px -40px 0px' });
  items.forEach(i => io.observe(i));
})();

/* ---------------------------------------------------------
   4. MOBILE NAV
--------------------------------------------------------- */
(function initNav(){
  const toggle = document.getElementById('nav-toggle');
  const header = document.querySelector('.site-header');
  if (!toggle || !header) return;
  toggle.addEventListener('click', () => {
    const open = header.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  header.querySelectorAll('.main-nav a').forEach(a => {
    a.addEventListener('click', () => header.classList.remove('open'));
  });
})();