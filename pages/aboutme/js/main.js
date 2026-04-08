const modeOpusBtn = document.getElementById('modeOpusBtn');
const modeAboutBtn = document.getElementById('modeAboutBtn');
const modeArticleBtn = document.getElementById('modeArticleBtn');

if (modeOpusBtn) modeOpusBtn.addEventListener('click', () => {
    window.location.href = '../opus/?view=grid';
});

if (modeAboutBtn) modeAboutBtn.addEventListener('click', () => {
    window.location.href = './';
});

if (modeArticleBtn) modeArticleBtn.addEventListener('click', () => {
    window.location.href = '../article/';
});
