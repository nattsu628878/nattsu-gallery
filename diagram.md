# nattsu Gallery - 構造図・遷移図

## ページ構造図

```
┌─────────────────────────────────────────────────────────┐
│                    index.html                            │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Header                                           │  │
│  │  - タイトル: "nattsu Gallery"                     │  │
│  │  - ビュー切り替え: Grid / Table / Simple         │  │
│  │  - 設定: Size / Background / Font                 │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Main Area                                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │  │
│  │  │ Grid View   │  │ Table View  │  │ Simple   │ │  │
│  │  │ (default)   │  │ (hidden)    │  │ (hidden)  │ │  │
│  │  └─────────────┘  └─────────────┘  └──────────┘ │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Detail Panel (右側からスライドイン)              │  │
│  │  - タイトル / タイプ / 概要 / 日付 / タグ         │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## データフロー図

```mermaid
graph TD
    A[index.html] -->|読み込み| B[app.js]
    B -->|fetch| C[data/items.json]
    C -->|JSON配列| B
    B -->|renderGrid| D[grid-view.js]
    B -->|renderTable| E[table-view.js]
    B -->|renderSimple| F[simple-view.js]
    
    D -->|fetch| C
    E -->|fetch| C
    F -->|fetch| C
    
    D -->|getThumbnailUrl| G[utils.js]
    E -->|getThumbnailUrl| G
    D -->|showDetailPanel| G
    D -->|executeAction| G
    
    D -->|assets.md| H[assets/*.md]
    D -->|assets.image| I[thumbnails/*.jpg]
    D -->|url| J[YouTube/SoundCloud]
    
    G -->|クリック時| K[article.html]
    G -->|クリック時| L[midi.html]
    G -->|クリック時| M[audioplayer.html]
    G -->|クリック時| N[外部URL]
```

## ページ遷移図

```mermaid
graph LR
    A[index.html<br/>メインギャラリー] -->|クリック: assets.md| B[article.html<br/>Markdown表示]
    A -->|クリック: assets.midi| C[midi.html<br/>MIDIビジュアライザー]
    A -->|クリック: assets.wav| D[audioplayer.html<br/>オーディオプレイヤー]
    A -->|クリック: url| E[外部URL<br/>YouTube/SoundCloud等]
    
    B -->|戻る| A
    C -->|戻る| A
    D -->|戻る| A
    
    style A fill:#628878,color:#fff
    style B fill:#f9f9f9
    style C fill:#f9f9f9
    style D fill:#f9f9f9
    style E fill:#e8e8e8
```

## ビュー切り替えフロー

```mermaid
stateDiagram-v2
    [*] --> GridView: 初期表示
    GridView --> TableView: Tableボタンクリック
    TableView --> GridView: Gridボタンクリック
    TableView --> SimpleView: Simpleボタンクリック
    GridView --> SimpleView: Simpleボタンクリック
    SimpleView --> GridView: Gridボタンクリック
    SimpleView --> TableView: Tableボタンクリック
    
    note right of GridView
        カード形式表示
        サムネイル + ホバー詳細パネル
    end note
    
    note right of TableView
        表形式表示
        サムネイル/タイトル/タイプ/日付/タグ
    end note
    
    note right of SimpleView
        IDのみリスト表示
    end note
```

## アセットタイプとクリック動作の優先順位

```mermaid
graph TD
    A[アイテムクリック] --> B{assets.wav?}
    B -->|あり| C[audioplayer.html]
    B -->|なし| D{assets.midi?}
    D -->|あり| E[midi.html]
    D -->|なし| F{assets.md?}
    F -->|あり| G[article.html]
    F -->|なし| H{url?}
    H -->|あり| I[外部URL]
    H -->|なし| J[何もしない]
    
    style C fill:#628878,color:#fff
    style E fill:#628878,color:#fff
    style G fill:#628878,color:#fff
    style I fill:#e8e8e8
```

## ファイル構造

```
nattsu-gallery/
├── index.html              # メインページ
├── article.html            # Markdown記事表示ページ
├── midi.html              # MIDIビジュアライザー（将来）
├── audioplayer.html       # オーディオプレイヤー（将来）
├── app.js                 # メインアプリケーション
├── styles.css             # スタイル
├── js/
│   ├── grid-view.js       # Grid View実装
│   ├── table-view.js      # Table View実装
│   ├── simple-view.js     # Simple View実装
│   └── utils.js           # 共通ユーティリティ
├── data/
│   └── items.json         # メタデータ（必須: idのみ）
├── assets/
│   ├── *.md              # Markdownファイル
│   ├── *.midi            # MIDIファイル（将来）
│   └── *.wav             # WAVファイル（将来）
└── thumbnails/
    └── *.jpg, *.png      # サムネイル画像
```

## データ読み込みフロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant I as index.html
    participant A as app.js
    participant G as grid-view.js
    participant D as data/items.json
    participant U2 as utils.js
    
    U->>I: ページアクセス
    I->>A: DOMContentLoaded
    A->>A: loadData()
    A->>A: renderView('grid')
    A->>G: renderGrid(container)
    G->>D: fetch('data/items.json')
    D-->>G: JSON配列
    G->>G: createMediaCard(item)
    G->>U2: getThumbnailUrl(item)
    G->>U2: showDetailPanel(item)
    G-->>I: カード表示
    U->>I: カードクリック
    I->>U2: executeAction(item)
    U2->>I: 新しいタブでページを開く
```

## サムネイル取得の優先順位

```mermaid
graph TD
    A[サムネイル取得] --> B{assets.image?}
    B -->|あり| C[assets.imageを使用]
    B -->|なし| D{thumbnail?}
    D -->|あり| E[thumbnailを使用]
    D -->|なし| F{url?}
    F -->|あり| G{YouTube?}
    G -->|はい| H[YouTube APIから取得]
    G -->|いいえ| I{SoundCloud?}
    I -->|はい| J[oEmbed APIから取得]
    I -->|いいえ| K[urlをそのまま使用]
    F -->|なし| L[プレースホルダー表示]
    
    style C fill:#628878,color:#fff
    style E fill:#628878,color:#fff
    style H fill:#628878,color:#fff
    style J fill:#628878,color:#fff
    style K fill:#e8e8e8
    style L fill:#f0f0f0
```
