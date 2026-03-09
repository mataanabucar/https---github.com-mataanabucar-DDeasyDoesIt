# Gallery Branch Apply Reference

Date: 2026-03-09
Source branch at time of note: `dev`
Status: the gallery work is currently in the local working tree and is not committed yet.

## What this gallery update includes

- `/pages/gallery` renders a dedicated responsive gallery grid.
- Gallery thumbnails open a dialog lightbox with previous and next controls.
- Left and right keyboard arrows work while the dialog is open.
- The topbar and mobile drawer both get a `Gallery` link if the assigned menu does not already contain one.
- The gallery uses 39 `.webp` assets under `assets/`.

## Best way to carry this to `main`

If you want the cleanest transfer path, commit the gallery work on `dev` first, then cherry-pick that commit into `main`.

Example:

```powershell
git switch dev
git add blocks/_header-menu.liquid sections/main-page.liquid snippets/header-drawer.liquid snippets/gallery-page-grid.liquid assets/gallery-lightbox.js assets/Gallery*.webp
git commit -m "Add gallery page, assets, and lightbox"

git switch main
git cherry-pick <gallery-commit-sha>
```

If you do not want to commit first, use the file manifest and exact tracked-file changes below.

## File manifest

Tracked files modified:

- `blocks/_header-menu.liquid`
- `sections/main-page.liquid`
- `snippets/header-drawer.liquid`

New files in the working tree:

- `snippets/gallery-page-grid.liquid`
- `assets/gallery-lightbox.js`

New gallery image assets:

```text
assets/Gallery Dress Pink Tie Dye Diamond Dye.webp
assets/Gallery Dress Pink White Tie Diamond Dye.webp
assets/Gallery Dress Yellow Brown Tie Diamond Dye.webp
assets/Gallery Shorts Pink Blue Tie Diamond Dye.webp
assets/Gallery Shorts Pink Red Tie Diamond Dye.webp
assets/Gallery Shorts Pink White Tie Diamond Dye.webp
assets/Gallery T Shirt Blue Green Diamond Dye.webp
assets/Gallery T Shirt Blue Orange Diamond Dye.webp
assets/Gallery T Shirt Blue Purple Diamond Dye.webp
assets/Gallery T Shirt Blue Tie Diamond Dye.webp
assets/Gallery T Shirt Blue White Diamond Dye.webp
assets/Gallery T Shirt Blue Yellow Diamond Dye.webp
assets/Gallery T Shirt Brown Orange Diamond Dye.webp
assets/Gallery T Shirt Brown White Diamond Dye.webp
assets/Gallery T Shirt Green Blue Diamond Dye.webp
assets/Gallery T Shirt Green Orange Diamond Dye.webp
assets/Gallery T Shirt Green Tie Diamond Dye.webp
assets/Gallery T Shirt Orange Brown Diamond Dye.webp
assets/Gallery T Shirt Orange White Diamond Dye.webp
assets/Gallery T Shirt Pink Orange Diamond Dye.webp
assets/Gallery T Shirt Pink Purple Diamond Dye.webp
assets/Gallery T Shirt Pink Red Diamond Dye.webp
assets/Gallery T Shirt Pink Tie Diamond Dye.webp
assets/Gallery T Shirt Purple Blue Diamond Dye.webp
assets/Gallery T Shirt Purple Red Diamond Dye.webp
assets/Gallery T Shirt White Brown Diamond Dye.webp
assets/Gallery T Shirt White Tie Diamond Dye.webp
assets/Gallery T Shirt Yellow Blue Diamond Dye.webp
assets/Gallery T Shirt Yellow Brown Diamond Dye.webp
assets/Gallery Top Black Tie Dye Diamond Dye.webp
assets/Gallery Top Blue Black Tie Diamond Dye.webp
assets/Gallery Top Blue Green Tie Diamond Dye.webp
assets/Gallery Top Blue Purple Tie Diamond Dye.webp
assets/Gallery Top Blue Tie Dye Diamond Dye.webp
assets/Gallery Top Orange Brown Tie Diamond Dye.webp
assets/Gallery Top Pink Blue Tie Diamond Dye.webp
assets/Gallery Top Pink Purple Tie Diamond Dye.webp
assets/Gallery Top Pink Tie Dye Diamond Dye.webp
assets/Gallery Top White Tie Dye Diamond Dye.webp
```

## Exact tracked-file changes

### `sections/main-page.liquid`

Add the gallery render immediately after `{% content_for 'blocks' %}`:

```liquid
{% if page.handle == 'gallery' %}
  {% render 'gallery-page-grid' %}
{% endif %}
```

### `blocks/_header-menu.liquid`

Add gallery detection inside the opening `{% liquid %}` block:

