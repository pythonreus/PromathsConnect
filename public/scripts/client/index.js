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
// Testimonials Data Array with different icons and colors
const testimonials = [
   
    {
        name: "Kamogelo Mosehle",
        role: "Former Tutor",
        message: "On my side the program was great at the beginning, the students attended. The shift began closer to mid year exams, and how I see it, it was because of too much school work load for both me and students, sessions didn't go as planned and sometimes students didn't show up. On the other side, some students really appreciated the sessions and help they got from me and other tutors, either through private communication or group chats.",
        color: "from-purple-500 to-pink-500",
        icon: "fa-chalkboard-teacher"
    },
    {
        name: "Karabo Monareng",
        role: "Former Mentee",
        message: "The 2025 Mentorship Program was a meaningful and enriching experience that provided guidance, support, and personal growth. It created a supportive space that positively contributed to both my academic and personal development.",
        color: "from-blue-500 to-teal-400",
        icon: "fa-user-graduate"
    },
    {
        name: "Nompumelelo Mavuso",
        role: "Former Mentor",
        message: "It was nice working with different personalities from different people. There were some difficulties with participation from other mentees and just clashing schedules but overall it was an insightful and fulfilling experience.",
        color: "from-orange-500 to-red-500",
        icon: "fa-hands-helping"
    },
    {
        name: "Karabo Morajane",
        role: "Former Mentor",
        message: "My experience as a mentor was actually amazing, my mentees felt like my younger siblings who I was helping to navigate varsity life in the same way I would have loved to be introduced to varsity life in my first year. I got to spend time with them and know beyond just being wits students.",
        color: "from-green-500 to-emerald-400",
        icon: "fa-user-friends"
    },
    {
        name: "Nomsa Vilakazi",
        role: "Former Tutor",
        message: "It was great having to help the 1st years, also helped me understand the course more. Even though only 2-3 showed up to the lessons, but I mostly did consultations.",
        color: "from-yellow-500 to-amber-500",
        icon: "fa-book-open"
    },
    {
        name: "Leshalabe Carlifonia Thakgalo",
        role: "Former Tutor",
        message: "Tutoring in 2025 was a good learning experience where I learned how to work with different kinds of people, improved my communication skill and it also taught me patience. Honestly, what I enjoyed most was getting that genuine 'thank you' after a session, knowing that I had made a difference in my tutee's learning journey.",
        color: "from-pink-500 to-rose-500",
        icon: "fa-heart"
    }
];

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Find the testimonials section
    const testimonialsSection = document.getElementById('testimonials');
    
    if (!testimonialsSection) {
        console.error('Testimonials section not found!');
        return;
    }
    
    // Find the grid container inside the testimonials section
    const gridContainer = testimonialsSection.querySelector('.grid');
    
    if (!gridContainer) {
        console.error('Grid container not found in testimonials section!');
        return;
    }
    
    // Replace the grid with a horizontal scrolling carousel
    gridContainer.outerHTML = `
        <div class="testimonials-carousel-container relative">
            <!-- All testimonials in a single row -->
            <div id="allTestimonialsRow" class="flex gap-6 pb-4 overflow-x-auto snap-x snap-mandatory scroll-smooth">
                <!-- Testimonials will be inserted here by JavaScript -->
            </div>
            
            <!-- Navigation Buttons -->
            <button id="scrollLeftBtn" class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-8 bg-gradient-to-r from-midnight/90 to-royal/90 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border border-white/20 hover:border-white/40 transition-all z-10 hover:scale-110 shadow-lg">
                <i class="fas fa-chevron-left"></i>
            </button>
            
            <button id="scrollRightBtn" class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-8 bg-gradient-to-r from-midnight/90 to-royal/90 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border border-white/20 hover:border-white/40 transition-all z-10 hover:scale-110 shadow-lg">
                <i class="fas fa-chevron-right"></i>
            </button>
            
            <!-- Scroll Indicator -->
            <div class="mt-6 text-center">
                <p class="text-white/60 text-sm">
                    <i class="fas fa-arrows-left-right mr-2"></i>Scroll horizontally to see all testimonials
                </p>
            </div>
        </div>
    `;
    
    // Add custom colors to Tailwind config
    addCustomColors();
    
    // Now create all testimonials
    createAllTestimonials();
});

