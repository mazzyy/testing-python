import './styles.css';

const deployTime = new Date().toLocaleString();

document.querySelector('#app').innerHTML = `
  <main class="layout">
    <section class="hero">
      <p class="badge">Dummy Frontend</p>
      <h1>Pipeline Playground</h1>
      <p class="subtitle">
        A small frontend app built to validate CI/CD jobs, build artifacts, and deployment flow.
      </p>
      <div class="meta-grid">
        <article>
          <h2>Build Target</h2>
          <p>Static assets generated with Vite</p>
        </article>
        <article>
          <h2>Environment</h2>
          <p>Ready for staging and production checks</p>
        </article>
        <article>
          <h2>Last Generated</h2>
          <p>${deployTime}</p>
        </article>
      </div>
      <button id="health-check" class="action-btn">Run UI Health Check</button>
      <p id="health-result" class="health-result" aria-live="polite"></p>
    </section>
  </main>
`;

const healthButton = document.querySelector('#health-check');
const healthResult = document.querySelector('#health-result');

healthButton.addEventListener('click', () => {
  const checks = ['HTML loaded', 'CSS active', 'JavaScript running'];
  healthResult.textContent = `PASS: ${checks.join(' | ')}`;
});
