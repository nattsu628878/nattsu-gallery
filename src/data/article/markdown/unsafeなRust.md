参考：
https://www.youtube.com/watch?v=lx86iUb2xiI

- unsafeブロック
- unsafe impl
- unsafe externブロック
- unsafe属性

#### unsafeブロック
`unsafe {}`
- ポインター外し
- unionのフィールドの使用
- static mut（グローバル変数）の使用
- インラインアセンブリの使用 - `asm!()`
- unsafe関数の使用

#### unsafe impl
unsafe trainを実装するためのもの
SendトレイトとSyncトレイト
プログラマーが能動的にimplすることが安全かどうかをコンパイラーが保証できない

#### unsafe externブロック
externブロック - Rust以外の言語で実装した関数を呼び出せる

#### unsafe属性
関数に付ける属性のうち、export_name no_mangle link_sectionで必要

参考：
https://doc.rust-jp.rs/book-ja/ch19-01-unsafe-rust.html