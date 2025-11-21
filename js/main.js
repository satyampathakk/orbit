// Main site JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Load services if on main page
    if (document.getElementById('services')) {
        loadServices();
    }
    
    // Load gallery if on main page
    if (document.getElementById('gallery')) {
        loadGallery();
    }
    
    // Load about section if on main page
    if (document.getElementById('about')) {
        loadAboutSection();
    }
    // Load clients and team from API if present on the page
    if (document.getElementById('clients')) {
        loadClientsFront();
    }
    if (document.querySelector('.team-grid')) {
        loadTeamFront();
    }
    
    // Load jobs if on careers page
    if (document.getElementById('careers') || window.location.pathname.includes('careers')) {
        loadJobs();
    }
    
    // Initialize existing functionality
    initializeNavigation();
    initializeFormHandler();
});

function loadServices() {
    // Attempt to load data with fetch, fallback to XMLHttpRequest for local file access
    loadData('./data/services.json')
        .then(data => {
            const container = document.querySelector('.services-slider');
            if (!container) return;

            container.innerHTML = '';

            data.services.forEach(service => {
                const serviceCard = document.createElement('div');
                serviceCard.className = 'service-card';
                serviceCard.innerHTML = `
                    <div class="service-image">
                        <img src="${service.image}" alt="${service.title}">
                    </div>
                    <div class="service-content">
                        <h3>${service.title}</h3>
                        <p>${service.description}</p>
                    </div>
                `;
                container.appendChild(serviceCard);
            });

            // Reinitialize slider functionality if it exists
            initializeSlider();
        })
        .catch(error => console.error('Error loading services:', error));
}

