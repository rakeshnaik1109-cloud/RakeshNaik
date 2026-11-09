"""Copy the files the published site needs into _site/.

Every page, script, stylesheet and text file is published; any other file (images,
video, PDFs, …) is published only if some page, script or stylesheet names it. Large
originals kept in the repository but never shown (full-size photos, HEIC files) stay
out of the upload, so GitHub Pages has less to sync.
"""
import os, shutil, subprocess, sys, urllib.parse

TEXT = ('.html', '.js', '.css', '.json', '.xml', '.txt', '.webmanifest', '.svg', '.ico')
out = sys.argv[1] if len(sys.argv) > 1 else '_site'
files = [f for f in subprocess.check_output(['git', 'ls-files'], text=True).splitlines() if not f.startswith('.github/')]
corpus = ''
for f in files:
    if f.endswith(TEXT):
        with open(f, encoding='utf-8', errors='ignore') as h:
            corpus += h.read() + '\n'

def named(f):
    base = os.path.basename(f)
    forms = {f, base, urllib.parse.quote(f), urllib.parse.quote(base), f.replace(' ', '%20'), base.replace(' ', '%20')}
    return any(x in corpus for x in forms)

keep = [f for f in files if f.endswith(TEXT) or f in ('.nojekyll', 'CNAME') or named(f)]
if os.path.exists(out):
    shutil.rmtree(out)
size = 0
for f in keep:
    dst = os.path.join(out, f)
    os.makedirs(os.path.dirname(dst) or out, exist_ok=True)
    shutil.copy2(f, dst)
    size += os.path.getsize(f)
skipped = len(files) - len(keep)
print(f'published {len(keep)} files ({size / 1e6:.1f} MB); left out {skipped} unreferenced files')
