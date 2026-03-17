// ไฟล์: js/app.js

// ตัวแปร global
let map, measureSource, measureVector, draftSource, draftVector;
let activeMeasureType = null;
let overlay;
let moveEndTimeout;

// Styles
const NODE_STYLE = new ol.style.Style({
    image: new ol.style.Circle({
        radius: 6, 
        fill: new ol.style.Fill({ color: '#ffffff' }),
        stroke: new ol.style.Stroke({ color: '#3b82f6', width: 2 })
    })
});

const DRAFT_LINE_STYLE = new ol.style.Style({
    stroke: new ol.style.Stroke({ color: '#ffffff', width: 2, lineDash: [8, 8] })
});

const createLabelStyle = (textRows) => {
    return new ol.style.Text({
        text: textRows.join('\n'),
        font: 'bold 14px Prompt, sans-serif',
        textAlign: 'center',
        fill: new ol.style.Fill({ color: '#000000' }),
        stroke: new ol.style.Stroke({ color: '#ffffff', width: 3 }),
        offsetY: 0,
        lineHeight: 1.4
    });
};

// ✅ ✅ ✅ ฟังก์ชันแสดงป้ายแปลงที่ดิน (แก้ไขใหม่) ✅ ✅ ✅
const parcelStyle = (feature, resolution) => {
    const view = map.getView();
    const zoom = view.getZoom();
    
    // ✅ ซ่อน label เมื่อซูมออก (ป้องกันหน้าจอมืด/ซ้อนทับ)
    if (zoom < 18) {
        return new ol.style.Style({
            stroke: new ol.style.Stroke({ color: '#ff0000', width: 1 }),
            fill: new ol.style.Fill({ color: 'rgba(0, 0, 0, 0)' })
        });
    }
    
    const code = feature.get('parcel_cod') || '';
    const title = feature.get('title') || '';
    const fname = feature.get('fname') || '';
    const lname = feature.get('lname') || '';
    const ownerName = `${title}${fname} ${lname}`.trim();
    
    // ✅ ข้อ 1: ตัดชื่อเจ้าของเมื่อเกิน 20 ตัวอักษร
    const maxNameLength = 50;
    const displayName = ownerName.length > maxNameLength 
        ? ownerName.substring(0, maxNameLength) + '...' 
        : ownerName;
    
    if (!code) {
        return new ol.style.Style({
            stroke: new ol.style.Stroke({ color: '#ff0000', width: 1 }),
            fill: new ol.style.Fill({ color: 'rgba(0, 0, 0, 0)' })
        });
    }
    
    // ✅ ข้อ 2: สร้าง Style ที่มี Text 2 อันซ้อนกัน (แสดงระดับซูมเดียวกัน)
    const styles = [
        new ol.style.Style({
            stroke: new ol.style.Stroke({ color: '#ff0000', width: 1.5 }),
            fill: new ol.style.Fill({ color: 'rgba(0, 0, 0, 0)' }) // เติมสีพื้นจางๆ เล็กน้อย
        })
    ];
    
    // ✅ บรรทัดที่ 1: รหัสแปลง (สีแดงขอบขาว)
    styles.push(new ol.style.Style({
        text: new ol.style.Text({
            text: code.toString(),
            font: 'bold 12px Prompt, sans-serif',
            fill: new ol.style.Fill({ color: '#ff0000' }),
            stroke: new ol.style.Stroke({ color: '#ffffff', width: 2.5 }),
            offsetY: -12,
            textAlign: 'center',
            zIndex: 100
        })
    }));
    
    // ✅ บรรทัดที่ 2: ชื่อเจ้าของ (สีน้ำเงินขอบขาว) - แสดงเฉพาะเมื่อมีข้อมูล
    if (displayName) {
        styles.push(new ol.style.Style({
            text: new ol.style.Text({
                text: displayName,
                font: '12px Prompt, sans-serif',
                fill: new ol.style.Fill({ color: '#4285F4' }),  // ✅ สีน้ำเงิน
                stroke: new ol.style.Stroke({ color: '#ffffff', width: 2.7 }),
                offsetY: 8,  // ✅ วางใต้บรรทัดแรก
                textAlign: 'center',
                zIndex: 100
            })
        }));
    }
    
    return styles;
};

