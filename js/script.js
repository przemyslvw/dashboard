// Konfiguracja domyślnych URL-i
const defaultUrls = {
    iframe1: 'https://www.example.com',
    iframe2: 'https://www.example.com',
    iframe3: 'https://www.example.com',
    iframe4: 'https://www.example.com',
    iframe5: 'https://www.example.com',
    iframe6: 'https://www.example.com'
};

// Funkcja do załadowania zapisanych URL-i z localStorage
function loadSavedUrls() {
    // Map of panel numbers to their element selectors
    const panelElements = {
        1: { selector: '#iframe1', type: 'iframe' },
        2: { selector: '.left-column img', type: 'img' },
        3: { selector: '#iframe3', type: 'iframe' },
        4: { selector: '#iframe4', type: 'iframe' },
        5: { selector: '#iframe5', type: 'iframe' },
        6: { selector: '#iframe6', type: 'iframe' }
    };

    for (let i = 1; i <= 6; i++) {
        console.log(`Processing panel ${i}...`);
        const savedUrl = localStorage.getItem(`iframe${i}Url`);
        const panel = panelElements[i];
        
        if (!panel) {
            console.error(`No configuration found for panel ${i}`);
            continue;
        }
        
        console.log(`Panel ${i} selector:`, panel.selector);
        const element = document.querySelector(panel.selector);
        const urlInput = document.getElementById(`url${i}`);
        
        if (!element) {
            console.error(`Element not found for panel ${i} with selector: ${panel.selector}`);
            continue;
        }
        
        if (!urlInput) {
            console.error(`URL input not found for panel ${i} (url${i})`);
            continue;
        }
        
        const urlToSet = savedUrl || defaultUrls[`iframe${i}`];
        
        try {
            if (panel.type === 'img') {
                console.log(`Initializing image panel ${i}`);
                const handleImageLoad = (url) => {
                    console.log(`Loading image for panel ${i} from:`, url);
                    const img = new Image();
                    img.onerror = () => {
                        console.warn(`Panel ${i}: Failed to load image from URL:`, url);
                        // If the URL is different from default and fails, try the default URL
                        if (url !== defaultUrls[`iframe${i}`]) {
                            console.log(`Trying default URL for panel ${i}`);
                            handleImageLoad(defaultUrls[`iframe${i}`]);
                        } else {
                            // If default URL also fails, set empty source
                            console.log(`Panel ${i}: Both URLs failed, clearing source`);
                            if (element) element.src = '';
                            if (urlInput) urlInput.value = url || '';
                        }
                    };
                    img.onload = () => {
                        // console.log(`Panel ${i}: Image loaded successfully from:`, url);
                        // Only update if the URL is still relevant and elements exist
                        if ((url === urlToSet || url === defaultUrls[`iframe${i}`]) && element && urlInput) {
                            element.src = url;
                            urlInput.value = url;
                        }
                    };
                    try {
                        img.src = url;
                    } catch (error) {
                        console.error(`Panel ${i}: Error setting image source:`, error);
                    }
                };
                
                // Start loading the image if we have a URL
                if (urlToSet) {
                    handleImageLoad(urlToSet);
                } else {
                    console.warn(`Panel ${i}: No URL to load`);
                }
            } else {
                // For iframes
                if (element.tagName === 'IFRAME') {
                    element.src = urlToSet;
                    urlInput.value = urlToSet;
                } else {
                    console.warn(`Element for panel ${i} is not an iframe`);
                }
            }
        } catch (error) {
            console.error(`Error loading URL for panel ${i}:`, error);
            // Fallback to default URL in case of error
            element.src = defaultUrls[`iframe${i}`];
            urlInput.value = defaultUrls[`iframe${i}`];
        }
    }
}

// Funkcja do zapisania URL-i do localStorage
function saveUrls() {
    for (let i = 1; i <= 6; i++) {
        const urlInput = document.getElementById(`url${i}`);
        if (!urlInput) {
            console.warn(`URL input for panel ${i} not found`);
            continue;
        }
        
        const url = urlInput.value.trim();
        if (!url) continue;
        
        localStorage.setItem(`iframe${i}Url`, url);
        
        // Handle panel 2 specially as it's an image, not an iframe
        const element = i === 2 
            ? document.querySelector('.left-column img')
            : document.getElementById(`iframe${i}`);
            
        if (element) {
            element.src = url;
        } else {
            console.warn(`Element for panel ${i} not found`);
        }
    }
    
    showNotification('✅ Ustawienia zapisane!', 'success');
    closeModal();
}

// Funkcja do resetowania URL-i do wartości domyślnych
function resetUrls() {
    if (confirm('Czy na pewno chcesz zresetować wszystkie URL-e do wartości domyślnych?')) {
        for (let i = 1; i <= 6; i++) {
            const element = i === 2 
                ? document.querySelector('.left-column img')
                : document.getElementById(`iframe${i}`);
            const urlInput = document.getElementById(`url${i}`);
            
            if (!element || !urlInput) continue;
            
            localStorage.removeItem(`iframe${i}Url`);
            const defaultUrl = defaultUrls[`iframe${i}`];
            element.src = defaultUrl;
            urlInput.value = defaultUrl;
        }
        showNotification('🔄 Ustawienia zresetowane!', 'info');
    }
}

// Funkcja do odświeżania iframe
function refreshIframe(iframeNumber) {
    const element = iframeNumber === 2 
        ? document.querySelector('.left-column img')
        : document.getElementById(`iframe${iframeNumber}`);
        
    if (!element) return;
    
    const currentSrc = element.src;
    element.src = '';
    setTimeout(() => {
        element.src = currentSrc;
    }, 100);
    showNotification(`🔄 Panel ${iframeNumber} odświeżony!`, 'info');
}

// Funkcja do pokazywania powiadomień
function showNotification(message, type = 'success') {
    // Usuń poprzednie powiadomienie jeśli istnieje
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Dodaj style
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 2000;
        animation: slideInRight 0.3s ease;
        font-weight: 600;
    `;
    
    document.body.appendChild(notification);
    
    // Usuń po 3 sekundach
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Funkcje do zarządzania modalem
function openModal() {
    document.getElementById('settingsModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Załaduj zapisane URL-e przy starcie
    loadSavedUrls();
    
    // Przycisk ustawień
    document.getElementById('settingsBtn').addEventListener('click', openModal);
    
    // Przycisk zamknięcia modala
    document.querySelector('.close-btn').addEventListener('click', closeModal);
    
    // Przycisk zapisz
    document.getElementById('saveBtn').addEventListener('click', saveUrls);
    
    // Przycisk resetuj
    document.getElementById('resetBtn').addEventListener('click', resetUrls);
    
    // Zamknij modal po kliknięciu poza nim
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('settingsModal');
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // Przyciski odświeżania
    document.querySelectorAll('.refresh-btn').forEach(button => {
        button.addEventListener('click', function() {
            const iframeNumber = this.getAttribute('data-iframe');
            refreshIframe(iframeNumber);
        });
    });
    
    // Obsługa Enter w inputach
    document.querySelectorAll('.url-input-group input').forEach(input => {
        input.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                saveUrls();
            }
        });
    });
});

// Dodaj style dla animacji powiadomień
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Obsługa błędów ładowania iframe
window.addEventListener('load', function() {
    document.querySelectorAll('iframe').forEach((iframe, index) => {
        iframe.addEventListener('error', function() {
            console.error(`Błąd ładowania iframe ${index + 1}`);
        });
    });
});
