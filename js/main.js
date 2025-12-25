// ========== ORBIT POWER MAIN WEBSITE FUNCTIONALITY ==========
// Handles dynamic content loading, sliders, and page interactions

// ========== PAGE INITIALIZATION ==========

// Main site JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all sections
    initializeSections();
    initializeNavigation();
    initializeFormHandler();
});

// ========== CONTENT LOADING ==========

// Initialize all content sections
function initializeSections() {
    const sections = [
        { id: 'services', loader: loadServices },
        { id: 'gallery', loader: loadGallery },
        { id: 'about', loader: loadAboutSection },
        { id: 'clients', loader: loadClientsFront },
        { id: 'certificates', loader: loadCertificatesFront },
        { id: 'testimonials', loader: loadTestimonialsFront }
    ];

    sections.forEach(({ id, loader }) => {
        if (document.getElementById(id)) loader();
    });

    // Load team if team grid exists
    if (document.querySelector('.team-grid')) loadTeamFront();

    // Load jobs if on careers page
    if (document.getElementById('careers') || window.location.pathname.includes('careers')) {
        loadJobs();
    }
}

/**
 * Generic data loader that renders items using a template function
 * Reduces code duplication for similar loading patterns
 * @param {string} dataFile - Path to data file or API endpoint
 * @param {string} containerId - CSS selector for container
 * @param {Function} templateFn - Function that takes item and returns HTML string
 * @param {Function} onLoadFn - Optional callback after loading
 */
function loadAndRender(dataFile, containerId, templateFn, onLoadFn = null) {
    loadData(dataFile)
        .then(data => {
            const container = document.querySelector(containerId);
            if (!container) return;

            const dataKey = Object.keys(data)[0];
            const items = data[dataKey] || [];
            container.innerHTML = items.map(templateFn).join('');
            
            if (onLoadFn) onLoadFn();
        })
        .catch(error => console.error(`Error loading data from ${dataFile}:`, error));
}

// ========== SERVICE LOADING ==========

// Load services
function loadServices() {
    const templateFn = (service) => `
        <div class="service-card">
            <div class="service-image">
                <img src="${service.image}" alt="${service.title}">
            </div>
            <div class="service-content">
                <h3>${service.title}</h3>
                <p>${service.description}</p>
            </div>
        </div>`;
    
    loadAndRender('./data/services.json', '.services-slider', templateFn, initializeSlider);
}

// Load gallery
function loadGallery() {
    const templateFn = (item) => `
        <div class="gallery-item">
            <img src="${item.image}" alt="${item.title}">
            <div class="overlay">
                <h4>${item.title}</h4>
                <p>${item.description}</p>
            </div>
        </div>`;
    
    loadAndRender('./data/gallery.json', '.gallery-slider', templateFn, () => initializeSlider('.gallery', '.gallery-slider'));
}

// Load jobs
function loadJobs() {
    loadData('./data/jobs.json')
        .then(data => {
            const container = document.querySelector('.openings-container');
            if (!container) return;

            container.innerHTML = '';

            data.jobs.forEach(job => {
                const jobCard = document.createElement('div');
                jobCard.className = 'job-card';
                jobCard.innerHTML = `
                    <div class="job-card-content">
                        <div class="job-card-header">
                            <h3 class="job-title">${job.title}</h3>
                            <div class="job-tags">
                                <span class="job-location"><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                                <span class="job-type">${job.type}</span>
                                <span class="job-salary">${job.salary}</span>
                            </div>
                        </div>

                        <div class="job-card-body">
                            <p class="job-description">${job.description}</p>

                            <div class="job-details">
                                ${(job.responsibilities && job.responsibilities.length > 0) ? `
                                <div class="job-section">
                                    <h4><i class="fas fa-briefcase"></i> Key Responsibilities</h4>
                                    <ul>
                                        ${job.responsibilities.map(resp => `<li><i class="fas fa-check-circle"></i> ${resp}</li>`).join('')}
                                    </ul>
                                </div>
                                ` : ''}

                                ${(job.requirements && job.requirements.length > 0) ? `
                                <div class="job-section">
                                    <h4><i class="fas fa-clipboard-list"></i> Requirements</h4>
                                    <ul>
                                        ${job.requirements.map(req => `<li><i class="fas fa-check-circle"></i> ${req}</li>`).join('')}
                                    </ul>
                                </div>
                                ` : ''}
                            </div>
                        </div>

                        <div class="job-card-footer">
                            <a href="#application" class="btn btn-primary apply-btn">Apply Now</a>
                        </div>
                    </div>
                `;
                container.appendChild(jobCard);
            });
        })
        .catch(error => console.error('Error loading jobs:', error));
}

