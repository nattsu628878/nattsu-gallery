# JSON Schema Documentation

## 概要

`data/items.json`で管理されるデータ構造仕様書です。各ビューは独自にJSONを解釈し、必要なフィールドのみを使用します。

## データ管理

- **データファイル**: `data/items.json`
- **必須フィールド**: `id` のみ
- **UI解釈**: 各ビューのJSファイルにオプションスキーマを委ねて、分割統治
- **拡張性**: 後からデータにフィールドを追加して、新たなviewに対応させていく
- **編集**: JSONファイルなので、別ページやツールから簡単に編集可能

## 基本原則

- **スキーマレス設計**
- **必須フィールド**: `id` のみ
- **その他のフィールド**: すべてオプション。各ビューが独自に解釈
- **拡張性**: 新しいフィールドを追加しても、既存のビューには影響しない
- **複数のアセットタイプ**: 1つのアイテムに複数のアセットタイプ（`md`、`midi`、`wav`など）を同時に指定可能。クリック時の優先順位は `wav` > `midi` > `md` > `url`


## 各ビューのスキーマ

### Simple View

**受け付けるスキーマ**:

```typescript
{
  "id": string  // 必須
}
```

**使用フィールド**:
- `id`: 必須

**表示内容**: IDのみをリスト表示

**ファイル**: `js/simple-view.js`

---

### Table View

**受け付けるスキーマ**:

```typescript
{
  "id": string,                    // 必須
  "url"?: string,                  // サムネイル取得用のURL（YouTube、SoundCloudなど）
  "thumbnail"?: string,            // 直接サムネイルURL
  "title"?: string,
  "type"?: string,
  "date"?: string,
  "tags"?: string[],
  "assets"?: {
    "image"?: string,              // サムネイル画像（thumbnailより優先）
    "md"?: string,                  // Markdownファイルのリンク（assets配下、説明文）
    "midi"?: string,                // MIDIファイルのリンク
    "wav"?: string                  // WAVファイルのリンク（音声ファイル）
  }
}
```

**使用フィールド**:
- `id`: 必須
- `url`: サムネイル取得用のURL（YouTube、SoundCloudなど）
- `thumbnail`: 直接サムネイルURL
- `title`: タイトル表示
- `type`: タイプ表示
- `date`: 日付表示
- `tags`: タグ表示
- `assets.image`: サムネイル画像（最優先）
- `assets.md`: Markdownファイルのリンク（ツールチップとして表示）

**表示内容**:
- Thumbnail: サムネイル画像
- Title: タイトル（なければID）
- Type: タイプ（なければ"-"）
- Date: 日付（なければ"-"）
- Tags: タグ（なければ"-"）

**サムネイル取得ロジック**:
1. `assets.image`が指定されている場合、それを最優先
2. `thumbnail`が指定されている場合、それを使用
3. `url`が指定されている場合、URLの種類に応じて自動取得
   - **YouTube**: `https://www.youtube.com/watch?v=VIDEO_ID` → `https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg`
   - **SoundCloud**: oEmbed APIから非同期で取得
   - **その他**: `url`をそのままサムネイルURLとして使用
4. どちらもない場合、プレースホルダーを表示

**クリック動作**（複数のアセットタイプがある場合の優先順位）:
1. `assets.wav`がある場合、`audioplayer.html?file=...`で表示（音声ファイルを最優先）
2. `assets.midi`がある場合、`midi.html?file=...`で表示
3. `assets.md`がある場合、`article.html?file=...`で表示（説明文）
4. それ以外は`url`を開く

**複数のアセットタイプの使用例**:
- 音楽作品: `assets.wav`（音声ファイル）+ `assets.md`（説明文）
- 開発プロジェクト: `assets.md`（説明文）+ `url`（GitHubリンク）

**ファイル**: `js/table-view.js`

---

### Grid View

**受け付けるスキーマ**:

```typescript
{
  "id": string,                    // 必須
  "url"?: string,                  // サムネイル取得用のURL（YouTube、SoundCloudなど）
  "thumbnail"?: string,            // 直接サムネイルURL
  "title"?: string,
  "type"?: string,
  "date"?: string,
  "tags"?: string[],
  "assets"?: {
    "image"?: string,              // サムネイル画像（thumbnailより優先）
    "md"?: string,                 // Markdownファイルのリンク（content配下）
    "midi"?: string,               // MIDIファイルのリンク（将来の拡張）
    "wav"?: string                 // WAVファイルのリンク（将来の拡張）
  }
}
```

