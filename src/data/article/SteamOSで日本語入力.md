1. flatpak(Discover)でfcitxをインストール
    - fcitx5, fcitx5用のMozc
2. .xprofileにfcitxを設定    
```
export GTK_IM_MODULE=fcitx
export QT_IM_MODULE=fcitx
export XMODIFIERS=@im=fcitx
```
3. Fcitxの設定で入力メソッドにMozcを追加（←）
