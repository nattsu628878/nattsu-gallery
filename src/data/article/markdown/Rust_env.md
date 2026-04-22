参考：
https://www.youtube.com/watch?v=h8_oHd4ospQ&list=PLboM456Obo1j-qSjNITmRahFbjNI235WR&index=10

rustup
- rustc（コンパイラ）、cargoをインストールするためのCLT
- windows - VisualStudioのビルドツールとWindows SDKが必要
- UNIX系 - gcc or clangが必要

cargo
- Rustのプロジェクトをパッケージとして管理、ビルド、テスト
- crates.io - パッケージのオンラインリポジトリ
- rustcは使わず、cargoで作成、ビルドができる

rustup command
- rustup doc
- rustup update
- rustup default　（すべてのプロジェクトのコンパイラを指定 nightly or stable）
- rustup override （プロジェクトごとにコンパイラを指定）
- rustup target

cargo command
- cargo new
- cargo init
- cargo build
- cargo build --relese
- cargo run
- cargo run --
- cargo add
- cargo remove

cargo.toml
```
[package]
name = "hello_world"
version = "0.1.0"
edition = "2024"

[dependencies]
ここにパッケージを記載
例）
regex = "1.8.1"
```

クロスコンパイル
- 例）Apple silicon macからintel macへ
`rustup target add x86_64-apple-darwin`
`cargo build --target x86_64-apple-darwin`
https://doc.rust-lang.org/nightly/rustc/platform-support.html
- ./.cargo/config.tomlにつぎを設定すると自動クロスコンパイル
```
[build]
target = "i686-pc-windows-msvc"
```

他プラットフォーム間のクロスコンパイル
- cross
	- Dockerを用意してその中でビルドしてくれる
	- Docker Desktopが必要

workspace
- サブプロジェクトを扱える

clippy
- cargoに入っている、よりよいコードを提案してくれるやつ

VScodeの設定
- rust-analyzerプラグイン
	- rust-analyzer.check.commandをclippyに設定
	- QuickFixにも対応