# site-build — サイトの自動ビルド（GitHub Actions を使わない配備）

管理画面で保存した内容（お知らせ・ブログ・アップデート・不具合）を、**ビルド時に API から取って HTML に焼き**、公開ディレクトリを差し替える仕組み。
検索エンジンにも中身が読めるようにするためのもの。設計: `seo-prerender-design.md`（セッションの設計書）。

```
管理画面で保存 ──▶ gozakura-api が /var/lib/site-build/requested を更新
docs を push   ──▶ 毎分のタイマーが GitHub の先頭 commit の変化を検知      ──▶ site-build.service (build.sh)
1日1回          ──▶ 取りこぼしの回収                                              │
                                                                                  ▼
   git fetch → (lock が変わったら npm ci) → vitepress build（API は 127.0.0.1:3000）→ 検査
   → /var/www/site/releases/<日時>-<commit>/ を作る → /var/www/site/current の symlink を付け替える
```

- ビルドや検査に失敗したら**差し替えない**（今のサイトが残る）。5 分は自動でやり直さない。
- 保存の直後は 30 秒待って、続けて直した分を 1 回にまとめる。
- 古い release は 5 個まで残す（ロールバック用）。

## ファイル

| ファイル | 置き場所 | 役目 |
|---|---|---|
| `build.sh` | `/opt/site-build/build.sh` | ビルダー本体 |
| `site-build.service` | `/etc/systemd/system/` | build.sh を `sitebuild` ユーザーで 1 回走らせる。メモリ 700MB・CPU 80% の上限つき |
| `site-build.path` | 同上 | `requested` の更新を見て service を起動 |
| `site-build.timer` | 同上 | 毎分 service を呼ぶ |
| `site-build.env.example` | `/etc/site-build.env` | マシンごとの設定 |
| `install.sh` | — | 上記を入れる（root で実行。何度でも実行できる） |
| `nginx/gozakura-strip-html.conf` | `/etc/nginx/conf.d/` | `.html` 付き URL を寄せる変換表 |
| `nginx/gozakura-site.conf` | `/etc/nginx/snippets/` | 旧記事 URL の 301・404 ページなど |

状態ファイルは `/var/lib/site-build/`: `requested`（API が更新）/ `built_at` / `built_commit` / `failed_at` / `status.json`（`{"state":"ok|building|failed",...}`）。

## 入れ方

```bash
# 1. このリポジトリの ops/site-build をマシンに置く（例: /root/ops-site-build）
# 2. 入れる
sudo ./install.sh
# 3. /etc/site-build.env を確認する（staging は下の表のとおり）
# 4. 1 回ビルドしてみる（まだ nginx の root は変えない）
sudo -u sitebuild env FORCE=1 /opt/site-build/build.sh
ls -l /var/www/site/current        # → releases/<日時>-<commit> を指していればOK
# 5. nginx を切り替える（下記）
```

| 設定 | 本番（CT111） | staging（VM117） |
|---|---|---|
| `BRANCH` | `main` | `feature/web-platform` |
| `VITE_API_URL` | 空（`https://api.gozakura.org`） | `http://192.168.11.113` |
| `BUILD_API_URL` | `http://127.0.0.1:3000` | 同じ |

### nginx の切り替え

1. `nginx/gozakura-strip-html.conf` を `/etc/nginx/conf.d/` に、`nginx/gozakura-site.conf` を `/etc/nginx/snippets/` に置く。
2. server ブロックを次のようにする（`location /` の `try_files` は今のまま）。
   ```nginx
   root /var/www/site/current;
   include /etc/nginx/snippets/gozakura-site.conf;
   ```
   本番には今 `absolute_redirect off;` と `if ($news_redirect) {...}` があるので、前者は snippet に含まれる（重複を消す）。後者は残す。
3. 本番だけ: 旧スラッグ（`/news/IP` など）の転送先を新 URL に直す。
   ```bash
   sed -i -E 's#/news/view\?id=#/news/#' /etc/nginx/conf.d/news-redirects.conf
   ```
4. `nginx -t && systemctl reload nginx`

## 日々の使い方

```bash
systemctl list-timers site-build.timer       # タイマーの状態
journalctl -u site-build -n 50 --no-pager     # 直近のログ（成功・失敗の理由）
cat /var/lib/site-build/status.json           # 最後の結果
sudo -u sitebuild env FORCE=1 /opt/site-build/build.sh   # 今すぐ 1 回ビルド（失敗後の待ち時間も無視）
```

**ロールバック**（直前の公開版に戻す）:

```bash
ls -1t /var/www/site/releases/                # 新しい順
ln -sfn /var/www/site/releases/<戻したいもの> /var/www/site/current.new && mv -T /var/www/site/current.new /var/www/site/current
```
戻したあと、次のビルドで最新に戻る。止めたいときは `systemctl stop site-build.timer site-build.path`。

## つまずいたとき

| 症状 | 原因と対処 |
|---|---|
| 保存しても反映されない | `journalctl -u site-build` を見る。`failed` なら理由が出ている。`requested` が更新されているか `ls -l --time-style=full-iso /var/lib/site-build/requested` で確認 |
| 「記事の数が合いません」 | ビルド中に保存が入ったとき。5 分後に自動でやり直す（`FORCE=1` で即実行） |
| 「API の取得に失敗」 | gozakura-api が落ちている。`systemctl status gozakura-api` |
| `npm ci` が失敗 | ネットワークか `package-lock.json` の不整合。`journalctl -u site-build` のエラーを見る |
| メモリ不足で落ちる | `MemoryMax` 超過。`NODE_OPTIONS` を下げるか、`/etc/systemd/system/site-build.service` の `MemoryMax` を見直す |

## 注意

- `build.sh` を更新したら `install.sh` を再実行する（`/opt/site-build/build.sh` はコピー）。
- ビルドは docs の `main`（staging は `feature/web-platform`）のコードを実行する。push できる人 = 本番で動くコードを決められる人。
- 本番 CT111（1 コア / 1GB）の LXC で、`MemoryMax` / `CPUQuota` が効くかは導入時に確認する。
