<template>
  <a href="/form" class="event-banner">
    <div class="event-content">
      <div class="badge">SPECIAL EVENT</div>
      <div class="text-group">
        <h3 class="title">✨ サーバー名募集中！</h3>
        <p class="description">あなたの案が建国鯖の名前になるかも？案を募集中です！</p> 
      </div>
      <div class="arrow">➔</div>
    </div>
  </a>
</template>

<style scoped>
.event-banner {
  display: block;
  margin: 24px 0;
  text-decoration: none !important;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
}

.event-banner:hover {
  transform: translateY(-2px);
  border-color: rgba(111, 142, 247, 0.5);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(111, 142, 247, 0.15);
}

.event-content {
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  color: white;
}

.badge {
  background: rgba(111, 142, 247, 0.1);
  color: #8fb1ff;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: bold;
  letter-spacing: 0.05rem;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(111, 142, 247, 0.3);
  white-space: nowrap;
  animation: pulse 2s infinite;
}

.text-group {
  flex-grow: 1;
}

.title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.description {
  margin: 4px 0 0;
  font-size: 0.9rem;
  opacity: 0.9;
  color: white;
}

.arrow {
  font-size: 1.5rem;
  transition: transform 0.3s ease;
}

.event-banner:hover .arrow {
  transform: translateX(8px);
}

@keyframes pulse {
  0% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0.8; transform: scale(1); }
}

@media (max-width: 640px) {
  .event-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .arrow {
    display: none;
  }
}
</style>
