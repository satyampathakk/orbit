// Admin panel functionality with real data integration
document.addEventListener('DOMContentLoaded', function() {
    // Navigation
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.admin-section');
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show corresponding section
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(btn.dataset.section).classList.add('active');
            
            // Load content based on section
            loadContent(btn.dataset.section);
        });
    });
    
    // Initialize dashboard
    loadContent('dashboard');
    
    // Modal functionality
    const modal = document.getElementById('content-modal');
    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.querySelector('.cancel-btn');
    const contentForm = document.getElementById('content-form');
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Form submission
    contentForm.addEventListener('submit', handleFormSubmit);
    
    // Add image upload functionality
    const imageUpload = document.getElementById('image-upload');
    if (imageUpload) {
        imageUpload.addEventListener('change', function(e) {
            handleImageUpload(e.target.files[0]);
        });
    }
    
    // Quick action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
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
            }
        });
    });
    
    // Add content buttons
    document.getElementById('add-service-btn').addEventListener('click', () => openModal('service', null));
    document.getElementById('add-gallery-btn').addEventListener('click', () => openModal('gallery', null));
    document.getElementById('add-job-btn').addEventListener('click', () => openModal('job', null));
    // New add buttons for clients and team (may not exist on every page load)
    const addClientBtn = document.getElementById('add-client-btn');
    if (addClientBtn) addClientBtn.addEventListener('click', () => openModal('client', null));
    const addTeamBtn = document.getElementById('add-team-btn');
    if (addTeamBtn) addTeamBtn.addEventListener('click', () => openModal('team', null));
    
    // Company form submission
    document.getElementById('company-form').addEventListener('submit', handleCompanyFormSubmit);
});

let currentEditing = null;
let currentContentType = null;
let currentImageFile = null;

