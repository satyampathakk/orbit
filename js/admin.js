// Admin panel functionality with auth gating
document.addEventListener('DOMContentLoaded', function() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.admin-section');
    const modal = document.getElementById('content-modal');
    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.querySelector('.cancel-btn');
    const contentForm = document.getElementById('content-form');
    const imageUpload = document.getElementById('image-upload');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!ensureAuthenticated('Please log in to access the admin panel.')) return;
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(btn.dataset.section).classList.add('active');
            loadContent(btn.dataset.section);
        });
    });

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    contentForm.addEventListener('submit', handleFormSubmit);

    if (imageUpload) {
        imageUpload.addEventListener('change', function(e) {
            handleImageUpload(e.target.files[0]);
        });
    }

    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!ensureAuthenticated('Please log in to add content.')) return;
            const action = btn.dataset.action;
            switch(action) {
                case 'add-service':
                    openModal('service', null);
                    break;
                case 'add-gallery':
                    openModal('gallery', null);
                    break;
                case 'add-job':
                    openModal('job', null);
                    break;
                case 'add-client':
                    openModal('client', null);
                    break;
                case 'add-team':
                    openModal('team', null);
                    break;
                case 'add-certificate':
                    openModal('certificate', null);
                    break;
                case 'add-testimonial':
                    openModal('testimonial', null);
                    break;
            }
        });
    });

    document.getElementById('add-service-btn').addEventListener('click', () => { if (ensureAuthenticated()) openModal('service', null); });
    document.getElementById('add-gallery-btn').addEventListener('click', () => { if (ensureAuthenticated()) openModal('gallery', null); });
    document.getElementById('add-job-btn').addEventListener('click', () => { if (ensureAuthenticated()) openModal('job', null); });
    const addClientBtn = document.getElementById('add-client-btn');
    if (addClientBtn) addClientBtn.addEventListener('click', () => { if (ensureAuthenticated()) openModal('client', null); });
    const addTeamBtn = document.getElementById('add-team-btn');
    if (addTeamBtn) addTeamBtn.addEventListener('click', () => { if (ensureAuthenticated()) openModal('team', null); });
    const addCertBtn = document.getElementById('add-certificate-btn');
    if (addCertBtn) addCertBtn.addEventListener('click', () => { if (ensureAuthenticated()) openModal('certificate', null); });
    const addTestimonialBtn = document.getElementById('add-testimonial-btn');
    if (addTestimonialBtn) addTestimonialBtn.addEventListener('click', () => { if (ensureAuthenticated()) openModal('testimonial', null); });

    document.getElementById('company-form').addEventListener('submit', handleCompanyFormSubmit);
    loginForm.addEventListener('submit', handleLoginSubmit);
    logoutBtn.addEventListener('click', handleLogout);

    bootstrapAuth();
});

let currentEditing = null;
let currentContentType = null;
let currentImageFile = null;
let authToken = localStorage.getItem('authToken') || null;
let isAuthenticated = false;

function setLoginError(message = '') {
    const errorEl = document.getElementById('login-error');
    if (errorEl) errorEl.textContent = message;
}

function setAuthState(authenticated, message = '') {
    isAuthenticated = authenticated;
    const overlay = document.getElementById('login-overlay');
    const statusText = document.getElementById('auth-state-text');
    const logoutBtn = document.getElementById('logout-btn');

    document.querySelectorAll('.requires-auth').forEach(el => {
        el.classList.toggle('locked', !authenticated);
    });

    if (overlay) overlay.classList.toggle('hidden', authenticated);
    if (statusText) statusText.textContent = authenticated ? 'Authenticated' : 'Not authenticated';
    if (logoutBtn) logoutBtn.style.display = authenticated ? 'inline-flex' : 'none';

    if (!authenticated && message) {
        setLoginError(message);
    } else if (authenticated) {
        setLoginError('');
    }
}

function clearAuth() {
    authToken = null;
    localStorage.removeItem('authToken');
}

function ensureAuthenticated(message) {
    if (!isAuthenticated) {
        setAuthState(false, message || 'Please log in to continue.');
        return false;
    }
    return true;
}

function getAuthHeaders(headers = {}) {
    const merged = { ...headers };
    if (authToken) merged['Authorization'] = `Bearer ${authToken}`;
    return merged;
}

async function authorizedFetch(url, options = {}) {
    const opts = { ...options };
    opts.headers = getAuthHeaders(options.headers || {});
    const res = await fetch(url, opts);
    if (res.status === 401) {
        clearAuth();
        setAuthState(false, 'Session expired. Please log in again.');
        throw new Error('Unauthorized');
    }
    return res;
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();

    try {
        setLoginError('');
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!res.ok) {
            throw new Error('Invalid credentials');
        }

        const data = await res.json();
        authToken = data.token;
        localStorage.setItem('authToken', authToken);
        setAuthState(true);
        // Default to dashboard on login
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const dashboardBtn = document.querySelector('.nav-btn[data-section="dashboard"]');
        if (dashboardBtn) dashboardBtn.classList.add('active');
        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        const dashSection = document.getElementById('dashboard');
        if (dashSection) dashSection.classList.add('active');
        loadContent('dashboard');
    } catch (error) {
        console.error('Login failed:', error);
        setLoginError(error.message || 'Login failed. Please try again.');
    }
}

