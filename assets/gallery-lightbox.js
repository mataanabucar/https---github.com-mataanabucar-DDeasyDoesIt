import { DialogComponent } from '@theme/dialog';
import { preloadImage } from '@theme/utilities';

class GalleryLightbox extends DialogComponent {
  requiredRefs = ['dialog', 'image', 'counter', 'title', 'triggers', 'thumbs'];

  #activeIndex = 0;
  #opener = null;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('dialog:close', this.#restoreFocus);
    this.#render();
  }

  updatedCallback() {
    super.updatedCallback();
    this.#render();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('dialog:close', this.#restoreFocus);
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

  #restoreFocus = () => {
    if (!(this.#opener instanceof HTMLElement)) return;

    requestAnimationFrame(() => {
      this.#opener?.focus();
    });
  };
}

if (!customElements.get('gallery-lightbox')) {
  customElements.define('gallery-lightbox', GalleryLightbox);
}
