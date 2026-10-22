#!/usr/bin/env bash
# 建国鯖サイトのビルダー。API（お知らせ・ブログなど）の中身を HTML に焼いて、公開ディレクトリを差し替える。
#
# 起動のきっかけ（どれも systemd から。手で動かしてもよい）
#   - 管理画面での保存:  gozakura-api が /var/lib/site-build/requested を更新 → site-build.path
#   - docs リポジトリの push:  site-build.timer が毎分起動し、GitHub の先頭 commit が変わっていれば
#   - 取りこぼし:  最後のビルドから FORCE_EVERY_SEC（既定 24 時間）たったら
#   - 手動:  FORCE=1 /opt/site-build/build.sh
#
# 公開は「releases/<日時>-<commit>/ を作って current の symlink を付け替える」ので、途中の状態は見えない。
# ビルドや検査に失敗したら差し替えない（今のサイトがそのまま残る）。
set -Eeuo pipefail

ENV_FILE="${SITE_BUILD_ENV:-/etc/site-build.env}"
# shellcheck disable=SC1090
[ -f "$ENV_FILE" ] && . "$ENV_FILE"

: "${REPO_URL:=https://github.com/zbike9618/docs.git}"
: "${BRANCH:=main}"
: "${WORK_DIR:=/opt/site-build}"
: "${OUT_DIR:=/var/www/site}"
: "${STATE_DIR:=/var/lib/site-build}"
: "${BUILD_API_URL:=http://127.0.0.1:3000}"   # ビルド中に API を読みに行く先
: "${VITE_API_URL:=}"                         # ブラウザが API を呼ぶ先（空なら https://api.gozakura.org）
: "${KEEP_RELEASES:=5}"
: "${DEBOUNCE_SEC:=30}"                       # 保存から何秒待つか（続けて直したときに1回にまとめる）
: "${DEBOUNCE_MAX_SEC:=180}"
: "${RETRY_AFTER_FAIL_SEC:=300}"              # 失敗したあと、自動では何秒待ってから再挑戦するか
: "${FORCE_EVERY_SEC:=86400}"
: "${NODE_OPTIONS:=--max-old-space-size=512}"
export NODE_OPTIONS
# npm の保存先などをビルダー専用の場所にそろえる（HOME が無い環境でも動かすため）
export HOME="${HOME_DIR:-$WORK_DIR}"

SRC_DIR="$WORK_DIR/src"
RELEASES_DIR="$OUT_DIR/releases"
STATUS_FILE="$STATE_DIR/status.json"

log() { printf '[site-build] %s\n' "$*"; }
now() { date +%s; }
mtime() { if [ -e "$1" ]; then stat -c %Y "$1"; else echo 0; fi }
readnum() { if [ -s "$1" ]; then cat "$1"; else echo 0; fi }

mkdir -p "$STATE_DIR" "$RELEASES_DIR" "$WORK_DIR"

# 二重起動を防ぐ（path と timer が同時に起動しても1つだけ動く）
exec 9>"$STATE_DIR/lock"
flock -n 9 || { log "別のビルドが動いています。今回は何もしません"; exit 0; }

# status.json（gozakura-api の GET /api/site-build が読む）。途中で読まれても壊れないよう、書いてから差し替える
write_status() { # state reason
  local tmp="$STATUS_FILE.tmp"
  printf '{"state":"%s","commit":"%s","startedAt":%s,"finishedAt":%s,"reason":"%s"}\n' \
    "$1" "${commit:-}" "${started:-0}" "$(now)" "$(printf '%s' "${2:-}" | tr -d '"\\\n' | cut -c1-300)" > "$tmp"
  mv -f "$tmp" "$STATUS_FILE"
}

building=0
on_error() {
  local code=$? line=$1
  trap - ERR
  if [ "$building" = 1 ]; then
    now > "$STATE_DIR/failed_at"
    log "失敗しました（$line 行目, 終了コード $code）。公開中のサイトは変更していません"
    write_status failed "line $line, exit $code"
  fi
  exit "$code"
}
trap 'on_error $LINENO' ERR

fail() { # 理由を残して失敗にする
  log "失敗: $*"
  now > "$STATE_DIR/failed_at"
  write_status failed "$*"
  exit 1
}

# ---- ビルドが要るかを決める --------------------------------------------------
requested="$(mtime "$STATE_DIR/requested")"
built_at="$(readnum "$STATE_DIR/built_at")"
failed_at="$(readnum "$STATE_DIR/failed_at")"
built_commit="$(cat "$STATE_DIR/built_commit" 2>/dev/null || true)"

remote_commit="$(timeout 20 git ls-remote "$REPO_URL" "refs/heads/$BRANCH" 2>/dev/null | cut -f1 || true)"

trigger=""
if [ "${FORCE:-0}" = 1 ]; then
  trigger="manual"
elif [ "$requested" -gt "$built_at" ]; then
  trigger="edit"
elif [ -n "$remote_commit" ] && [ "$remote_commit" != "$built_commit" ]; then
  trigger="push"
