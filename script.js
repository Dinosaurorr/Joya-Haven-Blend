document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    const moonIcon = document.getElementById('moon-icon');
    const sunIcon = document.getElementById('sun-icon');
    const htmlElement = document.documentElement;

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    });

    function setTheme(theme) {
        htmlElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        if (theme === 'dark') {
            moonIcon.style.display = 'none';
            sunIcon.style.display = 'block';
        } else {
            moonIcon.style.display = 'block';
            sunIcon.style.display = 'none';
        }
        
        // Re-calculate carousel position on theme change if width might change
        if (typeof updateCarousel === 'function') {
            updateCarousel(false);
        }
    }

    // Carousel Logic
    const carouselContainer = document.getElementById('carousel-container');
    const carouselGrid = document.getElementById('carousel-grid');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');

    if (carouselGrid && prevBtn && nextBtn) {
        const items = Array.from(carouselGrid.children);
        const totalItems = items.length;
        let currentIndex = 0;
        let isTransitioning = false;

        // Clone first and last items for seamless looping
        const firstClone = items[0].cloneNode(true);
        const lastClone = items[totalItems - 1].cloneNode(true);

        carouselGrid.appendChild(firstClone);
        carouselGrid.insertBefore(lastClone, items[0]);

        // Start at index 1 (the original first item)
        currentIndex = 1;
        updateCarousel(false);

        function updateCarousel(animate = true) {
            const width = carouselContainer.offsetWidth;
            const targetScroll = currentIndex * width;
            
            if (window.innerWidth <= 1024) {
                // On tablet/mobile, use native scroll for better feel with scroll-snap
                carouselContainer.scrollTo({
                    left: targetScroll,
                    behavior: animate ? 'smooth' : 'auto'
                });
            } else {
                // On desktop, keep the existing translate logic for seamless looping
                if (animate) {
                    carouselGrid.style.transition = 'transform 0.5s ease';
                } else {
                    carouselGrid.style.transition = 'none';
                }
                carouselGrid.style.transform = `translateX(-${targetScroll}px)`;
            }
        }

        // On tablet/mobile, update currentIndex based on scroll position to keep sync and handle looping
        let isJumping = false;
        carouselContainer.addEventListener('scroll', () => {
            if (isJumping) return;
            
            if (window.innerWidth <= 1024) {
                const width = carouselContainer.offsetWidth;
                const scrollLeft = carouselContainer.scrollLeft;
                currentIndex = Math.round(scrollLeft / width);

                const itemsWithClones = carouselGrid.children;
                
                // Jump logic for mobile/tablet scroll-snap
                if (scrollLeft <= width * 0.1) {
                    // Near start clone, jump to actual last item
                    isJumping = true;
                    currentIndex = itemsWithClones.length - 2;
                    carouselContainer.scrollLeft = currentIndex * width;
                    setTimeout(() => { isJumping = false; }, 50);
                } else if (scrollLeft >= width * (itemsWithClones.length - 1.1)) {
                    // Near end clone, jump to actual first item
                    isJumping = true;
                    currentIndex = 1;
                    carouselContainer.scrollLeft = currentIndex * width;
                    setTimeout(() => { isJumping = false; }, 50);
                }
            }
        });

        function handleNext() {
            if (isTransitioning) return;
            isTransitioning = true;
            currentIndex++;
            updateCarousel();
            
            if (window.innerWidth <= 1024) {
                // On mobile/tablet, native scroll doesn't fire transitionend
                setTimeout(() => { isTransitioning = false; }, 500);
            }
        }

        function handlePrev() {
            if (isTransitioning) return;
            isTransitioning = true;
            currentIndex--;
            updateCarousel();

            if (window.innerWidth <= 1024) {
                // On mobile/tablet, native scroll doesn't fire transitionend
                setTimeout(() => { isTransitioning = false; }, 500);
            }
        }

        nextBtn.addEventListener('click', handleNext);
        prevBtn.addEventListener('click', handlePrev);

        carouselGrid.addEventListener('transitionend', () => {
            isTransitioning = false;
            const itemsWithClones = carouselGrid.children;
            
            if (currentIndex === 0) {
                // We are at the last clone, jump to actual last item
                currentIndex = itemsWithClones.length - 2;
                updateCarousel(false);
            } else if (currentIndex === itemsWithClones.length - 1) {
                // We are at the first clone, jump to actual first item
                currentIndex = 1;
                updateCarousel(false);
            }
        });

        // Handle resize
        window.addEventListener('resize', () => {
            updateCarousel(false);
        });
    }

    // Rainbow Cursor Highlight Effect
    const cursorCanvas = document.getElementById('cursor-canvas');
    if (cursorCanvas && window.matchMedia('(pointer: fine)').matches) {
        const ctx = cursorCanvas.getContext('2d');
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;
        let opacity = 0;
        let targetOpacity = 0;
        let hue = 0;
        let inactivityTimer;

        // Create "scattered" points that follow tightly
        const points = Array.from({ length: 6 }, () => ({
            x: targetX,
            y: targetY,
            offsetX: (Math.random() - 0.5) * 80, // Tighter scattering
            offsetY: (Math.random() - 0.5) * 80,
            size: 100 + Math.random() * 80, // Smaller, softer sizes
            speed: 1 // No delay
        }));

        function resizeCanvas() {
            cursorCanvas.width = window.innerWidth;
            cursorCanvas.height = window.innerHeight;
        }

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        window.addEventListener('mousemove', (e) => {
            targetX = e.clientX;
            targetY = e.clientY;
            targetOpacity = 0.4; // Slightly more visible since it's smaller
            
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                targetOpacity = 0;
            }, 800); // Fades out faster
        });

        function animate() {
            ctx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
            
            // Smooth cursor tracking
            mouseX = targetX;
            mouseY = targetY;
            
            // Smooth opacity change
            opacity += (targetOpacity - opacity) * 0.1;

            if (opacity > 0.005) {
                hue = (hue + 1) % 360; // Faster color cycling
                ctx.globalCompositeOperation = 'screen';

                points.forEach((p, i) => {
                    // Update point position relative to mouse with no delay
                    p.x = mouseX + p.offsetX;
                    p.y = mouseY + p.offsetY;

                    // Create a large radial gradient for each point
                    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                    const pColor = (hue + i * 40) % 360; 
                    
                    gradient.addColorStop(0, `hsla(${pColor}, 100%, 75%, ${opacity * 0.4})`);
                    gradient.addColorStop(0.5, `hsla(${pColor}, 100%, 75%, ${opacity * 0.1})`);
                    gradient.addColorStop(1, `hsla(${pColor}, 100%, 75%, 0)`);

                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                });
            }
            
            requestAnimationFrame(animate);
        }
        animate();
    }

    // About Carousel Logic (Manual + Infinite)
    const aboutTrack = document.getElementById('about-carousel-track');
    const aboutPrev = document.getElementById('about-prev');
    const aboutNext = document.getElementById('about-next');
    const zoomModal = document.getElementById('zoom-modal');
    const zoomContent = document.getElementById('zoom-content');
    const zoomClose = document.querySelector('.zoom-close');
    
    if (aboutTrack) {
        const originalItems = Array.from(aboutTrack.querySelectorAll('.about-carousel-item'));
        let aboutIndex = 1;
        
        // Add clones for infinite feel
        const firstClone = originalItems[0].cloneNode(true);
        const lastClone = originalItems[originalItems.length - 1].cloneNode(true);
        
        aboutTrack.appendChild(firstClone);
        aboutTrack.insertBefore(lastClone, aboutTrack.firstChild);
        
        const allItems = aboutTrack.querySelectorAll('.about-carousel-item');
        
        const updateAboutCarousel = (animate = true) => {
            aboutTrack.style.transition = animate ? 'transform 0.8s cubic-bezier(0.65, 0, 0.35, 1)' : 'none';
            aboutTrack.style.transform = `translateX(-${aboutIndex * 100}%)`;
        };
        
        // Initialize position
        updateAboutCarousel(false);
        
        const handleNext = () => {
            if (aboutIndex >= allItems.length - 1) return;
            aboutIndex++;
            updateAboutCarousel();
            
            if (aboutIndex === allItems.length - 1) {
                setTimeout(() => {
                    aboutIndex = 1;
                    updateAboutCarousel(false);
                }, 800);
            }
        };
        
        const handlePrev = () => {
            if (aboutIndex <= 0) return;
            aboutIndex--;
            updateAboutCarousel();
            
            if (aboutIndex === 0) {
                setTimeout(() => {
                    aboutIndex = allItems.length - 2;
                    updateAboutCarousel(false);
                }, 800);
            }
        };
        
        aboutNext.addEventListener('click', handleNext);
        aboutPrev.addEventListener('click', handlePrev);

        // Zoom Logic
        aboutTrack.addEventListener('click', (e) => {
            const item = e.target.closest('.about-carousel-item');
            if (item) {
                const clone = item.cloneNode(true);
                zoomContent.innerHTML = '';
                zoomContent.appendChild(clone);
                zoomModal.classList.add('active');
                document.body.style.overflow = 'hidden'; // Prevent scroll
            }
        });

        zoomClose.addEventListener('click', () => {
            zoomModal.classList.remove('active');
            document.body.style.overflow = '';
        });

        zoomModal.addEventListener('click', (e) => {
            if (e.target === zoomModal) {
                zoomModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Best Sellers Infinite Scroll Logic
    const productGrid = document.querySelector('.product-grid');
    if (productGrid) {
        const originalItems = Array.from(productGrid.children);
        if (originalItems.length > 0) {
            // Clone all items to both ends for a robust infinite scroll
            const endClones = originalItems.map(item => {
                const clone = item.cloneNode(true);
                clone.classList.add('clone');
                return clone;
            });
            const startClones = originalItems.map(item => {
                const clone = item.cloneNode(true);
                clone.classList.add('clone');
                return clone;
            });
            
            endClones.forEach(clone => productGrid.appendChild(clone));
            startClones.reverse().forEach(clone => productGrid.insertBefore(clone, productGrid.firstChild));
            
            let isJumpingProduct = false;
            let autoScrollInterval;
            
            // Structure is now: [StartClones] [Original] [EndClones]
            // We want to stay in the [Original] section
            const originalSetSize = originalItems.length;
            
            const startAutoScroll = () => {
                stopAutoScroll();
                autoScrollInterval = setInterval(() => {
                    if (window.innerWidth <= 1024 && !isJumpingProduct) {
                        const width = productGrid.offsetWidth;
                        const scrollLeft = productGrid.scrollLeft;
                        const nextScroll = scrollLeft + width;
                        
                        productGrid.scrollTo({
                            left: nextScroll,
                            behavior: 'smooth'
                        });
                    }
                }, 4000); // Scroll every 4 seconds
            };

            const stopAutoScroll = () => {
                if (autoScrollInterval) clearInterval(autoScrollInterval);
            };

            const updateProductScroll = () => {
                if (window.innerWidth <= 1024) {
                    const scrollLeft = productGrid.scrollLeft;
                    const items = Array.from(productGrid.children);
                    
                    if (isJumpingProduct) return;

                    // Calculate thresholds
                    // If we scroll into the first clone set or the last clone set, jump back to original
                    const startThreshold = items[originalSetSize].offsetLeft - 50;
                    const endThreshold = items[originalSetSize * 2].offsetLeft - 50;

                    if (scrollLeft < startThreshold) {
                        isJumpingProduct = true;
                        // Jump forward by one entire set width
                        productGrid.scrollLeft += items[originalSetSize].offsetLeft - items[0].offsetLeft;
                        setTimeout(() => { isJumpingProduct = false; }, 50);
                    } else if (scrollLeft > endThreshold) {
                        isJumpingProduct = true;
                        // Jump backward by one entire set width
                        productGrid.scrollLeft -= items[originalSetSize].offsetLeft - items[0].offsetLeft;
                        setTimeout(() => { isJumpingProduct = false; }, 50);
                    }
                }
            };

            productGrid.addEventListener('scroll', updateProductScroll);
            
            // Pause auto-scroll on interaction
            productGrid.addEventListener('touchstart', stopAutoScroll);
            productGrid.addEventListener('touchend', startAutoScroll);

            let lastIsMobile = window.innerWidth <= 1024;
            const setInitialPosition = () => {
                const isMobile = window.innerWidth <= 1024;
                
                if (isMobile) {
                    const items = productGrid.children;
                    if (items.length >= originalSetSize * 2) {
                        // Only set initial position if we were not already in mobile or if position is way off
                        if (!lastIsMobile || Math.abs(productGrid.scrollLeft - items[originalSetSize].offsetLeft) > 100) {
                            productGrid.scrollLeft = items[originalSetSize].offsetLeft;
                        }
                        startAutoScroll();
                    }
                } else {
                    stopAutoScroll();
                    productGrid.scrollLeft = 0;
                }
                lastIsMobile = isMobile;
            };

            window.addEventListener('load', setInitialPosition);
            window.addEventListener('resize', setInitialPosition);
            // Also call it immediately if already loaded
            if (document.readyState === 'complete') setInitialPosition();
        }
    }

    // Scroll Reveal Intersection Observer
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-visible');
                // Optional: stop observing once revealed
                // revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15, // Trigger when 15% of element is visible
        rootMargin: '0px 0px -50px 0px' // Offset trigger point slightly
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // Mobile Menu Logic
    const menuToggle = document.getElementById('menu-toggle');
    const menuClose = document.getElementById('menu-close');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuOverlay = document.getElementById('mobile-menu-overlay');
    const mobileLinks = document.querySelectorAll('.mobile-nav-links a');

    function toggleMenu() {
        mobileMenu.classList.toggle('active');
        menuOverlay.classList.toggle('active');
        document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    }

    if (menuToggle && menuClose && mobileMenu && menuOverlay) {
        menuToggle.addEventListener('click', toggleMenu);
        menuClose.addEventListener('click', toggleMenu);
        menuOverlay.addEventListener('click', toggleMenu);

        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                toggleMenu();
            });
        });
    }
});