// Function to add custom gradient colors
function addCustomColors() {
    const style = document.createElement('style');
    style.textContent = `
        /* Custom gradient colors for testimonials */
        .bg-gradient-purple-pink {
            background-image: linear-gradient(to bottom right, #8b5cf6, #ec4899);
        }
        
        .bg-gradient-blue-teal {
            background-image: linear-gradient(to bottom right, #3b82f6, #2dd4bf);
        }
        
        .bg-gradient-orange-red {
            background-image: linear-gradient(to bottom right, #f97316, #ef4444);
        }
        
        .bg-gradient-green-emerald {
            background-image: linear-gradient(to bottom right, #22c55e, #10b981);
        }
        
        .bg-gradient-yellow-amber {
            background-image: linear-gradient(to bottom right, #eab308, #f59e0b);
        }
        
        .bg-gradient-pink-rose {
            background-image: linear-gradient(to bottom right, #ec4899, #f43f5e);
        }
    `;
    document.head.appendChild(style);
}

function createAllTestimonials() {
    const testimonialsRow = document.getElementById('allTestimonialsRow');
    
    if (!testimonialsRow) return;
    
    // Clear any existing content
    testimonialsRow.innerHTML = '';
    
    // Create all testimonial cards
    testimonials.forEach((testimonial, index) => {
        const testimonialCard = document.createElement('div');
        testimonialCard.className = 'snap-start flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 px-2';
        
        // Convert Tailwind gradient classes to inline style
        let gradientStyle = '';
        if (testimonial.color === 'from-purple-500 to-pink-500') {
            gradientStyle = 'background-image: linear-gradient(to bottom right, #8b5cf6, #ec4899);';
        } else if (testimonial.color === 'from-blue-500 to-teal-400') {
            gradientStyle = 'background-image: linear-gradient(to bottom right, #3b82f6, #2dd4bf);';
        } else if (testimonial.color === 'from-orange-500 to-red-500') {
            gradientStyle = 'background-image: linear-gradient(to bottom right, #f97316, #ef4444);';
        } else if (testimonial.color === 'from-green-500 to-emerald-400') {
            gradientStyle = 'background-image: linear-gradient(to bottom right, #22c55e, #10b981);';
        } else if (testimonial.color === 'from-yellow-500 to-amber-500') {
            gradientStyle = 'background-image: linear-gradient(to bottom right, #eab308, #f59e0b);';
        } else if (testimonial.color === 'from-pink-500 to-rose-500') {
            gradientStyle = 'background-image: linear-gradient(to bottom right, #ec4899, #f43f5e);';
        }
        
        testimonialCard.innerHTML = `
            <div class="card-hover-effect bg-gradient-to-br from-midnight to-royal rounded-2xl p-6 sm:p-8 border border-white/10 h-full">
                <div class="flex items-center mb-4 sm:mb-6">
                    <div class="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center testimonial-icon" 
                         style="${gradientStyle}">
                        <i class="fas ${testimonial.icon} text-white text-sm sm:text-base"></i>
                    </div>
                    <div class="ml-3 sm:ml-4">
                        <h4 class="text-white font-bold text-sm sm:text-base">${testimonial.name}</h4>
                        <p class="text-white/60 text-xs sm:text-sm">${testimonial.role}</p>
                    </div>
                </div>
                <p class="text-white/60 italic text-sm sm:text-base leading-relaxed">"${testimonial.message}"</p>
            </div>
        `;
        
        // If it's a Tailwind gradient class, use that
        if (testimonial.color.includes('from-') && testimonial.color.includes('to-') && 
            !testimonial.color.includes('purple') && !testimonial.color.includes('blue') && 
            !testimonial.color.includes('orange') && !testimonial.color.includes('green') &&
            !testimonial.color.includes('yellow') && !testimonial.color.includes('pink')) {
            
            testimonialCard.querySelector('.rounded-full').className = 
                `w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br ${testimonial.color} rounded-full flex items-center justify-center testimonial-icon`;
        }
        
        testimonialsRow.appendChild(testimonialCard);
    });
    
    // Add CSS for smooth scrolling
    addCarouselStyles();
    
    // Initialize navigation
    initializeCarouselNavigation();
}

function addCarouselStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .testimonials-carousel-container {
            position: relative;
            width: 100%;
        }
        
        #allTestimonialsRow {
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1);
            padding-bottom: 20px;
            margin-bottom: -20px;
        }
        
        #allTestimonialsRow::-webkit-scrollbar {
            height: 8px;
        }
        
        #allTestimonialsRow::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
        }
        
        #allTestimonialsRow::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 10px;
        }
        
        #allTestimonialsRow::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
        }
        
        /* Responsive adjustments */
        @media (max-width: 640px) {
            #allTestimonialsRow > div {
                width: 85%;
            }
            
            #scrollLeftBtn, #scrollRightBtn {
                display: none;
            }
        }
        
        @media (min-width: 641px) and (max-width: 1024px) {
            #allTestimonialsRow > div {
                width: 48%;
            }
        }
        
        @media (min-width: 1025px) {
            #allTestimonialsRow > div {
                width: 32%;
            }
        }
        
        /* Smooth scrolling */
        .snap-x {
            scroll-snap-type: x mandatory;
        }
        
        .snap-start {
            scroll-snap-align: start;
        }
        
        .snap-mandatory {
            scroll-snap-stop: always;
        }
        
        /* Hide scroll buttons on mobile */
        @media (max-width: 640px) {
            #scrollLeftBtn, #scrollRightBtn {
                display: none;
            }
        }
        
        /* Testimonial icons */
        .testimonial-icon {
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
            transition: all 0.3s ease;
        }
        
        .testimonial-icon:hover {
            transform: scale(1.05);
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
        }
        
        /* Custom gradients for icon backgrounds */
        .bg-gradient-purple-pink {
            background-image: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
        }
        
        .bg-gradient-blue-teal {
            background-image: linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%);
        }
        
        .bg-gradient-orange-red {
            background-image: linear-gradient(135deg, #f97316 0%, #ef4444 100%);
        }
        
        .bg-gradient-green-emerald {
            background-image: linear-gradient(135deg, #22c55e 0%, #10b981 100%);
        }
        
        .bg-gradient-yellow-amber {
            background-image: linear-gradient(135deg, #eab308 0%, #f59e0b 100%);
        }
        
        .bg-gradient-pink-rose {
            background-image: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
        }
        
        /* Color-specific icon containers */
        .icon-purple-pink { background: linear-gradient(135deg, #8b5cf6, #ec4899); }
        .icon-blue-teal { background: linear-gradient(135deg, #3b82f6, #2dd4bf); }
        .icon-orange-red { background: linear-gradient(135deg, #f97316, #ef4444); }
        .icon-green-emerald { background: linear-gradient(135deg, #22c55e, #10b981); }
        .icon-yellow-amber { background: linear-gradient(135deg, #eab308, #f59e0b); }
        .icon-pink-rose { background: linear-gradient(135deg, #ec4899, #f43f5e); }
    `;
    document.head.appendChild(style);
}

function initializeCarouselNavigation() {
    const testimonialsRow = document.getElementById('allTestimonialsRow');
    const scrollLeftBtn = document.getElementById('scrollLeftBtn');
    const scrollRightBtn = document.getElementById('scrollRightBtn');
    
    if (!testimonialsRow || !scrollLeftBtn || !scrollRightBtn) return;
    
    // Calculate scroll amount (width of one card + gap)
    function getScrollAmount() {
        const cards = testimonialsRow.querySelectorAll('div');
        if (cards.length === 0) return 400;
        
        const cardWidth = cards[0].offsetWidth;
        const gap = 24; // 6 * 4px (gap-6 = 1.5rem = 24px)
        return cardWidth + gap;
    }
    
    // Scroll left
    scrollLeftBtn.addEventListener('click', () => {
        testimonialsRow.scrollBy({
            left: -getScrollAmount(),
            behavior: 'smooth'
        });
    });
    
    // Scroll right
    scrollRightBtn.addEventListener('click', () => {
        testimonialsRow.scrollBy({
            left: getScrollAmount(),
            behavior: 'smooth'
        });
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            testimonialsRow.scrollBy({
                left: -getScrollAmount(),
                behavior: 'smooth'
            });
        } else if (e.key === 'ArrowRight') {
            testimonialsRow.scrollBy({
                left: getScrollAmount(),
                behavior: 'smooth'
            });
        }
    });
    
    // Show/hide navigation buttons based on scroll position
    function updateNavButtons() {
        const scrollLeft = testimonialsRow.scrollLeft;
        const scrollWidth = testimonialsRow.scrollWidth;
        const clientWidth = testimonialsRow.clientWidth;
        
        // Show/hide left button
        if (scrollLeft <= 10) {
            scrollLeftBtn.style.opacity = '0.5';
            scrollLeftBtn.style.cursor = 'not-allowed';
        } else {
            scrollLeftBtn.style.opacity = '1';
            scrollLeftBtn.style.cursor = 'pointer';
        }
        
        // Show/hide right button
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
            scrollRightBtn.style.opacity = '0.5';
            scrollRightBtn.style.cursor = 'not-allowed';
        } else {
            scrollRightBtn.style.opacity = '1';
            scrollRightBtn.style.cursor = 'pointer';
        }
    }
    
    // Initial button state
    updateNavButtons();
    
    // Update button states on scroll
    testimonialsRow.addEventListener('scroll', updateNavButtons);
    
    // Update button states on window resize
    window.addEventListener('resize', updateNavButtons);
}
