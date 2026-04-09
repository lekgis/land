// ✅ ========== ลงทะเบียน Service Worker ==========
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      // ✅ ตรวจสอบว่าใช้ HTTPS หรือ localhost
      const isSecure = 
        window.location.protocol === 'https:' || 
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
      
      if (!isSecure) {
        console.warn('⚠️ Service Worker requires HTTPS or localhost');
        return;
      }
      
      // ✅ ลงทะเบียน Service Worker
      const registration = await navigator.serviceWorker.register('./sw.js', {
        scope: './'
      });
      
      console.log('✅ Service Worker registered:', registration.scope);
      
      // ✅ ตรวจสอบการอัปเดต
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 New Service Worker installing...');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // ✅ มีอัปเดตใหม่ → แจ้งผู้ใช้
            showNotification('🔄 มีเวอร์ชันใหม่! รีเฟรชหน้าเพื่ออัปเดต', 'info');
          }
        });
      });
      
      // ✅ ส่งข้อความไปหา Service Worker
      if (registration.active) {
        registration.active.postMessage({ type: 'CLIENT_READY' });
      }
      
    } catch (err) {
      console.error('❌ Service Worker registration failed:', err);
    }
  } else {
    console.warn('⚠️ Service Worker not supported in this browser');
  }
}

// ✅ ========== เริ่มต้นแอป ==========
async function initApp() {
  console.log('🚀 Initializing App...');
  
  // ✅ 1. ลงทะเบียน Service Worker
  await registerServiceWorker();
  
  // ✅ 2. เริ่มต้นแผนที่
  if (typeof initMap === 'function') {
    initMap();
  }
  
  // ✅ 3. เริ่มต้น Lucide Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // ✅ 4. เริ่มต้น PWA Handler (จาก pwa.js)
  if (typeof initPWA === 'function') {
    initPWA();
  }
  
  // ✅ 5. โหลดข้อมูล
  if (typeof loadExistingData === 'function') {
    loadExistingData();
  }
  
  console.log('✅ App initialized');
}

// ✅ เรียกใช้เมื่อหน้าเว็บพร้อม
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// ✅ ========== Helper: ตรวจสอบการเชื่อมต่อ ==========
window.isOnline = () => navigator.onLine;

window.addEventListener('online', () => {
  console.log('🌐 Online');
  showNotification('✅ เชื่อมต่ออินเทอร์เน็ตแล้ว', 'success');
  
  // ✅ พยายามซิงค์ข้อมูลที่ค้าง (ถ้ามีฟังก์ชัน)
  if (typeof processSyncQueue === 'function') {
    processSyncQueue();
  }
});

window.addEventListener('offline', () => {
  console.log('📴 Offline');
  showNotification('⚠️ โหมดออฟไลน์ - ข้อมูลจะถูกบันทึกในเครื่อง', 'warning');
});
