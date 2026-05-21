document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('globeCanvas');
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    let containerWidth, containerHeight, radius, projection, path;
    const dpr = window.devicePixelRatio || 1;

    function resize() {
        const parent = canvas.parentElement;
        containerWidth = parent.clientWidth;
        containerHeight = parent.clientHeight;
        radius = Math.min(containerWidth, containerHeight) / 2.5;

        canvas.width = containerWidth * dpr;
        canvas.height = containerHeight * dpr;
        canvas.style.width = `${containerWidth}px`;
        canvas.style.height = `${containerHeight}px`;
        
        // Reset transform before re-scaling
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.scale(dpr, dpr);

        projection = d3.geoOrthographic()
            .scale(radius)
            .translate([containerWidth / 2, containerHeight / 2])
            .clipAngle(90);

        path = d3.geoPath().projection(projection).context(context);
        
        if (landFeatures) render();
    }

    const pointInPolygon = (point, polygon) => {
        const [x, y] = point;
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const [xi, yi] = polygon[i];
            const [xj, yj] = polygon[j];
            if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
                inside = !inside;
            }
        }
        return inside;
    };

    const pointInFeature = (point, feature) => {
        const geometry = feature.geometry;
        if (geometry.type === "Polygon") {
            const coordinates = geometry.coordinates;
            if (!pointInPolygon(point, coordinates[0])) return false;
            for (let i = 1; i < coordinates.length; i++) {
                if (pointInPolygon(point, coordinates[i])) return false;
            }
            return true;
        } else if (geometry.type === "MultiPolygon") {
            for (const polygon of geometry.coordinates) {
                if (pointInPolygon(point, polygon[0])) {
                    let inHole = false;
                    for (let i = 1; i < polygon.length; i++) {
                        if (pointInPolygon(point, polygon[i])) {
                            inHole = true;
                            break;
                        }
                    }
                    if (!inHole) return true;
                }
            }
        }
        return false;
    };

    const generateDotsInPolygon = (feature, dotSpacing = 16) => {
        const dots = [];
        const bounds = d3.geoBounds(feature);
        const [[minLng, minLat], [maxLng, maxLat]] = bounds;
        const stepSize = dotSpacing * 0.08;

        for (let lng = minLng; lng <= maxLng; lng += stepSize) {
            for (let lat = minLat; lat <= maxLat; lat += stepSize) {
                const point = [lng, lat];
                if (pointInFeature(point, feature)) {
                    dots.push(point);
                }
            }
        }
        return dots;
    };

    const allDots = [];
    let landFeatures;

    const render = () => {
        context.clearRect(0, 0, containerWidth, containerHeight);

        const currentScale = projection.scale();
        const scaleFactor = currentScale / radius;

        // Draw ocean (globe background)
        context.beginPath();
        context.arc(containerWidth / 2, containerHeight / 2, currentScale, 0, 2 * Math.PI);
        context.fillStyle = "#111827"; // matching hero dark background
        context.fill();
        context.strokeStyle = "rgba(255,255,255,0.1)";
        context.lineWidth = 2 * scaleFactor;
        context.stroke();

        if (landFeatures) {
            // Draw graticule
            const graticule = d3.geoGraticule();
            context.beginPath();
            path(graticule());
            context.strokeStyle = "rgba(255,255,255,0.15)";
            context.lineWidth = 1 * scaleFactor;
            context.stroke();

            // Draw land outlines
            context.beginPath();
            landFeatures.features.forEach(feature => {
                path(feature);
            });
            context.strokeStyle = "rgba(255,255,255,0.3)";
            context.lineWidth = 1 * scaleFactor;
            context.stroke();

            // Draw halftone dots
            context.fillStyle = "rgba(0, 242, 255, 0.6)"; // Quantéra cyan matching dots
            allDots.forEach(dot => {
                const projected = projection([dot.lng, dot.lat]);
                if (
                    projected &&
                    projected[0] >= 0 &&
                    projected[0] <= containerWidth &&
                    projected[1] >= 0 &&
                    projected[1] <= containerHeight
                ) {
                    context.beginPath();
                    context.arc(projected[0], projected[1], 1.2 * scaleFactor, 0, 2 * Math.PI);
                    context.fill();
                }
            });
        }
    };

    window.addEventListener('resize', resize);
    resize();

    const loadWorldData = async () => {
        try {
            const response = await fetch(
                "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json"
            );
            if (!response.ok) throw new Error("Failed to load land data");

            landFeatures = await response.json();

            landFeatures.features.forEach(feature => {
                const dots = generateDotsInPolygon(feature, 16);
                dots.forEach(([lng, lat]) => {
                    allDots.push({ lng, lat, visible: true });
                });
            });

            render();
        } catch (err) {
            console.error("Failed to load land map data", err);
        }
    };

    const rotation = [0, 0];
    let autoRotate = true;
    const rotationSpeed = 0.5;

    const rotate = () => {
        if (autoRotate && projection) {
            rotation[0] += rotationSpeed;
            projection.rotate(rotation);
            render();
        }
    };

    d3.timer(rotate);

    const handleMouseDown = (event) => {
        autoRotate = false;
        const startX = event.clientX;
        const startY = event.clientY;
        const startRotation = [...rotation];

        const handleMouseMove = (moveEvent) => {
            const sensitivity = 0.5;
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;

            rotation[0] = startRotation[0] + dx * sensitivity;
            rotation[1] = startRotation[1] - dy * sensitivity;
            rotation[1] = Math.max(-90, Math.min(90, rotation[1]));

            projection.rotate(rotation);
            render();
        };

        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            setTimeout(() => { autoRotate = true; }, 10);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleWheel = (event) => {
        event.preventDefault();
        const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1;
        const newRadius = Math.max(radius * 0.5, Math.min(radius * 3, projection.scale() * scaleFactor));
        projection.scale(newRadius);
        render();
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    // Initial data load
    loadWorldData();
});