function getUTM(lat, lon) {
    const zone = lon < 102 ? 47 : 48;
    const x = ((lon - (zone === 47 ? 99 : 105)) * 111319 * Math.cos(lat * Math.PI / 180) + 500000).toFixed(0);
    const y = (lat * 111132).toFixed(0);
    return `UTM ${zone}N: ${x}, ${y}`;
}
const measureStyle = (feature) => {
    const geom = feature.getGeometry();
    const styles = [
        new ol.style.Style({
            stroke: new ol.style.Stroke({ color: '#3b82f6', width: 4 }),
            fill: new ol.style.Fill({ color: 'rgba(59, 130, 246, 0.2)' })
        })
    ];
    if (geom.getType() === 'LineString') {
        geom.getCoordinates().forEach(coord => {
            styles.push(new ol.style.Style({ geometry: new ol.geom.Point(coord), image: NODE_STYLE.getImage() }));
        });
        const len = ol.sphere.getLength(geom);
        styles.push(new ol.style.Style({
            geometry: new ol.geom.Point(geom.getLastCoordinate()),
            text: createLabelStyle([len > 1000 ? (len/1000).toFixed(2)+' กม.' : len.toFixed(1)+' ม.']),
            zIndex: 100
        }));
    } else if (geom.getType() === 'Polygon') {
        geom.getCoordinates()[0].forEach(coord => {
            styles.push(new ol.style.Style({ geometry: new ol.geom.Point(coord), image: NODE_STYLE.getImage() }));
        });
        const interiorPoint = geom.getInteriorPoint().getCoordinates();
        const lonLat = ol.proj.toLonLat(interiorPoint);
        const area = ol.sphere.getArea(geom);
        styles.push(new ol.style.Style({
            geometry: new ol.geom.Point(interiorPoint),
            text: createLabelStyle([
                formatThaiArea(area),
                `LAT/LONG: ${lonLat[1].toFixed(6)}, ${lonLat[0].toFixed(6)}`,
                getUTM(lonLat[1], lonLat[0])
            ]),
            zIndex: 100
        }));
    }
    return styles;
};
function init() {
    const lastPos = JSON.parse(localStorage.getItem('ol_pos_v2') || '{"lon":103.057069,"lat":15.418727,"zoom":16}');
    const container = document.getElementById('popup');
    const closer = document.getElementById('popup-closer');
    overlay = new ol.Overlay({
        element: container,
        autoPan: { animation: { duration: 250 } }
    });
    closer.onclick = () => { overlay.setPosition(undefined); return false; };
    const googleSatellite = new ol.layer.Tile({
        source: new ol.source.XYZ({
            url: 'https://mt{0-3}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
            maxZoom: 22
        })
    });
    draftVector = new ol.layer.Vector({
        source: new ol.source.Vector(),
        style: DRAFT_LINE_STYLE,
        zIndex: 90,
        updateWhileInteracting: true,  // ✅ อัปเดตขณะผู้ใช้เลื่อน/แพนแผนที่
        updateWhileAnimating: true     // ✅ อัปเดตขณะแผนที่กำลังแอนิเมชัน (ซูม, ฟิต)
    });
    measureVector = new ol.layer.Vector({
        source: new ol.source.Vector(),
        style: measureStyle,
        zIndex: 100
    });
    map = new ol.Map({
        target: 'map',
        overlays: [overlay],
        layers: [googleSatellite, draftVector, measureVector],
        view: new ol.View({
            center: ol.proj.fromLonLat([lastPos.lon, lastPos.lat]),
            zoom: lastPos.zoom,
            maxZoom: 24,
            enableRotation: false
        })
    });
    // ✅ เพิ่มส่วนนี้: อัปเดตเส้นปะแบบ Real-time ทุกเฟรมที่แผนที่เรนเดอร์
    map.on('postrender', function() {
        // ทำงานเฉพาะตอนเปิดโหมดวัดระยะหรือวัดพื้นที่เท่านั้น
        if (activeMeasureType) {
            updateDraftLine();
        }
    });
    measureSource = measureVector.getSource();
    draftSource = draftVector.getSource();
    createUserLocationMarker();
    map.on('singleclick', (evt) => {
        if (typeof activeMeasureType !== 'undefined' && activeMeasureType) return;
        const feature = map.forEachFeatureAtPixel(evt.pixel, (feat, layer) => { return feat; }, { hitTolerance: 5 });
        if (feature) {
            const props = feature.getProperties();
            const lonLat = ol.proj.toLonLat(evt.coordinate);
            let content = `<div class="p-1"><h3 class="font-bold text-blue-600 mb-2 border-b pb-1">ข้อมูลแปลงที่ดิน</h3><table class="w-full text-xs">`;
            for (const [key, val] of Object.entries(props)) {
                if (key !== 'geometry' && key !== 'boundedBy') {
                    const displayVal = (val === null || val === undefined || val === '' || val === 'null') ? '-' : val;
                    content += `<tr><td class="font-semibold py-0.5 pr-2">${key}:</td><td>${displayVal}</td></tr>`;
                }
            }
            content += `</table><div class="mt-3 pt-2 border-t text-[10px] text-gray-500">${typeof getUTM === 'function' ? getUTM(lonLat[1], lonLat[0]) : ''}</div></div>`;
            document.getElementById('popup-content').innerHTML = content;
            overlay.setPosition(evt.coordinate);
        } else {
            overlay.setPosition(undefined);
        }
    });
    let moveEndTimeout;
    map.on('moveend', () => {
        clearTimeout(moveEndTimeout);
        moveEndTimeout = setTimeout(() => {
            const view = map.getView();
            const center = ol.proj.toLonLat(view.getCenter());
            localStorage.setItem('ol_pos_v2', JSON.stringify({ lon: center[0], lat: center[1], zoom: view.getZoom() }));
            if (typeof updateDraftLine === 'function') updateDraftLine();
        }, 100);
    });
}
function getCrosshairMapCoordinate() {
    const size = map.getSize();
    if (!size) return null;
    // ✅ คำนวณพิกัดจากตำแหน่งกลางจอแนวนอน และ 35% ของความสูงจอ (ตามตำแหน่ง crosshair ใน CSS)
    return map.getCoordinateFromPixel([size[0] / 2, size[1] * 0.35]);
}
function updateDraftLine() {
    if (!activeMeasureType) return;
    draftSource.clear();
    const feats = measureSource.getFeatures();
    if (!feats.length) return;
    const cross = getCrosshairMapCoordinate();
    const geom = feats[0].getGeometry();
    if (activeMeasureType === 'LineString') {
        const c = geom.getCoordinates();
        draftSource.addFeature(new ol.Feature(new ol.geom.LineString([c[c.length - 1], cross])));
    } else if (activeMeasureType === 'Polygon') {
        const r = geom.getCoordinates()[0];
        draftSource.addFeature(new ol.Feature(new ol.geom.LineString([r[r.length - 2], cross])));
        if (r.length > 3) draftSource.addFeature(new ol.Feature(new ol.geom.LineString([cross, r[0]])));
    }
}
function addPointAtCrosshair() {
    const cross = getCrosshairMapCoordinate();
    const feats = measureSource.getFeatures();
    if (feats.length > 0) {
        const geom = feats[0].getGeometry();
        if (activeMeasureType === 'LineString') {
            const c = geom.getCoordinates(); c.push(cross); geom.setCoordinates(c);
        } else {
            const r = geom.getCoordinates()[0]; r.splice(r.length - 1, 0, cross); geom.setCoordinates([r]);
        }
    } else {
        const f = activeMeasureType === 'LineString' 
            ? new ol.Feature(new ol.geom.LineString([cross, cross]))
            : new ol.Feature(new ol.geom.Polygon([[cross, cross, cross]]));
        measureSource.addFeature(f);
    }
    document.getElementById('confirmContainer').style.display = 'block';
    updateDraftLine();
}
function undoPoint() {
    const feats = measureSource.getFeatures();
    if (!feats.length) return;
    const geom = feats[0].getGeometry();
    if (activeMeasureType === 'LineString') {
        const c = geom.getCoordinates(); 
        if (c.length > 2) { c.pop(); geom.setCoordinates(c); } else { measureSource.clear(); document.getElementById('confirmContainer').style.display = 'none'; }
    } else {
        const r = geom.getCoordinates()[0];
        if (r.length > 4) { r.splice(r.length - 2, 1); geom.setCoordinates([r]); } else { measureSource.clear(); document.getElementById('confirmContainer').style.display = 'none'; }
    }
    updateDraftLine();
}
function toggleMeasure(type) {
    const lineBtn = document.getElementById('measureLineBtn');
    const areaBtn = document.getElementById('measureAreaBtn');
    const cross = document.getElementById('crosshair');
    const ctrl = document.getElementById('drawControls');
    measureSource.clear(); draftSource.clear();
    document.getElementById('confirmContainer').style.display = 'none';
    overlay.setPosition(undefined);
    if (activeMeasureType === type) {
        activeMeasureType = null;
        lineBtn.classList.remove('active'); areaBtn.classList.remove('active');
        cross.style.display = 'none'; ctrl.style.display = 'none';
        return;
    }
    activeMeasureType = type;
    lineBtn.classList.toggle('active', type === 'LineString');
    areaBtn.classList.toggle('active', type === 'Polygon');
    cross.style.display = 'block'; ctrl.style.display = 'flex';
}
function finishMeasurement() {
    activeMeasureType = null;
    draftSource.clear();
    document.getElementById('crosshair').style.display = 'none';
    document.getElementById('drawControls').style.display = 'none';
    document.getElementById('confirmContainer').style.display = 'none';
    document.getElementById('measureLineBtn').classList.remove('active');
    document.getElementById('measureAreaBtn').classList.remove('active');
}
function formatThaiArea(sqm) {
    const r = Math.floor(sqm/1600), n = Math.floor((sqm%1600)/400), w = ((sqm%400)/4).toFixed(1);
    
    // ✅ เพิ่มหน่วย ตร.ม. หรือ ตร.กม. ตามขนาดพื้นที่
    let metricUnit = '';
    if (sqm < 1000000) {
        // น้อยกว่า 1 ตร.กม. → แสดงเป็น ตร.ม. (ทศนิยม 2 ตำแหน่ง)
        metricUnit = sqm.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' ตร.ม.';
    } else {
        // 1 ตร.กม. ขึ้นไป → แสดงเป็น ตร.กม. (✅ ปรับเป็นทศนิยม 2 ตำแหน่ง)
        metricUnit = (sqm / 1000000).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' ตร.กม.';
    }
    
    return `พื้นที่: ${r}-${n}-${w} ไร่ ${metricUnit}`;
}
// ✅ ตัวแปรจัดการตำแหน่งผู้ใช้
let userLocationOverlay, accuracyOverlay, watchId = null;
let isTrackingLocation = false;
let lastKnownPosition = null;

