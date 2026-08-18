<script setup>
import { ref } from 'vue'
import { withBase } from 'vitepress'
import ServerStatus from './ServerStatus.vue'
import NewsList from './NewsList.vue'
import EventBanner from './EventBanner.vue'

const copied = ref(false)
const serverAddress = 'play.gozakura.org'

const copyAddress = async () => {
  try {
    await navigator.clipboard.writeText(serverAddress)
    copied.value = true
    window.setTimeout(() => { copied.value = false }, 1800)
  } catch {
    copied.value = false
  }
}
</script>

<template>
  <main class="k-home">
    <section class="k-hero">
      <div class="k-hero-grid" aria-hidden="true"></div>
      <div class="k-orb k-orb-one" aria-hidden="true"></div>
      <div class="k-orb k-orb-two" aria-hidden="true"></div>

      <div class="k-shell k-hero-inner">
        <div class="k-hero-copy">
          <p class="k-eyebrow"><span></span> MINECRAFT BEDROCK SERVER</p>
          <h1>国をつくり、<br><em>世界を動かせ。</em></h1>
          <p class="k-lead">
            仲間を集め、領土を広げ、経済を育てる。<br>
            外交と戦略が歴史を変える、本格建国サーバー。
          </p>
          <div class="k-actions">
            <a class="k-button k-button-primary" href="#join">今すぐ参加する <span>→</span></a>
            <a class="k-button k-button-ghost" :href="withBase('/guide/start')">遊び方を見る</a>
          </div>
          <div class="k-platforms">
            <span>対応機種</span>
            <b>SWITCH</b><b>SMARTPHONE</b><b>PS / XBOX</b><b>WINDOWS</b>
          </div>
        </div>

        <div class="k-emblem-wrap">
          <div class="k-emblem-ring k-ring-one"></div>
          <div class="k-emblem-ring k-ring-two"></div>
          <div class="k-emblem">
            <img :src="withBase('/yuku5_icon.jpg')" alt="建国鯖ロゴ">
          </div>
          <div class="k-floating-card k-card-top">
            <span class="k-card-icon">⚔</span>
            <div><small>THE WORLD AWAITS</small><strong>戦略的な国家戦争</strong></div>
          </div>
          <div class="k-floating-card k-card-bottom">
            <span class="k-live-dot"></span>
            <div><small>24 HOURS</small><strong>いつでも参加可能</strong></div>
          </div>
        </div>
      </div>
    </section>

    <section id="join" class="k-join">
      <div class="k-shell">
        <div class="k-section-heading k-heading-light">
          <p class="k-kicker">JOIN THE SERVER</p>
          <h2>3分で、この世界へ。</h2>
          <p>マインクラフト統合版があれば、誰でも無料で参加できます。</p>
        </div>

        <div class="k-join-layout">
          <div class="k-connect-card">
            <div class="k-connect-head">
              <span class="k-live-dot"></span>
              <span>接続情報</span>
              <b>BEDROCK</b>
            </div>
            <label>SERVER ADDRESS</label>
            <div class="k-address-row">
              <code>{{ serverAddress }}</code>
              <button type="button" @click="copyAddress">{{ copied ? 'コピーしました' : 'IPをコピー' }}</button>
            </div>
            <div class="k-port"><span>PORT</span><strong>19132</strong></div>
            <p>Switch・スマホなどは、フレンド参加にも対応しています。</p>
            <a :href="withBase('/guide/start')">端末別の詳しい参加方法を見る →</a>
          </div>

          <ol class="k-steps">
            <li>
              <span>01</span>
              <div><h3>統合版を起動</h3><p>プレイから「サーバー」タブを開きます。</p></div>
            </li>
            <li>
              <span>02</span>
              <div><h3>サーバーを追加</h3><p>上のアドレスとポートを入力します。</p></div>
            </li>
            <li>
              <span>03</span>
              <div><h3>歴史を始める</h3><p>参加したら、国に入るか自分の国を興そう。</p></div>
            </li>
          </ol>
        </div>

        <ServerStatus />
      </div>
    </section>

    <section class="k-world">
      <div class="k-shell">
        <div class="k-section-heading">
          <p class="k-kicker">BUILD YOUR NATION</p>
          <h2>ただ生きるだけじゃない。<br>国の未来を、選択する。</h2>
          <p>資源を集める。仲間と都市を築く。他国と手を結ぶ。すべての行動が世界に残ります。</p>
        </div>

        <div class="k-feature-grid">
          <a :href="withBase('/guide/start#2-建国-countrywars-の基本')" class="k-feature k-feature-large">
            <span class="k-number">01</span><i>領土</i>
            <div><h3>建国と領土</h3><p>国を興し、土地を保護し、仲間が暮らす都市を築く。</p><b>詳しく見る →</b></div>
          </a>
          <a :href="withBase('/guide/start#5-経済を発展させる')" class="k-feature">
            <span class="k-number">02</span><i>経済</i>
            <div><h3>職業と経済</h3><p>働き、商い、税を定めて強い国家を育てる。</p><b>詳しく見る →</b></div>
          </a>
          <a :href="withBase('/guide/start#6-外交と戦争')" class="k-feature">
            <span class="k-number">03</span><i>外交</i>
            <div><h3>同盟と交渉</h3><p>友好か、敵対か。言葉もまた強力な武器になる。</p><b>詳しく見る →</b></div>
          </a>
          <a :href="withBase('/guide/start#戦争のはじめかた')" class="k-feature k-feature-war">
            <span class="k-number">04</span><i>戦争</i>
            <div><h3>侵略と防衛</h3><p>綿密な準備と連携で敵国の領土を奪取する。</p><b>詳しく見る →</b></div>
          </a>
        </div>
      </div>
    </section>

    <section class="k-updates">
      <div class="k-shell">
        <div class="k-update-head">
          <div class="k-section-heading">
            <p class="k-kicker">LATEST INTELLIGENCE</p>
            <h2>世界の最新情報</h2>
          </div>
          <a :href="withBase('/news')">すべてのお知らせ →</a>
        </div>
        <div class="k-news-card">
          <NewsList :limit="3" />
        </div>
        <EventBanner />
      </div>
    </section>

    <section class="k-final-cta">
      <div class="k-shell k-final-inner">
        <div>
          <p class="k-kicker">YOUR STORY STARTS HERE</p>
          <h2>次の歴史をつくるのは、<br><em>あなたかもしれない。</em></h2>
        </div>
        <a class="k-button k-button-primary" href="#join">建国鯖に参加する <span>→</span></a>
      </div>
    </section>
  </main>
</template>
