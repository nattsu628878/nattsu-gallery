const urlParams = new URLSearchParams(window.location.search);
const file = urlParams.get('file');

if (!file) {
    document.getElementById('content').innerHTML =
        '<div class="error">エラー: ファイルが指定されていません。</div>';
} else {
    fetch(file)
        .then((response) => {
            if (!response.ok) {
                throw new Error('ファイルの読み込みに失敗しました');
            }
            return response.text();
        })
        .then((markdownRaw) => {
            let markdown = markdownRaw;
            const wikiLinkRegex = /\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g;
            markdown = markdown.replace(wikiLinkRegex, (_, id, text) => {
                const display = (text && text.trim()) || id.trim();
                const filePath = '/pages/opus/assets/' + id.trim() + '.md';
                const url = '/pages/opus/article/?file=' + encodeURIComponent(filePath);
                const escaped = display.replace(/\\/g, '\\\\').replace(/\]/g, '\\]');
                return `[${escaped}](${url})`;
            });

            // 旧リンク互換: /assets/ を /pages/opus/assets/ に置換
            markdown = markdown.replace(/\/assets\//g, '/pages/opus/assets/');

            const html = marked.parse(markdown);
            document.getElementById('content').innerHTML = html;

            const titleFromUrl = urlParams.get('title');
            if (titleFromUrl) {
                document.getElementById('title').textContent = titleFromUrl;
                document.title = `${titleFromUrl} - nattsu`;
            } else {
                const titleMatch = markdown.match(/^#\s+(.+)$/m);
                if (titleMatch) {
                    document.getElementById('title').textContent = titleMatch[1];
                    document.title = `${titleMatch[1]} - nattsu`;
                } else {
                    const fileName = file.split('/').pop().replace('.md', '');
                    document.getElementById('title').textContent = fileName;
                    document.title = `${fileName} - nattsu`;
                }
            }

            const date = new Date().toLocaleDateString('ja-JP');
            document.getElementById('meta').textContent = `更新日: ${date}`;
        })
        .catch((error) => {
            console.error('エラー:', error);
            document.getElementById('content').innerHTML =
                `<div class="error">エラー: ${error.message}</div>`;
        });
}
