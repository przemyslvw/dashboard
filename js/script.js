document.addEventListener('DOMContentLoaded', function() {
    // Add fullscreen toggle functionality to all panels
    document.querySelectorAll('.fullscreen-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const panel = this.closest('.iframe-wrapper');
            const icon = this.querySelector('i');
            
            if (panel.classList.contains('fullscreen')) {
                // Exit fullscreen
                panel.classList.remove('fullscreen');
                icon.classList.remove('fa-compress');
                icon.classList.add('fa-expand');
                document.body.style.overflow = '';
            } else {
                // Enter fullscreen
                // First, exit any other panel that might be in fullscreen
                document.querySelectorAll('.iframe-wrapper.fullscreen').forEach(p => {
                    p.classList.remove('fullscreen');
                    p.querySelector('.fullscreen-btn i').classList.remove('fa-compress');
                    p.querySelector('.fullscreen-btn i').classList.add('fa-expand');
                });
                
                panel.classList.add('fullscreen');
                icon.classList.remove('fa-expand');
                icon.classList.add('fa-compress');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    // Close fullscreen when clicking outside the panel
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.iframe-wrapper.fullscreen')) {
            const fullscreenPanel = document.querySelector('.iframe-wrapper.fullscreen');
            if (fullscreenPanel) {
                const icon = fullscreenPanel.querySelector('.fullscreen-btn i');
                fullscreenPanel.classList.remove('fullscreen');
                icon.classList.remove('fa-compress');
                icon.classList.add('fa-expand');
                document.body.style.overflow = '';
            }
        }
    });

    // Close fullscreen when pressing Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const fullscreenPanel = document.querySelector('.iframe-wrapper.fullscreen');
            if (fullscreenPanel) {
                const icon = fullscreenPanel.querySelector('.fullscreen-btn i');
                fullscreenPanel.classList.remove('fullscreen');
                icon.classList.remove('fa-compress');
                icon.classList.add('fa-expand');
                document.body.style.overflow = '';
            }
        }
    });
});