function loadContent(section) {
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
            document.getElementById('mission').value = company.mission || '';

            // Convert array to comma-separated string for values field
            document.getElementById('values').value = Array.isArray(company.values) ?
                company.values.join(', ') : '';
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
    const imagePathGroup = document.getElementById('image-path-group');
    const locationGroup = document.getElementById('location-group');
    const typeGroup = document.getElementById('type-group');
    const salaryGroup = document.getElementById('salary-group');
    const linkGroup = document.getElementById('link-group');
    const roleGroup = document.getElementById('role-group');
    const bioGroup = document.getElementById('bio-group');
    
    // Hide all specific fields first
    imagePathGroup.style.display = 'none'; // Hide for now, will show when image is uploaded
    locationGroup.style.display = 'none';
    typeGroup.style.display = 'none';
    salaryGroup.style.display = 'none';
    if (linkGroup) linkGroup.style.display = 'none';
    if (roleGroup) roleGroup.style.display = 'none';
    if (bioGroup) bioGroup.style.display = 'none';
    
    if (contentType === 'job') {
        locationGroup.style.display = 'block';
        typeGroup.style.display = 'block';
        salaryGroup.style.display = 'block';
        imagePathGroup.style.display = 'block';
    } else if (contentType === 'gallery') {
        imagePathGroup.style.display = 'block';
    } else if (contentType === 'client') {
        imagePathGroup.style.display = 'block';
        if (linkGroup) linkGroup.style.display = 'block';
    } else if (contentType === 'team') {
        imagePathGroup.style.display = 'block';
        if (roleGroup) roleGroup.style.display = 'block';
        if (bioGroup) bioGroup.style.display = 'block';
    } else { // service
        imagePathGroup.style.display = 'block';
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
    }
    
    promise.then(item => {
        if (!item) {
            alert('Item not found');
            return;
        }
        
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
        } else if (contentType === 'client') {
            document.getElementById('link').value = item.link || '';
        } else if (contentType === 'team') {
            // team may use 'name' instead of title
            if (item.name) document.getElementById('title').value = item.name;
            document.getElementById('role').value = item.role || '';
            document.getElementById('bio').value = item.bio || '';
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
    const itemData = {
        title: data.title,
        description: data.description
    };
    
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
        itemData.location = data.location;
        itemData.type = data.type;
        itemData.salary = data.salary;
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
        itemData.bio = data.bio;
    }
    
    if (currentEditing) {
        updateContent(currentContentType, currentEditing, itemData);
    } else {
        addNewContent(currentContentType, itemData);
    }
    
    closeModal();
}

function addNewContent(contentType, data) {
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
    }

    // If a file was selected in the modal, send as multipart/form-data so the server can store the image
    if (currentImageFile && (contentType === 'service' || contentType === 'gallery' || contentType === 'client' || contentType === 'team')) {
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
        // append image file under field name 'image' (server expects this)
        formData.append('image', currentImageFile);

        // include X-Category header so server can determine destination reliably
        const headers = {};
        if (contentType === 'service') headers['X-Category'] = 'services';
        else if (contentType === 'gallery') headers['X-Category'] = data.category || 'gallery';
        else if (contentType === 'client') headers['X-Category'] = 'clients';
        else if (contentType === 'team') headers['X-Category'] = 'team';

        fetch(url, {
            method: 'POST',
            headers,
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
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert(`${itemName} added successfully!`);
                    if (contentType === 'gallery') loadContent('gallery');
                    else if (contentType === 'job') loadContent('jobs');
                    else if (contentType === 'client') loadContent('clients');
                    else if (contentType === 'team') loadContent('team');
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
    }

    // If a new file was selected, send as multipart/form-data so the server can store the image
    if (currentImageFile && (contentType === 'service' || contentType === 'gallery' || contentType === 'client' || contentType === 'team')) {
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
            if (data.bio) formData.append('bio', data.bio);
        }
        // for client/team we don't need category but ensure image appended
        formData.append('image', currentImageFile);

        // include X-Category header so server can determine destination reliably
        const headers = {};
        if (contentType === 'service') headers['X-Category'] = 'services';
        else if (contentType === 'gallery') headers['X-Category'] = data.category || 'gallery';
        else if (contentType === 'client') headers['X-Category'] = 'clients';
        else if (contentType === 'team') headers['X-Category'] = 'team';

        fetch(url, {
            method: 'PUT',
            headers,
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
        fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert(`${itemName} updated successfully!`);
                    if (contentType === 'gallery') loadContent('gallery');
                    else if (contentType === 'job') loadContent('jobs');
                    else if (contentType === 'client') loadContent('clients');
                    else if (contentType === 'team') loadContent('team');
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

function deleteService(id) {
    if (!confirm('Are you sure you want to delete this service?')) return;

    fetch(`/api/services/${id}`, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('Service deleted successfully!');
                loadServices();
            } else {
                alert(`Error deleting service: ${result.error || 'Unknown error'}`);
            }
        })
        .catch(error => {
            console.error('Error deleting service:', error);
            alert('Error deleting service');
        });
}

function deleteGalleryItem(id) {
    if (!confirm('Are you sure you want to delete this gallery item?')) return;

    fetch(`/api/gallery/${id}`, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('Gallery item deleted successfully!');
                loadGallery();
            } else {
                alert(`Error deleting gallery item: ${result.error || 'Unknown error'}`);
            }
        })
        .catch(error => {
            console.error('Error deleting gallery item:', error);
            alert('Error deleting gallery item');
        });
}

function deleteJob(id) {
    if (!confirm('Are you sure you want to delete this job?')) return;

    fetch(`/api/jobs/${id}`, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('Job deleted successfully!');
                loadJobs();
            } else {
                alert(`Error deleting job: ${result.error || 'Unknown error'}`);
            }
        })
        .catch(error => {
            console.error('Error deleting job:', error);
            alert('Error deleting job');
        });
}

function deleteClient(id) {
    if (!confirm('Are you sure you want to delete this client?')) return;

    fetch(`/api/clients/${id}`, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('Client deleted successfully!');
                loadClients();
            } else {
                alert(`Error deleting client: ${result.error || 'Unknown error'}`);
            }
        })
        .catch(error => {
            console.error('Error deleting client:', error);
            alert('Error deleting client');
        });
}

function deleteTeamMember(id) {
    if (!confirm('Are you sure you want to delete this team member?')) return;

    fetch(`/api/team/${id}`, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('Team member deleted successfully!');
                loadTeam();
            } else {
                alert(`Error deleting team member: ${result.error || 'Unknown error'}`);
            }
        })
        .catch(error => {
            console.error('Error deleting team member:', error);
            alert('Error deleting team member');
        });
}

function handleCompanyFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    // Convert values string back to array
    const companyData = {
        ...data,
        values: data.values ? data.values.split(',').map(v => v.trim()) : []
    };

    fetch('/api/company', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
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