async function handleLogout(e) {
    if (e) e.preventDefault();
    try {
        if (authToken) {
            await authorizedFetch('/api/auth/logout', { method: 'POST' });
        }
    } catch (error) {
        console.error('Logout failed:', error);
    } finally {
        clearAuth();
        setAuthState(false);
    }
}

async function bootstrapAuth() {
    if (!authToken) {
        setAuthState(false);
        return;
    }

    try {
        const res = await authorizedFetch('/api/auth/status');
        if (!res.ok) throw new Error('Unauthorized');
        setAuthState(true);
        loadContent('dashboard');
    } catch (error) {
        console.error('Auth check failed:', error);
        clearAuth();
        setAuthState(false, 'Please log in to continue.');
    }
}

function loadContent(section) {
    if (!ensureAuthenticated()) return;
    switch(section) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'services':
            loadServices();
            break;
        case 'gallery':
            loadGallery();
            break;
        case 'jobs':
            loadJobs();
            break;
        case 'clients':
            loadClients();
            break;
        case 'team':
            loadTeam();
            break;
        case 'certificates':
            loadCertificates();
            break;
        case 'testimonials':
            loadTestimonials();
            break;
        case 'company':
            loadCompanyInfo();
            break;
    }
}

function loadClients() {
    fetch('/api/clients')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('clients-list');
            container.innerHTML = '';

            (data.clients || []).forEach(client => {
                const item = document.createElement('div');
                item.className = 'content-item';
                item.innerHTML = `
                    <div class="content-info">
                        <h3>${client.title || client.name}</h3>
                        <p>${client.link || ''}</p>
                    </div>
                    <div class="content-actions">
                        <button class="btn-secondary" onclick="openModal('client', ${client.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-danger" onclick="deleteClient(${client.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                `;
                container.appendChild(item);
            });
        })
        .catch(error => {
            console.error('Error loading clients:', error);
            document.getElementById('clients-list').innerHTML = '<p>Error loading clients. Check console for details.</p>';
        });
}

function loadTeam() {
    fetch('/api/team')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('team-list');
            container.innerHTML = '';

            (data.team || []).forEach(member => {
                const item = document.createElement('div');
                item.className = 'content-item';
                item.innerHTML = `
                    <div class="content-info">
                        <h3>${member.name || member.title}</h3>
                        <p>${member.role || ''}</p>
                    </div>
                    <div class="content-actions">
                        <button class="btn-secondary" onclick="openModal('team', ${member.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-danger" onclick="deleteTeamMember(${member.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                `;
                container.appendChild(item);
            });
        })
        .catch(error => {
            console.error('Error loading team members:', error);
            document.getElementById('team-list').innerHTML = '<p>Error loading team members. Check console for details.</p>';
        });
}

function loadCertificates() {
    fetch('/api/certificates')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('certificates-list');
            container.innerHTML = '';

            (data.certificates || []).forEach(cert => {
                const item = document.createElement('div');
                item.className = 'content-item';
                item.innerHTML = `
                    <div class="content-info">
                        <h3>${cert.title || 'Untitled Certificate'}</h3>
                        <p>${cert.description || ''}</p>
                    </div>
                    <div class="content-actions">
                        <button class="btn-secondary" onclick="openModal('certificate', ${cert.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-danger" onclick="deleteCertificate(${cert.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                `;
                container.appendChild(item);
            });
        })
        .catch(error => {
            console.error('Error loading certificates:', error);
            document.getElementById('certificates-list').innerHTML = '<p>Error loading certificates. Check console for details.</p>';
        });
}

function loadTestimonials() {
    fetch('/api/testimonials')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('testimonials-list');
            container.innerHTML = '';

            (data.testimonials || []).forEach(testimonial => {
                const item = document.createElement('div');
                item.className = 'content-item';
                item.innerHTML = `
                    <div class="content-info">
                        <h3>${testimonial.clientName || 'Unnamed Client'}</h3>
                        <p>${testimonial.position || testimonial.company || ''}</p>
                    </div>
                    <div class="content-actions">
                        <button class="btn-secondary" onclick="openModal('testimonial', ${testimonial.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-danger" onclick="deleteTestimonial(${testimonial.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                `;
                container.appendChild(item);
            });
        })
        .catch(error => {
            console.error('Error loading testimonials:', error);
            document.getElementById('testimonials-list').innerHTML = '<p>Error loading testimonials. Check console for details.</p>';
        });
}

