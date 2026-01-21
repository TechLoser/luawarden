class LuaWarden {
    constructor() {
        this.initializeEventListeners();
        this.apiBase = '/';
    }

    initializeEventListeners() {
        const form = document.getElementById('uploadForm');
        const fileInput = document.getElementById('luaFile');
        const codeTextarea = document.getElementById('code');
        const uploadBtn = document.querySelector('.upload-btn');

        // File input change handler
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                codeTextarea.value = '';
                this.readFile(e.target.files[0]);
            }
        });

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUpload();
        });

        // Auto-resize textarea
        codeTextarea.addEventListener('input', () => {
            this.autoResizeTextarea(codeTextarea);
        });
    }

    readFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('code').value = e.target.result;
        };
        reader.readAsText(file);
    }

    async handleUpload() {
        const uploadBtn = document.querySelector('.upload-btn');
        const resultDiv = document.getElementById('result');
        const fileInput = document.getElementById('luaFile');
        const codeTextarea = document.getElementById('code');

        // Show loading state
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<span class="loading"></span> <span class="btn-text">Protecting...</span>';

        try {
            const formData = new FormData();
            
            // Check if file is selected
            if (fileInput.files.length > 0) {
                formData.append('luaFile', fileInput.files[0]);
            } else {
                const code = codeTextarea.value.trim();
                if (!code) {
                    this.showError('Please provide either a file or paste your code');
                    return;
                }
                formData.append('code', code);
            }

            const response = await fetch(`${this.apiBase}upload`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess(data);
            } else {
                this.showError(data.error || 'Upload failed');
            }

        } catch (error) {
            console.error('Upload error:', error);
            this.showError('Network error. Please try again.');
        } finally {
            // Reset button
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<span class="btn-text">Protect Script</span> <i class="fas fa-shield-alt"></i>';
        }
    }

    showSuccess(data) {
        const resultDiv = document.getElementById('result');
        const resultTitle = document.getElementById('resultTitle');
        const resultMessage = document.getElementById('resultMessage');
        const shareLink = document.getElementById('shareLink');

        resultTitle.textContent = 'Success!';
        resultMessage.textContent = data.message;
        shareLink.value = data.link;

        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth' });

        // Add success animation
        resultDiv.style.animation = 'pulse 0.5s ease-in-out';
        setTimeout(() => {
            resultDiv.style.animation = '';
        }, 500);
    }

    showError(message) {
        const resultDiv = document.getElementById('result');
        const resultTitle = document.getElementById('resultTitle');
        const resultMessage = document.getElementById('resultMessage');
        const shareLink = document.getElementById('shareLink');
        const successIcon = document.querySelector('.success-icon');

        resultTitle.textContent = 'Error!';
        resultMessage.textContent = message;
        shareLink.value = '';
        
        // Change icon to error
        if (successIcon) {
            successIcon.className = 'fas fa-exclamation-circle error-icon';
            successIcon.style.color = '#ef4444';
        }

        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth' });

        // Add error animation
        resultDiv.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            resultDiv.style.animation = '';
        }, 500);
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 300) + 'px';
    }
}

// Global copy function
function copyLink() {
    const shareLink = document.getElementById('shareLink');
    shareLink.select();
    shareLink.setSelectionRange(0, 99999); // For mobile devices
    
    try {
        document.execCommand('copy');
        // Show feedback
        const originalText = shareLink.placeholder;
        shareLink.placeholder = 'Copied!';
        setTimeout(() => {
            shareLink.placeholder = originalText;
        }, 2000);
    } catch (err) {
        console.error('Copy failed:', err);
        alert('Copy failed. Please copy manually.');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LuaWarden();
    
    // Add some interactive effects
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px) rotateX(5deg)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) rotateX(0)';
        });
    });
});

// Add shake animation for errors
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
    }
`;
document.head.appendChild(style);
