import { useEffect, useRef, useState } from 'react';
import type { CircleMarker, Map as LeafletMap, TileLayer } from 'leaflet';
// CSS Leaflet giữ nguyên bố cục, bỏ icon bitmap không dùng vì Metro chưa hỗ trợ URL tương đối trong CSS.
import '@/assets/styles/leaflet.css';
import { campusMap } from '@/data/campusMap';
import type { CampusMapProps } from './campus-map.types';

export default function CampusMap(props: CampusMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const tiles = useRef<TileLayer | null>(null);
  const library = useRef<typeof import('leaflet') | null>(null);
  const markers = useRef(new Map<number, CircleMarker>());
  const current = useRef(props);
  // Lưu instance thay vì boolean: retry luôn kích hoạt lại các effect lớp ghim,
  // kể cả khi import đã cache và React gộp các lần cập nhật state rất nhanh.
  const [ready, setReady] = useState<LeafletMap | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { current.current = props; });

  useEffect(() => {
    let disposed = false;
    let instance: LeafletMap | undefined;
    let observer: ResizeObserver | undefined;
    let failedTiles = 0;
    setReady(null);
    setError('');
    // Leaflet chỉ cần DOM/SVG, không cần WebGL hoặc Worker. Import trong effect
    // giữ tương thích Expo static rendering (máy chủ không có window/document).
    void import('leaflet').then(L => {
      if (disposed || !container.current) return;
      library.current = L;
      instance = L.map(container.current, { minZoom: 12, maxZoom: 19, scrollWheelZoom: false })
        .setView([current.current.center.latitude, current.current.center.longitude], 16);
      map.current = instance;
      // Chỉ tải ô ảnh trong vùng đang xem; giữ các ô lân cận khi di chuyển.
      // Cache HTTP mặc định của trình duyệt được giữ nguyên, không tải trước toàn trường.
      tiles.current = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, updateWhenIdle: true, keepBuffer: 2,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      });
      tiles.current.on('loading', () => { failedTiles = 0; });
      tiles.current.on('tileerror', () => {
        failedTiles += 1;
        if (!disposed) setError('Chưa tải được một phần bản đồ nền. Các ghim địa điểm vẫn có thể chọn.');
      });
      tiles.current.on('load', () => { if (!disposed && failedTiles === 0) setError(''); });
      tiles.current.addTo(instance);
      L.control.scale({ imperial: false }).addTo(instance);
      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(() => instance?.invalidateSize({ pan: false }));
        observer.observe(container.current);
      }
      // Ghim dữ liệu trong app hiển thị ngay, không cần đợi toàn bộ ảnh nền tải xong.
      setReady(instance);
    }).catch((cause: unknown) => {
      if (!disposed) {
        console.error('[CampusMap] Initialization:', cause);
        setError('Không mở được sơ đồ. Hãy thử tải lại.');
      }
    });
    return () => {
      disposed = true;
      observer?.disconnect();
      instance?.remove();
      map.current = null;
      tiles.current = null;
    };
  }, [attempt]);

  useEffect(() => {
    const L = library.current;
    const instance = map.current;
    if (!ready || !L || !instance) return;
    // Tạo lớp ghim một lần theo dữ liệu, không tạo lại khi tìm kiếm/chọn địa điểm.
    const group = L.layerGroup().addTo(instance);
    const nextMarkers = new Map<number, CircleMarker>();
    for (const place of props.places) {
      const label = document.createElement('span');
      label.textContent = place.name;
      const marker = L.circleMarker([place.coordinate.latitude, place.coordinate.longitude], {
        radius: 7, weight: 2, color: '#ffffff', fillColor: '#1D4ED8', fillOpacity: 1,
      }).bindTooltip(label, { permanent: place.id !== 100, interactive: true, direction: 'top', offset: [0, -6] })
        .on('click', () => current.current.onSelect(place.id)).addTo(group);
      marker.getTooltip()?.on('click', () => current.current.onSelect(place.id));
      const element = marker.getElement();
      if (element) {
        element.setAttribute('tabindex', '0');
        element.setAttribute('role', 'button');
        element.setAttribute('aria-label', `Chọn ${place.name}`);
        element.addEventListener('keydown', event => {
          const key = (event as KeyboardEvent).key;
          if (key === 'Enter' || key === ' ') { event.preventDefault(); current.current.onSelect(place.id); }
        });
      }
      nextMarkers.set(place.id, marker);
    }
    markers.current = nextMarkers;
    return () => { group.remove(); markers.current.clear(); };
  }, [props.places, ready]);

  useEffect(() => {
    if (!ready) return;
    // Chọn ghim chỉ đổi màu/kích thước, giữ nguyên bản đồ và các ô ảnh đã tải.
    markers.current.forEach((marker, id) => {
      marker.setStyle({ fillColor: id === props.selectedId ? '#E11D48' : '#1D4ED8' });
      marker.setRadius(id === props.selectedId ? 10 : 7);
      if (id === props.selectedId) marker.bringToFront();
    });
  }, [props.selectedId, props.places, ready]);

  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance) return;
    const atCampus = props.center.latitude === campusMap.center.latitude && props.center.longitude === campusMap.center.longitude;
    if (atCampus && props.selectedId === undefined && props.places.length) {
      instance.fitBounds(props.places.map(place => [place.coordinate.latitude, place.coordinate.longitude]), { padding: [35, 35], maxZoom: 17, animate: false });
    } else {
      instance.setView([props.center.latitude, props.center.longitude], Math.max(instance.getZoom(), 17), { animate: false });
    }
  }, [props.center, props.selectedId, props.places, ready]);

  useEffect(() => {
    const L = library.current;
    const instance = map.current;
    if (!ready || !L || !instance || !props.userLocation) return;
    const marker = L.circleMarker([props.userLocation.latitude, props.userLocation.longitude], {
      radius: 8, color: '#fff', weight: 3, fillColor: '#16A34A', fillOpacity: 1,
    }).bindTooltip('Vị trí của bạn').addTo(instance);
    return () => { marker.remove(); };
  }, [props.userLocation, ready]);

  return <div style={{ position: 'relative', isolation: 'isolate' }}>
    <div ref={container} aria-label="Sơ đồ 2D Đại học Tây Nguyên" style={{ width: '100%', height: 430, background: '#E8EEE5' }} />
    {!ready && !error && <div role="status" style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, background: 'white', padding: 10 }}>Đang mở sơ đồ...</div>}
    {error && <div role="alert" style={{ position: 'absolute', bottom: 30, left: 12, right: 12, zIndex: 1000, background: 'white', padding: 12, borderRadius: 8 }}>
      {error} <button type="button" onClick={() => { setError(''); if (ready) tiles.current?.redraw(); else setAttempt(value => value + 1); }}>Thử lại</button>
    </div>}
  </div>;
}
