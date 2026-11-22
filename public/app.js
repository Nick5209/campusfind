const list = document.querySelector('#listings');
const form = document.querySelector('#listing-form');
const message = document.querySelector('#form-message');
const search = document.querySelector('#search');
const count = document.querySelector('#item-count');
let allListings = [];
let activeKind = 'all';

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const prettyDate = value => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));

async function request(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

function render() {
  const term = search.value.trim().toLowerCase();
  const filtered = allListings.filter(item =>
    (activeKind === 'all' || item.kind === activeKind) &&
    [item.title, item.category, item.description, item.location].some(value => value.toLowerCase().includes(term))
  );
  count.textContent = `${filtered.length} ${filtered.length === 1 ? 'item' : 'items'}`;
  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state"><strong>${allListings.length ? 'No matching items' : 'No listings yet'}</strong>${allListings.length ? 'Try a different search or filter.' : 'Be the first to post a lost or found item.'}</div>`;
    return;
  }
  list.innerHTML = filtered.map(item => `
    <article class="listing-card">
      <div>
        <div class="listing-top"><span class="kind ${item.kind}">${item.kind}</span><span class="category">${escapeHtml(item.category)}</span></div>
        <h3>${escapeHtml(item.title)}</h3>
      </div>
      <button class="status-button" data-id="${item._id}" data-status="${item.status}" aria-label="Mark ${escapeHtml(item.title)} ${item.status === 'open' ? 'resolved' : 'open'}">${item.status === 'open' ? 'Mark resolved' : 'Reopen'}</button>
      <p class="listing-description">${escapeHtml(item.description)}</p>
      <div class="listing-meta"><span>⌖ ${escapeHtml(item.location)}</span><span>▦ ${prettyDate(item.date)}</span></div>
    </article>`).join('');
}

async function loadListings() {
  list.innerHTML = '<div class="empty-state">Loading listings...</div>';
  try { allListings = await request('/api/listings'); render(); }
  catch (error) { count.textContent = ''; list.innerHTML = `<div class="empty-state"><strong>Could not load listings</strong>${escapeHtml(error.message)} Check that the app and database are running.</div>`; }
}

form.elements.date.value = new Date().toISOString().slice(0, 10);
form.addEventListener('submit', async event => {
  event.preventDefault();
  message.textContent = '';
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true; button.textContent = 'Publishing...';
  const values = Object.fromEntries(new FormData(form));
  try {
    await request('/api/listings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
    form.reset(); form.elements.date.value = new Date().toISOString().slice(0, 10);
    message.style.color = '#34683c'; message.textContent = 'Your listing has been published.';
    await loadListings();
  } catch (error) { message.style.color = '#a23a2a'; message.textContent = error.message; }
  finally { button.disabled = false; button.textContent = 'Publish listing'; }
});

list.addEventListener('click', async event => {
  const button = event.target.closest('.status-button');
  if (!button) return;
  button.disabled = true;
  try {
    await request(`/api/listings/${button.dataset.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: button.dataset.status === 'open' ? 'resolved' : 'open' }) });
    await loadListings();
  } catch (error) { button.disabled = false; message.style.color = '#a23a2a'; message.textContent = error.message; }
});

search.addEventListener('input', render);
document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
  activeKind = button.dataset.kind;
  document.querySelectorAll('.filter').forEach(option => { const selected = option === button; option.classList.toggle('active', selected); option.setAttribute('aria-pressed', String(selected)); });
  render();
}));

let installPrompt;
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; document.querySelector('#install-button').hidden = false; });
document.querySelector('#install-button').addEventListener('click', async () => {
  if (!installPrompt) return;
  installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; document.querySelector('#install-button').hidden = true;
});
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js').catch(() => {}));
loadListings();