// ========== ABOUT & COMPANY INFORMATION ==========

// Load about section
function loadAboutSection() {
    fetch('/api/company')
        .then(resp => resp.ok ? resp.json() : Promise.reject())
        .catch(() => loadData('./data/company.json'))
        .then(data => {
            const company = data.company || data;
            updateAboutContent(company);
            if (document.querySelector('.team-grid')) loadTeamFront();
        })
        .catch(error => console.error('Error loading company info:', error));
}

// Update about section content
function updateAboutContent(company) {
    const updates = [
        { selector: '.about-overview h2', content: `About ${company.name}` },
        { selector: '.about-overview p', content: company.description },
        { selector: '.mission-text', content: company.mission }
    ];

    updates.forEach(({ selector, content }) => {
        const elem = document.querySelector(selector);
        if (elem) elem.textContent = content;
    });

    // Update stats
    const statsData = [
        { value: company.founded, label: 'Founded' },
        { value: company.employees, label: 'Team Members' },
        { value: company.projects, label: 'Projects Completed' },
        { value: company.statesCovered, label: 'States Covered' }
    ];

    document.querySelectorAll('.stat-card').forEach((card, index) => {
        if (statsData[index]) {
            const num = card.querySelector('.stat-number');
            const label = card.querySelector('.stat-label');
            if (num) num.textContent = statsData[index].value;
            if (label) label.textContent = statsData[index].label;
        }
    });
}

// ========== TEAM, CLIENTS, CERTIFICATES, TESTIMONIALS ==========

// Load clients for public site
function loadClientsFront() {
    fetch('/api/clients')
        .then(resp => resp.ok ? resp.json() : Promise.reject())
        .catch(() => loadData('./data/clients.json'))
        .then(data => {
            const clients = data.clients || [];
            const grid = document.querySelector('.clients-grid');
            if (!grid) return;

            grid.innerHTML = clients.map(c => {
                const tag = c.link ? 'a' : 'div';
                const attrs = c.link ? `href="${c.link}" target="_blank" rel="noopener noreferrer"` : '';
                const content = c.image 
                    ? `<img src="${c.image}" alt="${c.title || c.name || 'Client logo'}">` 
                    : '<i class="fas fa-industry fa-2x"></i>';
                return `<${tag} ${attrs} class="client-logo">${content}</${tag}>`;
            }).join('');
        })
        .catch(err => console.error('Error loading clients:', err));
}

// Load team for public site
function loadTeamFront() {
    fetch('/api/team')
        .then(resp => resp.ok ? resp.json() : Promise.reject())
        .catch(() => loadData('./data/team.json'))
        .then(data => updateTeamMembers(data.team || []))
        .catch(err => console.error('Error loading team:', err));
}

// Update team members display
function updateTeamMembers(team) {
    const teamGrid = document.querySelector('.team-grid');
    if (!teamGrid) return;

    const teamHeading = document.querySelector('.team-section h3');
    if (teamHeading) teamHeading.textContent = 'Our Leadership Team';

    teamGrid.innerHTML = team.map(person => {
        const avatar = person.image 
            ? `<div class="avatar"><img src="${person.image}" alt="${person.name || ''}"/></div>`
            : `<div class="avatar"><span class="avatar-text">${(person.name || '').split(' ').map(n => n[0]).join('')}</span></div>`;

        const expertise = Array.isArray(person.expertise) && person.expertise.length
            ? `<div class="expertise-tags">${person.expertise.map(skill => `<span class="expertise-tag">${skill}</span>`).join('')}</div>`
            : '';

        return `
            <div class="team-member">
                ${avatar}
                <h4 class="member-name">${person.name || person.title || ''}</h4>
                <p class="member-position">${person.role || person.position || ''}</p>
                <p class="member-bio">${person.bio || ''}</p>
                ${expertise}
            </div>
        `;
    }).join('');
}

// Load certificates for public site
function loadCertificatesFront() {
    fetch('/api/certificates')
        .then(resp => resp.ok ? resp.json() : Promise.reject())
        .catch(() => loadData('./data/certificates.json'))
        .then(data => updateCertificatesGrid(data.certificates || []))
        .catch(err => console.error('Error loading certificates:', err));
}

