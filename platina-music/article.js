const article = document.querySelector('article');
const progress = document.querySelector('.progress');
const contents = Array.from(document.querySelectorAll('.contents a'), (link) => ({
  link,
  section: document.getElementById(link.hash.slice(1)),
}));

function updateReadingPosition() {
  const box = article.getBoundingClientRect();
  const travel = Math.max(1, box.height - window.innerHeight);
  const fraction = Math.max(0, Math.min(1, -box.top / travel));
  progress.style.setProperty('--read', fraction);

  let active;
  for (const item of contents) {
    if (item.section.getBoundingClientRect().top <= window.innerHeight * 0.32) active = item;
  }
  for (const item of contents) {
    if (item === active) {
      item.link.setAttribute('aria-current', 'location');
    } else {
      item.link.removeAttribute('aria-current');
    }
  }
}

let readingFrame = 0;
function queueReadingUpdate() {
  if (readingFrame) return;
  readingFrame = requestAnimationFrame(() => {
    readingFrame = 0;
    updateReadingPosition();
  });
}

window.addEventListener('scroll', queueReadingUpdate, { passive: true });
window.addEventListener('resize', queueReadingUpdate);
window.addEventListener('load', queueReadingUpdate);
updateReadingPosition();
