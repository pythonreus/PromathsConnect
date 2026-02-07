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
    
    // DOM Elements for form handling
    const tutorModulesSection = document.getElementById('tutorModulesSection');
    const positionRadios = document.querySelectorAll('input[name="position"]');
    const tutorModulesInput = document.getElementById('tutorModules');
    
    // Show/hide tutor modules section based on position
    positionRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'Tutor' || this.value === 'Both') {
                tutorModulesSection.classList.remove('hidden');
                tutorModulesInput.required = true;
            } else {
                tutorModulesSection.classList.add('hidden');
                tutorModulesInput.required = false;
            }
        });
    });
    
    // Updated form submission handler
    mentorForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Collect form data
        const formData = {
            fullName: document.getElementById('fullName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phoneNumber: document.getElementById('phoneNumber').value.trim(),
            yearOfStudy: document.getElementById('yearOfStudy').value,
            faculty: document.getElementById('faculty').value.trim(),
            position: document.querySelector('input[name="position"]:checked')?.value,
            motivation: document.getElementById('motivation').value.trim(),
            impactIdeas: document.getElementById('impactIdeas').value.trim() || '',
            tutorModules: []
        };
        
        // Process tutor modules from comma-separated string
        if (formData.position === 'Tutor' || formData.position === 'Both') {
            const modulesText = tutorModulesInput.value.trim();
            if (modulesText) {
                // Split by comma, trim whitespace, filter out empty strings
                formData.tutorModules = modulesText
                    .split(',')
                    .map(module => module.trim())
                    .filter(module => module.length > 0);
            }
        }
        
        // Validate required fields
        if (!validateForm(formData)) {
            return;
        }
        
        // Validate tutor modules if position requires it
        if ((formData.position === 'Tutor' || formData.position === 'Both') && formData.tutorModules.length === 0) {
            showNotification('error', 'Please enter at least one subject/module you can tutor');
            tutorModulesInput.focus();
            return;
        }
        
        // Get submit button and save original state
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalHTML = submitBtn.innerHTML;
        const originalClasses = submitBtn.className;
        
        // Show loading state
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-3"></i>Submitting...';
        submitBtn.disabled = true;
        
        try {
            // Make API request
            const response = await fetch('/api/applications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // Show success animation
                submitBtn.innerHTML = '<i class="fas fa-check mr-3"></i>Submitted!';
                submitBtn.className = originalClasses.replace('from-violet to-sky', 'from-mint to-green-400');
                
                // Show success notification
                showNotification('success', result.message || 'Application submitted successfully!');
                
                // Reset form after 2 seconds
                setTimeout(() => {
                    applicationForm.style.animation = 'slideRight 0.5s ease-out reverse';
                    setTimeout(() => {
                        applicationForm.classList.add('hidden');
                        mentorForm.reset();
                        tutorModulesSection.classList.add('hidden');
                        tutorModulesInput.required = false;
                        
                        // Reset button to original state
                        submitBtn.innerHTML = originalHTML;
                        submitBtn.disabled = false;
                        submitBtn.className = originalClasses;
                        
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 400);
                }, 2000);
            } else {
                // Show error state
                submitBtn.innerHTML = '<i class="fas fa-exclamation-circle mr-3"></i>Error!';
                submitBtn.className = originalClasses.replace('from-violet to-sky', 'from-coral to-red-400');
                
                // Show error notification
                showNotification('error', result.message || 'Failed to submit application');
                
                // Reset button after 3 seconds
                setTimeout(() => {
                    submitBtn.innerHTML = originalHTML;
                    submitBtn.disabled = false;
                    submitBtn.className = originalClasses;
                }, 3000);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            
            // Show error state
            submitBtn.innerHTML = '<i class="fas fa-exclamation-circle mr-3"></i>Network Error!';
            submitBtn.className = originalClasses.replace('from-violet to-sky', 'from-coral to-red-400');
            
            // Show error notification
            showNotification('error', 'Network error. Please check your connection and try again.');
            
            // Reset button after 3 seconds
            setTimeout(() => {
                submitBtn.innerHTML = originalHTML;
                submitBtn.disabled = false;
                submitBtn.className = originalClasses;
            }, 3000);
        }
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
                videoObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    videoObserver.observe(document.getElementById('video'));
    
    // Helper functions
    function validateForm(data) {
        // Check required fields
        if (!data.fullName || !data.email || !data.phoneNumber || !data.yearOfStudy || 
            !data.faculty || !data.position || !data.motivation) {
            showNotification('error', 'Please fill in all required fields');
            return false;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            showNotification('error', 'Please enter a valid email address');
            return false;
        }
        
        return true;
    }
    
    function showNotification(type, message) {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification fixed top-6 right-6 px-6 py-4 rounded-xl shadow-2xl z-50 animate-slide-up flex items-center space-x-3`;
        
        if (type === 'success') {
            notification.className += ' bg-gradient-to-r from-mint to-green-400 text-white';
            notification.innerHTML = `
                <i class="fas fa-check-circle text-xl"></i>
                <div>
                    <div class="font-bold">Success!</div>
                    <div class="text-sm opacity-90">${message}</div>
                </div>
            `;
        } else {
            notification.className += ' bg-gradient-to-r from-coral to-red-400 text-white';
            notification.innerHTML = `
                <i class="fas fa-exclamation-circle text-xl"></i>
                <div>
                    <div class="font-bold">Error!</div>
                    <div class="text-sm opacity-90">${message}</div>
                </div>
            `;
        }
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.5s ease-out reverse';
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }
    
    // Optional: Add real-time validation for tutor modules input
    tutorModulesInput.addEventListener('input', function() {
        const modulesText = this.value.trim();
        const modulesCount = modulesText ? modulesText.split(',').filter(m => m.trim()).length : 0;
        
        // Update character count if you want to show it
        const counter = document.getElementById('modulesCounter');
        if (!counter) {
            const counterDiv = document.createElement('div');
            counterDiv.id = 'modulesCounter';
            counterDiv.className = 'absolute bottom-3 left-3 text-white/40 text-xs';
            counterDiv.innerHTML = `${modulesCount} module${modulesCount !== 1 ? 's' : ''}`;
            this.parentNode.appendChild(counterDiv);
        } else {
            counter.innerHTML = `${modulesCount} module${modulesCount !== 1 ? 's' : ''}`;
        }
    });
});