**使用フィールド**:
- `id`: 必須
- `url`: サムネイル取得用のURL（YouTube、SoundCloudなど）
- `thumbnail`: 直接サムネイルURL
- `title`: タイトル表示
- `type`: タイプ表示
- `date`: 日付表示
- `tags`: タグ表示
- `assets.image`: サムネイル画像（最優先）
- `assets.md`: Markdownファイルのリンク（プレビュー表示用）

**表示内容**:
- サムネイル画像（カード形式）
- ホバー時に詳細パネルを表示（タイトル、タイプ、日付、タグ、Markdownプレビュー）
- クリック時に適切なページを開く

**サムネイル取得ロジック**:
1. `assets.image`が指定されている場合、それを最優先
2. `thumbnail`が直接指定されている場合、それを使用
3. `url`が指定されている場合、URLの種類に応じて自動取得
   - **YouTube**: `https://www.youtube.com/watch?v=VIDEO_ID` → `https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg`
   - **SoundCloud**: oEmbed APIから非同期で取得
   - **その他**: `url`をそのままサムネイルURLとして使用
4. どちらもない場合、プレースホルダーを表示

**特殊機能**:
- YouTubeサムネイル: `url`がYouTubeの場合、動画IDから自動生成
- SoundCloudサムネイル: `url`がSoundCloudの場合、oEmbed APIから取得
- Markdownプレビュー: `assets.md`がある場合、Markdownファイルを読み込んでプレビュー表示

**クリック動作**（複数のアセットタイプがある場合の優先順位）:
1. `assets.wav`がある場合、`audioplayer.html?file=...`で表示（音声ファイルを最優先）
2. `assets.midi`がある場合、`midi.html?file=...`で表示
3. `assets.md`がある場合、`article.html?file=...`で表示（説明文）
4. それ以外は`url`を開く

**複数のアセットタイプの使用例**:
- 音楽作品: `assets.wav`（音声ファイル）+ `assets.md`（説明文）
- 開発プロジェクト: `assets.md`（説明文）+ `url`（GitHubリンク）

**ファイル**: `js/grid-view.js`

---

## サムネイルの取得方法

### 1. 直接URL指定

```json
{
  "assets": {
    "thumbnail": "/thumbnails/image.jpg"
  }
}
```

### 2. YouTube動画

```json
{
  "assets": {
    "thumbnail": {
      "source": "youtube",
      "url": "https://www.youtube.com/watch?v=VIDEO_ID"
    }
  }
}
```

自動的に `https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg` を生成します。

### 3. SoundCloud

```json
{
  "assets": {
    "thumbnail": {
      "source": "soundcloud",
      "url": "https://soundcloud.com/user/track"
    }
  }
}
```

oEmbed APIからサムネイルを取得します。

---

## アクションタイプ

### external

外部URLを新しいタブで開く

```json
{
  "assets": {
    "action": {
      "type": "external",
      "url": "https://example.com"
    }
  }
}
```

### article

記事ページを表示

```json
{
  "assets": {
    "action": {
      "type": "article",
      "url": "/assets/article.md"
    }
  }
}
```

### image

画像を新しいタブで開く

```json
{
  "assets": {
    "action": {
      "type": "image",
      "url": "/images/image.jpg"
    }
  }
}
```

### custom

カスタムハンドラを実行（将来の拡張用）

```json
{
  "assets": {
    "action": {
      "type": "custom",
      "handler": "console.log('custom action')"
    }
  }
}
```

---

## 実装ファイル

- **メインアプリ**: `app.js`
- **データ管理**: `data/items.json`
- **共通ユーティリティ**: `js/utils.js`
- **Grid View**: `js/grid-view.js`
- **Table View**: `js/table-view.js`
- **Simple View**: `js/simple-view.js`

---

## 拡張性

新しいフィールドを追加する場合:

1. `data/items.json`に新しいフィールドを追加
2. 必要に応じて各ビューファイルでそのフィールドを使用
3. 既存のビューは影響を受けない（オプショナルフィールドのため）

例: 新しい`rating`フィールドを追加

```json
{
  "id": "sample",
  "rating": 5
}
```

このフィールドは、使用するビューでのみ参照されます。他のビューには影響しません。

## データ管理方針

- **必須フィールド**: `id`のみ
- **UI解釈**: 各ビューのJSファイルにオプションスキーマを委ねて、分割統治
- **拡張性**: 後からデータにフィールドを追加して、新たなviewに対応させていく
