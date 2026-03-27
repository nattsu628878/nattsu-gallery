const modeOpusBtn = document.getElementById('modeOpusBtn');
const modeAboutBtn = document.getElementById('modeAboutBtn');
const modeNtBtn = document.getElementById('modeNtBtn');

if (modeOpusBtn) modeOpusBtn.addEventListener('click', () => {
    window.location.href = '/pages/opus/?view=grid';
});

if (modeAboutBtn) modeAboutBtn.addEventListener('click', () => {
    window.location.href = '/pages/aboutme/';
});

if (modeNtBtn) modeNtBtn.addEventListener('click', () => {
    window.location.href = '/pages/nt/';
});
