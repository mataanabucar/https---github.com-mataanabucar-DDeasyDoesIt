import { DialogComponent } from '@theme/dialog';
import { preloadImage } from '@theme/utilities';

class GalleryLightbox extends DialogComponent {
  requiredRefs = ['dialog', 'image', 'counter', 'title', 'triggers', 'thumbs', 'stage'];

  #activeIndex = 0;
  #opener = null;
  #controller = new AbortController();
  #isZoomed = false;
  #isPanning = false;
  #lastPointerType = 'mouse';
  #zoomScale = 2.5;
  #pan = { x: 0, y: 0 };
  #panStart = { x: 0, y: 0 };
  #pointerStart = { x: 0, y: 0 };
  #dragDistance = 0;
  #ignoreNextStageClick = false;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('dialog:close', this.#restoreFocus);
    this.#bindStageEvents();
    this.#resetZoom();
    this.#render();
  }

  updatedCallback() {
    super.updatedCallback();
    this.#render();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('dialog:close', this.#restoreFocus);
    this.#controller.abort();
  }

  get slides() {
    const triggers = Array.isArray(this.refs.triggers) ? this.refs.triggers : [];

    return triggers.map((trigger) => ({
      src: trigger.dataset.gallerySrc || '',
      alt: trigger.dataset.galleryAlt || '',
      title: trigger.dataset.galleryTitle || '',
    }));
  }

  openFromTrigger(index, event) {
    event.preventDefault();

    const trigger = event.target instanceof Element ? event.target.closest('[data-gallery-trigger]') : null;
    this.#opener = trigger instanceof HTMLElement ? trigger : null;

    this.#setActiveIndex(index);
    this.showDialog();
  }

  selectIndex(index, event) {
    event.preventDefault();
    this.#setActiveIndex(index);
  }

  showPrevious(event) {
    event?.preventDefault();
    this.#setActiveIndex(this.#activeIndex - 1);
  }

  showNext(event) {
    event?.preventDefault();
    this.#setActiveIndex(this.#activeIndex + 1);
  }

  preload(index) {
    const slide = this.slides[this.#normalizeIndex(index)];
    if (slide?.src) preloadImage(slide.src);
  }

  handleKeyDown(event) {
    if (!this.refs.dialog.open) return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.showPrevious();
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.showNext();
    }
  }

  #setActiveIndex(index) {
    if (!this.slides.length) return;

    this.#resetZoom();
    this.#activeIndex = this.#normalizeIndex(index);
    this.#render();
    this.preload(this.#activeIndex + 1);
    this.preload(this.#activeIndex - 1);
  }

  #normalizeIndex(index) {
    const total = this.slides.length;
    if (!total) return 0;

    return ((index % total) + total) % total;
  }

  #render() {
    const slides = this.slides;
    if (!slides.length) return;

    const slide = slides[this.#activeIndex];
    if (!slide) return;

    if (this.refs.image.getAttribute('src') !== slide.src) {
      this.refs.image.setAttribute('src', slide.src);
    }

    this.refs.image.alt = slide.alt || slide.title;
    this.refs.counter.textContent = `${this.#activeIndex + 1} / ${slides.length}`;
    this.refs.title.textContent = slide.title || slide.alt;

    const thumbs = Array.isArray(this.refs.thumbs) ? this.refs.thumbs : [];
    thumbs.forEach((thumb, index) => {
      const isActive = index === this.#activeIndex;
      thumb.dataset.active = `${isActive}`;
      thumb.setAttribute('aria-pressed', `${isActive}`);

      if (isActive) {
        thumb.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    });
  }

  #bindStageEvents() {
    const { signal } = this.#controller;

    this.refs.stage.addEventListener('click', this.#handleStageClick, { signal });
    this.refs.stage.addEventListener('pointerdown', this.#handleStagePointerDown, { signal });
    this.refs.stage.addEventListener('pointermove', this.#handleStagePointerMove, { signal });
    this.refs.stage.addEventListener('pointerup', this.#handleStagePointerUp, { signal });
    this.refs.stage.addEventListener('pointercancel', this.#handleStagePointerCancel, { signal });
  }

  #handleStageClick = (event) => {
    if (this.#ignoreNextStageClick) {
      this.#ignoreNextStageClick = false;
      event.preventDefault();
      return;
    }

    if (this.#isZoomed) {
      event.preventDefault();
      this.#resetZoom();
      return;
    }

    this.#isZoomed = true;
    this.#pan = { x: 0, y: 0 };

    if (this.#lastPointerType === 'mouse') {
      this.#setZoomOrigin(event.clientX, event.clientY);
    } else {
      this.#setZoomOrigin();
    }

    this.#applyZoomState();
  };

  #handleStagePointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return;

    this.#lastPointerType = event.pointerType || 'mouse';
    this.#pointerStart = { x: event.clientX, y: event.clientY };
    this.#dragDistance = 0;

    if (!this.#isZoomed) return;

    if (this.#lastPointerType === 'mouse') {
      this.#setZoomOrigin(event.clientX, event.clientY);
      return;
    }

    this.#isPanning = true;
    this.#panStart = { ...this.#pan };
    this.refs.stage.setPointerCapture?.(event.pointerId);
    this.#applyZoomState();
    event.preventDefault();
  };

  #handleStagePointerMove = (event) => {
    if (!this.#isZoomed) return;

    if ((event.pointerType || this.#lastPointerType) === 'mouse') {
      this.#setZoomOrigin(event.clientX, event.clientY);
      return;
    }

    if (!this.#isPanning) return;

    const dx = event.clientX - this.#pointerStart.x;
    const dy = event.clientY - this.#pointerStart.y;
    this.#dragDistance = Math.max(this.#dragDistance, Math.hypot(dx, dy));

    this.#pan = {
      x: this.#panStart.x + dx,
      y: this.#panStart.y + dy,
    };

    this.#constrainPan();
    this.#applyZoomState();
    event.preventDefault();
  };

  #handleStagePointerUp = (event) => {
    if (!this.#isPanning) return;

    this.#isPanning = false;
    this.refs.stage.releasePointerCapture?.(event.pointerId);
    this.#applyZoomState();

    if (this.#dragDistance > 8) {
      this.#ignoreNextStageClick = true;
    }
  };

  #handleStagePointerCancel = (event) => {
    this.#isPanning = false;
    this.refs.stage.releasePointerCapture?.(event.pointerId);
    this.#applyZoomState();
  };

  #setZoomOrigin(clientX = null, clientY = null) {
    const stage = this.refs.stage;
    if (!stage) return;

    if (clientX === null || clientY === null) {
      stage.style.setProperty('--gallery-zoom-origin-x', '50%');
      stage.style.setProperty('--gallery-zoom-origin-y', '50%');
      return;
    }

    const stageRect = stage.getBoundingClientRect();
    const imageMetrics = this.#getImageMetrics();
    if (!imageMetrics || !stageRect.width || !stageRect.height) return;

    const relativeX = clamp(clientX - stageRect.left - imageMetrics.left, 0, imageMetrics.width);
    const relativeY = clamp(clientY - stageRect.top - imageMetrics.top, 0, imageMetrics.height);

    stage.style.setProperty('--gallery-zoom-origin-x', `${(relativeX / imageMetrics.width) * 100}%`);
    stage.style.setProperty('--gallery-zoom-origin-y', `${(relativeY / imageMetrics.height) * 100}%`);
  }

  #getImageMetrics() {
    const stage = this.refs.stage;
    const image = this.refs.image;
    if (!(stage instanceof HTMLElement) || !(image instanceof HTMLImageElement)) return null;

    const stageWidth = stage.clientWidth;
    const stageHeight = stage.clientHeight;
    if (!stageWidth || !stageHeight) return null;

    const naturalWidth = image.naturalWidth || stageWidth;
    const naturalHeight = image.naturalHeight || stageHeight;
    const imageAspectRatio = naturalWidth / naturalHeight;
    const stageAspectRatio = stageWidth / stageHeight;

    let width;
    let height;
    let left = 0;
    let top = 0;

    if (imageAspectRatio > stageAspectRatio) {
      width = stageWidth;
      height = width / imageAspectRatio;
      top = (stageHeight - height) / 2;
    } else {
      height = stageHeight;
      width = height * imageAspectRatio;
      left = (stageWidth - width) / 2;
    }

    return { width, height, left, top };
  }

  #constrainPan() {
    const stage = this.refs.stage;
    const imageMetrics = this.#getImageMetrics();
    if (!(stage instanceof HTMLElement) || !imageMetrics) return;

    const overflowX = Math.max(0, imageMetrics.width * this.#zoomScale - stage.clientWidth);
    const overflowY = Math.max(0, imageMetrics.height * this.#zoomScale - stage.clientHeight);

    this.#pan.x = clamp(this.#pan.x, -(overflowX / 2), overflowX / 2);
    this.#pan.y = clamp(this.#pan.y, -(overflowY / 2), overflowY / 2);
  }

  #applyZoomState() {
    const stage = this.refs.stage;
    if (!(stage instanceof HTMLElement)) return;

    stage.dataset.zoomed = `${this.#isZoomed}`;
    stage.dataset.panning = `${this.#isPanning}`;
    stage.style.setProperty('--gallery-zoom-scale', this.#isZoomed ? `${this.#zoomScale}` : '1');
    stage.style.setProperty('--gallery-zoom-pan-x', this.#isZoomed ? `${this.#pan.x}px` : '0px');
    stage.style.setProperty('--gallery-zoom-pan-y', this.#isZoomed ? `${this.#pan.y}px` : '0px');
  }

  #resetZoom = () => {
    this.#isZoomed = false;
    this.#isPanning = false;
    this.#pan = { x: 0, y: 0 };
    this.#panStart = { x: 0, y: 0 };
    this.#pointerStart = { x: 0, y: 0 };
    this.#dragDistance = 0;
    this.#ignoreNextStageClick = false;
    this.#setZoomOrigin();
    this.#applyZoomState();
  };

  #restoreFocus = () => {
    this.#resetZoom();

    if (!(this.#opener instanceof HTMLElement)) return;

    requestAnimationFrame(() => {
      this.#opener?.focus();
    });
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

if (!customElements.get('gallery-lightbox')) {
  customElements.define('gallery-lightbox', GalleryLightbox);
}
