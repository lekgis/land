// ไฟล์: js/pwa.js

let deferredPrompt;
const installContainer = document.getElementById('pwa-install-container');
const installBtn = document.getElementById('pwa-install-btn');
const isSecure = window.location.protocol === 'https:' || 
                 window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1';

// ✅ ตรวจสอบอุปกรณ์
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

if ('serviceWorker' in navigator && isSecure) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then((reg) => console.log('✅ SW registered:', reg.scope))
            .catch(err => console.warn('❌ SW failed:', err.message));
    });
    
    // ✅ Android: beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        // ✅ แสดงปุ่มติดตั้งเฉพาะบน Android เท่านั้น
        if (installContainer && !isIOS) {
            installContainer.style.display = 'block';
            const btn = document.getElementById('pwa-install-btn');
            btn?.classList.add('animate-bounce');                    
        }
    });
    
    // ✅ Android: Install button click
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

// ✅ iOS: แสดงคำแนะนำการติดตั้งแบบมีปุ่มและภาพประกอบ
function showIOSInstallHint() {
    // ✅ แสดงเฉพาะบน iOS และยังไม่ติดตั้ง
    if (!isIOS || isStandalone) return;
    
    // ✅ ตรวจสอบว่าเคยแสดงแล้วหรือไม่
    if (localStorage.getItem('ios_hint_shown')) return;
    
    const hint = document.createElement('div');
    hint.id = 'ios-install-hint';
    hint.className = 'fixed inset-0 z-[9999] bg-black/70 flex items-end justify-center p-4';
    hint.innerHTML = `
        <div class="bg-white rounded-2xl p-5 max-w-sm w-full text-center shadow-2xl animate-slide-up">
            <div class="text-4xl mb-3">🍎</div>
            <h3 class="font-bold text-lg text-gray-800 mb-2">ติดตั้งแอปวัดที่ดิน</h3>
            <p class="text-gray-600 text-sm mb-4">
                กดปุ่ม <strong>แชร์</strong> 📤 → <strong>"เพิ่มลงในหน้าจอหลัก"</strong>
            </p>
            
            <!-- ✅ ภาพประกอบขั้นตอน -->
            <div class="flex justify-center gap-4 mb-4">
                <div class="text-center">
                    <div class="w-12 h-12 mx-auto bg-gray-100 rounded-lg flex items-center justify-center text-2xl mb-1">📤</div>
                    <span class="text-xs text-gray-500">1. แชร์</span>
                </div>
                <div class="text-center">
                    <div class="w-12 h-12 mx-auto bg-gray-100 rounded-lg flex items-center justify-center text-xl mb-1">➕</div>
                    <span class="text-xs text-gray-500">2. เพิ่ม</span>
                </div>
            </div>
            
            <!-- ✅ ลูกศรชี้ปุ่มแชร์ -->
            <div class="relative h-8 mb-2">
                <div class="absolute right-0 top-0 text-2xl animate-bounce">👆</div>
            </div>
            
            <!-- ✅ ปุ่มรับทราบ -->
            <button onclick="closeIOSInstallHint()" class="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold mt-2 hover:bg-blue-700 transition">
                รับทราบ
            </button>
        </div>
    `;
    document.body.appendChild(hint);
    
    // ✅ บันทึกว่าเคยแสดงแล้ว
    localStorage.setItem('ios_hint_shown', 'true');
}

// ✅ ปิดคำแนะนำ iOS
function closeIOSInstallHint() {
    const hint = document.getElementById('ios-install-hint');
    if (hint) {
        hint.style.opacity = '0';
        hint.style.transition = 'opacity 0.2s ease';
        setTimeout(() => hint.remove(), 200);
    }
}

// ✅ เพิ่ม CSS อนิเมชัน
const iosHintStyle = document.createElement('style');
iosHintStyle.textContent = `
    @keyframes slide-up {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    .animate-slide-up {
        animation: slide-up 0.3s ease;
    }
`;
document.head.appendChild(iosHintStyle);

// ✅ แสดงคำแนะนำหลังจากผู้ใช้มีปฏิสัมพันธ์กับหน้าเว็บ (ดีกว่าแสดงทันที)
document.addEventListener('click', function initIOSHint() {
    showIOSInstallHint();
    document.removeEventListener('click', initIOSHint);
}, { once: true });

// ✅ Fallback: แสดงหลังจาก 5 วินาทีถ้าผู้ใช้ไม่คลิก
setTimeout(() => {
    showIOSInstallHint();
}, 5000);
