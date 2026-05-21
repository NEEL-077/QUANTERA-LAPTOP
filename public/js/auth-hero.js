/**
 * Quantéra Futuristic Auth Hero
 * A high-performance Vanilla Three.js implementation of the interactive tech background.
 */

class FuturisticHero {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.container = this.canvas.parentElement;
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });

        this.mouse = new THREE.Vector2(0, 0);
        this.targetMouse = new THREE.Vector2(0, 0);
        this.time = 0;

        this.assets = {
            texture: 'https://i.postimg.cc/XYwvXN8D/img-4.png',
            depth: 'https://i.postimg.cc/2SHKQh2q/raw-4.webp'
        };

        this.init();
    }

    async init() {
        const loader = new THREE.TextureLoader();
        
        // Load textures
        const [tex, depth] = await Promise.all([
            new Promise(res => loader.load(this.assets.texture, res)),
            new Promise(res => loader.load(this.assets.depth, res))
        ]);

        this.setupShader(tex, depth);
        this.resize();
        this.bindEvents();
        this.render();
    }

    setupShader(tex, depth) {
        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform sampler2D uTexture;
            uniform sampler2D uDepth;
            uniform vec2 uMouse;
            uniform float uTime;
            uniform float uAspect;
            varying vec2 vUv;

            // Simple noise function for data dots
            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
            }

            void main() {
                // Depth-based displacement (Mouse Parallax)
                float d = texture2D(uDepth, vUv).r;
                vec2 displacement = uMouse * d * 0.05;
                vec2 uv = vUv + displacement;

                // Sample base image
                vec4 color = texture2D(uTexture, uv);

                // Scanning Line Effect
                float scanPos = mod(uTime * 0.2, 1.2) - 0.1;
                float scanWidth = 0.02;
                float scanLine = smoothstep(0.0, scanWidth, abs(vUv.y - scanPos));
                vec3 scanColor = vec3(0.9, 0.1, 0.1) * (1.0 - scanLine) * 0.8;
                
                // Add scan color with glow
                color.rgb += scanColor;

                gl_FragColor = color;
            }
        `;

        this.uniforms = {
            uTexture: { value: tex },
            uDepth: { value: depth },
            uMouse: { value: new THREE.Vector2(0, 0) },
            uTime: { value: 0 },
            uAspect: { value: this.container.clientWidth / this.container.clientHeight }
        };

        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader,
            fragmentShader
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);
    }

    bindEvents() {
        window.addEventListener('mousemove', (e) => {
            // Normalized mouse coordinates (-1 to 1)
            this.targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.renderer.setSize(w, h);
        if (this.uniforms) {
            this.uniforms.uAspect.value = w / h;
        }
    }

    render() {
        requestAnimationFrame(() => this.render());
        
        this.time += 0.02;
        
        // Smooth mouse lerp
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;

        if (this.uniforms) {
            this.uniforms.uTime.value = this.time;
            this.uniforms.uMouse.value.copy(this.mouse);
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize when ready
document.addEventListener('DOMContentLoaded', () => {
    // We expect Three.js to be loaded via CDN
    if (typeof THREE !== 'undefined') {
        window.authHero = new FuturisticHero('globeCanvas');
    }
});
