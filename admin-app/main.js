import { open } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile, writeBinaryFile, exists, createDir } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';

let tags = [];
const tagInput = document.getElementById('tagInput');
const tagsContainer = document.getElementById('tagsContainer');
const typeSelect = document.getElementById('type');
const assetsSection = document.getElementById('assetsSection');
const dateInput = document.getElementById('date');
const thumbnailFileInput = document.getElementById('thumbnailFile');
const thumbnailPathInput = document.getElementById('thumbnail');
const statusMessage = document.getElementById('statusMessage');

// 今日の日付をデフォルトに設定
dateInput.value = new Date().toISOString().split('T')[0];

// タグ入力
tagInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const tag = tagInput.value.trim();
        if (tag && !tags.includes(tag)) {
            tags.push(tag);
            updateTagsDisplay();
            tagInput.value = '';
        }
    }
});

function updateTagsDisplay() {
    tagsContainer.innerHTML = '';
    tags.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag';
        tagEl.innerHTML = `${tag}<span class="tag-remove" onclick="removeTag('${tag}')">×</span>`;
        tagsContainer.appendChild(tagEl);
    });
}

window.removeTag = function(tag) {
    tags = tags.filter(t => t !== tag);
    updateTagsDisplay();
};

// サムネイルファイル選択時の処理
thumbnailFileInput.addEventListener('change', async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
        const file = files[0];
        const fileName = file.name;
        const fileExtension = fileName.split('.').pop();
        const id = document.getElementById('id').value || 'new-item';
        const thumbnailPath = `/thumbnails/${id}.${fileExtension}`;
        thumbnailPathInput.value = thumbnailPath;
    }
});

// タイプに応じたアセット入力欄を表示
typeSelect.addEventListener('change', (e) => {
    const type = e.target.value;
    assetsSection.innerHTML = '';
    
    if (!type) {
        assetsSection.innerHTML = '<p style="color: #666;">タイプを選択すると、該当する入力欄が表示されます。</p>';
        return;
    }
    
    switch(type) {
        case 'picture':
            assetsSection.innerHTML = `
                <h3>画像</h3>
                <div class="form-group">
                    <label for="assetImage">画像パス</label>
                    <input type="text" id="assetImage" placeholder="/thumbnails/image.jpg">
                </div>
            `;
            break;
        case 'movie':
            assetsSection.innerHTML = `
                <h3>動画</h3>
                <div class="form-group">
                    <label for="assetVideo">YouTube URL</label>
                    <input type="text" id="assetVideo" placeholder="https://www.youtube.com/watch?v=xxxxx">
                </div>
            `;
            break;
        case 'music':
            assetsSection.innerHTML = `
                <h3>音楽</h3>
                <div class="form-group">
                    <label for="assetAudio">音声URL（Dropbox等）</label>
                    <input type="text" id="assetAudio" placeholder="https://dl.dropboxusercontent.com/s/xxxxx/audio.mp3">
                </div>
            `;
            break;
        case 'write':
            assetsSection.innerHTML = `
                <h3>文章</h3>
                <div class="form-group">
                    <label for="assetContent">Markdownファイルパス</label>
                    <input type="text" id="assetContent" placeholder="/content/article.md">
                    <small style="color: #666;">例: /content/article.md</small>
                </div>
                <div class="form-group">
                    <label for="markdownContent">Markdown本文</label>
                    <textarea id="markdownContent" placeholder="# タイトル&#10;&#10;本文..."></textarea>
                </div>
            `;
            break;
        case 'dev':
            assetsSection.innerHTML = `
                <h3>開発</h3>
                <div class="form-group">
                    <label for="assetRepo">GitHubリポジトリURL</label>
                    <input type="text" id="assetRepo" placeholder="https://github.com/username/repo">
                </div>
                <div class="form-group">
                    <label for="assetDemo">Demo URL</label>
                    <input type="text" id="assetDemo" placeholder="https://example.com/demo">
                </div>
            `;
            break;
    }
});

// フォーム送信
document.getElementById('itemForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveItem();
});

