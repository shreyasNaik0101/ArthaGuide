import { useEffect, useRef } from 'react';

// Decorative only: WebGL never owns application state or blocks the finance workflow.
export default function FinanceScene() {
  const host = useRef(null);
  useEffect(() => {
    const element = host.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let disposed = false, renderer, frame, observer;
    let cleanup = () => {};
    import('three').then(THREE => {
      if (disposed) return;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
      } catch { return; } // The CSS aurora remains when WebGL is unavailable.
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      element.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, .1, 100);
      camera.position.z = 11;
      scene.add(new THREE.AmbientLight(0xffffff, 2));
      const light = new THREE.DirectionalLight(0xd7dcff, 4);
      light.position.set(3, 4, 6); scene.add(light);
      const group = new THREE.Group(); scene.add(group);
      const meshes = [];
      const colors = [0x7471ff, 0x4bc7ed, 0xc595ff];
      for (let i = 0; i < 6; i++) {
        const geometry = i % 2 ? new THREE.TorusGeometry(.6, .045, 12, 64) : new THREE.IcosahedronGeometry(.4, 0);
        const material = new THREE.MeshStandardMaterial({ color: colors[i % 3], metalness: .55, roughness: .25, transparent: true, opacity: .38, wireframe: i % 2 === 0 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set((i % 2 ? 1 : -1) * (2.6 + i * .3), (i % 3 - 1) * 2.5, -i * .25);
        mesh.rotation.set(i * .5, i * .7, i * .3);
        group.add(mesh); meshes.push(mesh);
      }
      let pointerX = 0, pointerY = 0;
      const pointer = event => { pointerX = event.clientX / window.innerWidth - .5; pointerY = event.clientY / window.innerHeight - .5; };
      const render = time => {
        if (disposed) return;
        if (!reduced.matches) {
          group.rotation.y += (pointerX * .12 - group.rotation.y) * .025;
          group.rotation.x += (pointerY * .08 - group.rotation.x) * .025;
          meshes.forEach((mesh, i) => { mesh.rotation.y = i * .7 + time * .00008; mesh.rotation.z = i * .3 + time * .00004; });
        }
        renderer.render(scene, camera);
        if (!document.hidden && !reduced.matches) frame = requestAnimationFrame(render);
      };
      const resume = () => { cancelAnimationFrame(frame); render(performance.now()); };
      const resize = () => { const { width, height } = element.getBoundingClientRect(); renderer.setSize(width, height); camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix(); resume(); };
      observer = new ResizeObserver(resize); observer.observe(element);
      window.addEventListener('pointermove', pointer, { passive: true });
      document.addEventListener('visibilitychange', resume);
      reduced.addEventListener('change', resume);
      const lost = event => { event.preventDefault(); cancelAnimationFrame(frame); };
      renderer.domElement.addEventListener('webglcontextlost', lost);
      cleanup = () => {
        window.removeEventListener('pointermove', pointer);
        document.removeEventListener('visibilitychange', resume);
        reduced.removeEventListener('change', resume);
        renderer.domElement.removeEventListener('webglcontextlost', lost);
        meshes.forEach(mesh => { mesh.geometry.dispose(); mesh.material.dispose(); });
      };
      resize();
    }).catch(() => {});
    return () => { disposed = true; cancelAnimationFrame(frame); observer?.disconnect(); cleanup(); renderer?.dispose(); renderer?.domElement.remove(); };
  }, []);
  return <div className="finance-atmosphere" aria-hidden="true"><div className="aurora aurora-one" /><div className="aurora aurora-two" /><div ref={host} className="finance-webgl" /></div>;
}
