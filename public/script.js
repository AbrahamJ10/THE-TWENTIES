// Carrusel automático
let slides = document.querySelectorAll('.carrusel .slide');
let index = 0;

function showSlide() {
  slides.forEach((slide, i) => {
    slide.style.display = (i === index) ? 'block' : 'none';
  });
  index = (index + 1) % slides.length;
}

setInterval(showSlide, 3000);
showSlide();
