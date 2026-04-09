/**
 * ✅ PWA Install Handler - จัดการติดตั้งแอปแบบครบวงจร
 */

let deferredPrompt = null;
let isStandalone = false;

// ✅ ตรวจสอบว่าแอปทำงานในโหมด Standalone หรือไม่
function checkStandaloneMode() {
  isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://');
  
  console.log('📱 Standalone mode:', isStandalone);
  return isStandalone;
}

// ✅ แสดงแบนเนอร์ติดตั้งแอป
function showInstallBanner() {
  const banner = document.getElementById('pwa-install-banner');
  if (banner) {
    banner.style.display = 'block';
    console.log('🔔 แสดงแบนเนอร์ติดตั้งแอป');
    
    // ✅ บันทึกว่าแสดงแล้ว (ไม่แสดงซ้ำใน 7 วัน)
    localStorage.setItem('pwa-banner-shown', Date.now().toString());
  }
}

// ✅ ซ่อนแบนเนอร์ติดตั้งแอป
function hideInstallBanner() {
  const banner = document.getElementById('pwa-install-banner');
  if (banner) {
    banner.style.display = 'none';
  }
}

// ✅ แสดงคำแนะนำสำหรับ iOS
function showIOSInstallHint() {
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isNotStandalone = !checkStandaloneMode();
  
  if (isIOS && isNotStandalone) {
    // ✅ ตรวจสอบว่าผู้ใช้ปิดคำแนะนำนี้แล้วหรือไม่
    const hintDismissed = sessionStorage.getItem('ios-hint-dismissed');
    
    if (!hintDismissed) {
      const hint = document.getElementById('ios-install-hint');
      if (hint) {
        hint.style.display = 'block';
        
        // ✅ ปุ่มปิดคำแนะนำ
        document.getElementById('ios-hint-close')?.addEventListener('click', () => {
          hint.style.display = 'none';
          sessionStorage.setItem('ios-hint-dismissed', 'true');
        });
        
        // ✅ ซ่อนอัตโนมัติหลัง 15 วินาที
        setTimeout(() => {
          if (hint.style.display !== 'none') {
            hint.style.opacity = '0';
            setTimeout(() => { hint.style.display = 'none'; }, 300);
          }
        }, 15000);
      }
    }
  }
}

// ✅ จัดการเหตุการณ์ก่อนติดตั้ง (beforeinstallprompt)
function setupBeforeInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // ป้องกันการโชว์พรอมต์อัตโนมัติของเบราว์เซอร์
    deferredPrompt = e;
    
    console.log('✨ PWA install prompt available');
    
    // ✅ ตรวจสอบว่าเคยแสดงแบนเนอร์แล้วใน 7 วันหรือไม่
    const lastShown = localStorage.getItem('pwa-banner-shown');
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    
    if (!lastShown || (Date.now() - parseInt(lastShown)) > sevenDays) {
      // ✅ แสดงแบนเนอร์ติดตั้งแอป
      showInstallBanner();
    }
  });
}

// ✅ จัดการเมื่อผู้ใช้คลิกปุ่มติดตั้ง
function setupInstallButton() {
  document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
    if (!deferredPrompt) {
      console.warn('⚠️ ไม่พบ deferredPrompt');
      return;
    }
    
    const btn = document.getElementById('pwa-install-btn');
    const originalText = btn.innerHTML;
    
    // ✅ แสดงสถานะกำลังติดตั้ง
    btn.disabled = true;
    btn.innerHTML = '<span class="animate-spin">⏳</span> กำลังติดตั้ง...';
    
    try {
      // ✅ แสดงพรอมต์ติดตั้ง
      deferredPrompt.prompt();
      
      // ✅ รอผลจากผู้ใช้
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`📦 Install ${outcome}`);
      
      if (outcome === 'accepted') {
        // ✅ ติดตั้งสำเร็จ
        hideInstallBanner();
        showNotification('✅ ติดตั้งแอปสำเร็จ! สามารถใช้งานแบบออฟไลน์ได้', 'success');
      } else {
        // ✅ ผู้ใช้ยกเลิก → คืนค่าปุ่ม
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
      
      // ✅ ล้าง deferredPrompt
      deferredPrompt = null;
      
    } catch (err) {
      console.error('❌ Install error:', err);
      btn.disabled = false;
      btn.innerHTML = originalText;
      showNotification('❌ เกิดข้อผิดพลาดในการติดตั้ง', 'error');
    }
  });
}

// ✅ จัดการปุ่มปิดแบนเนอร์
function setupCloseInstallBanner() {
  document.getElementById('pwa-install-close')?.addEventListener('click', () => {
    hideInstallBanner();
    // ✅ บันทึกว่าผู้ใช้ปิดเอง (ไม่แสดงอีกใน 30 วัน)
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  });
}

// ✅ แสดงแจ้งเตือน (Helper)
function showNotification(message, type = 'info') {
  // ✅ ใช้ฟังก์ชันเดิมของคุณถ้ามี
  if (typeof window.showNotificationLeft === 'function') {
    window.showNotificationLeft(message, type);
  } else {
    // ✅ Fallback: แสดงแจ้งเตือนแบบง่าย
    const notification = document.createElement('div');
    notification.className = `fixed top-4 left-4 z-[9999] px-4 py-3 rounded-lg shadow-lg text-white font-medium ${
      type === 'success' ? 'bg-green-600' :
      type === 'error' ? 'bg-red-600' :
      type === 'warning' ? 'bg-yellow-600' :
      'bg-blue-600'
    }`;
    notification.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// ✅ ตรวจสอบและเริ่มระบบ PWA
function initPWA() {
  console.log('🚀 Initializing PWA...');
  
  // ✅ 1. ตรวจสอบโหมด Standalone
  checkStandaloneMode();
  
  // ✅ 2. ถ้าเป็น Standalone → ซ่อนปุ่มติดตั้งทั้งหมด
  if (isStandalone) {
    hideInstallBanner();
    console.log('✅ App running in standalone mode');
    return;
  }
  
  // ✅ 3. ตั้งค่า Event Listeners
  setupBeforeInstallPrompt();
  setupInstallButton();
  setupCloseInstallBanner();
  
  // ✅ 4. แสดงคำแนะนำ iOS (ถ้าจำเป็น)
  showIOSInstallHint();
  
  // ✅ 5. ตรวจสอบว่าแอปติดตั้งแล้วหรือไม่ (สำหรับ Analytics)
  window.addEventListener('appinstalled', () => {
    console.log('🎉 PWA installed!');
    hideInstallBanner();
    showNotification('🎉 ขอบคุณที่ติดตั้งแอป "วัดที่ดิน"!', 'success');
    
    // ✅ บันทึกเหตุการณ์ติดตั้ง (ถ้ามีระบบติดตาม)
    if (typeof gtag === 'function') {
      gtag('event', 'pwa_installed', {
        'event_category': 'engagement',
        'event_label': 'app_install'
      });
    }
  });
}

// ✅ เรียกใช้เมื่อหน้าเว็บโหลดเสร็จ
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPWA);
} else {
  initPWA();
}

// ✅ Export functions สำหรับใช้ภายนอก (ถ้าจำเป็น)
window.PWA = {
  showInstallBanner,
  hideInstallBanner,
  showIOSInstallHint,
  checkStandaloneMode
};