function loadDashboardStats() {
    // Load actual data counts
    loadData('./data/services.json').then(data => {
        document.getElementById('services-count').textContent = data.services.length;
    }).catch(() => document.getElementById('services-count').textContent = '0');

    loadData('./data/gallery.json').then(data => {
        document.getElementById('gallery-count').textContent = data.gallery.length;
    }).catch(() => document.getElementById('gallery-count').textContent = '0');

    loadData('./data/jobs.json').then(data => {
        document.getElementById('jobs-count').textContent = data.jobs.length;
    }).catch(() => document.getElementById('jobs-count').textContent = '0');

    loadData('./data/company.json').then(data => {
        document.getElementById('team-count').textContent = data.team.length;
    }).catch(() => document.getElementById('team-count').textContent = '0');

    // Load certificates count
    loadData('./data/certificates.json').then(data => {
        const certCount = (data.certificates || []).length;
        // Add certificates count to dashboard if the element exists
        const certCountElement = document.getElementById('certificates-count');
        if (certCountElement) {
            certCountElement.textContent = certCount;
        }
    }).catch(() => {
        const certCountElement = document.getElementById('certificates-count');
        if (certCountElement) {
            certCountElement.textContent = '0';
        }
    });

    // Load testimonials count
    loadData('./data/testimonials.json').then(data => {
        const testimonialCount = (data.testimonials || []).length;
        // Add testimonials count to dashboard if the element exists
        const testimonialCountElement = document.getElementById('testimonials-count');
        if (testimonialCountElement) {
            testimonialCountElement.textContent = testimonialCount;
        }
    }).catch(() => {
        const testimonialCountElement = document.getElementById('testimonials-count');
        if (testimonialCountElement) {
            testimonialCountElement.textContent = '0';
        }
    });
}

function loadServices() {
    fetch('/api/services')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('services-list');
            container.innerHTML = '';

            data.services.forEach(service => {
                const item = document.createElement('div');
                item.className = 'content-item';
                item.innerHTML = `
                    <div class="content-info">
                        <h3>${service.title}</h3>
                        <p>${service.description.substring(0, 100)}${service.description.length > 100 ? '...' : ''}</p>
                    </div>
                    <div class="content-actions">
                        <button class="btn-secondary" onclick="openModal('service', ${service.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-danger" onclick="deleteService(${service.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                `;
                container.appendChild(item);
            });
        })
        .catch(error => {
            console.error('Error loading services:', error);
            document.getElementById('services-list').innerHTML = '<p>Error loading services. Check console for details.</p>';
        });
}

function loadGallery() {
    fetch('/api/gallery')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('gallery-list');
            container.innerHTML = '';

            data.gallery.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'content-item';
                itemElement.innerHTML = `
                    <div class="content-info">
                        <h3>${item.title}</h3>
                        <p>${item.description}</p>
                    </div>
                    <div class="content-actions">
                        <button class="btn-secondary" onclick="openModal('gallery', ${item.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-danger" onclick="deleteGalleryItem(${item.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                `;
                container.appendChild(itemElement);
            });
        })
        .catch(error => {
            console.error('Error loading gallery:', error);
            document.getElementById('gallery-list').innerHTML = '<p>Error loading gallery items. Check console for details.</p>';
        });
}

function loadJobs() {
    fetch('/api/jobs')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('jobs-list');
            container.innerHTML = '';

            data.jobs.forEach(job => {
                const item = document.createElement('div');
                item.className = 'content-item';
                item.innerHTML = `
                    <div class="content-info">
                        <h3>${job.title}</h3>
                        <p>${job.location} | ${job.type}</p>
                    </div>
                    <div class="content-actions">
                        <button class="btn-secondary" onclick="openModal('job', ${job.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-danger" onclick="deleteJob(${job.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                `;
                container.appendChild(item);
            });
        })
        .catch(error => {
            console.error('Error loading jobs:', error);
            document.getElementById('jobs-list').innerHTML = '<p>Error loading jobs. Check console for details.</p>';
        });
}

function loadCompanyInfo() {
    fetch('/api/company')
        .then(response => response.json())
        .then(data => {
            const company = data.company;
            document.getElementById('company-name').value = company.name;
            document.getElementById('company-description').value = company.description || '';
            document.getElementById('founded').value = company.founded || '';
            document.getElementById('employees').value = company.employees || '';
            document.getElementById('projects').value = company.projects || '';
            const statesField = document.getElementById('states-covered');
            if (statesField) statesField.value = company.statesCovered || '';
            document.getElementById('mission').value = company.mission || '';

        })
        .catch(error => {
            console.error('Error loading company info:', error);
            alert('Error loading company information');
        });
}

