# Rakesh Naik — research website

The personal research site of **Rakesh Naik**, PhD researcher in Raman and SERS
spectroscopy at the Centre for Photonics and Quantum Communication Technology,
IIT Roorkee.

**Live:** https://rakeshnaik1109-cloud.github.io/RakeshNaik/

Hand-written HTML, CSS and vanilla JavaScript. No framework, no build step, no
trackers, no cookies. Every page is a file you can open.

---

## Pages

| Page | What is on it |
|---|---|
| `index.html` | Home — hero spectrum, research threads, RNSpectraX, timeline, contact |
| `research.html` | The physics, current directions, methods |
| `publications.html` | Journal and conference papers, software, talks, science communication |
| `gallery.html` | Photographs, with a keyboard-navigable lightbox |
| `blog.html` | The Lab Notebook |
| `media.html` | Lab2Life — podcast and video |
| `404.html` | Not-found page |

Supporting files: `css/site.css` (one stylesheet: tokens, components,
responsive, print), `js/site.js` (navigation, scroll reveal, lightbox, hero
spectrum interaction), `assets/favicon.svg`, `Photos/` (gallery photographs),
`images/` (portrait and share image), `CV.pdf`, `sitemap.xml`, `robots.txt`,
`site.webmanifest`.

`RNSpectraX.html` is kept only as a redirect, so old links to the previous
in-site version of the app still arrive at the current one.

---

## How the website and RNSpectraX fit together

RNSpectraX lives in its own repository so the app can be versioned, cited and
cloned on its own. Both are published with GitHub Pages and link to each other:

```
https://rakeshnaik1109-cloud.github.io/RakeshNaik/     ← this repository
https://rakeshnaik1109-cloud.github.io/RNSpectra_X/    ← github.com/rakeshnaik1109-cloud/RNSpectra_X
```

- **Site → app:** the gold `RNSpectraX ↗` button in the header, the software
  section on the home page and the publications page all open the app.
- **App → site:** the home link in the RNSpectraX header is set in one place,
  `js/config.js` in the app repository.

---

## Publishing

GitHub Pages serves this repository from the `main` branch, root folder
(**Settings → Pages → Deploy from a branch → `main` / `(root)`**). A push to
`main` is live within a minute or two. `.nojekyll` is included so the folders are
served as-is.

### Custom domain

Rename `CNAME.example` to `CNAME`, follow the DNS instructions inside, then
update the canonical URLs in every `<head>`, and `sitemap.xml` and `robots.txt`,
to the new domain.

---

## Updating content

- **Publications:** add an `<article class="pub">` block in `publications.html`
  (copy an existing one). Add DOIs as papers come out.
- **Gallery:** copy any `<figure class="shot">` block in `gallery.html` and change
  the `src`, `alt` and caption. Resize photos to about 2000 px wide and save as
  JPEG at ~80 % quality before committing; a 6 MB phone photo loads slowly on
  mobile.
- **Portrait:** `images/rakesh-naik.jpg`, 4:5 portrait (800 × 1000 px).
- **Share image:** `images/ResearchersBanners.png` is what appears when the site
  is shared on LinkedIn, WhatsApp or X (ideal size 1200 × 630 px).

---

## The design, briefly

The palette comes from the physics. A Raman map is read against a dark field, so
the site is dark. Gold is the plasmonic metal that makes SERS work, and it is the
only accent that carries weight. The warm red and cool cyan used sparingly are
the Stokes and anti-Stokes directions a scattered photon can shift.

Type is **Bricolage Grotesque** for display, **IBM Plex Sans** for reading and
**IBM Plex Mono** for anything that is data.

The hero is a real spectrum: a sum of Lorentzian bands over a fluorescence
background, computed rather than drawn, with five bands labelled by their actual
assignments. It draws itself once on load. Hovering or tapping a marked band
tells you what it is.

### Quality floor

- Responsive from 320 px upward.
- Visible keyboard focus everywhere; the lightbox is fully keyboard-operable.
- `prefers-reduced-motion` disables every animation.
- A print stylesheet so `Ctrl+P` produces a readable document.
- Semantic headings, real `alt` text, skip link, and landmark roles.

---

## SEO

See [`SEO.md`](SEO.md) for what is already in place and what only you can do.
Meta tags alone do not rank a page; being linked from Google Scholar, ORCID and
your lab's site is what does.

---

## Licence

Site design and code © 2026 Rakesh Naik. Photographs © Rakesh Naik and the
respective photographers. RNSpectraX is licensed separately in its own
repository.
