const MAP_SCRIPT_SRC = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU';

let yandexMapsLoader = null;

function loadYandexMaps() {
  if (window.ymaps) {
    return Promise.resolve(window.ymaps);
  }

  if (yandexMapsLoader) {
    return yandexMapsLoader;
  }

  yandexMapsLoader = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = MAP_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(window.ymaps);
    script.onerror = () => reject(new Error('Не удалось загрузить API Яндекс.Карт.'));
    document.head.appendChild(script);
  });

  return yandexMapsLoader;
}

export async function initContactMap() {
  const mapContainer = document.getElementById('yandex-map');

  if (!mapContainer) {
    return;
  }

  try {
    const ymaps = await loadYandexMaps();
    const lat = Number(mapContainer.dataset.lat || '59.914195');
    const lng = Number(mapContainer.dataset.lng || '30.344461');
    const company = mapContainer.dataset.company || 'Питер-Жалюзи';
    const address = mapContainer.dataset.address || '';
    const phone = mapContainer.dataset.phone || '';

    ymaps.ready(() => {
      const map = new ymaps.Map('yandex-map', {
        center: [lat, lng],
        zoom: 17,
        controls: ['zoomControl', 'fullscreenControl']
      });

      const placemark = new ymaps.Placemark([lat, lng], {
        hintContent: company,
        balloonContent: `<strong>${company}</strong><br>${address}<br>📞 ${phone}`
      }, {
        preset: 'islands#blueStretchyIcon'
      });

      map.geoObjects.add(placemark);
      map.setCenter([lat, lng], 17);
    });
  } catch (error) {
    console.error('Yandex map error:', error);
    mapContainer.innerHTML = '<div class="section-placeholder" data-state="error">Не удалось загрузить карту.</div>';
  }
}