// ✅ สร้าง Overlay สำหรับจุดตำแหน่งผู้ใช้
function createUserLocationMarker() {
    const markerEl = document.createElement('div');
    markerEl.className = 'user-location-marker';
    userLocationOverlay = new ol.Overlay({
        element: markerEl,
        positioning: 'center-center',
        stopEvent: false,
        zIndex: 1000
    });
    map.addOverlay(userLocationOverlay);

    const accuracyEl = document.createElement('div');
    accuracyEl.className = 'accuracy-circle';
    accuracyEl.style.display = 'none';
    accuracyOverlay = new ol.Overlay({
        element: accuracyEl,
        positioning: 'center-center',
        stopEvent: false,
        zIndex: 999
    });
    map.addOverlay(accuracyOverlay);
}
// ✅ ฟังก์ชันเริ่มติดตามตำแหน่ง (เรียกอัตโนมัติ)
function startLocationTracking() {
    if (!navigator.geolocation) {
        console.warn('⚠️ เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง');
        return;
    }
    
    isTrackingLocation = true;
    
    const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
    };
    
    watchId = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            const coord = ol.proj.fromLonLat([longitude, latitude]);
            
            // อัปเดตตำแหน่งจุด marker
            userLocationOverlay.setPosition(coord);
            lastKnownPosition = coord;
            
            // อัปเดตวงความแม่นยำ (แสดงเฉพาะเมื่อความแม่นยำ <= 50 เมตร)
            if (accuracyOverlay && accuracy <= 50) {
                const accElement = accuracyOverlay.getElement();
                const zoom = map.getView().getZoom();
                const pixelsPerMeter = Math.pow(2, zoom) * 0.59;
                const radiusPx = Math.min(accuracy * pixelsPerMeter, 150); // จำกัดขนาดสูงสุด
                accElement.style.width = `${radiusPx * 2}px`;
                accElement.style.height = `${radiusPx * 2}px`;
                accElement.style.display = 'block';
                accuracyOverlay.setPosition(coord);
            } else if (accuracyOverlay) {
                accuracyOverlay.getElement().style.display = 'none';
            }
            
            // ซูมไปตำแหน่งครั้งแรกเท่านั้น
            if (!userLocationOverlay._initialZoomed) {
                map.getView().animate({
                    center: coord,
                    zoom: 19,
                    duration: 500
                });
                userLocationOverlay._initialZoomed = true;
            }
            
            // อัปเดตพิกัดใน UI (ถ้ามี)
            const coordDisplay = document.getElementById('coord-display');
            if (coordDisplay) {
                coordDisplay.textContent = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                coordDisplay.classList.remove('hidden');
            }
        },
        (error) => {
            console.warn('Geolocation error:', error.message);
            // ไม่แสดง alert เพื่อไม่รบกวนผู้ใช้
        },
        options
    );
}
// ✅ ฟังก์ชันหยุดติดตามตำแหน่ง (เรียกอัตโนมัติเมื่อแอปถูกพัก)
function stopLocationTracking() {
    isTrackingLocation = false;
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    // ไม่ซ่อน marker เพื่อให้ผู้ใช้เห็นตำแหน่งสุดท้าย
}
function getCurrentLocation() {
    if (isTrackingLocation) { stopLocationTracking(); } else {
        if (!userLocationOverlay) createUserLocationMarker();
        startLocationTracking();
    }
}
// ✅ ฟังก์ชันซูมไปยังตำแหน่งปัจจุบัน (ปุ่มกดแล้วทำแค่ซูม)
function zoomToCurrentLocation() {
    if (lastKnownPosition) {
        map.getView().animate({
            center: lastKnownPosition,
            zoom: 19,
            duration: 500
        });
    } else if (userLocationOverlay?.getPosition()) {
        map.getView().animate({
            center: userLocationOverlay.getPosition(),
            zoom: 19,
            duration: 500
        });
    } else {
        // ถ้ายังไม่มีตำแหน่ง → ขอตำแหน่งครั้งเดียว
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const coord = ol.proj.fromLonLat([longitude, latitude]);
                    map.getView().animate({
                        center: coord,
                        zoom: 19,
                        duration: 500
                    });
                    lastKnownPosition = coord;
                    if (userLocationOverlay) userLocationOverlay.setPosition(coord);
                },
                () => {},
                { enableHighAccuracy: true, timeout: 10000 }
            );
        }
    }
}

