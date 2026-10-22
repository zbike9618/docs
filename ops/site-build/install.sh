#!/usr/bin/env bash
# ビルダーを入れる（root で実行。何度実行しても同じ結果になる）
#   使い方: sudo ./install.sh
# やること: sitebuild ユーザーと置き場所を作る → build.sh と systemd ユニットを入れる → path と timer を有効にする
# /etc/site-build.env が無ければ site-build.env.example から作る（あれば触らない）。
# nginx の root は触らない（README の手順で、動作確認をしてから /var/www/site/current に切り替える）。
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then echo "root で実行してください" >&2; exit 1; fi
here="$(cd "$(dirname "$0")" && pwd)"

id sitebuild >/dev/null 2>&1 || useradd --system --home-dir /opt/site-build --shell /usr/sbin/nologin sitebuild

install -d -o sitebuild -g sitebuild -m 755 /opt/site-build /var/lib/site-build /var/www/site /var/www/site/releases
install -m 755 "$here/build.sh" /opt/site-build/build.sh
if [ ! -f /etc/site-build.env ]; then
  install -m 644 "$here/site-build.env.example" /etc/site-build.env
  echo "/etc/site-build.env を作りました。BRANCH などを確認してください"
fi

# requested は gozakura-api が更新する（どのユーザーで動いていても書けるよう 666）。中身は時刻だけ。
# 無いと path ユニットが監視できないので先に作る
touch /var/lib/site-build/requested
chown sitebuild:sitebuild /var/lib/site-build/requested
chmod 666 /var/lib/site-build/requested

install -m 644 "$here/site-build.service" "$here/site-build.path" "$here/site-build.timer" /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now site-build.path site-build.timer

echo "入れました。状態: systemctl list-timers site-build.timer / journalctl -u site-build -n 50"
echo "手で1回ビルドする: sudo -u sitebuild env FORCE=1 /opt/site-build/build.sh"
