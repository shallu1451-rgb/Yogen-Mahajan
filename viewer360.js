/**
 * Ritu Mahajan Fashion Store – Interactive 360° Product Viewer
 * Features:
 * - 360° Drag & Touch Turntable Rotation
 * - Continuous Auto-Spin with Play/Pause
 * - Quick Angle Snap (Front 0°, Right 90°, Back 180°, Left 270°)
 * - 360° Degree Slider with Live Angle Readout
 * - Realistic 3D Pedestal, Ambient Glow & Specular Sheen Effect
 * - Multi-Angle Image Cross-Fading (Front & Detail angles)
 * - Fabric Zoom Slider / Toggle
 * - Pre-Filled WhatsApp Inquiry Integration
 */

(function () {
    // Inject Modal HTML into DOM if not present
    function ensureModalInDOM() {
        if (document.getElementById('viewer360-modal')) return;

        const modalHTML = `
        <div id="viewer360-modal" class="v360-overlay" role="dialog" aria-modal="true" aria-label="360 Product Viewer">
            <div class="v360-container">
                <!-- Header -->
                <div class="v360-topbar">
                    <div class="v360-title-wrap">
                        <span class="v360-badge-pill"><i class="fas fa-arrows-rotate"></i> 360° INTERACTIVE VIEW</span>
                        <h3 id="v360-product-title" class="v360-heading">Product Name</h3>
                        <p id="v360-product-subtitle" class="v360-subheading">Pure Fabric · Handcrafted in Chandigarh</p>
                    </div>
                    <button class="v360-close-btn" id="v360-close-btn" aria-label="Close 360 Viewer">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <!-- 3D Turntable Stage -->
                <div class="v360-stage-wrapper">
                    <div class="v360-drag-hint" id="v360-drag-hint">
                        <i class="fas fa-hand-pointer"></i> <span>Drag left / right to spin in 360°</span>
                    </div>

                    <div class="v360-stage" id="v360-stage">
                        <!-- Lighting Sheen Effect -->
                        <div class="v360-sheen" id="v360-sheen"></div>

                        <!-- 3D Rotating Frame -->
                        <div class="v360-rotator" id="v360-rotator">
                            <img id="v360-main-img" src="" alt="360 Product View" draggable="false">
                            <img id="v360-alt-img" src="" alt="360 Alternate View" draggable="false" style="display:none;opacity:0;">
                        </div>

                        <!-- Turntable Pedestal Base -->
                        <div class="v360-pedestal">
                            <div class="v360-pedestal-rim"></div>
                            <div class="v360-pedestal-glow"></div>
                        </div>
                    </div>

                    <!-- Live Angle & Status Indicator -->
                    <div class="v360-angle-indicator">
                        <span id="v360-angle-text">Angle: 0° (Front View)</span>
                    </div>
                </div>

                <!-- Controls Bar -->
                <div class="v360-controls-panel">
                    <!-- Rotation Slider -->
                    <div class="v360-slider-row">
                        <i class="fas fa-rotate-left"></i>
                        <input type="range" id="v360-range" min="0" max="359" value="0" aria-label="Rotate angle">
                        <i class="fas fa-rotate-right"></i>
                    </div>

                    <!-- Preset Angle Buttons -->
                    <div class="v360-buttons-row">
                        <button class="v360-angle-btn active" data-angle="0"><i class="fas fa-compass"></i> Front (0°)</button>
                        <button class="v360-angle-btn" data-angle="90"><i class="fas fa-arrow-right"></i> Right (90°)</button>
                        <button class="v360-angle-btn" data-angle="180"><i class="fas fa-arrow-down"></i> Back (180°)</button>
                        <button class="v360-angle-btn" data-angle="270"><i class="fas fa-arrow-left"></i> Left (270°)</button>
                        <button class="v360-action-btn" id="v360-play-btn" title="Toggle Auto Spin"><i class="fas fa-play"></i> Auto Spin</button>
                        <button class="v360-action-btn" id="v360-zoom-btn" title="Zoom In Fabric"><i class="fas fa-magnifying-glass-plus"></i> Zoom</button>
                    </div>

                    <!-- Product Action Footer -->
                    <div class="v360-footer-row">
                        <div class="v360-fabric-tag" id="v360-specs">
                            <span><i class="fas fa-check-circle" style="color:var(--clr-secondary)"></i> Available at Sector 19-C Store</span>
                        </div>
                        <a id="v360-wa-link" href="#" target="_blank" class="btn btn-whatsapp" style="padding:10px 22px;font-size:.85rem">
                            <i class="fab fa-whatsapp"></i> Inquire on WhatsApp
                        </a>
                    </div>
                </div>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        initViewerLogic();
    }

    // State Variables
    let currentAngle = 0;
    let isDragging = false;
    let startX = 0;
    let startAngle = 0;
    let isAutoSpinning = false;
    let spinInterval = null;
    let isZoomed = false;
    let primaryImageSrc = '';
    let secondaryImageSrc = '';

    function initViewerLogic() {
        const modal = document.getElementById('viewer360-modal');
        const stage = document.getElementById('v360-stage');
        const rotator = document.getElementById('v360-rotator');
        const mainImg = document.getElementById('v360-main-img');
        const altImg = document.getElementById('v360-alt-img');
        const range = document.getElementById('v360-range');
        const angleText = document.getElementById('v360-angle-text');
        const playBtn = document.getElementById('v360-play-btn');
        const zoomBtn = document.getElementById('v360-zoom-btn');
        const closeBtn = document.getElementById('v360-close-btn');
        const angleButtons = document.querySelectorAll('.v360-angle-btn');
        const sheen = document.getElementById('v360-sheen');

        // Apply rotation angle
        window.setViewerAngle = function (angle, updateSlider = true) {
            currentAngle = ((Math.round(angle) % 360) + 360) % 360;

            if (updateSlider && range) {
                range.value = currentAngle;
            }

            // Update angle label
            let viewLabel = 'Front View';
            if (currentAngle >= 45 && currentAngle < 135) viewLabel = 'Right Profile';
            else if (currentAngle >= 135 && currentAngle < 225) viewLabel = 'Back View';
            else if (currentAngle >= 225 && currentAngle < 315) viewLabel = 'Left Profile';

            if (angleText) {
                angleText.textContent = `Angle: ${currentAngle}° (${viewLabel})`;
            }

            // Perspective Transform calculation
            // As angle turns, compute 3D tilt and lighting sheen
            const rad = (currentAngle * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);

            // 3D Matrix/Rotation
            const rotateY = currentAngle;
            const tiltX = Math.sin(rad * 2) * 5; // gentle tilt effect
            const scale = isZoomed ? 1.45 : (1 - Math.abs(sin) * 0.12);

            if (rotator) {
                rotator.style.transform = `perspective(900px) rotateY(${rotateY}deg) rotateX(${tiltX}deg) scale(${scale})`;
            }

            // Dynamic lighting sheen shift
            if (sheen) {
                const sheenPos = ((currentAngle / 360) * 100);
                sheen.style.background = `radial-gradient(ellipse at ${sheenPos}% 40%, rgba(255,255,255,0.45) 0%, rgba(201,124,193,0.15) 40%, transparent 70%)`;
            }

            // Cross-fade to alternate image if angle is around back/side and alternate image exists
            if (secondaryImageSrc && altImg && mainImg) {
                const isBack = currentAngle >= 90 && currentAngle <= 270;
                if (isBack) {
                    altImg.style.display = 'block';
                    altImg.style.opacity = Math.min(1, Math.abs(sin) + (currentAngle >= 135 && currentAngle <= 225 ? 0.5 : 0));
                    mainImg.style.opacity = 1 - parseFloat(altImg.style.opacity || 0);
                } else {
                    mainImg.style.opacity = '1';
                    altImg.style.opacity = '0';
                }
            }

            // Update active preset button
            angleButtons.forEach(btn => {
                const bAngle = parseInt(btn.getAttribute('data-angle'), 10);
                if (Math.abs(currentAngle - bAngle) < 25 || (bAngle === 0 && currentAngle > 335)) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        };

        // Slider Input
        if (range) {
            range.addEventListener('input', (e) => {
                stopAutoSpin();
                setViewerAngle(parseInt(e.target.value, 10), false);
            });
        }

        // Preset angle buttons
        angleButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                stopAutoSpin();
                const target = parseInt(btn.getAttribute('data-angle'), 10);
                smoothRotateTo(target);
            });
        });

        // Mouse Drag Interaction
        if (stage) {
            stage.addEventListener('mousedown', (e) => {
                stopAutoSpin();
                isDragging = true;
                startX = e.clientX;
                startAngle = currentAngle;
                stage.classList.add('dragging');
                const hint = document.getElementById('v360-drag-hint');
                if (hint) hint.style.opacity = '0';
            });

            window.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                const deltaX = e.clientX - startX;
                const newAngle = startAngle + (deltaX * 0.75);
                setViewerAngle(newAngle);
            });

            window.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    stage.classList.remove('dragging');
                }
            });

            // Touch Swipe Interaction (Mobile & Tablet)
            stage.addEventListener('touchstart', (e) => {
                stopAutoSpin();
                isDragging = true;
                startX = e.touches[0].clientX;
                startAngle = currentAngle;
                const hint = document.getElementById('v360-drag-hint');
                if (hint) hint.style.opacity = '0';
            }, { passive: true });

            stage.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                const deltaX = e.touches[0].clientX - startX;
                const newAngle = startAngle + (deltaX * 0.85);
                setViewerAngle(newAngle);
            }, { passive: true });

            stage.addEventListener('touchend', () => {
                isDragging = false;
            });
        }

        // Auto Spin Toggle
        function startAutoSpin() {
            if (isAutoSpinning) return;
            isAutoSpinning = true;
            if (playBtn) {
                playBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
                playBtn.classList.add('spinning');
            }
            spinInterval = setInterval(() => {
                setViewerAngle(currentAngle + 1.2);
            }, 30);
        }

        function stopAutoSpin() {
            if (!isAutoSpinning) return;
            isAutoSpinning = false;
            if (playBtn) {
                playBtn.innerHTML = '<i class="fas fa-play"></i> Auto Spin';
                playBtn.classList.remove('spinning');
            }
            if (spinInterval) {
                clearInterval(spinInterval);
                spinInterval = null;
            }
        }

        if (playBtn) {
            playBtn.addEventListener('click', () => {
                if (isAutoSpinning) stopAutoSpin();
                else startAutoSpin();
            });
        }

        // Zoom Toggle
        if (zoomBtn) {
            zoomBtn.addEventListener('click', () => {
                isZoomed = !isZoomed;
                zoomBtn.innerHTML = isZoomed ? '<i class="fas fa-magnifying-glass-minus"></i> Reset' : '<i class="fas fa-magnifying-glass-plus"></i> Zoom';
                zoomBtn.classList.toggle('active', isZoomed);
                setViewerAngle(currentAngle);
            });
        }

        // Smooth rotation interpolation
        function smoothRotateTo(targetAngle) {
            const diff = targetAngle - currentAngle;
            const steps = 18;
            let step = 0;
            const stepVal = diff / steps;
            const anim = setInterval(() => {
                step++;
                setViewerAngle(currentAngle + stepVal);
                if (step >= steps) {
                    clearInterval(anim);
                    setViewerAngle(targetAngle);
                }
            }, 16);
        }

        // Close Modal
        function closeModal() {
            stopAutoSpin();
            if (modal) modal.classList.remove('open');
            document.body.style.overflow = '';
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
        }

        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            if (!modal || !modal.classList.contains('open')) return;
            if (e.key === 'Escape') closeModal();
            if (e.key === 'ArrowLeft') {
                stopAutoSpin();
                setViewerAngle(currentAngle - 10);
            }
            if (e.key === 'ArrowRight') {
                stopAutoSpin();
                setViewerAngle(currentAngle + 10);
            }
            if (e.key === ' ') {
                e.preventDefault();
                if (isAutoSpinning) stopAutoSpin();
                else startAutoSpin();
            }
        });
    }

    /**
     * Public API: Open 360 Product Viewer
     * @param {Object} options
     * @param {string} options.title - Product Name
     * @param {string} options.subtitle - Fabric or Category subtitle
     * @param {string} options.image - Primary front image
     * @param {string} [options.altImage] - Alternate angle image
     * @param {string} [options.specs] - Highlight specifications
     */
    window.open360 = function (options) {
        ensureModalInDOM();

        const titleEl = document.getElementById('v360-product-title');
        const subEl = document.getElementById('v360-product-subtitle');
        const mainImg = document.getElementById('v360-main-img');
        const altImg = document.getElementById('v360-alt-img');
        const specsEl = document.getElementById('v360-specs');
        const waLink = document.getElementById('v360-wa-link');
        const modal = document.getElementById('viewer360-modal');

        const title = options.title || 'Exquisite Designer Outfit';
        const subtitle = options.subtitle || 'Available at Booth No. 306, Sadar Bazar, Sector 19-C, Chandigarh';
        primaryImageSrc = options.image || 'cat-anarkali.jpg';
        secondaryImageSrc = options.altImage || '';

        if (titleEl) titleEl.textContent = title;
        if (subEl) subEl.textContent = subtitle;
        if (mainImg) {
            mainImg.src = primaryImageSrc;
            mainImg.style.opacity = '1';
        }
        if (altImg) {
            if (secondaryImageSrc) {
                altImg.src = secondaryImageSrc;
                altImg.style.display = 'block';
                altImg.style.opacity = '0';
            } else {
                altImg.style.display = 'none';
            }
        }

        if (specsEl && options.specs) {
            specsEl.innerHTML = `<span><i class="fas fa-sparkles" style="color:var(--clr-accent)"></i> ${options.specs}</span>`;
        }

        if (waLink) {
            const waText = encodeURIComponent(`Hi Ritu Mahajan, I was exploring the 360° view of "${title}" on your website. Please share availability, colors, and pricing!`);
            waLink.href = `https://wa.me/919888960332?text=${waText}`;
        }

        if (modal) {
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
            if (window.setViewerAngle) {
                window.setViewerAngle(0);
            }
        }
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureModalInDOM);
    } else {
        ensureModalInDOM();
    }
})();
