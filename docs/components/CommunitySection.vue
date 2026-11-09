<script setup>
// トップの「COMMUNITY」。参加方法のすぐ下に置き、Discord と YouTube へ大きく案内する
import BrandIcon from './BrandIcon.vue'
import { DISCORD_URL, YOUTUBE_URL } from '../data/site.js'
</script>

<template>
  <section id="community" class="k-community">
    <div class="k-shell">
      <div class="k-section-heading">
        <p class="k-kicker">COMMUNITY</p>
        <h2>参加したら、<br>仲間ともつながろう。</h2>
        <p>お知らせや困ったときの相談は Discord で。動画は YouTube で公開しています。</p>
      </div>

      <div class="k-community-grid">
        <a class="k-community-card is-discord" :href="DISCORD_URL" target="_blank" rel="noopener">
          <span class="k-community-icon"><BrandIcon name="discord" /></span>
          <span class="k-community-body">
            <small>DISCORD</small>
            <strong>公式Discordサーバー</strong>
            <span>お知らせやアップデート情報が届きます。わからないことは、ここで気軽に質問できます。</span>
          </span>
          <span class="k-community-cta">Discordに参加する <span aria-hidden="true">→</span></span>
        </a>

        <a class="k-community-card is-youtube" :href="YOUTUBE_URL" target="_blank" rel="noopener">
          <span class="k-community-icon"><BrandIcon name="youtube" /></span>
          <span class="k-community-body">
            <small>YOUTUBE</small>
            <strong>ゆっくり伍桜</strong>
            <span>運営のチャンネル。マイクラのゆっくり動画や配信を公開しています。</span>
          </span>
          <span class="k-community-cta">チャンネルを見る <span aria-hidden="true">→</span></span>
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.k-community {
  --c-discord: #5865f2;
  --c-youtube: #e5132e;
  padding: 96px 0;
  background: #eef0f8;
}

.k-community-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 44px;
}

.k-community-card {
  position: relative;
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 6px 22px;
  align-items: start;
  padding: 30px;
  overflow: hidden;
  color: var(--k-ink) !important;
  border: 1px solid #dde0eb;
  background: #fff;
  box-shadow: 0 18px 40px rgba(16, 28, 45, .07);
  transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
}
.k-community-card::after {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: var(--accent);
}
.k-community-card.is-discord { --accent: var(--c-discord); }
.k-community-card.is-youtube { --accent: var(--c-youtube); }
.k-community-card:hover {
  transform: translateY(-3px);
  border-color: var(--accent);
  box-shadow: 0 22px 46px rgba(16, 28, 45, .12);
}

.k-community-icon {
  grid-row: span 2;
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 34px;
  background: var(--accent);
}

.k-community-body { display: block; }
.k-community-body small,
.k-community-body strong,
.k-community-body > span { display: block; }
.k-community-body small { color: #7b8290; font-size: 10px; font-weight: 800; letter-spacing: .2em; }
.k-community-body strong { margin-top: 4px; font-size: 22px; line-height: 1.4; }
.k-community-body > span { margin-top: 8px; color: #5d6675; font-size: 14px; line-height: 1.75; }

.k-community-cta {
  grid-column: 2;
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 14px;
  min-height: 46px;
  margin-top: 14px;
  padding: 0 22px;
  color: #fff;
  background: var(--accent);
  font-size: 14px;
  font-weight: 800;
}
.k-community-card:hover .k-community-cta { filter: brightness(1.08); }

@media (max-width: 760px) {
  .k-community-grid { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .k-community { padding: 62px 0; }
  .k-community-grid { gap: 12px; margin-top: 28px; }
  .k-community-card { grid-template-columns: 48px minmax(0, 1fr); gap: 4px 16px; padding: 20px; }
  .k-community-icon { grid-row: auto; width: 48px; height: 48px; font-size: 26px; }
  .k-community-body strong { font-size: 18px; }
  .k-community-body > span { font-size: 13px; }
  .k-community-cta { grid-column: 1 / -1; justify-self: stretch; justify-content: center; margin-top: 12px; }
}

@media (prefers-reduced-motion: reduce) {
  .k-community-card { transition: none; }
}
</style>

<style>
/* ダークモード（html.dark）。scoped だと html 側のクラスを見られないので分けている */
html.dark .k-community { background: linear-gradient(160deg, #0f1a31, #0a1422); }
html.dark .k-community .k-section-heading h2 { color: #eef2f7; }
html.dark .k-community .k-section-heading > p:last-child { color: #9eabba; }
html.dark .k-community .k-community-card { color: #fff !important; border-color: #26364c; background: #101e31; box-shadow: 0 22px 50px rgba(0, 0, 0, .24); }
html.dark .k-community .k-community-card:hover { border-color: var(--accent); }
html.dark .k-community .k-community-body small { color: #8794a8; }
html.dark .k-community .k-community-body > span { color: #a9b5c5; }
</style>
