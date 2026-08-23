import { escapeHtml, fetchJson, setStatus } from '/scripts/api.js';
import { hydrateAssetImages, IMG_PLACEHOLDER_SRC } from '/scripts/asset-loader.js';

function formatDate(date) {
  try {
    return new Date(date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return '';
  }
}

function renderWorks(works) {
  const slides = works.map((work) => {
    const title = escapeHtml(work.title || 'Наши работы');
    const photo = escapeHtml(work.photo);

    return `
      <div class="work-slide">
        <img src="${IMG_PLACEHOLDER_SRC}" data-asset-src="${photo}" alt="${title}" loading="lazy" />
        <div class="work-slide-caption">
          <p style="font-size:1.2rem;font-weight:600;margin:0;">${title}</p>
        </div>
      </div>
    `;
  }).join('');

  const dots = works.map((_, index) => `
    <button class="slider-dot" data-slide-dot="${index}" type="button" aria-label="Слайд ${index + 1}"></button>
  `).join('');

  const worksWord = works.length === 1 ? 'работа' : works.length < 5 ? 'работы' : 'работ';

  return `
    <div class="works-slider">
      <div class="works-track">${slides}</div>
      <button class="slider-nav-btn" data-slider-prev type="button" aria-label="Предыдущая работа">‹</button>
      <button class="slider-nav-btn" data-slider-next type="button" aria-label="Следующая работа">›</button>
      <div class="slider-dots">${dots}</div>
    </div>
    <p class="works-count">${works.length} ${worksWord} в нашем портфолио</p>
  `;
}

function renderReviews(reviews) {
  return reviews.map((review) => {
    const name = escapeHtml(review.name);
    const blindsType = escapeHtml(review.blindsType);
    const comment = escapeHtml(review.comment);
    const avatar = name.charAt(0).toUpperCase() || 'К';
    const photos = Array.isArray(review.photos) ? review.photos : [];
    const stars = Array.from({ length: 5 }, (_, index) => `
      <span data-active="${index < Number(review.rating || 0)}">★</span>
    `).join('');

    return `
      <article class="review-card">
        <div class="review-card-header">
          <div class="review-card-avatar">${avatar}</div>
          <div class="review-card-meta">
            <div class="review-card-name">${name}</div>
            <div class="review-card-type">${blindsType}</div>
          </div>
          <div class="review-card-stars">${stars}</div>
        </div>
        <p class="review-card-text">${comment}</p>
        ${photos.length ? `
          <div class="review-card-photos">
            ${photos.map((photo, index) => `
              <img src="${IMG_PLACEHOLDER_SRC}" data-asset-src="${escapeHtml(photo)}" alt="Фото отзыва ${index + 1}" loading="lazy" />
            `).join('')}
          </div>
        ` : ''}
        <div class="review-card-date">${formatDate(review.created_at)}</div>
      </article>
    `;
  }).join('');
}

function initSlider(root) {
  const track = root.querySelector('.works-track');
  const dots = Array.from(root.querySelectorAll('[data-slide-dot]'));
  const slides = root.querySelectorAll('.work-slide');
  const prevBtn = root.querySelector('[data-slider-prev]');
  const nextBtn = root.querySelector('[data-slider-next]');
  const slider = root.querySelector('.works-slider');

  if (!(track instanceof HTMLElement) || !slides.length) {
    return;
  }

  let currentSlide = 0;
  let autoSlideId = null;

  const updateSlider = () => {
    track.style.transform = `translateX(-${currentSlide * 100}%)`;

    dots.forEach((dot, index) => {
      if (dot instanceof HTMLElement) {
        dot.style.background = index === currentSlide ? 'white' : 'transparent';
      }
    });
  };

  const moveToSlide = (index) => {
    currentSlide = (index + slides.length) % slides.length;
    updateSlider();
  };

  const startAutoSlide = () => {
    autoSlideId = window.setInterval(() => moveToSlide(currentSlide + 1), 5000);
  };

  const stopAutoSlide = () => {
    if (autoSlideId) {
      window.clearInterval(autoSlideId);
      autoSlideId = null;
    }
  };

  prevBtn?.addEventListener('click', () => moveToSlide(currentSlide - 1));
  nextBtn?.addEventListener('click', () => moveToSlide(currentSlide + 1));

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => moveToSlide(index));
  });

  slider?.addEventListener('mouseenter', stopAutoSlide);
  slider?.addEventListener('mouseleave', () => {
    stopAutoSlide();
    startAutoSlide();
  });

  updateSlider();
  startAutoSlide();

  return () => {
    stopAutoSlide();
  };
}