// ✅ เริ่มติดตามตำแหน่งอัตโนมัติเมื่อโหลดหน้าเว็บ
function initAutoLocationTracking() {
    if (!userLocationOverlay) createUserLocationMarker();
    startLocationTracking();
    console.log('เริ่มติดตามตำแหน่งอัตโนมัติ');
}

// ✅ จัดการเมื่อแอปถูกพัก/กลับมา (Page Visibility API)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // ✅ แอปถูกพัก/หน้าจอปิด → หยุดติดตามเพื่อประหยัดแบตเตอรี่
        stopLocationTracking();
        console.log('⏸️ หยุดติดตามตำแหน่ง (แอปถูกพัก)');
    } else {
        // ✅ แอปกลับมาทำงาน → เริ่มติดตามใหม่
        if (!isTrackingLocation) {
            startLocationTracking();
            console.log('▶️ เริ่มติดตามตำแหน่งใหม่ (แอปกลับมา)');
        }
    }
});

// ✅ จัดการเมื่อปิดแอป/รีเฟรชหน้า
window.addEventListener('beforeunload', () => {
    stopLocationTracking();
});

// ✅ อัปเดตขนาดวงความแม่นยำเมื่อซูมแผนที่
map?.on('moveend', () => {
    if (accuracyOverlay && userLocationOverlay?.getPosition() && isTrackingLocation) {
        const zoom = map.getView().getZoom();
        const pixelsPerMeter = Math.pow(2, zoom) * 0.59;
        const radiusPx = 10 * pixelsPerMeter;
        const accElement = accuracyOverlay.getElement();
        accElement.style.width = `${radiusPx * 2}px`;
        accElement.style.height = `${radiusPx * 2}px`;
    }
});

