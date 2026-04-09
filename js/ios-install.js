/**
 * ✅ iOS PWA Install Helper
 * จัดการการแจ้งเตือนติดตั้งแอปบนอุปกรณ์ iOS
 */

class iOSInstallHelper {
    constructor() {
        this.isIOS = this.detectIOS();
        this.isStandalone = this.isStandaloneMode();
        this.hasSeenHint = sessionStorage.getItem('ios-install-hint-seen') === 'true';
        
        this.init();
    }
    
    // ✅ ตรวจจับว่าเป็น iOS หรือไม่
    detectIOS() {
        const ua = navigator.userAgent || navigator.vendor || window.opera;
        return /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    }
    
    // ✅ ตรวจสอบว่าแอปเปิดในโหมด Standalone หรือไม่
    isStandaloneMode() {
        return window.matchMedia('(display-mode: standalone)').matches || 
               window.navigator.standalone === true;
    }
    
    // ✅ เริ่มต้นระบบ
    init() {
        if (!this.isIOS) return;
        
        // ถ้าเปิดในโหมด standalone → ไม่ต้องทำอะไร
        if (this.isStandalone) {
            console.log('🚀 แอปเปิดในโหมด Standalone แล้ว');
            return;
        }
        
        // รอให้หน้าเว็บโหลดเสร็จ
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.showHint());
        } else {
            this.showHint();
        }
        
        // ✅ ฟังการเปลี่ยนแปลง visibility (เมื่อผู้ใช้กลับมาที่แท็บ)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && !this.isStandalone && !this.hasSeenHint) {
                this.showHint();
            }
        });
    }
    
    // ✅ แสดงคำแนะนำ (เลือกแสดงเป็น Modal หรือ Toast)
    showHint() {
        if (this.hasSeenHint) return;
        
        // ✅ ใช้ Toast สำหรับแสดงครั้งแรก (ไม่รบกวน)
        this.showIOSToast();
        
        // ✅ หลังจาก 8 วินาที ถ้าผู้ใช้ยังไม่ปิด → แสดง Modal เต็มรูปแบบ
        setTimeout(() => {
            if (!this.hasSeenHint && document.getElementById('ios-install-hint')?.classList.contains('hidden')) {
                this.showIOSModal();
            }
        }, 8000);
    }
    
    // ✅ แสดง Toast แจ้งเตือนลอย
    showIOSToast() {
        const toast = document.getElementById('ios-toast');
        if (!toast) return;
        
        toast.classList.remove('hidden');
        
        // ✅ สร้างไอคอนถ้ายังไม่มี
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // ✅ ซ่อนอัตโนมัติหลัง 6 วินาที (ถ้าผู้ใช้ไม่ปิดเอง)
        this.toastTimeout = setTimeout(() => {
            this.closeIOSToast();
        }, 6000);
    }
    
    // ✅ ปิด Toast
    closeIOSToast() {
        const toast = document.getElementById('ios-toast');
        if (toast) {
            toast.classList.add('animate-fade-out');
            setTimeout(() => {
                toast.classList.add('hidden');
                toast.classList.remove('animate-fade-out');
            }, 300);
        }
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
    }
    
    // ✅ แสดง Modal คำแนะนำเต็มรูปแบบ
    showIOSModal() {
        const modal = document.getElementById('ios-install-hint');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }
    
    // ✅ ปิด Modal
    closeIOSModal() {
        const modal = document.getElementById('ios-install-hint');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        this.markAsSeen();
    }
    
    // ✅ บันทึกว่าผู้ใช้เห็นคำแนะนำแล้ว
    markAsSeen() {
        sessionStorage.setItem('ios-install-hint-seen', 'true');
        this.hasSeenHint = true;
    }
}

// ✅ ฟังก์ชันเรียกจาก HTML
function closeIOSInstallHint() {
    if (window.iosInstallHelper) {
        window.iosInstallHelper.closeIOSModal();
    }
}

function closeIOSToast() {
    if (window.iosInstallHelper) {
        window.iosInstallHelper.closeIOSToast();
    }
}

// ✅ เริ่มต้นเมื่อโหลดสคริปต์
document.addEventListener('DOMContentLoaded', () => {
    window.iosInstallHelper = new iOSInstallHelper();
});