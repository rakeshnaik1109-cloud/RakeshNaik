# Being findable

Two halves. The first is built into this repository. The second is work only you
can do — and it matters far more.

---

## Part 1 — already in place

| Item | Where |
|---|---|
| Unique, descriptive `<title>` and meta description per page | every `<head>` |
| Canonical URLs | every `<head>` |
| Open Graph + Twitter cards, so shared links preview properly | every `<head>` |
| `Person` structured data — name, job title, affiliation, expertise | `index.html` JSON-LD |
| `SoftwareApplication` structured data for RNSpectraX | `index.html` JSON-LD |
| `WebSite` and `BreadcrumbList` structured data | `index.html`, subpages |
| `sitemap.xml` listing every page with priorities | root |
| `robots.txt` pointing at the sitemap | root |
| Semantic HTML — one `h1` per page, ordered headings, landmarks | all pages |
| Descriptive `alt` text on every photograph | `gallery.html` |
| Lazy-loaded images with explicit dimensions (no layout shift) | `gallery.html` |
| Fast by construction — no framework, no bundle, two files of CSS and JS | — |
| Mobile-first responsive layout | `css/site.css` |
| HTTPS | provided by GitHub Pages |

Structured data is why a search result for your name can show your role and
affiliation rather than a naked URL. Test it at
[search.google.com/test/rich-results](https://search.google.com/test/rich-results).

---

## Part 2 — what you have to do

Ranking for `Rakesh Naik SERS` is mostly decided by whether authoritative
academic sites link to you. Meta tags cannot manufacture that.

### Do these first, in order

1. **Google Search Console.** Add the property, verify it, submit
   `https://rakeshnaik1109-cloud.github.io/RakeshNaik/sitemap.xml`. Without this you are waiting to
   be discovered instead of asking to be indexed. Also add
   [Bing Webmaster Tools](https://www.bing.com/webmasters) — it feeds several
   other engines and takes five minutes.

2. **Point academic profiles at this site.** Each of these is a high-authority
   backlink and each is free:
   - Google Scholar → *Homepage* field
   - ORCID → *Websites & social links* (create an ORCID iD if you have none; it
     is the single most useful identifier a researcher can own)
   - ResearchGate, Web of Science / Publons, Scopus author profile
   - LinkedIn → *Website* field
   - Your **lab and department pages at IIT Roorkee** — a link from `iitr.ac.in`
     is worth more than everything else on this list combined. Ask.

3. **Keep the publication list current.** Every correct title, author list and
   DOI in `publications.html` is a phrase someone might search. Add DOIs as
   papers are published.

4. **Add an ORCID iD when you have one.** In `index.html`, inside the `Person`
   block, add it to `sameAs` next to Google Scholar, LinkedIn and GitHub:

   ```json
   "sameAs": [
     "https://orcid.org/XXXX-XXXX-XXXX-XXXX",
     "https://scholar.google.com/citations?hl=en&user=xDMzlr0AAAAJ",
     "https://www.linkedin.com/in/albertrakesh/",
     "https://github.com/rakeshnaik1109-cloud"
   ]
   ```

   `sameAs` is how a search engine connects this page to your verified academic
   identity.

5. **Publish the blog posts.** Two are drafted as placeholders. A page about
   *why receptor-free SERS is hard* can rank for queries no personal homepage
   ever will, and it gives people a reason to link to you.

### Then, steadily

- **Write for the long queries.** Nobody outranks Wikipedia for "Raman
  spectroscopy". Plenty of room exists for "receptor-free SERS virus detection",
  "SERS enhancement factor reproducibility" or "browser-based Raman baseline
  correction". Those are also the people you actually want to hear from.
- **Cite the software in your papers.** A DOI'd, cited tool pulls traffic for
  years. Archive a release on [Zenodo](https://zenodo.org) to get a permanent DOI
  and a citation record.
- **Keep one canonical URL.** Pick `https://rakeshnaik1109-cloud.github.io/RakeshNaik/` *or* a custom
  domain and use it everywhere. Splitting your links across two hostnames splits
  your authority.
- **Update the site.** Freshness is a weak signal on its own, but a site that
  has not changed in three years also stops attracting links.

### Do not bother with

- Keyword stuffing. The `keywords` meta tag has been ignored by Google since
  2009; it is in these files only because some academic aggregators still read it.
- Buying backlinks. For an academic profile this is both useless and a
  reputational risk.
- Chasing a perfect Lighthouse score. The site is already fast; past a point you
  are optimising a number rather than an experience.

---

## Checking your work

| Tool | What it tells you |
|---|---|
| [Rich Results Test](https://search.google.com/test/rich-results) | Whether your structured data parses |
| [PageSpeed Insights](https://pagespeed.web.dev/) | Real-world loading performance |
| Search Console → *Coverage* | Which pages are actually indexed |
| Search Console → *Performance* | The queries people used to find you |
| `site:rakeshnaik1109-cloud.github.io/RakeshNaik` in Google | A quick check that indexing happened |

Expect two to six weeks before a new site settles into results, and longer before
your name query is dominated by your own site rather than by namesakes. The
backlinks in step 2 are what shorten that.