function openModal(contentType, id = null) {
    currentContentType = contentType;
    currentEditing = id;
    
    const modal = document.getElementById('content-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('content-form');
    
    // Reset form
    form.reset();
    currentImageFile = null;

    // Update the generic title label to be context-aware (e.g., 'Name' for team)
    const titleLabel = document.querySelector('label[for="title"]');
    if (titleLabel) {
        titleLabel.textContent = contentType === 'team' ? 'Name' : 'Title';
    }
    
    // Show/hide fields based on content type
    const imageUploadGroup = document.getElementById('image-upload-group');
    const imagePathGroup = document.getElementById('image-path-group');
    const descriptionGroup = document.getElementById('description-group');
    const locationGroup = document.getElementById('location-group');
    const typeGroup = document.getElementById('type-group');
    const salaryGroup = document.getElementById('salary-group');
    const responsibilitiesGroup = document.getElementById('responsibilities-group');
    const requirementsGroup = document.getElementById('requirements-group');
    const linkGroup = document.getElementById('link-group');
    const roleGroup = document.getElementById('role-group');
    const bioGroup = document.getElementById('bio-group');

    // Hide all specific fields first
    imageUploadGroup.style.display = 'block'; // Show by default
    imagePathGroup.style.display = 'none'; // Hide for now, will show when image is uploaded
    descriptionGroup.style.display = 'block'; // Show by default for most content types
    locationGroup.style.display = 'none';
    typeGroup.style.display = 'none';
    salaryGroup.style.display = 'none';
    responsibilitiesGroup.style.display = 'none';
    requirementsGroup.style.display = 'none';
    if (linkGroup) linkGroup.style.display = 'none';
    if (roleGroup) roleGroup.style.display = 'none';
    if (bioGroup) bioGroup.style.display = 'none';

    if (contentType === 'job') {
        locationGroup.style.display = 'block';
        typeGroup.style.display = 'block';
        salaryGroup.style.display = 'block';
        responsibilitiesGroup.style.display = 'block';
        requirementsGroup.style.display = 'block';
        imageUploadGroup.style.display = 'none'; // Hide image upload for jobs since it's not needed
    } else if (contentType === 'gallery') {
        imageUploadGroup.style.display = 'block';
    } else if (contentType === 'client') {
        imageUploadGroup.style.display = 'block';
        if (linkGroup) linkGroup.style.display = 'block';
    } else if (contentType === 'team') {
        imageUploadGroup.style.display = 'block';
        descriptionGroup.style.display = 'none'; // Hide description for team - use bio instead
        if (roleGroup) roleGroup.style.display = 'block';
        if (bioGroup) bioGroup.style.display = 'block';
    } else if (contentType === 'certificate') {
        imageUploadGroup.style.display = 'block';
        descriptionGroup.style.display = 'block';
        // Additional certificate-specific fields would go here
    } else if (contentType === 'testimonial') {
        imageUploadGroup.style.display = 'block';
        descriptionGroup.style.display = 'none'; // Hide main description for testimonials
        // Show testimonial-specific fields
        document.getElementById('rating-group').style.display = 'block';
        document.getElementById('client-name-group').style.display = 'block';
        document.getElementById('position-group').style.display = 'block';
        // Hide the title field for testimonials since we use client-name instead
        document.getElementById('title-group').style.display = 'none';

        // For testimonials, make client name required and title not required
        document.getElementById('client-name').required = true;
        document.getElementById('title').required = false;
    } else { // service
        imageUploadGroup.style.display = 'block';
        // Make sure testimonial fields are hidden for other content types
        document.getElementById('rating-group').style.display = 'none';
        document.getElementById('client-name-group').style.display = 'none';
        document.getElementById('position-group').style.display = 'none';
        document.getElementById('title-group').style.display = 'block'; // Show title for other content types

        // Reset required attributes for other content types
        document.getElementById('client-name').required = false;
        document.getElementById('title').required = true;
    }
    
    if (id) {
        // Editing existing item - load the data
        title.textContent = `Edit ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`;
        loadContentForEdit(contentType, id);
    } else {
        // Adding new item
        title.textContent = `Add New ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`;
        // Reset image preview
        document.getElementById('image-preview').innerHTML = '';
    }
    
    modal.style.display = 'block';
}

function loadContentForEdit(contentType, id) {
    let promise;
    
    switch(contentType) {
        case 'service':
            promise = loadData('./data/services.json').then(data => data.services.find(item => item.id == id));
            break;
        case 'gallery':
            promise = loadData('./data/gallery.json').then(data => data.gallery.find(item => item.id == id));
            break;
        case 'job':
            promise = loadData('./data/jobs.json').then(data => data.jobs.find(item => item.id == id));
            break;
        case 'client':
            promise = loadData('./data/clients.json').then(data => (data.clients || []).find(item => item.id == id));
            break;
        case 'team':
            promise = loadData('./data/team.json').then(data => (data.team || []).find(item => item.id == id));
            break;
        case 'certificate':
            promise = loadData('./data/certificates.json').then(data => (data.certificates || []).find(item => item.id == id));
            break;
        case 'testimonial':
            promise = loadData('./data/testimonials.json').then(data => (data.testimonials || []).find(item => item.id == id));
            break;
    }
    
    promise.then(item => {
        if (!item) {
            alert('Item not found');
            return;
        }
        
        // Always update the form fields regardless of visibility
        document.getElementById('title').value = item.title || item.name || '';
        document.getElementById('description').value = item.description || item.bio || '';

        if (item.image) {
            const preview = document.getElementById('image-preview');
            preview.innerHTML = `<img src="${item.image}" alt="Current image" style="max-width: 100%; max-height: 150px;">`;
            document.getElementById('image-path').value = item.image;
            document.getElementById('image-path-group').style.display = 'block';
        }

        if (contentType === 'job') {
            document.getElementById('location').value = item.location || '';
            document.getElementById('type').value = item.type || 'Full-time';
            document.getElementById('salary').value = item.salary || '';
            // Handle responsibilities and requirements (converting array to newline-separated string)
            document.getElementById('responsibilities').value = Array.isArray(item.responsibilities) ? item.responsibilities.join('\n') : item.responsibilities || '';
            document.getElementById('requirements').value = Array.isArray(item.requirements) ? item.requirements.join('\n') : item.requirements || '';
        } else if (contentType === 'client') {
            document.getElementById('link').value = item.link || '';
        } else if (contentType === 'team') {
            // team may use 'name' instead of title
            if (item.name) document.getElementById('title').value = item.name;
            document.getElementById('role').value = item.role || '';
            document.getElementById('bio').value = item.bio || '';
            // Don't populate description for team members since it's hidden
        } else if (contentType === 'testimonial') {
            // For testimonials, populate specific fields
            document.getElementById('client-name').value = item.clientName || item.name || '';
            document.getElementById('position').value = item.position || item.company || '';
            document.getElementById('rating').value = item.rating || 5;
            // Don't populate title or description for testimonials
        } else {
            // For other content types, populate description
            document.getElementById('description').value = item.description || '';
        }
    }).catch(error => {
        console.error('Error loading item for edit:', error);
        alert('Error loading item data');
    });
}

function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    // Prepare the item data
    let itemData;

    // For team members, we use name and bio; for others, we use title and description
    if (currentContentType === 'team') {
        // Validate required fields for team
        if (!data.title || data.title.trim() === '') {
            alert('Name is required for team members.');
            return;
        }
        if (!document.getElementById('bio').value || document.getElementById('bio').value.trim() === '') {
            alert('Short Bio is required for team members.');
            return;
        }

        itemData = {
            title: data.title
        };
    }
    // For testimonials, we use client name, position and rating; no title or description needed
    else if (currentContentType === 'testimonial') {
        // Validate required fields for testimonials
        if (!document.getElementById('client-name').value || document.getElementById('client-name').value.trim() === '') {
            alert('Client name is required for testimonials.');
            return;
        }

        itemData = {
            clientName: document.getElementById('client-name').value,
            position: document.getElementById('position').value,
            rating: parseInt(document.getElementById('rating').value) || 5
        };
    } else {
        // Validate required fields for other content types
        if (!data.title || data.title.trim() === '') {
            alert('Title is required.');
            return;
        }
        if (!data.description || data.description.trim() === '') {
            alert('Description is required.');
            return;
        }

        itemData = {
            title: data.title,
            description: data.description
        };
    }
    
    // Add image if provided
    if (data.image && data.image.trim()) {
        itemData.image = data.image;
    } else if (currentImageFile) {
        // If we have a file but no path, we need to handle upload differently in a real system
        // For now, we'll use a placeholder
        itemData.image = `/images/${currentContentType}/uploaded_image.jpg`;
    }
    
    // Add content type specific fields
    if (currentContentType === 'job') {
        itemData.location = data.location || document.getElementById('location').value;
        itemData.type = data.type || document.getElementById('type').value;
        itemData.salary = data.salary || document.getElementById('salary').value;
        // Get responsibilities and requirements from form elements since they're not in FormData
        const responsibilities = document.getElementById('responsibilities').value;
        const requirements = document.getElementById('requirements').value;
        // Convert newline-separated responsibilities and requirements to arrays
        if (responsibilities) {
            itemData.responsibilities = responsibilities.split('\n').filter(line => line.trim() !== '');
        }
        if (requirements) {
            itemData.requirements = requirements.split('\n').filter(line => line.trim() !== '');
        }
    }
    // Client-specific fields
    if (currentContentType === 'client') {
        itemData.link = data.link;
    }
    // Team-specific fields
    if (currentContentType === 'team') {
        // store team name in title if provided
        if (data.title) itemData.name = data.title;
        itemData.role = data.role;
        // Use bio field for team members instead of description
        itemData.bio = document.getElementById('bio').value;
        // Don't include description for team members since it's hidden
    }
    // Testimonial-specific fields were already handled above
    else if (currentContentType !== 'testimonial') {
        // For other content types (not testimonials), use description
        itemData.description = data.description;
    }

    if (currentEditing) {
        updateContent(currentContentType, currentEditing, itemData);
    } else {
        addNewContent(currentContentType, itemData);
    }

    closeModal();
}

