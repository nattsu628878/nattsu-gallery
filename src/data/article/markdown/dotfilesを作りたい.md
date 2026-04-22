github:
https://github.com/nattsu628878/dotfiles-mac
https://github.com/nattsu628878/dotfiles-win

# OSX

参考：
https://qiita.com/kez/items/e349a8d025acbcdc3a86
https://github.com/yoshimi-I/dotfiles
#### ディレクトリ構成

link.sh
```
#!/bin/zsh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo SCRIPT_DIR


for dotfile in "${SCRIPT_DIR}"/.??* ; do
    [[ "$dotfile" == "${SCRIPT_DIR}/.git" ]] && continue
    [[ "$dotfile" == "${SCRIPT_DIR}/.github" ]] && continue
    [[ "$dotfile" == "${SCRIPT_DIR}/.DS_Store" ]] && continue

    ln -fnsv "$dotfile" "$HOME"
done

```

default
https://zenn.dev/keyamin/articles/970af2dca9c4c5

.Brewfile
```
tap "homebrew/bundle"
cask "cursor"
cask "deepl"
cask "discord"
cask "firefox"
cask "notion"
cask "obs"
cask "obsidian"
cask "scroll-reverser"
cask "touchdesigner"
vscode "ms-ceintl.vscode-language-pack-ja"
```

# Windows

