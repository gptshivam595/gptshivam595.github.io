const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealItems = document.querySelectorAll("[data-reveal]");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  revealItems.forEach(item => observer.observe(item));
} else {
  revealItems.forEach(item => item.classList.add("is-visible"));
}

const getCarouselStep = track => {
  const firstCard = track.firstElementChild;
  if (!firstCard) return Math.max(track.clientWidth, 1);

  const cardRect = firstCard.getBoundingClientRect();
  const styles = window.getComputedStyle(track);
  const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;

  return cardRect.width + gap;
};

const scrollCarousel = (track, direction) => {
  const step = getCarouselStep(track);
  const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
  const currentIndex = Math.round(track.scrollLeft / step);
  const nextLeft = Math.max(0, Math.min(maxScroll, (currentIndex + direction) * step));

  track.scrollTo({
    left: nextLeft,
    behavior: prefersReducedMotion ? "auto" : "smooth"
  });
};

document.querySelectorAll("[data-carousel-prev], [data-carousel-next]").forEach(button => {
  button.addEventListener("click", () => {
    const targetId = button.dataset.carouselPrev || button.dataset.carouselNext;
    const track = document.getElementById(targetId);
    if (!track) return;

    const direction = button.dataset.carouselNext ? 1 : -1;
    scrollCarousel(track, direction);
  });
});

document.querySelectorAll("[data-wheel-carousel]").forEach(track => {
  let activeTimer;
  let wheelAccumulator = 0;

  track.addEventListener(
    "wheel",
    event => {
      const horizontalIntent = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      const wheelAmount = horizontalIntent ? event.deltaX : event.deltaY;
      const maxScroll = track.scrollWidth - track.clientWidth;
      const canScroll = maxScroll > 0;

      if (!canScroll || Math.abs(wheelAmount) < 2) return;

      const atStart = track.scrollLeft <= 1;
      const atEnd = track.scrollLeft >= maxScroll - 1;
      if ((atStart && wheelAmount < 0) || (atEnd && wheelAmount > 0)) return;

      event.preventDefault();
      track.classList.add("is-wheel-active");
      wheelAccumulator += wheelAmount;

      const threshold = Math.min(getCarouselStep(track) * 0.45, 180);
      if (Math.abs(wheelAccumulator) >= threshold) {
        scrollCarousel(track, wheelAccumulator > 0 ? 1 : -1);
        wheelAccumulator = 0;
      }

      window.clearTimeout(activeTimer);
      activeTimer = window.setTimeout(() => {
        wheelAccumulator = 0;
        track.classList.remove("is-wheel-active");
      }, 320);
    },
    { passive: false }
  );
});