function addNewContent(contentType, data) {
    if (!ensureAuthenticated('Please log in to add content.')) return;
    let url, itemName;

    switch(contentType) {
        case 'service':
            url = '/api/services';
            itemName = 'Service';
            break;
        case 'gallery':
            url = '/api/gallery';
            itemName = 'Gallery Item';
            break;
        case 'job':
            url = '/api/jobs';
            itemName = 'Job';
            break;
        case 'client':
            url = '/api/clients';
            itemName = 'Client';
            break;
        case 'team':
            url = '/api/team';
            itemName = 'Team Member';
            break;
        case 'certificate':
            url = '/api/certificates';
            itemName = 'Certificate';
            break;
        case 'testimonial':
            url = '/api/testimonials';
            itemName = 'Testimonial';
            break;
    }

    // If a file was selected in the modal, send as multipart/form-data so the server can store the image
    if (currentImageFile && (contentType === 'service' || contentType === 'gallery' || contentType === 'client' || contentType === 'team' || contentType === 'certificate' || contentType === 'testimonial')) {
        const formData = new FormData();
        formData.append('title', data.title || '');
        formData.append('description', data.description || '');
        if (data.category) formData.append('category', data.category);
        if (data.icon) formData.append('icon', data.icon);
        // indicate the intended images subfolder to the server
        if (contentType === 'service') {
            formData.append('category', 'services');
        } else if (contentType === 'gallery') {
            // allow explicit category if provided, otherwise default to 'gallery'
            formData.append('category', data.category || 'gallery');
        }
        // Append content-type specific fields so server can persist them
        if (contentType === 'client' && data.link) {
            formData.append('link', data.link);
        }
        if (contentType === 'team') {
            // team members prefer 'name' over 'title'
            formData.append('name', data.name || data.title || '');
            if (data.role) formData.append('role', data.role);
            if (data.bio) formData.append('bio', data.bio);
        }
        // Add job-specific fields (responsibilities and requirements) to form data
        if (contentType === 'job') {
            formData.append('location', document.getElementById('location').value);
            formData.append('type', document.getElementById('type').value);
            formData.append('salary', document.getElementById('salary').value);
            // For responsibilities and requirements, append them to form data
            const responsibilities = document.getElementById('responsibilities').value;
            const requirements = document.getElementById('requirements').value;

            if (responsibilities) {
                const respArray = responsibilities.split('\n').filter(line => line.trim() !== '');
                respArray.forEach((resp, index) => {
                    formData.append(`responsibilities[${index}]`, resp);
                });
            }
            if (requirements) {
                const reqArray = requirements.split('\n').filter(line => line.trim() !== '');
                reqArray.forEach((req, index) => {
                    formData.append(`requirements[${index}]`, req);
                });
            }
        }
        // Add testimonial-specific fields
        if (contentType === 'testimonial') {
            formData.append('clientName', document.getElementById('client-name').value);
            formData.append('position', document.getElementById('position').value);
            formData.append('rating', document.getElementById('rating').value);
        }

        // append image file under field name 'image' (server expects this)
        formData.append('image', currentImageFile);

        // include X-Category header so server can determine destination reliably
        const headers = {};
        if (contentType === 'service') headers['X-Category'] = 'services';
        else if (contentType === 'gallery') headers['X-Category'] = data.category || 'gallery';
        else if (contentType === 'client') headers['X-Category'] = 'clients';
        else if (contentType === 'team') headers['X-Category'] = 'team';
        else if (contentType === 'certificate') headers['X-Category'] = 'certificates';
        else if (contentType === 'testimonial') headers['X-Category'] = 'testimonials';
        else if (contentType === 'job') headers['X-Category'] = 'jobs';

        authorizedFetch(url, {
            method: 'POST',
            headers: getAuthHeaders(headers),
            body: formData
        })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert(`${itemName} added successfully!`);
                    // reload the appropriate section after adding
                    if (contentType === 'gallery') loadContent('gallery');
                    else if (contentType === 'job') loadContent('jobs');
                    else if (contentType === 'client') loadContent('clients');
                    else if (contentType === 'team') loadContent('team');
                    else if (contentType === 'testimonial') loadContent('testimonials');
                    else loadContent('services');
                } else {
                    alert(`Error adding ${itemName}: ${result.error || 'Unknown error'}`);
                }
            })
            .catch(error => {
                console.error(`Error adding ${contentType}:`, error);
                alert(`Error adding ${itemName}: ${error.message}`);
            });
    } else {
        // Fallback to JSON submission when no file upload is required
        // In this case, we need to get the values from the actual form fields, not from the FormData object
        const itemData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value
        };

        // Add content type specific fields
        if (currentContentType === 'job') {
            itemData.location = document.getElementById('location').value;
            itemData.type = document.getElementById('type').value;
            itemData.salary = document.getElementById('salary').value;
            // Get responsibilities and requirements from the form fields
            const responsibilities = document.getElementById('responsibilities').value;
            const requirements = document.getElementById('requirements').value;

            // Convert newline-separated responsibilities and requirements to arrays
            if (responsibilities) {
                itemData.responsibilities = responsibilities.split('\n').filter(line => line.trim() !== '');
            }
            if (requirements) {
                itemData.requirements = requirements.split('\n').filter(line => line.trim() !== '');
            }
        }
        // Client-specific fields
        if (currentContentType === 'client') {
            itemData.link = document.getElementById('link').value;
        }
        // Team-specific fields
        if (currentContentType === 'team') {
            // store team name in title if provided
            if (document.getElementById('title').value) itemData.name = document.getElementById('title').value;
            itemData.role = document.getElementById('role').value;
            itemData.bio = document.getElementById('bio').value;
            // Don't include description for team members since it's hidden
        }
        // Testimonial-specific fields
        else if (currentContentType === 'testimonial') {
            itemData.clientName = document.getElementById('client-name').value;
            itemData.position = document.getElementById('position').value;
            itemData.rating = parseInt(document.getElementById('rating').value) || 5;
            // Don't include title or description for testimonials
        } else {
            // For other content types, use description
            itemData.description = document.getElementById('description').value;
        }

        authorizedFetch(url, {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(itemData)
        })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert(`${itemName} added successfully!`);
                    if (contentType === 'gallery') loadContent('gallery');
                    else if (contentType === 'job') loadContent('jobs');
                    else if (contentType === 'client') loadContent('clients');
                    else if (contentType === 'team') loadContent('team');
                    else if (contentType === 'certificate') loadContent('certificates');
                    else if (contentType === 'testimonial') loadContent('testimonials');
                    else loadContent('services');
                } else {
                    alert(`Error adding ${itemName}: ${result.error || 'Unknown error'}`);
                }
            })
            .catch(error => {
                console.error(`Error adding ${contentType}:`, error);
                alert(`Error adding ${itemName}: ${error.message}`);
            });
    }
}