export function initWorksReviewsPage() {
  const worksState = document.getElementById('works-state');
  const worksSliderRoot = document.getElementById('works-slider-root');
  const reviewsState = document.getElementById('reviews-state');
  const reviewsGrid = document.getElementById('reviews-grid');
  const reviewForm = document.getElementById('review-form');
  const reviewStatus = document.getElementById('review-form-status');
  let destroySlider = null;

  if (!worksState || !worksSliderRoot || !reviewsState || !reviewsGrid || !reviewForm) {
    return;
  }

  const loadPageData = async () => {
    worksState.hidden = false;
    reviewsState.hidden = false;
    reviewsGrid.hidden = true;
    delete worksState.dataset.state;
    delete reviewsState.dataset.state;

    try {
      const [worksResponse, reviewsResponse] = await Promise.all([
        fetchJson('/api/reviews/works'),
        fetchJson('/api/reviews')
      ]);

      const works = Array.isArray(worksResponse.data) ? worksResponse.data : [];
      const reviews = Array.isArray(reviewsResponse.data) ? reviewsResponse.data : [];

      if (works.length) {
        destroySlider?.();
        worksState.hidden = true;
        worksSliderRoot.innerHTML = renderWorks(works);
        await hydrateAssetImages(worksSliderRoot);
        destroySlider = initSlider(worksSliderRoot);
      } else {
        destroySlider?.();
        destroySlider = null;
        worksSliderRoot.innerHTML = '';
        worksState.hidden = false;
        delete worksState.dataset.state;
        worksState.textContent = 'Работы пока не добавлены.';
      }

      if (reviews.length) {
        reviewsState.hidden = true;
        reviewsGrid.hidden = false;
        reviewsGrid.innerHTML = renderReviews(reviews);
        await hydrateAssetImages(reviewsGrid);
      } else {
        reviewsGrid.hidden = true;
        reviewsGrid.innerHTML = '';
        reviewsState.hidden = false;
        delete reviewsState.dataset.state;
        reviewsState.textContent = 'Отзывов пока нет.';
      }
    } catch (error) {
      console.error('Works/reviews page error:', error);
      destroySlider?.();
      destroySlider = null;
      worksSliderRoot.innerHTML = '';
      reviewsGrid.innerHTML = '';
      reviewsGrid.hidden = true;

      worksState.hidden = false;
      worksState.dataset.state = 'error';
      worksState.textContent = 'Не удалось загрузить работы.';

      reviewsState.hidden = false;
      reviewsState.dataset.state = 'error';
      reviewsState.textContent = 'Не удалось загрузить отзывы.';
    }
  };

  reviewForm.querySelectorAll('input, select, textarea').forEach((field) => {
    field.addEventListener('focus', () => {
      field.style.borderColor = 'var(--color-primary)';
    });

    field.addEventListener('blur', () => {
      field.style.borderColor = '#E2E8F0';
    });
  });

  // --- Логика превью фото ---
  const photoInput = document.getElementById('review-photos');
  const previewContainer = document.getElementById('review-photos-preview');
  /** @type {File[]} */
  let selectedPhotos = [];
  const MAX_PHOTOS = 3;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 МБ

  const renderPreviews = () => {
    if (!(previewContainer instanceof HTMLElement)) {
      return;
    }
    previewContainer.innerHTML = '';
    selectedPhotos.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'review-photo-preview-item';
        const img = document.createElement('img');
        img.src = e.target?.result || '';
        img.alt = `Превью ${index + 1}`;
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-photo-btn';
        removeBtn.innerHTML = '×';
        removeBtn.setAttribute('aria-label', 'Удалить фото');
        removeBtn.addEventListener('click', () => {
          selectedPhotos.splice(index, 1);
          renderPreviews();
        });
        wrapper.appendChild(img);
        wrapper.appendChild(removeBtn);
        previewContainer.appendChild(wrapper);
      };
      reader.readAsDataURL(file);
    });
  };

  photoInput?.addEventListener('change', (event) => {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement) || !input.files) {
      return;
    }
    const newFiles = Array.from(input.files);
    const oversized = newFiles.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length) {
      setStatus(reviewStatus, `Файлы слишком большие (макс. 5 МБ): ${oversized.map((f) => f.name).join(', ')}`, 'error');
      return;
    }
    const freeSlots = MAX_PHOTOS - selectedPhotos.length;
    const toAdd = newFiles.slice(0, freeSlots);
    if (toAdd.length < newFiles.length) {
      setStatus(reviewStatus, `Можно прикрепить до ${MAX_PHOTOS} фото. Добавлено ${toAdd.length}.`, 'error');
    }
    selectedPhotos = [...selectedPhotos, ...toAdd];
    renderPreviews();
    input.value = ''; // сброс input чтобы можно было выбрать тот же файл
    setStatus(reviewStatus, '', '');
  });

  // --- Отправка формы с фото ---
  reviewForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const submitButton = form.querySelector('button[type="submit"]');

    if (!(submitButton instanceof HTMLButtonElement)) {
      return;
    }

    const originalText = submitButton.textContent;
    submitButton.textContent = 'Отправка...';
    submitButton.disabled = true;
    setStatus(reviewStatus, '');

    try {
      const reviewData = {
        name: form.querySelector('#review-name')?.value || '',
        blindsType: form.querySelector('#review-type')?.value || '',
        rating: Number(form.querySelector('#review-rating')?.value || 5),
        comment: form.querySelector('#review-comment')?.value || ''
      };

      const formData = new FormData();
      formData.append('name', reviewData.name);
      formData.append('blindsType', reviewData.blindsType);
      formData.append('rating', String(reviewData.rating));
      formData.append('comment', reviewData.comment);

      selectedPhotos.forEach((file) => {
        formData.append('photos', file);
      });

      const apiUrl = document.body.dataset.apiUrl || '';
      const response = await fetch(`${apiUrl}/api/reviews`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Ошибка сервера: ${response.status}`);
      }

      form.reset();
      selectedPhotos = [];
      if (previewContainer instanceof HTMLElement) {
        previewContainer.innerHTML = '';
      }
      setStatus(reviewStatus, '', '');
      await loadPageData();
      setStatus(reviewStatus, 'Спасибо! Ваш отзыв отправлен.', 'success');
    } catch (error) {
      console.error('Review form error:', error);
      setStatus(reviewStatus, error.message || 'Не удалось отправить отзыв.', 'error');
    } finally {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  });

  loadPageData();
}
