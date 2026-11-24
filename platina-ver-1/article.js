const article = document.querySelector('article');
const contentsLinks = Array.from(document.querySelectorAll('.contents a'));
const progress = document.querySelector('.reading-progress');
const sections = contentsLinks.map((link) => document.querySelector(link.hash));

function updateReadingPosition() {
  const articleBox = article.getBoundingClientRect();
  const travel = Math.max(1, articleBox.height - window.innerHeight);
  const fraction = Math.max(0, Math.min(1, -articleBox.top / travel));
  progress.style.setProperty('--read', fraction);

  const activeSection = sections.findLast((section) => section.getBoundingClientRect().top <= window.innerHeight * 0.3);
  contentsLinks.forEach((link) => {
    if (activeSection?.id === link.hash.slice(1)) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

let updatePending = false;
function scheduleReadingUpdate() {
  if (updatePending) return;
  updatePending = true;
  requestAnimationFrame(() => {
    updateReadingPosition();
    updatePending = false;
  });
}

window.addEventListener('scroll', scheduleReadingUpdate, { passive: true });
window.addEventListener('resize', scheduleReadingUpdate);
window.addEventListener('load', scheduleReadingUpdate);
updateReadingPosition();

const viewer = document.querySelector('.lightbox');
const viewerImage = viewer.querySelector('img');
const viewerCaption = viewer.querySelector('figcaption');
const closeButton = viewer.querySelector('button');
document.querySelectorAll('[data-enlarge]').forEach((link) => {
  link.addEventListener('click', (event) => {
    if (typeof viewer.showModal !== 'function' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    viewerImage.src = link.href;
    viewerImage.alt = link.querySelector('img').alt;
    viewerCaption.textContent = link.closest('figure').querySelector('figcaption').textContent.trim();
    viewer.showModal();
  });
});
closeButton.addEventListener('click', () => viewer.close());
viewer.addEventListener('click', (event) => {
  if (event.target === viewer) viewer.close();
});
viewer.addEventListener('close', () => viewerImage.removeAttribute('src'));