function loadData(url) {
    return new Promise((resolve, reject) => {
        try {
            // Use fetch API if available
            if (window.fetch) {
                fetch(url)
                    .then(response => {
                        if (response.ok) {
                            return response.json();
                        } else {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                    })
                    .then(data => resolve(data))
                    .catch(err => {
                        // If fetch fails (e.g. CORS when accessing file:// directly), handle gracefully
                        console.warn(`Fetch failed for ${url}:`, err.message);
                        // Fallback to embedded demo data for local file access
                        resolve(getDemoData(url));
                    });
            } else {
                // Fallback for older browsers (if needed)
                // For this implementation, we'll rely on the demo data fallback
                resolve(getDemoData(url));
            }
        } catch (error) {
            console.warn(`Load error for ${url}:`, error.message);
            // If network request fails completely, use demo data
            resolve(getDemoData(url));
        }
    });
}

// Function to provide demo data when JSON files can't be loaded
function getDemoData(url) {
    if (url.includes('services.json')) {
        return {
            "services": []
        };
    } else if (url.includes('gallery.json')) {
        return {
            "gallery": []
        };
    } else if (url.includes('jobs.json')) {
        return {
            "jobs": []
        };
    } else if (url.includes('company.json')) {
        return {
            "company": {
                "name": "Orbit Power",
                "description": "",
                "founded": "",
                "employees": "",
                "projects": "",
                "statesCovered": "",
                "clientRetention": "",
                "license": "",
                "location": "",
                "mission": "",
                "values": [],
                "contact": {
                    "address": "",
                    "phone": "",
                    "email": ""
                }
            },
            "team": []
        };
    }

    // Return empty object if URL doesn't match known files
    return {};
}

function loadGallery() {
    loadData('./data/gallery.json')
        .then(data => {
            const container = document.querySelector('.gallery-slider');
            if (!container) return;

            container.innerHTML = '';

            data.gallery.forEach(item => {
                const galleryItem = document.createElement('div');
                galleryItem.className = 'gallery-item';
                galleryItem.innerHTML = `
                    <img src="${item.image}" alt="${item.title}">
                    <div class="overlay">
                        <h4>${item.title}</h4>
                        <p>${item.description}</p>
                    </div>
                `;
                container.appendChild(galleryItem);
            });

            // Reinitialize gallery slider functionality
            initializeGallerySlider();
        })
        .catch(error => console.error('Error loading gallery:', error));
}

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
                    <div class="job-header">
                        <h3 class="job-title">${job.title}</h3>
                        <div class="job-meta">
                            <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                            <span><i class="fas fa-briefcase"></i> ${job.type}</span>
                            <span><i class="fas fa-coins"></i> ${job.salary}</span>
                        </div>
                    </div>
                    <div class="job-description">
                        <p>${job.description}</p>
                    </div>
                    <div class="job-requirements">
                        <h4>Key Responsibilities:</h4>
                        <ul>
                            ${ (job.responsibilities || []).map(resp => `<li><i class="fas fa-check"></i> ${resp}</li>`).join('') }
                        </ul>

                        <h4>Requirements:</h4>
                        <ul>
                            ${ (job.requirements || []).map(req => `<li><i class="fas fa-check"></i> ${req}</li>`).join('') }
                        </ul>
                    </div>
                `;
                container.appendChild(jobCard);
            });
        })
        .catch(error => console.error('Error loading jobs:', error));
}

function loadAboutSection() {
    // Prefer API endpoint for up-to-date company info
    fetch('/api/company')
        .then(resp => {
            if (!resp.ok) throw new Error('Network response not ok');
            return resp.json();
        })
        .catch(() => loadData('./data/company.json'))
        .then(data => {
            // Update company overview
            const company = data.company || data;
            const header = document.querySelector('.about-overview h2');
            if (header) header.textContent = `About ${company.name}`;

            const desc = document.querySelector('.about-overview p');
            if (desc) desc.textContent = company.description;

            // Update stats
            const stats = document.querySelectorAll('.stat-card');
            if (stats[0]) {
                const num = stats[0].querySelector('.stat-number');
                if (num) num.textContent = company.founded;
                // Also update the label if it exists
                const label = stats[0].querySelector('.stat-label');
                if (label) label.textContent = 'Founded';
            }
            if (stats[1]) {
                const num = stats[1].querySelector('.stat-number');
                if (num) num.textContent = company.employees;
                const label = stats[1].querySelector('.stat-label');
                if (label) label.textContent = 'Team Members';
            }
            if (stats[2]) {
                const num = stats[2].querySelector('.stat-number');
                if (num) num.textContent = company.projects;
                const label = stats[2].querySelector('.stat-label');
                if (label) label.textContent = 'Projects Completed';
            }

            // Update mission
            const mission = document.querySelector('.mission-section p');
            if (mission) mission.textContent = company.mission;

            // Update team members if the team section exists. Prefer separate team API.
            if (document.querySelector('.team-grid')) loadTeamFront();
        })
        .catch(error => console.error('Error loading company info:', error));
}

// Load clients for the public site
function loadClientsFront() {
    // Try API first, fallback to data file
    fetch('/api/clients')
        .then(resp => {
            if (!resp.ok) throw new Error('Network response not ok');
            return resp.json();
        })
        .catch(() => loadData('./data/clients.json'))
        .then(data => {
            const clients = data.clients || [];
            const grid = document.querySelector('.clients-grid');
            if (!grid) return;

            grid.innerHTML = '';

            clients.forEach(c => {
                const el = document.createElement('div');
                el.className = 'client-logo';
                el.innerHTML = `
                    ${c.image ? `<img src="${c.image}" alt="${c.title || c.name}" />` : '<i class="fas fa-industry fa-3x"></i>'}
                    <p>${c.title || c.name || ''}</p>
                `;
                // If a link exists, wrap image/text in anchor
                if (c.link) {
                    const a = document.createElement('a');
                    a.href = c.link;
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                    a.appendChild(el.cloneNode(true));
                    grid.appendChild(a);
                } else {
                    grid.appendChild(el);
                }
            });
        })
        .catch(err => console.error('Error loading clients front:', err));
}

// Load team for the public site
function loadTeamFront() {
    fetch('/api/team')
        .then(resp => {
            if (!resp.ok) throw new Error('Network response not ok');
            return resp.json();
        })
        .catch(() => loadData('./data/team.json'))
        .then(data => {
            const team = data.team || data || [];
            updateTeamMembers(team);
        })
        .catch(err => console.error('Error loading team front:', err));
}

function updateTeamMembers(team) {
    const teamGrid = document.querySelector('.team-grid');
    if (!teamGrid) return;

    // Update the heading text to be more professional
    const teamHeading = document.querySelector('.team-section h3');
    if (teamHeading) {
        teamHeading.textContent = 'Our Leadership Team';
    }

    teamGrid.innerHTML = '';

    team.forEach(person => {
        const memberCard = document.createElement('div');
        memberCard.className = 'team-member';

        // avatar: use image if available, otherwise initials
        const avatarHtml = person.image ?
            `<div class="avatar"><img src="${person.image}" alt="${person.name || ''}"/></div>` :
            `<div class="avatar"><span class="avatar-text">${(person.name || '').split(' ').map(n => n[0]).join('')}</span></div>`;

        memberCard.innerHTML = `
            ${avatarHtml}

            <h4 class="member-name">${person.name || person.title || ''}</h4>

            <p class="member-position">${person.role || person.position || ''}</p>

            <p class="member-bio">
                ${person.bio || ''}
            </p>

        `;

        // If expertise exists (array), add tags
        if (Array.isArray(person.expertise) && person.expertise.length) {
            const tags = document.createElement('div');
            tags.className = 'expertise-tags';
            tags.innerHTML = person.expertise.map(skill => `<span class="expertise-tag">${skill}</span>`).join('');
            memberCard.appendChild(tags);
        }

        teamGrid.appendChild(memberCard);
    });
}

function initializeSlider() {
    const prevBtn = document.querySelector('.services .prev-btn');
    const nextBtn = document.querySelector('.services .next-btn');
    const servicesSlider = document.querySelector('.services-slider');
    
    if (prevBtn && nextBtn && servicesSlider) {
        prevBtn.addEventListener('click', () => {
            servicesSlider.scrollBy({ left: -320, behavior: 'smooth' });
        });
        
        nextBtn.addEventListener('click', () => {
            servicesSlider.scrollBy({ left: 320, behavior: 'smooth' });
        });
    }
}

function initializeGallerySlider() {
    const galleryPrevBtn = document.querySelector('.gallery .prev-btn');
    const galleryNextBtn = document.querySelector('.gallery .next-btn');
    const gallerySlider = document.querySelector('.gallery-slider');
    
    if (galleryPrevBtn && galleryNextBtn && gallerySlider) {
        galleryPrevBtn.addEventListener('click', () => {
            gallerySlider.scrollBy({ left: -320, behavior: 'smooth' });
        });
        
        galleryNextBtn.addEventListener('click', () => {
            gallerySlider.scrollBy({ left: 320, behavior: 'smooth' });
        });
    }
}

function initializeNavigation() {
    // Mobile Navigation Toggle
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Add scroll effect to navbar
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (navbar && window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
        } else if (navbar) {
            navbar.style.background = 'var(--white-overlay-2)';
        }
    });
}

function initializeFormHandler() {
    // Form submission handling
    const form = document.getElementById('enquiry-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const message = document.getElementById('message').value;
            
            // Basic validation
            if (name && email && phone && message) {
                // Show success message
                const messageDiv = document.getElementById('form-submitted-message');
                if (messageDiv) {
                    messageDiv.textContent = "Thanks — we'll contact you shortly.";
                }
                
                // Reset form
                form.reset();
                
                // Optional: clear success message after 4 seconds
                setTimeout(() => {
                    if (messageDiv) {
                        messageDiv.textContent = "";
                    }
                }, 4000);
            } else {
                alert('Please fill in all required fields.');
            }
        });
    }
}