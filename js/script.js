document.addEventListener('DOMContentLoaded', function() {
    // Initialize Ace Editor if available
    let editor;
    if (typeof ace !== 'undefined') {
        const codeEditor = document.getElementById('code-editor');
        if (codeEditor) {
            editor = ace.edit("code-editor");
            editor.setTheme("ace/theme/monokai");
            editor.session.setMode("ace/mode/python");
            editor.setOptions({
                fontSize: "14px",
                fontFamily: "'Fira Code', monospace",
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                showLineNumbers: true,
                showPrintMargin: false,
                tabSize: 4
            });
        }
    }

    // Settings Modal
    const modal = document.getElementById('settingsModal');
    const settingsBtn = document.getElementById('settingsBtn');
    const closeBtn = document.querySelector('.close-btn');
    const cancelBtn = document.getElementById('cancelSettings');
    const saveBtn = document.getElementById('saveSettings');
    const tabs = document.querySelectorAll('.settings-tabs .tab');
    const panes = document.querySelectorAll('.settings-pane');

    // Open modal
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        });
    }

    // Close modal
    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // Close when clicking outside modal
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Tab switching in settings
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show corresponding pane
            panes.forEach(pane => {
                if (pane.id === tabId) {
                    pane.classList.add('active');
                } else {
                    pane.classList.remove('active');
                }
            });
        });
    });

    // Save settings
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const theme = document.getElementById('theme')?.value;
            const fontSize = document.getElementById('fontSize')?.value + 'px';
            const fontFamily = document.getElementById('fontFamily')?.value;
            
            // Apply theme if theme element exists
            if (theme) {
                document.documentElement.setAttribute('data-theme', theme);
            }
            
            // Apply font settings to editor if available
            if (editor) {
                editor.setOptions({
                    fontSize: fontSize,
                    fontFamily: `'${fontFamily}', monospace`
                });
            }
            
            closeModal();
            showNotification('Settings saved successfully!');
        });
    }

    // File explorer functionality
    const folderHeaders = document.querySelectorAll('.folder-header');
    folderHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const folder = header.parentElement;
            const contents = folder.querySelector('.folder-contents');
            const chevron = header.querySelector('i.fa-chevron-right');
            
            folder.classList.toggle('expanded');
            if (contents) {
                contents.style.display = folder.classList.contains('expanded') ? 'block' : 'none';
            }
            if (chevron) {
                chevron.style.transform = folder.classList.contains('expanded') ? 'rotate(90deg)' : 'rotate(0)';
            }
        });
    });

    // File selection
    const fileItems = document.querySelectorAll('.file-item');
    fileItems.forEach(item => {
        item.addEventListener('click', () => {
            fileItems.forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            
            // Simulate file opening (in a real app, this would load the file)
            const fileName = item.textContent.trim();
            const fileExtension = fileName.split('.').pop().toLowerCase();
            
            // Update active tab if tabs exist
            const tabs = document.querySelector('.panel-tabs');
            if (tabs) {
                const tabButtons = tabs.querySelectorAll('.tab');
                tabButtons.forEach(btn => btn.classList.remove('active'));
                if (tabButtons.length > 0) {
                    tabButtons[0].classList.add('active');
                    tabButtons[0].textContent = fileName;
                }
            }
            
            // Set appropriate editor mode based on file extension if editor is available
            if (editor) {
                let mode = 'text';
                switch(fileExtension) {
                    case 'js': mode = 'javascript'; break;
                    case 'py': mode = 'python'; break;
                    case 'html': mode = 'html'; break;
                    case 'css': mode = 'css'; break;
                    case 'json': mode = 'json'; break;
                }
                editor.session.setMode(`ace/mode/${mode}`);
                
                // Set sample content
                const sampleContent = getSampleContent(fileName, fileExtension);
                editor.setValue(sampleContent, -1);
            }
        });
    });

    // Terminal simulation
    const terminal = document.getElementById('terminal');
    if (terminal) {
        const terminalInput = document.createElement('div');
        terminalInput.className = 'terminal-line';
        terminalInput.innerHTML = '$ <span class="cursor">_</span>';
        terminal.appendChild(terminalInput);
        
        // Simple command processing
        let commandHistory = [];
        let historyIndex = -1;
        
        document.addEventListener('keydown', (e) => {
            // Don't interfere with input in other elements
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || 
                                 activeElement.tagName === 'TEXTAREA' || 
                                 activeElement.isContentEditable)) {
                return;
            }
            
            if (e.key === 'Enter') {
                e.preventDefault();
                const command = terminalInput.textContent.replace(/\$\s*|\u200B/g, '').trim();
                
                if (command) {
                    // Add to history
                    commandHistory.unshift(command);
                    historyIndex = -1;
                    
                    // Process command
                    processCommand(command, terminal, terminalInput);
                    
                    // Create new input line
                    terminalInput.remove();
                    const newInput = document.createElement('div');
                    newInput.className = 'terminal-line';
                    newInput.innerHTML = '$ <span class="cursor">_</span>';
                    terminal.appendChild(newInput);
                    terminalInput = newInput;
                    
                    // Scroll to bottom
                    terminal.scrollTop = terminal.scrollHeight;
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (historyIndex < commandHistory.length - 1) {
                    historyIndex++;
                    terminalInput.innerHTML = `$ ${commandHistory[historyIndex]}<span class="cursor">_</span>`;
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIndex > 0) {
                    historyIndex--;
                    terminalInput.innerHTML = `$ ${commandHistory[historyIndex]}<span class="cursor">_</span>`;
                } else if (historyIndex === 0) {
                    historyIndex--;
                    terminalInput.innerHTML = '$ <span class="cursor">_</span>';
                }
            } else if (e.key.length === 1 || e.key === 'Backspace') {
                // If typing in terminal
                if (e.key === 'Backspace') {
                    const currentText = terminalInput.textContent.replace(/\$\s*|\u200B/g, '');
                    if (currentText.length > 0) {
                        terminalInput.textContent = '$ ' + currentText.slice(0, -1) + '_';
                    }
                } else {
                    terminalInput.textContent = terminalInput.textContent.replace('_', '') + e.key + '_';
                }
                e.preventDefault();
            }
        });
        
        // Initialize with a welcome message
        const welcome = document.createElement('div');
        welcome.className = 'terminal-line';
        welcome.textContent = 'Welcome to Arch Dashboard. Type \'help\' for available commands.';
        terminal.insertBefore(welcome, terminalInput);
    }
    
    // Auto-expand first folder
    const firstFolder = document.querySelector('.folder');
    if (firstFolder) {
        firstFolder.classList.add('expanded');
        const contents = firstFolder.querySelector('.folder-contents');
        if (contents) contents.style.display = 'block';
        const chevron = firstFolder.querySelector('.fa-chevron-right');
        if (chevron) chevron.style.transform = 'rotate(90deg)';
    }
    
    // Auto-select first file
    const firstFile = document.querySelector('.file-item');
    if (firstFile) {
        firstFile.click();
    }
    
    // Process command in terminal
    function processCommand(command, terminal, terminalInput) {
        const output = document.createElement('div');
        output.className = 'terminal-line';
        
        const args = command.split(' ');
        const cmd = args[0].toLowerCase();
        
        switch(cmd) {
            case 'clear':
                terminal.innerHTML = '';
                return;
            case 'ls':
                output.textContent = 'main.py  script.js  index.html  style.css  assets/';
                break;
            case 'neofetch':
                output.innerHTML = [
                    'OS: Arch Linux x86_64',
                    'Host: Custom Desktop',
                    'Kernel: 6.5.0-arch1-1',
                    'Uptime: 2d 4h 32m',
                    'Shell: zsh 5.9',
                    'Resolution: 2560x1440',
                    'DE: GNOME 44',
                    'WM: Mutter',
                    'CPU: AMD Ryzen 9 5900X (24) @ 3.7GHz',
                    'GPU: NVIDIA GeForce RTX 3080',
                    'Memory: 16GB / 32GB'
                ].join('\n');
                break;
            case 'help':
                output.textContent = 'Available commands: clear, ls, neofetch, help';
                break;
            default:
                output.textContent = `Command not found: ${cmd}. Type 'help' for available commands.`;
        }
        
        if (terminal && terminalInput) {
            terminal.insertBefore(output, terminalInput);
        }
    }
    
    // Sample file content
    function getSampleContent(filename, extension) {
        const samples = {
            'js': '// JavaScript file\nfunction helloWorld() {\n    console.log("Hello, World!");\n    return "JavaScript is awesome!";\n}\n\n// Call the function\nhelloWorld();',
            'py': '# Python file\ndef main():\n    print("Hello, World!")\n    return "Python is powerful!"\n\nif __name__ == "__main__":\n    main()',
            'html': '<!DOCTYPE html>\n<html>\n<head>\n    <title>Sample HTML</title>\n    <style>\n        body { font-family: Arial, sans-serif; }\n        .container { padding: 20px; }\n    </style>\n</head>\n<body>\n    <div class="container">\n        <h1>Hello, World!</h1>\n        <p>This is a sample HTML file.</p>\n    </div>\n</body>\n</html>',
            'css': '/* Sample CSS */\nbody {\n    margin: 0;\n    padding: 0;\n    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;\n    line-height: 1.6;\n    color: #333;\n}\n\n.container {\n    max-width: 1200px;\n    margin: 0 auto;\n    padding: 0 20px;\n}\n\n.btn {\n    display: inline-block;\n    padding: 8px 16px;\n    background: #007bff;\n    color: white;\n    text-decoration: none;\n    border-radius: 4px;\n    cursor: pointer;\n}\n\n.btn:hover {\n    background: #0056b3;\n}',
            'json': '{\n    "name": "sample-json",\n    "version": "1.0.0",\n    "description": "Sample JSON configuration file",\n    "main": "index.js",\n    "scripts": {\n        "start": "node index.js",\n        "test": "echo \"Error: no test specified\" && exit 1"\n    },\n    "dependencies": {\n        "express": "^4.17.1",\n        "react": "^17.0.2"\n    }\n}'
        };
        
        return samples[extension] || `// ${filename}\n// This is a sample ${extension ? extension.toUpperCase() : 'TEXT'} file.\n// Your content will be loaded here in a real application.`;
    }
    
    // Show notification
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        if (document.body) {
            document.body.appendChild(notification);
            
            // Auto-remove after 3 seconds
            setTimeout(() => {
                notification.classList.add('fade-out');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, 3000);
        }
    }
    // Initialize with a welcome message if terminal exists
    const terminal = document.getElementById('terminal');
    if (terminal) {
        const welcome = document.createElement('div');
        welcome.className = 'terminal-line';
        welcome.textContent = 'Welcome to Arch Dashboard. Type \'help\' for available commands.';
        terminal.appendChild(welcome);
    }
    
    // Auto-expand first folder
    const firstFolder = document.querySelector('.folder');
    if (firstFolder) {
        firstFolder.classList.add('expanded');
        const contents = firstFolder.querySelector('.folder-contents');
        if (contents) contents.style.display = 'block';
        const chevron = firstFolder.querySelector('.fa-chevron-right');
        if (chevron) chevron.style.transform = 'rotate(90deg)';
    }
    
    // Auto-select first file
    const firstFile = document.querySelector('.file-item');
    if (firstFile) {
        firstFile.click();
    }
});
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