// Update certificates grid with consistent templating
function updateCertificatesGrid(certificates) {
    const grid = document.getElementById('certificates-grid');
    if (!grid) return;

    grid.innerHTML = certificates.map(cert => {
        const isPdf = cert.image && cert.image.toLowerCase().endsWith('.pdf');
        const pdfClass = isPdf ? ' pdf' : '';
        const imageSrc = isPdf 
            ? '/images/icons/pdf-icon.svg' 
            : (cert.image || '/images/icons/document-icon.svg');
        
        return `
            <div class="certificate-card${pdfClass}">
                <h4 class="certificate-title">${cert.title || 'Certificate'}</h4>
                <div class="certificate-image-container">
                    <img src="${imageSrc}" alt="${cert.title || 'Certificate'}" class="certificate-image" />
                </div>
            </div>
        `;
    }).join('');
}

// Load testimonials for public site
function loadTestimonialsFront() {
    fetch('/api/testimonials')
        .then(resp => resp.ok ? resp.json() : Promise.reject())
        .catch(() => loadData('./data/testimonials.json'))
        .then(data => updateTestimonialsGrid(data.testimonials || []))
        .catch(err => console.error('Error loading testimonials:', err));
}

// Update testimonials grid with consistent templating
function updateTestimonialsGrid(testimonials) {
    const grid = document.getElementById('testimonials-grid');
    if (!grid) return;

    grid.innerHTML = testimonials.map(testimonial => `
        <div class="testimonial-card">
            <div class="rating">
                ${generateStars(testimonial.rating || 5)}
            </div>
            <div class="testimonial-image-container">
                <img src="${testimonial.image || '/images/testimonials/default-testimonial.jpg'}" 
                     alt="${testimonial.clientName || 'Client'}" 
                     class="testimonial-image" />
            </div>
            <h4>${testimonial.clientName || 'Client Name'}</h4>
            <p class="client-position">${testimonial.position || testimonial.company || 'Client'}</p>
        </div>
    `).join('');
}

// ========== SLIDER FUNCTIONALITY ==========

// Generic slider initialization - supports any slider with .prev-btn and .next-btn
function initializeSlider(sectionClass = '.services', sliderId = '.services-slider') {
    const section = document.querySelector(sectionClass);
    if (!section) return;
    
    const prevBtn = section.querySelector('.prev-btn');
    const nextBtn = section.querySelector('.next-btn');
    const slider = section.querySelector(sliderId);
    
    if (!prevBtn || !nextBtn || !slider) return;
    
    prevBtn.onclick = () => slider.scrollBy({ left: -320, behavior: 'smooth' });
    nextBtn.onclick = () => slider.scrollBy({ left: 320, behavior: 'smooth' });
}

// Legacy function aliases for backward compatibility
function initializeGallerySlider() {
    initializeSlider('.gallery', '.gallery-slider');
}

// Initialize navigation
function initializeNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navbar = document.querySelector('.navbar');
    
    // Mobile menu toggle
    if (hamburger && navMenu) {
        hamburger.onclick = () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        };
        
        // Close mobile menu on link click
        document.querySelectorAll('.nav-link').forEach(link => {
            link.onclick = () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            };
        });
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.onclick = function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        };
    });
    
    // Navbar scroll effect
    if (navbar) {
        window.addEventListener('scroll', debounce(() => {
            if (window.scrollY > 100) {
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                navbar.style.backdropFilter = 'blur(10px)';
            } else {
                navbar.style.background = 'var(--white-overlay-2)';
            }
        }, 100));
    }
}

// Initialize form handler
function initializeFormHandler() {
    const form = document.getElementById('enquiry-form');
    if (!form) return;
    
    form.onsubmit = function(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            message: document.getElementById('message').value
        };
        
        // Validate all fields are filled
        if (!Object.values(formData).every(val => val.trim())) {
            alert('Please fill in all required fields.');
            return;
        }
        
        // Show success message
        const messageDiv = document.getElementById('form-submitted-message');
        if (messageDiv) {
            messageDiv.textContent = "Thanks — we'll contact you shortly.";
        }
        
        form.reset();
        
        // Clear message after 4 seconds
        setTimeout(() => {
            if (messageDiv) messageDiv.textContent = "";
        }, 4000);
    };
}