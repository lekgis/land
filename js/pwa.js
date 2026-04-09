// ไฟล์: js/pwa.js

let deferredPrompt;
const installContainer = document.getElementById('pwa-install-container');
const installBtn = document.getElementById('pwa-install-btn');
const isSecure = window.location.protocol === 'https:' || 
                 window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1';

if ('serviceWorker' in navigator && isSecure) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then((reg) => console.log('✅ SW registered:', reg.scope))
            .catch(err => console.warn('❌ SW failed:', err.message));
    });
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (installContainer) {
            installContainer.style.display = 'block';
            const btn = document.getElementById('pwa-install-btn');
            btn.classList.add('animate-bounce');                    
        }
    });
    
    installBtn?.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`Install ${outcome}`);
            deferredPrompt = null;
            if (installContainer) installContainer.style.display = 'none';
        }
    });
    
    window.addEventListener('appinstalled', () => {
        console.log('🚀 PWA installed!');
        if (installContainer) installContainer.style.display = 'none';
    });
}

function showIOSInstallHint() {
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isIOS && !isStandalone) {
        const hint = document.createElement('div');
        hint.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-white px-5 py-4 rounded-2xl shadow-2xl text-center text-xs max-w-xs';
        hint.innerHTML = `<p class="font-bold text-blue-600 mb-1">แอปวัดที่ดิน อ.เล็ก 🍎 iPhone</p><p class="text-gray-700">กดปุ่ม <strong>มุนบนขวา</strong> 📤 → <strong>"เพิ่มลงในหน้าจอหลัก"</strong></p><button onclick="this.parentElement.remove()" class="mt-2 text-blue-600">ปิด</button>`;
        document.body.appendChild(hint);
    }
}

setTimeout(showIOSInstallHint, 3000);