async function saveItem() {
    const type = typeSelect.value;
    const id = document.getElementById('id').value;
    const title = document.getElementById('title').value;
    const summary = document.getElementById('summary').value;
    const date = document.getElementById('date').value;
    const thumbnail = thumbnailPathInput.value;
    
    // アセット情報を取得
    const assets = {};
    switch(type) {
        case 'picture':
            const image = document.getElementById('assetImage')?.value;
            if (image) assets.image = image;
            break;
        case 'movie':
            const video = document.getElementById('assetVideo')?.value;
            if (video) assets.video = video;
            break;
        case 'music':
            const audio = document.getElementById('assetAudio')?.value;
            if (audio) assets.audio = audio;
            break;
        case 'write':
            const content = document.getElementById('assetContent')?.value;
            if (content) assets.content = content;
            break;
        case 'dev':
            const repo = document.getElementById('assetRepo')?.value;
            const demo = document.getElementById('assetDemo')?.value;
            if (repo) assets.repo = repo;
            if (demo) assets.demo = demo;
            break;
    }
    
    // アイテムオブジェクトを作成
    const item = {
        id,
        type,
        title,
        summary,
        tags: tags.length > 0 ? tags : ['untagged'],
        date,
        thumbnail,
        assets
    };
    
    showStatus('保存中...', 'info');
    
    try {
        // プロジェクトディレクトリを選択
        const projectDir = await open({
            directory: true,
            multiple: false,
            title: 'プロジェクトのルートディレクトリを選択してください'
        });
        
        if (!projectDir) {
            showStatus('保存がキャンセルされました', 'info');
            return;
        }
        
        // dataディレクトリが存在しない場合は作成
        const dataDir = await join(projectDir, 'data');
        try {
            if (!(await exists(dataDir))) {
                await createDir(dataDir, { recursive: true });
            }
        } catch (error) {
            console.warn('dataディレクトリの作成に失敗:', error);
        }
        
        // items.jsonのパス
        const itemsPath = await join(dataDir, 'items.json');
        
        // 既存のitems.jsonを読み込む
        let items = [];
        try {
            if (await exists(itemsPath)) {
                const content = await readTextFile(itemsPath);
                if (content.trim()) {
                    items = JSON.parse(content);
                }
            }
        } catch (error) {
            console.warn('既存のitems.jsonを読み込めませんでした:', error);
        }
        
        // 新しいアイテムを追加
        items.push(item);
        
        // items.jsonに保存
        await writeTextFile(itemsPath, JSON.stringify(items, null, 2) + '\n');
        
        // サムネイル画像を保存
        if (thumbnailFileInput.files && thumbnailFileInput.files.length > 0) {
            const thumbnailFile = thumbnailFileInput.files[0];
            const fileExtension = thumbnailFile.name.split('.').pop();
            const thumbnailFileName = `${id}.${fileExtension}`;
            const thumbnailsDir = await join(projectDir, 'thumbnails');
            
            // thumbnailsディレクトリが存在しない場合は作成
            try {
                if (!(await exists(thumbnailsDir))) {
                    await createDir(thumbnailsDir, { recursive: true });
                }
            } catch (error) {
                console.warn('thumbnailsディレクトリの作成に失敗:', error);
            }
            
            const thumbnailPath = await join(thumbnailsDir, thumbnailFileName);
            
            // ファイルをArrayBufferとして読み込み
            const arrayBuffer = await thumbnailFile.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // TauriのFS APIでバイナリファイルを保存
            await writeBinaryFile(thumbnailPath, uint8Array);
        }
        
        // Markdownファイルを保存（writeタイプの場合）
        if (type === 'write' && document.getElementById('markdownContent')?.value) {
            const markdownContent = document.getElementById('markdownContent').value;
            const contentPath = document.getElementById('assetContent')?.value || `/content/${id}.md`;
            const fileName = contentPath.split('/').pop();
            const contentDir = await join(projectDir, 'content');
            
            // contentディレクトリが存在しない場合は作成
            try {
                if (!(await exists(contentDir))) {
                    await createDir(contentDir, { recursive: true });
                }
            } catch (error) {
                console.warn('contentディレクトリの作成に失敗:', error);
            }
            
            const markdownPath = await join(contentDir, fileName);
            await writeTextFile(markdownPath, markdownContent);
        }
        
        showStatus('✅ 保存完了！', 'success');
        
        // フォームをリセット
        setTimeout(() => {
            document.getElementById('itemForm').reset();
            tags = [];
            updateTagsDisplay();
            dateInput.value = new Date().toISOString().split('T')[0];
            showStatus('', '');
        }, 2000);
        
    } catch (error) {
        console.error('保存エラー:', error);
        showStatus(`❌ エラー: ${error.message}`, 'error');
    }
}

function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    if (!message) {
        statusMessage.className = 'status-message';
    }
}
