# JSON Schema Documentation

## 概要

`pages/opus/data/items.json`で管理されるデータ構造仕様書です。各ビューは独自にJSONを解釈し、必要なフィールドのみを使用します。

## データ管理

- **データファイル**: `pages/opus/data/items.json`
- **必須フィールド**: `id` のみ
- **UI解釈**: 各ビューのJSファイルにオプションスキーマを委ねて、分割統治
- **拡張性**: 後からデータにフィールドを追加して、新たなviewに対応させていく
- **編集**: JSONファイルなので、別ページやツールから簡単に編集可能

## 基本原則

- **スキーマレス設計**
- **必須フィールド**: `id` のみ
- **その他のフィールド**: すべてオプション。各ビューが独自に解釈
- **拡張性**: 新しいフィールドを追加しても、既存のビューには影響しない
- **複数のアセットタイプ**: 1つのアイテムに複数のアセットタイプ（`midi`、`wav` など）を同時に指定可能。クリック時の優先順位は `wav` > `midi` > `url`

## メディアの格納と type

- **メディア一式**: すべて **`pages/opus/assets/`** に格納する（Markdown、画像、動画ファイル）。
- **type**（ギャラリー表示・絞り込み）:
  - **picture**: 画像1枚。`assets.image`（`assets/{id}.{ext}`）。
  - **movie**: 動画1本。`url` に外部URLまたは `/pages/opus/assets/...` のローカルファイル。
- **その他の type**（dev, music 等）: 手動で items.json に追加可能。表示・クリックは各ビューが対応する範囲で解釈。
- **サムネイル／メイン画像**: `assets.image` に `/pages/opus/assets/` 配下のパスを指定。後方互換のため `thumbnail` も参照されるが、新規は `assets.image` のみ使用する。

## Opus Editer でのビュー別項目

スキーマレス設計のため、Opus Editer では**ビューごとに必要な項目**をまとめて表示する。今後ビューが増えても、各ビューのスキーマに合わせて項目を追加・表示できる。

| ビュー | 使用する項目（Opus Editer での入力） |
|--------|--------------------------------|
| **Simple View** | `id` のみ（共通の ID を入力すれば表示される） |
| **Grid View** | `id`, `title`, 画像（`assets.image` / thumbnail / url）。**日付・type・tags は使わない**。順番はランダム。ホバーでタイトルを表示。 |
| **Table View** | `id`, `title`, `date`, `tags`（type は廃止・tags に統合）。ソート: 日付順/逆順。絞り込み: タグ。 |

- **共通**: 全ビューで使う `id`（必須）。
- **Grid 用**: タイトルと画像のみ。画像は `picture` / `movie` / サムネイル取得で自動設定。
- **Table 用**: タイトル・日付・タイプ・タグはいずれも任意。タグは既存から選択または自由入力で追加可能。

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

**ファイル**: `pages/opus/js/views/simple-view.js`

---

### Table View

**必須スキーマ**: `id`, `title`, `date`, `tags`。**type は廃止**し、tags に統合。

**受け付けるスキーマ**:

```typescript
{
  "id": string,                    // 必須
  "title"?: string,
  "date"?: string,
  "tags"?: string[],               // type は廃止。分類は tags で行う
  "url"?: string,
  "thumbnail"?: string,
  "assets"?: {
    "image"?: string,
    "md"?: string,
    "midi"?: string,
    "wav"?: string
  }
}
```

**使用フィールド**: `id`（必須）, `title`, `date`, `tags`。サムネイルは `assets.image` > `thumbnail` > `url` から取得。

**表示内容**: Thumbnail, Title, Date, Tags（type 列はなし）

**ソート**: 日付順 / 日付逆順

**絞り込み**: タグ（選択したタグを含むアイテムのみ表示）

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
3. それ以外は `url` を開く（記事専用ページは廃止）

**複数のアセットタイプの使用例**:
- 音楽作品: `assets.wav`（音声ファイル）+ `url` など

**ファイル**: `pages/opus/js/views/table-view.js`

---

### Grid View（シンプル版）

**受け付けるスキーマ**:

```typescript
{
  "id": string,                    // 必須
  "title"?: string,                // ホバー時に表示
  "url"?: string,                  // サムネイル取得用（YouTube 等）
  "thumbnail"?: string,            // 直接サムネイルURL
  "assets"?: {
    "image"?: string               // 画像（最優先）
  }
}
```

**使用フィールド**: `id`（必須）, `title`, 画像（`assets.image` > `thumbnail` > `url` から取得）。日付・type・tags は使わない。

**表示内容**:
- 段々表示（1段目は右方向、2段目は左方向に流れるアニメーション）。順番はランダム。
- 画像カード。ホバーでタイトルを小さく表示。クリックで `executeAction`（記事・画像・動画・url を開く）。

**ファイル**: `pages/opus/js/views/grid-view.js`

---

## サムネイルの取得方法

1. **assets.image**: 最優先。`/pages/opus/assets/` 配下の画像パス（例: `/pages/opus/assets/{id}.jpg`、`/pages/opus/assets/{id}-card.jpg`）。
2. **url**: YouTube の場合は動画IDからサムネイルURLを生成。SoundCloud の場合は oEmbed API から取得。その他は url をそのまま使用。
3. **thumbnail**: 後方互換用。新規は `assets.image` を使用する。

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
      "url": "/pages/opus/assets/article.md"
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

- **メインアプリ**: `pages/opus/js/app/main.js`
- **データ管理**: `pages/opus/data/items.json`
- **共通ユーティリティ**: `pages/opus/js/utils.js`
- **Grid View**: `pages/opus/js/views/grid-view.js`
- **Table View**: `pages/opus/js/views/table-view.js`
- **Simple View**: `pages/opus/js/views/simple-view.js`

---

## 拡張性

新しいフィールドを追加する場合:

1. `pages/opus/data/items.json`に新しいフィールドを追加
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