elif [ $(( $(now) - built_at )) -gt "$FORCE_EVERY_SEC" ]; then
  trigger="daily"
fi
[ -n "$trigger" ] || exit 0

# 失敗した直後に毎分やり直さない（手動実行は除く）
if [ "$trigger" != "manual" ] && [ $(( $(now) - failed_at )) -lt "$RETRY_AFTER_FAIL_SEC" ]; then
  exit 0
fi

# 保存の直後は、続けて直すことが多いので少し待つ
if [ "$trigger" = "edit" ]; then
  waited=0
  while [ $(( $(now) - $(mtime "$STATE_DIR/requested") )) -lt "$DEBOUNCE_SEC" ] && [ "$waited" -lt "$DEBOUNCE_MAX_SEC" ]; do
    sleep 2
    waited=$(( waited + 2 ))
  done
fi

# ---- ここからビルド ----------------------------------------------------------
building=1
started="$(now)"
mark=$(( started - 1 ))   # ビルド中に入った保存を取りこぼさないための目印（これより新しい requested は次回やり直す）
commit=""
write_status building "trigger=$trigger"
log "ビルド開始 (trigger=$trigger, branch=$BRANCH)"

# ソースを最新にする
if [ ! -d "$SRC_DIR/.git" ]; then
  git clone --quiet --depth 1 --branch "$BRANCH" "$REPO_URL" "$SRC_DIR"
fi
cd "$SRC_DIR"
git remote set-url origin "$REPO_URL"
git fetch --quiet --depth 1 origin "$BRANCH"
git checkout --quiet --force --detach FETCH_HEAD
commit="$(git rev-parse HEAD)"

# 依存は package-lock.json が変わったときだけ入れ直す
lock_hash="$(sha256sum package-lock.json | cut -d' ' -f1)"
if [ ! -d node_modules ] || [ "$lock_hash" != "$(cat "$STATE_DIR/lock_hash" 2>/dev/null || true)" ]; then
  log "依存パッケージを入れます (npm ci)"
  # shellcheck disable=SC2086
  npm ci --no-audit --no-fund ${NPM_CI_ARGS:-}
  printf '%s' "$lock_hash" > "$STATE_DIR/lock_hash"
fi

# API から取って HTML に焼く。取得に失敗したらここで止まる（空の一覧は焼かない）
export LXC_DEPLOY=true
export BUILD_API_URL
if [ -n "$VITE_API_URL" ]; then export VITE_API_URL; fi
npx --no-install vitepress build docs

dist="$SRC_DIR/docs/.vitepress/dist"

# ---- 検査: 変なものを公開しない -------------------------------------------------
[ -s "$dist/index.html" ]  || fail "dist/index.html がありません"
[ -s "$dist/sitemap.xml" ] || fail "dist/sitemap.xml がありません"

count_json() { # URL JS式 → 件数
  curl -fsS --max-time 15 "$BUILD_API_URL$1" | node -e '
    let s = ""; process.stdin.on("data", (d) => s += d).on("end", () => {
      const a = JSON.parse(s); if (!Array.isArray(a)) process.exit(2);
      console.log(a.filter(eval("(n) => " + process.argv[1])).length);
    })' "$2"
}
expected_news="$(count_json /api/news 'n.body')"
expected_blog="$(count_json /api/blog 'true')"
actual_news="$( { find "$dist/news" -maxdepth 1 -name '*.html' 2>/dev/null || true; } | wc -l)"
actual_blog="$( { find "$dist/blog" -maxdepth 1 -name '*.html' 2>/dev/null || true; } | wc -l)"
# 焼いている最中に保存が入ると数がずれることがある。その場合は失敗にして、あとで自動でやり直す
[ "$actual_news" -eq "$expected_news" ] || fail "お知らせ記事の数が合いません (HTML=$actual_news, API=$expected_news)"
[ "$actual_blog" -eq "$expected_blog" ] || fail "ブログ記事の数が合いません (HTML=$actual_blog, API=$expected_blog)"

# ---- 公開: release を作って current を付け替える -------------------------------
release="$RELEASES_DIR/$(date -u +%Y%m%d-%H%M%S)-${commit:0:7}"
mkdir -p "$release"
cp -a "$dist/." "$release/"
ln -sfn "$release" "$OUT_DIR/current.new"
mv -T "$OUT_DIR/current.new" "$OUT_DIR/current"   # この1行で切り替わる（同じファイルシステム内なので一瞬）

# 古い release を消す（直近 KEEP_RELEASES 個だけ残す）
ls -1dt "$RELEASES_DIR"/*/ 2>/dev/null | tail -n +"$(( KEEP_RELEASES + 1 ))" | xargs -r rm -rf --

printf '%s' "$commit" > "$STATE_DIR/built_commit"
printf '%s' "$mark" > "$STATE_DIR/built_at"
rm -f "$STATE_DIR/failed_at"
building=0
write_status ok "trigger=$trigger"
log "公開しました: $(basename "$release") (お知らせ $actual_news 件 / ブログ $actual_blog 件, $(( $(now) - started )) 秒)"
