    
        document.addEventListener('DOMContentLoaded', function() {
            const applyBtns = document.querySelectorAll('#applyBtn, #applyBtn2');
            const applicationForm = document.getElementById('applicationForm');
            const cancelBtn = document.getElementById('cancelBtn');
            const mentorForm = document.getElementById('mentorForm');
            const youtubeVideo = document.getElementById('youtubeVideo');
            
            // Smooth scrolling for navigation links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('href');
                    if(targetId === '#') return;
                    
                    const targetElement = document.querySelector(targetId);
                    if(targetElement) {
                        window.scrollTo({
                            top: targetElement.offsetTop - 80,
                            behavior: 'smooth'
                        });
                    }
                });
            });
            
            // Animate elements on scroll
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.animationDelay = entry.target.dataset.delay || '0ms';
                        entry.target.style.opacity = '1';
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);
            
            document.querySelectorAll('.stagger-animate > *').forEach((el, index) => {
                el.dataset.delay = `${index * 150}ms`;
                observer.observe(el);
            });
            
            // Form handling
            applyBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    applicationForm.classList.remove('hidden');
                    applicationForm.style.animation = 'slideUp 0.7s ease-out';
                    setTimeout(() => {
                        applicationForm.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                });
            });
            
            cancelBtn.addEventListener('click', function() {
                applicationForm.style.animation = 'slideRight 0.5s ease-out reverse';
                setTimeout(() => {
                    applicationForm.classList.add('hidden');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 400);
            });
            
            mentorForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Show success animation
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalHTML = submitBtn.innerHTML;
                
                submitBtn.innerHTML = '<i class="fas fa-check mr-3"></i>Submitted!';
                submitBtn.classList.add('bg-gradient-to-r', 'from-mint', 'to-green-400');
                submitBtn.classList.remove('from-violet', 'to-sky');
                
                // Reset after 3 seconds
                setTimeout(() => {
                    applicationForm.style.animation = 'slideRight 0.5s ease-out reverse';
                    setTimeout(() => {
                        applicationForm.classList.add('hidden');
                        mentorForm.reset();
                        submitBtn.innerHTML = originalHTML;
                        submitBtn.classList.remove('from-mint', 'to-green-400');
                        submitBtn.classList.add('from-violet', 'to-sky');
                        
                        // Show success notification
                        const success = document.createElement('div');
                        success.className = 'fixed top-6 right-6 bg-gradient-to-r from-mint to-green-400 text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-slide-up';
                        success.innerHTML = `
                            <div class="flex items-center space-x-3">
                                <i class="fas fa-check-circle text-xl"></i>
                                <div>
                                    <div class="font-bold">Application Submitted!</div>
                                    <div class="text-sm opacity-90">We'll contact you soon.</div>
                                </div>
                            </div>
                        `;
                        document.body.appendChild(success);
                        
                        setTimeout(() => {
                            success.style.animation = 'slideUp 0.5s ease-out reverse';
                            setTimeout(() => success.remove(), 500);
                        }, 3000);
                    }, 400);
                }, 1500);
            });
            
            // Add hover effects to cards
            document.querySelectorAll('.card-hover-effect').forEach(card => {
                card.addEventListener('mouseenter', () => {
                    card.style.animation = 'cardHover 0.3s ease-out forwards';
                });
                
                card.addEventListener('mouseleave', () => {
                    card.style.animation = 'cardUnhover 0.3s ease-out forwards';
                });
            });
            
            // Video lazy loading
            const videoObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Video is now visible, you could load it here if needed
                        // For now, it's already embedded
                        videoObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            
            videoObserver.observe(document.getElementById('video'));
        });
    