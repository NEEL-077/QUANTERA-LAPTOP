/**
 * Newsletter Box 3D Background & Form Handling
 * Native JS translation of React WaitlistExperience component
 */

document.addEventListener('DOMContentLoaded', () => {
    initNewsletterForm();
    
    // Wait slightly to ensure THREE is loaded if it's async/deferred
    if (typeof THREE !== 'undefined') {
        initThreeJsBackground();
    } else {
        // Fallback: check again after a short delay
        setTimeout(() => {
            if (typeof THREE !== 'undefined') {
                initThreeJsBackground();
            }
        }, 500);
    }
});

function initThreeJsBackground() {
    const mountNode = document.getElementById('nlBgCanvas');
    if (!mountNode) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    mountNode.appendChild(renderer.domElement);

    // Create curved light geometry
    const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-15, -4, 0),
        new THREE.Vector3(2, 3, 0),
        new THREE.Vector3(18, 0.8, 0)
    );

    // Create tube geometry for the light streak
    const tubeGeometry = new THREE.TubeGeometry(curve, 200, 0.8, 32, false);

    // Create gradient material
    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float time;
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        // Create the gradient from red/orange to purple/magenta
        vec3 color1 = vec3(1.0, 0.2, 0.1); // Red/Orange
        vec3 color2 = vec3(0.8, 0.1, 0.6); // Purple/Magenta
        vec3 color3 = vec3(0.4, 0.05, 0.8); // Deep purple
        
        // Mix colors based on UV coordinates
        vec3 finalColor = mix(color1, color2, vUv.x);
        finalColor = mix(finalColor, color3, vUv.x * 0.7);
        
        // Add glow effect
        float glow = 1.0 - abs(vUv.y - 0.5) * 2.0;
        glow = pow(glow, 2.0);
        
        float fade = 1.0;
        if (vUv.x > 0.85) {
          fade = 1.0 - smoothstep(0.85, 1.0, vUv.x);
        }
        
        // Add subtle animation
        float pulse = sin(time * 2.0) * 0.1 + 0.9;
        
        gl_FragColor = vec4(finalColor * glow * pulse * fade, glow * fade * 0.8);
      }
    `;

    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            time: { value: 0 },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
    });

    const lightStreak = new THREE.Mesh(tubeGeometry, material);
    scene.add(lightStreak);

    // Add additional glow layers for more realistic effect
    const glowGeometry = new THREE.TubeGeometry(curve, 200, 1.5, 32, false);
    const glowMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vec3 color1 = vec3(1.0, 0.3, 0.2);
          vec3 color2 = vec3(0.6, 0.2, 0.8);
          
          vec3 finalColor = mix(color1, color2, vUv.x);
          
          float glow = 1.0 - abs(vUv.y - 0.5) * 2.0;
          glow = pow(glow, 4.0);
          
          float fade = 1.0;
          if (vUv.x > 0.85) {
            fade = 1.0 - smoothstep(0.85, 1.0, vUv.x);
          }
          
          float pulse = sin(time * 1.5) * 0.05 + 0.95;
          
          gl_FragColor = vec4(finalColor * glow * pulse * fade, glow * fade * 0.3);
        }
      `,
        uniforms: {
            time: { value: 0 },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
    });

    const glowLayer = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glowLayer);

    // Position camera
    camera.position.z = 7;
    camera.position.y = -0.8;

    let animationId;

    // Animation loop
    const animate = () => {
        animationId = requestAnimationFrame(animate);

        const time = Date.now() * 0.001;
        material.uniforms.time.value = time;
        glowMaterial.uniforms.time.value = time;

        // Subtle rotation for dynamic effect
        lightStreak.rotation.z = Math.sin(time * 0.2) * 0.05;
        glowLayer.rotation.z = Math.sin(time * 0.2) * 0.05;

        renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
}

function initNewsletterForm() {
    const form = document.getElementById('nlForm');
    const input = document.getElementById('nlEmail');
    const submitBtn = document.getElementById('nlSubmitBtn');
    const formContainer = document.getElementById('nlFormContainer');
    const successContainer = document.getElementById('nlSuccessContainer');

    if (!form || !input) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = input.value.trim();
        if (!email) return;

        // Update UI to loading state
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Subscribing...';
        submitBtn.style.opacity = '0.7';

        try {
            const response = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, source: 'homepage_premium_box' })
            });

            const data = await response.json();

            if (response.ok) {
                // Show success state
                formContainer.style.display = 'none';
                successContainer.style.display = 'block';
            } else {
                if (window.QuanteraUI?.showAlert) {
                    window.QuanteraUI.showAlert({
                        title: 'Newsletter Error',
                        description: data.error || 'Something went wrong. Please try again.',
                        variant: 'error'
                    });
                } else {
                    alert(data.error || 'Something went wrong. Please try again.');
                }
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                submitBtn.style.opacity = '1';
            }
        } catch (error) {
            console.error('Newsletter error:', error);
            if (window.QuanteraUI?.showAlert) {
                window.QuanteraUI.showAlert({
                    title: 'Connection Error',
                    description: 'Failed to connect to the server. Please try again later.',
                    variant: 'error'
                });
            } else {
                alert('Failed to connect to the server. Please try again later.');
            }
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            submitBtn.style.opacity = '1';
        }
    });
}
