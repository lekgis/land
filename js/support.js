// ไฟล์: js/support.js

// ✅ ฟังก์ชันจัดการหน้าต่างสนับสนุน
function openSupportModal() {
    const modal = document.getElementById('supportModal');
    if (modal) {
        modal.style.display = 'flex';
        const img = document.getElementById('supportQRImage');
        if (img) img.src = img.src;
    }
}

function closeSupportModal() {
    const modal = document.getElementById('supportModal');
    if (modal) modal.style.display = 'none';
}

// ปิด modal เมื่อคลิกนอกเนื้อหา
document.addEventListener('click', (e) => {
    const modal = document.getElementById('supportModal');
    const content = modal?.querySelector('.support-modal-content');
    if (modal && content && !content.contains(e.target) && e.target === modal) {
        closeSupportModal();
    }
});

// ปิด modal ด้วยปุ่ม ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSupportModal();
});

// ✅ ฟังก์ชันบันทึก QR Code
async function saveQRCode() {
    const qrUrl = 'https://raw.githubusercontent.com/lekgis/land/main/icons/qrcode.png';
    const fileName = 'qrcode-support-lekgis.png';
    
    try {
        const response = await fetch(qrUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        
        showToast('✅ บันทึก QR Code เรียบร้อยแล้ว');
        
    } catch (error) {
        console.warn('Fetch failed, trying direct download:', error);
        const fallbackMsg = 'หากไม่สามารถบันทึกอัตโนมัติได้ กรุณากดค้างที่ภาพแล้วเลือก "บันทึกภาพ"';
        if (confirm('⚠️ ไม่สามารถบันทึกอัตโนมัติได้ในอุปกรณ์นี้\n\n' + fallbackMsg + '\n\nต้องการเปิดภาพในแท็บใหม่หรือไม่?')) {
            window.open(qrUrl, '_blank');
        }
    }
}

// ✅ ฟังก์ชันแสดง Toast
function showToast(message, duration = 2500) {
    const oldToast = document.getElementById('ai-toast');
    if (oldToast) oldToast.remove();
    
    const toast = document.createElement('div');
    toast.id = 'ai-toast';
    toast.style.cssText = `
        position: fixed;
        bottom: max(80px, env(safe-area-inset-bottom));
        left: 50%;
        transform: translateX(-50%);
        background: rgba(30, 41, 59, 0.95);
        color: white;
        padding: 12px 24px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        animation: toastSlide 0.3s ease;
        max-width: 90%;
        text-align: center;
        backdrop-filter: blur(8px);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        toast.style.transition = 'all 0.2s ease';
        setTimeout(() => toast.remove(), 200);
    }, duration);
}

// ✅ อนิเมชันสำหรับ toast
const toastStyle = document.createElement('style');
toastStyle.textContent = `
    @keyframes toastSlide {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
`;
document.head.appendChild(toastStyle);