function updateContent(contentType, id, data) {
    if (!ensureAuthenticated('Please log in to update content.')) return;
    let url, itemName;

    switch(contentType) {
        case 'service':
            url = `/api/services/${id}`;
            itemName = 'Service';
            break;
        case 'gallery':
            url = `/api/gallery/${id}`;
            itemName = 'Gallery Item';
            break;
        case 'job':
            url = `/api/jobs/${id}`;
            itemName = 'Job';
            break;
        case 'client':
            url = `/api/clients/${id}`;
            itemName = 'Client';
            break;
        case 'team':
            url = `/api/team/${id}`;
            itemName = 'Team Member';
            break;
        case 'certificate':
            url = `/api/certificates/${id}`;
            itemName = 'Certificate';
            break;
        case 'testimonial':
            url = `/api/testimonials/${id}`;
            itemName = 'Testimonial';
            break;
    }

    // If a new file was selected, send as multipart/form-data so the server can store the image
    if (currentImageFile && (contentType === 'service' || contentType === 'gallery' || contentType === 'client' || contentType === 'team' || contentType === 'certificate' || contentType === 'testimonial')) {
        const formData = new FormData();
        formData.append('title', data.title || '');
        formData.append('description', data.description || '');
        if (data.category) formData.append('category', data.category);
        if (data.icon) formData.append('icon', data.icon);
        // indicate the intended images subfolder to the server
        if (contentType === 'service') {
            formData.append('category', 'services');
        } else if (contentType === 'gallery') {
            formData.append('category', data.category || 'gallery');
        }
        // Append content-type specific fields so server can persist them on update
        if (contentType === 'client' && data.link) {
            formData.append('link', data.link);
        }
        if (contentType === 'team') {
            formData.append('name', data.name || data.title || '');
            if (data.role) formData.append('role', data.role);
            // Use the bio field value directly from the element since it's not in FormData
            const bioValue = document.getElementById('bio').value;
            if (bioValue) formData.append('bio', bioValue);
        } else {
            // For other content types, include description
            if (data.description) formData.append('description', data.description);
        }
        if (contentType === 'job') {
            formData.append('location', document.getElementById('location').value);
            formData.append('type', document.getElementById('type').value);
            formData.append('salary', document.getElementById('salary').value);
            // For responsibilities and requirements, append them to form data
            const responsibilities = document.getElementById('responsibilities').value;
            const requirements = document.getElementById('requirements').value;

            if (responsibilities) {
                const respArray = responsibilities.split('\n').filter(line => line.trim() !== '');
                respArray.forEach((resp, index) => {
                    formData.append(`responsibilities[${index}]`, resp);
                });
            }
            if (requirements) {
                const reqArray = requirements.split('\n').filter(line => line.trim() !== '');
                reqArray.forEach((req, index) => {
                    formData.append(`requirements[${index}]`, req);
                });
            }
        }
        // Add testimonial-specific fields
        if (contentType === 'testimonial') {
            formData.append('clientName', document.getElementById('client-name').value);
            formData.append('position', document.getElementById('position').value);
            formData.append('rating', document.getElementById('rating').value);
        }
        // for client/team we don't need category but ensure image appended
        formData.append('image', currentImageFile);

        // include X-Category header so server can determine destination reliably
        const headers = {};
        if (contentType === 'service') headers['X-Category'] = 'services';
        else if (contentType === 'gallery') headers['X-Category'] = data.category || 'gallery';
        else if (contentType === 'client') headers['X-Category'] = 'clients';
        else if (contentType === 'team') headers['X-Category'] = 'team';
        else if (contentType === 'certificate') headers['X-Category'] = 'certificates';
        else if (contentType === 'testimonial') headers['X-Category'] = 'testimonials';
        else if (contentType === 'job') headers['X-Category'] = 'jobs';

        authorizedFetch(url, {
            method: 'PUT',
            headers: getAuthHeaders(headers),
            body: formData
        })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert(`${itemName} updated successfully!`);
                    if (contentType === 'gallery') loadContent('gallery');
                    else if (contentType === 'job') loadContent('jobs');
                    else if (contentType === 'client') loadContent('clients');
                    else if (contentType === 'team') loadContent('team');
                    else if (contentType === 'certificate') loadContent('certificates');
                    else if (contentType === 'testimonial') loadContent('testimonials');
                    else loadContent('services');
                } else {
                    alert(`Error updating ${itemName}: ${result.error || 'Unknown error'}`);
                }
            })
            .catch(error => {
                console.error(`Error updating ${contentType}:`, error);
                alert(`Error updating ${itemName}: ${error.message}`);
            });
    } else {
        // Prepare the item data for JSON submission when updating
        const itemData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value
        };

        // Add content type specific fields
        if (contentType === 'job') {
            itemData.location = document.getElementById('location').value;
            itemData.type = document.getElementById('type').value;
            itemData.salary = document.getElementById('salary').value;
            // Get responsibilities and requirements from the form fields
            const responsibilities = document.getElementById('responsibilities').value;
            const requirements = document.getElementById('requirements').value;

            // Convert newline-separated responsibilities and requirements to arrays
            if (responsibilities) {
                itemData.responsibilities = responsibilities.split('\n').filter(line => line.trim() !== '');
            }
            if (requirements) {
                itemData.requirements = requirements.split('\n').filter(line => line.trim() !== '');
            }
        }
        // Client-specific fields
        if (contentType === 'client') {
            itemData.link = document.getElementById('link').value;
        }
        // Team-specific fields
        if (contentType === 'team') {
            // store team name in title if provided
            if (document.getElementById('title').value) itemData.name = document.getElementById('title').value;
            itemData.role = document.getElementById('role').value;
            itemData.bio = document.getElementById('bio').value;
            // Don't include description for team members since it's hidden
        }
        // Testimonial-specific fields
        else if (contentType === 'testimonial') {
            itemData.clientName = document.getElementById('client-name').value;
            itemData.position = document.getElementById('position').value;
            itemData.rating = parseInt(document.getElementById('rating').value) || 5;
            // Don't include title or description for testimonials
        } else {
            // For other content types, use description
            itemData.description = document.getElementById('description').value;
        }

        authorizedFetch(url, {
            method: 'PUT',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(itemData)
        })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert(`${itemName} updated successfully!`);
                    if (contentType === 'gallery') loadContent('gallery');
                    else if (contentType === 'job') loadContent('jobs');
                    else if (contentType === 'client') loadContent('clients');
                    else if (contentType === 'team') loadContent('team');
                    else if (contentType === 'certificate') loadContent('certificates');
                    else if (contentType === 'testimonial') loadContent('testimonials');
                    else loadContent('services');
                } else {
                    alert(`Error updating ${itemName}: ${result.error || 'Unknown error'}`);
                }
            })
            .catch(error => {
                console.error(`Error updating ${contentType}:`, error);
                alert(`Error updating ${itemName}: ${error.message}`);
            });
    }
}

