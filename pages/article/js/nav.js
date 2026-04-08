const modeOpusBtn = document.getElementById('modeOpusBtn');
const modeAboutBtn = document.getElementById('modeAboutBtn');
const modeArticleBtn = document.getElementById('modeArticleBtn');

if (modeOpusBtn) {
  modeOpusBtn.addEventListener('click', () => {
    window.location.href = '/pages/opus/?view=grid';
  });
}

if (modeAboutBtn) {
  modeAboutBtn.addEventListener('click', () => {
    window.location.href = '/pages/aboutme/';
  });
}

if (modeArticleBtn) {
  modeArticleBtn.addEventListener('click', () => {
    window.location.href = '/pages/article/';
  });
}