// ✅ ✅ ✅ โหลด GeoJSON (แก้ไข renderMode ให้ป้ายแสดงชัด) ✅ ✅ ✅
document.getElementById('geojsonInput').addEventListener('change', async (e) => {
    for (const f of e.target.files) {
        try {
            const data = JSON.parse(await f.text());
            parcelLayer = new ol.layer.Vector({
                source: new ol.source.Vector({
                    features: new ol.format.GeoJSON().readFeatures(data, { featureProjection: 'EPSG:3857' })
                }),
                style: parcelStyle,
                zIndex: 60,
                declutter: false,              // ✅ ปิด declutter เพื่อให้แสดงป้ายทั้งหมด
                renderMode: 'vector',          // ✅ เปลี่ยนเป็น vector เพื่อความเสถียรของข้อความ
                updateWhileAnimating: true,    // ✅ อัปเดตขณะแอนิเมชัน
                updateWhileInteracting: true   // ✅ อัปเดตขณะเลื่อน/ซูม
            });
            parcelLayer.set('isParcelLayer', true);
            map.addLayer(parcelLayer);
            console.log(`✅ โหลด GeoJSON สำเร็จ: ${data.features?.length || 0} features`);
            if (data.features && data.features.length > 0) {
                const extent = parcelLayer.getSource().getExtent();
                map.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 500 });
            }
        } catch (err) {
            console.error('❌ Error loading GeoJSON:', err);
            alert('เกิดข้อผิดพลาดในการโหลดไฟล์ GeoJSON');
        }
    }
});