// Generic delete function for all content types
function deleteContent(contentType, id) {
    if (!ensureAuthenticated('Please log in to delete content.')) return;
    const typeMap = {
        service: { plural: 'services', loader: loadServices },
        gallery: { plural: 'gallery', loader: loadGallery },
        job: { plural: 'jobs', loader: loadJobs },
        client: { plural: 'clients', loader: loadClients },
        team: { plural: 'team', loader: loadTeam },
        certificate: { plural: 'certificates', loader: loadCertificates },
        testimonial: { plural: 'testimonials', loader: loadTestimonials }
    };

    const config = typeMap[contentType];
    if (!config) {
        console.error('Unknown content type:', contentType);
        return;
    }

    const itemName = contentType === 'gallery' ? 'gallery item' : 
                     contentType === 'team' ? 'team member' : contentType;

    if (!confirm(`Are you sure you want to delete this ${itemName}?`)) return;

    authorizedFetch(`/api/${config.plural}/${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert(`${itemName.charAt(0).toUpperCase() + itemName.slice(1)} deleted successfully!`);
                config.loader();
            } else {
                alert(`Error deleting ${itemName}: ${result.error || 'Unknown error'}`);
            }
        })
        .catch(error => {
            console.error(`Error deleting ${contentType}:`, error);
            alert(`Error deleting ${itemName}`);
        });
}

// Wrapper functions for backwards compatibility with HTML onclick attributes
function deleteService(id) { deleteContent('service', id); }
function deleteGalleryItem(id) { deleteContent('gallery', id); }
function deleteJob(id) { deleteContent('job', id); }
function deleteClient(id) { deleteContent('client', id); }
function deleteTeamMember(id) { deleteContent('team', id); }
function deleteCertificate(id) { deleteContent('certificate', id); }
function deleteTestimonial(id) { deleteContent('testimonial', id); }

function handleCompanyFormSubmit(e) {
    e.preventDefault();
    if (!ensureAuthenticated('Please log in to update company info.')) return;

    const formData = new FormData(e.target);
    const companyData = Object.fromEntries(formData);

    authorizedFetch('/api/company', {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(companyData)
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('Company information updated successfully!');
                loadCompanyInfo();
            } else {
                alert(`Error updating company information: ${result.error || 'Unknown error'}`);
            }
        })
        .catch(error => {
            console.error('Error updating company info:', error);
            alert('Error updating company information');
        });
}

// Function to load data with fallback
function loadData(url) {
    return new Promise((resolve, reject) => {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => resolve(data))
            .catch(error => {
                console.error(`Error loading data from ${url}:`, error);
                reject(error);
            });
    });
}

function handleImageUpload(file) {
    if (!file) return;
    
    currentImageFile = file;
    
    // Show image preview
    const reader = new FileReader();
    const preview = document.getElementById('image-preview');
    
    reader.onload = function(e) {
        preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 150px;">`;
        
        // Show the image path input field
        document.getElementById('image-path-group').style.display = 'block';
        
        // Generate a filename for the uploaded image (in a real system)
        const extension = file.name.split('.').pop();
        const fileName = `${currentContentType}_${Date.now()}.${extension}`;
        document.getElementById('image-path').value = `/images/${currentContentType}/${fileName}`;
    };
    
    reader.readAsDataURL(file);
}

function closeModal() {
    document.getElementById('content-modal').style.display = 'none';
    currentEditing = null;
    currentContentType = null;
    currentImageFile = null;
    
    // Reset image preview and path input
    document.getElementById('image-preview').innerHTML = '';
    document.getElementById('image-path').value = '';
    document.getElementById('image-path-group').style.display = 'none';
}