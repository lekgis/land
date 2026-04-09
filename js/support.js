/**
 * ✅ Support Functions - ฟังก์ชันช่วยเหลือทั่วไป
 */

// ✅ ตรวจสอบว่าเป็นมือถือหรือไม่
function isMobile() {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// ✅ ตรวจสอบว่าเป็น Tablet หรือไม่
function isTablet() {
  const ua = navigator.userAgent;
  return /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua);
}

// ✅ ตรวจสอบว่าเป็น Desktop หรือไม่
function isDesktop() {
  return !isMobile() && !isTablet();
}

// ✅ Debounce Function (สำหรับลดการเรียกซ้ำ)
function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

// ✅ Throttle Function (สำหรับจำกัดความถี่)
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ✅ Format Number (แสดงทศนิยมตามต้องการ)
function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return parseFloat(num).toFixed(decimals);
}

// ✅ Format Date ไทย + พ.ศ.
function formatThaiDate(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 
                    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear() + 543; // พ.ศ.
    const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    
    return `${day} ${month} ${year} ${time}`;
  } catch (e) {
    return dateString;
  }
}

// ✅ Copy to Clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // ✅ Fallback สำหรับเบราว์เซอร์เก่า
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch (e) {
      document.body.removeChild(textarea);
      return false;
    }
  }
}

// ✅ Download File Helper
function downloadFile(content, filename, mimeType = 'application/octet-stream') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // ✅ Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// ✅ Generate Unique ID
function generateId(prefix = '') {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ✅ Parse Query String
function parseQueryString(url) {
  const params = {};
  const queryString = url.split('?')[1];
  
  if (!queryString) return params;
  
  queryString.split('&').forEach(param => {
    const [key, value] = param.split('=');
    params[decodeURIComponent(key)] = decodeURIComponent(value || '');
  });
  
  return params;
}

// ✅ Build Query String
function buildQueryString(params) {
  return Object.entries(params)
    .map(([key, value]) => 
      `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join('&');
}

// ✅ LocalStorage Helper (พร้อม Error Handling)
const Storage = {
  set(key, value, expiryMinutes = null) {
    try {
      const item = {
        value,
        timestamp: Date.now(),
        expiry: expiryMinutes ? Date.now() + (expiryMinutes * 60 * 1000) : null
      };
      localStorage.setItem(key, JSON.stringify(item));
      return true;
    } catch (e) {
      console.warn('⚠️ localStorage set failed:', e);
      return false;
    }
  },
  
  get(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      
      // ✅ ตรวจสอบว่าหมดอายุหรือไม่
      if (parsed.expiry && Date.now() > parsed.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      
      return parsed.value;
    } catch (e) {
      console.warn('⚠️ localStorage get failed:', e);
      return null;
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn('⚠️ localStorage remove failed:', e);
      return false;
    }
  },
  
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.warn('⚠️ localStorage clear failed:', e);
      return false;
    }
  }
};

// ✅ Export ทั้งหมด
window.Support = {
  isMobile,
  isTablet,
  isDesktop,
  debounce,
  throttle,
  formatNumber,
  formatThaiDate,
  copyToClipboard,
  downloadFile,
  generateId,
  parseQueryString,
  buildQueryString,
  Storage
};
