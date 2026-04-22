#### 環境構築（Desktop版）
参考：
https://v2.tauri.app/ja/start/create-project/

create-tauri-appのインストール
`cargo install create-tauri-app --locked`
tauri CLIのインストール
`cargo install tauri-cli --version "^2.0.0" --locked`

#### プロジェクトの作成
tauriプロジェクトの作成
`cargo create-tauri-app`
開発サーバーの起動
tauriプロジェクトディレクトリで
`cargo tauri dev`

フロントエンドの言語
- Rust
- TypeScript / JavaScript
- .NET
パッケージマネジャー
- Vanilla(html + css + js)
- yew(Rust:フロントエンドもRustで開発)

#### モバイルアプリ開発
参考：
https://www.youtube.com/watch?v=gE7OxH0Xb1Y

各プラットフォーム固有の機能を使うには、Kotlin SwiftをTauriプラグインとして実装して使う



---
#### 環境構築（Docker,Debian編）
https://v2.tauri.app/ja/start/prerequisites/
いろいろインストール
```
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
build-essential \
curl \
wget \
file \
libxdo-dev \
libssl-dev \
libayatana-appindicator3-dev \
librsvg2-dev
```
これもしないとかも
```
sudo apt update
sudo apt install -y libwebkit2gtk-4.0-dev librsvg2-dev
```
rustインストール
`curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh`
パス通す
`echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc`
`source ~/.bashrc`

nvmでnode,npmインストール
https://nodejs.org/ja/download
```
# nvmをダウンロードしてインストールする：
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash
# シェルを再起動する代わりに実行する
\. "$HOME/.nvm/nvm.sh"
# Node.jsをダウンロードしてインストールする：
nvm install 22
# Node.jsのバージョンを確認する：
node -v # "v22.14.0"が表示される。
nvm current # "v22.14.0"が表示される。
# npmのバージョンを確認する：
npm -v # "10.9.2"が表示される。
```
パスを通す
`echo 'export PATH="$HOME/.cargo/bin:$HOME/.npmglobal/bin:$HOME/.nvm/versions/node/$(node -v)/bin:$PATH"' >> ~/.bashrc`
`source ~/.bashrc`

プロジェクトを作成
`npm create tauri-app@latest`

プロジェクトを開発サーバーで実行
```
cd tauri-app
npm install
npm run tauri dev
```