```liquid
assign gallery_page_url = '/pages/gallery'
assign on_gallery_page = false
assign has_gallery_link = false

if request.page_type == 'page' and page.handle == 'gallery'
  assign on_gallery_page = true
endif

for link in block_settings.menu.links
  if link.handle == 'gallery' or link.url == gallery_page_url
    assign has_gallery_link = true
    break
  endif
endfor
```

In the simple list menu variant, append this after the existing loop:

```liquid
{% unless has_gallery_link %}
  <li>
    <a
      href="{{ gallery_page_url }}"
      id="MenuItem-gallery"
      class="menu-list__item"
      {% if on_gallery_page %}
        aria-current="page"
      {% endif %}
    >
      Gallery
    </a>
  </li>
{% endunless %}
```

In the larger desktop menu variant, append this after the existing loop and before the next list item:

```liquid
{% unless has_gallery_link %}
  <li
    role="presentation"
    class="menu-list__list-item"
    on:focus="/activate"
    on:blur="/deactivate"
    on:pointerenter="/activate"
    on:pointerleave="/deactivate"
  >
    <a
      href="{{ gallery_page_url }}"
      data-skip-node-update="true"
      class="menu-list__link{% if on_gallery_page %} menu-list__link--active{% endif %}"
      {% if on_gallery_page %}
        aria-current="page"
      {% endif %}
      ref="menuitem"
    >
      <span class="menu-list__link-title">Gallery</span>
    </a>
  </li>
{% endunless %}
```

### `snippets/header-drawer.liquid`

Add gallery detection near the top of the file after the other initial assignments:

```liquid
assign gallery_page_url = '/pages/gallery'
assign on_gallery_page = false
assign has_gallery_link = false

if request.page_type == 'page' and page.handle == 'gallery'
  assign on_gallery_page = true
endif

for link in linklist.links
  if link.handle == 'gallery' or link.url == gallery_page_url
    assign has_gallery_link = true
    break
  endif
endfor
```

In the drawer branch that renders flat or deep menu items, append:

```liquid
{% unless has_gallery_link %}
  <li
    style="--menu-drawer-animation-index: {{ linklist.links.size | plus: 1 }};"
    class="{%- if block_settings.drawer_accordion -%}menu-drawer__list-item--deep{%- else -%}menu-drawer__list-item--flat{%- endif -%}{% if block_settings.drawer_dividers %} menu-drawer__list-item--divider{% endif %}"
  >
    <a
      id="HeaderDrawer-gallery"
      href="{{ gallery_page_url }}"
      class="menu-drawer__menu-item menu-drawer__menu-item--mainlist menu-drawer__animated-element focus-inset{% if on_gallery_page %} menu-drawer__menu-item--active{% endif %}"
      {% if on_gallery_page %}
        aria-current="page"
      {% endif %}
    >
      <span class="menu-drawer__menu-item-text wrap-text">Gallery</span>
    </a>
  </li>
{% endunless %}
```

In the alternate drawer branch, append:

```liquid
{% unless has_gallery_link %}
  <li
    class="menu-drawer__list-item"
    style="--menu-drawer-animation-index: {{ linklist.links.size | plus: 1 }};"
  >
    <a
      id="HeaderDrawer-gallery"
      href="{{ gallery_page_url }}"
      class="menu-drawer__menu-item menu-drawer__menu-item--mainlist menu-drawer__animated-element focus-inset{% if on_gallery_page %} menu-drawer__menu-item--active{% endif %}"
      {% if on_gallery_page %}
        aria-current="page"
      {% endif %}
    >
      <span class="menu-drawer__menu-item-text wrap-text">Gallery</span>
    </a>
  </li>
{% endunless %}
```

## New file notes

### `snippets/gallery-page-grid.liquid`

This file contains:

- the ordered list of all 39 gallery asset filenames
- the gallery grid markup
- the dialog and previous and next controls
- the thumbnail rail inside the dialog
- the responsive layout and the wide-screen breakout CSS
- the module script tag for `gallery-lightbox.js`

### `assets/gallery-lightbox.js`

This file contains:

- a `gallery-lightbox` custom element
- dialog open and close handling
- previous and next navigation
- left and right keyboard handling
- thumbnail state updates
- preloading for nearby slides
- focus restoration to the clicked opener on close

## Store-side notes

- The page handle must stay `gallery`, because the page render hook checks `page.handle == 'gallery'`.
- The Shopify page record for `/pages/gallery` already exists in the store.
- The current page body content still includes `test` above the gallery. Remove that in the Shopify page editor if it should not appear.

## Verification notes

- Local preview served `/pages/gallery` with the gallery markup and the lightbox script.
- `node --check assets/gallery-lightbox.js` passed.
- Full browser click automation was limited by broken local browser tooling, so the modal interaction was verified by implementation review and preview output rather than a complete automated click-through.