document.getElementById('folderInput').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    const tileMap = new Map();
    let metadataFile = null;
    files.forEach(file => {
        const path = file.webkitRelativePath;
        if (path.endsWith('tilemapresource.xml') || path.endsWith('metadata.json')) { metadataFile = file; }
        if (/\.(png|jpg|jpeg|webp)$/i.test(path)) { tileMap.set(path, file); }
    });
    if (tileMap.size === 0) return;
    const tileSource = new ol.source.XYZ({
        tileUrlFunction: (tileCoord) => {
            const z = tileCoord[0]; const x = tileCoord[1]; const y = tileCoord[2];
            for (const [path, file] of tileMap) {
                const nameMatch = path.match(new RegExp(`/${z}/${x}/(-?\\d+)\\.(png|jpg|jpeg|webp)$`, 'i'));
                if (nameMatch && parseInt(nameMatch[1]) === y) { return URL.createObjectURL(file); }
            }
            return null;
        },
        maxZoom: 22
    });
    const droneLayer = new ol.layer.Tile({ source: tileSource, zIndex: 40 });
    map.addLayer(droneLayer);
    map.getView().setZoom(18);
});
// ✅ ต้องอยู่ท้ายไฟล์เสมอ
window.onload = function() {
    // รอให้ทุกอย่างพร้อมก่อนเริ่ม
    setTimeout(() => {
        init();
    }, 100);
};
