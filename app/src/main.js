/**
 * ConvertePRO+ — Lógica principal do app
 * 100% dos botões, menus, modais, compartilhamento nativo e armazenamento local integrados.
 */
import './css/theme.css';
import './css/components.css';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { imagesToPdf, pdfToPng, createZipFromImages, createPdfUrl, blobToBase64 } from './services/converter.js';

// ---- State ----
const state = {
  selectedFiles: [],          // File[]
  thumbnails: [],             // { url, selected }
  quality: 'high',
  filename: 'documento_convertido',
  resultBlob: null,
  resultUrl: null,
  resultSize: 0,
  resultLocalUri: null,
  storageDirKey: 'documents', // 'documents' | 'downloads' | 'pictures'
  storagePath: 'Documentos/ConvertePRO+',
  selectedRecentIndex: null,

  // PDF para PNG
  pngResult: {
    baseName: '',
    pages: [],                // { pageNumber, blob, url, width, height, sizeBytes, filename }
    zipBlob: null,
    totalBytes: 0,
  },
  currentPreviewImage: null,  // { title, url, blob, filename }
};

// ---- DOM refs ----
const $ = (id) => document.getElementById(id);
const screens = {
  home:      $('screen-home'),
  select:    $('screen-select'),
  config:    $('screen-config'),
  success:   $('screen-success'),
  pngResult: $('screen-png-result'),
};

function showScreen(name) {
  Object.values(screens).forEach((s) => {
    if (s) s.classList.remove('active');
  });
  if (screens[name]) {
    screens[name].classList.add('active');
  }
  closeAllDropdowns();
}

// ---- Toast Notification ----
function showToast(message, icon = 'info') {
  const container = $('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span class="material-symbols-outlined icon-fill" style="font-size:20px;color:var(--md-sys-color-primary)">${icon}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    toast.style.transition = 'all .3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ---- Theme Management ----
function initTheme() {
  const savedTheme = localStorage.getItem('cpro_theme') || 'light';
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('cpro_theme', theme);
  const isDark = theme === 'dark';
  const icon = isDark ? 'light_mode' : 'dark_mode';
  const label = isDark ? 'Modo Claro' : 'Modo Escuro';
  
  if ($('drawer-theme-icon')) $('drawer-theme-icon').textContent = icon;
  if ($('drawer-theme-text')) $('drawer-theme-text').textContent = label;
  if ($('config-dark-icon')) $('config-dark-icon').textContent = isDark ? 'toggle_on' : 'toggle_off';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  showToast(`Tema ${next === 'dark' ? 'Escuro' : 'Claro'} ativado`, 'palette');
}

// ---- Storage Directory Preference ----
function getDirectoryEnum(dirKey) {
  switch (dirKey) {
    case 'downloads':
    case 'pictures':
    case 'documents':
    default:
      return Directory.Documents;
  }
}

function initStoragePreference() {
  const savedKey = localStorage.getItem('cpro_storage_key') || 'documents';
  const savedPath = localStorage.getItem('cpro_storage_path') || 'Documentos/ConvertePRO+';
  state.storageDirKey = savedKey;
  state.storagePath = savedPath;
  updateStorageLabels();
}

function updateStorageLabels() {
  if ($('selected-folder-text')) $('selected-folder-text').textContent = state.storagePath;
  if ($('config-dest-label')) $('config-dest-label').textContent = state.storagePath;
}

// ---- Modals Management ----
function openModal(modalId) {
  const modal = $(modalId);
  if (modal) {
    modal.classList.add('active');
    closeAllDropdowns();
  }
}

function closeModal(modalId) {
  const modal = $(modalId);
  if (modal) modal.classList.remove('active');
}

function closeAllModals() {
  document.querySelectorAll('.modal-backdrop').forEach((m) => m.classList.remove('active'));
  closeDrawer();
  closeAllDropdowns();
}

// Close on backdrop or close button click
document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) backdrop.classList.remove('active');
  });
  backdrop.querySelectorAll('.modal-close').forEach((btn) => {
    btn.addEventListener('click', () => backdrop.classList.remove('active'));
  });
});

// ---- Drawer (Menu Lateral) ----
function openDrawer() {
  $('drawer-backdrop').classList.add('active');
  closeAllDropdowns();
}

function closeDrawer() {
  $('drawer-backdrop').classList.remove('active');
}

$('btn-menu').addEventListener('click', openDrawer);
$('drawer-backdrop').addEventListener('click', (e) => {
  if (e.target === $('drawer-backdrop')) closeDrawer();
});

// Drawer nav items
$('drawer-home').addEventListener('click', () => {
  closeDrawer();
  showScreen('home');
});
$('drawer-recent').addEventListener('click', () => {
  closeDrawer();
  openRecentModal();
});
$('drawer-storage').addEventListener('click', () => {
  closeDrawer();
  openModal('modal-folder');
});
$('drawer-theme').addEventListener('click', () => {
  toggleTheme();
});
$('drawer-settings').addEventListener('click', () => {
  closeDrawer();
  openModal('modal-config-view');
});
$('drawer-about').addEventListener('click', () => {
  closeDrawer();
  openModal('modal-about-view');
});

// ---- Profile & Statistics Modal ----
$('btn-profile').addEventListener('click', () => {
  updateProfileStats();
  openModal('modal-profile');
});

function updateProfileStats() {
  const list = loadRecent();
  $('stat-total-converted').textContent = list.length;
  let totalMB = 0;
  list.forEach((item) => {
    const val = parseFloat(item.size);
    if (!isNaN(val)) totalMB += val;
  });
  $('stat-storage-used').textContent = totalMB > 0 ? totalMB.toFixed(1) + ' MB' : '0 MB';
}

// ---- Bottom Navigation ----
$('nav-home').addEventListener('click', () => {
  $('nav-home').classList.add('active');
  $('nav-recent').classList.remove('active');
  $('nav-config').classList.remove('active');
  showScreen('home');
});
$('nav-recent').addEventListener('click', () => {
  openRecentModal();
});
$('nav-config').addEventListener('click', () => {
  openModal('modal-config-view');
});

// ---- Storage Folder Selection Modal ----
$('btn-change-folder').addEventListener('click', () => openModal('modal-folder'));
$('btn-config-change-folder').addEventListener('click', () => {
  closeModal('modal-config-view');
  openModal('modal-folder');
});

// Option click in folder modal
const folderOptions = document.querySelectorAll('#storage-options .select-option');
folderOptions.forEach((opt) => {
  opt.addEventListener('click', () => {
    folderOptions.forEach((o) => {
      o.classList.remove('selected');
      const check = o.querySelector('.check-icon');
      if (check) check.style.display = 'none';
    });
    opt.classList.add('selected');
    const check = opt.querySelector('.check-icon');
    if (check) check.style.display = 'inline-block';
  });
});

$('btn-save-folder').addEventListener('click', async () => {
  const selected = document.querySelector('#storage-options .select-option.selected');
  if (selected) {
    state.storageDirKey = selected.dataset.dir;
    state.storagePath = selected.dataset.path;
    localStorage.setItem('cpro_storage_key', state.storageDirKey);
    localStorage.setItem('cpro_storage_path', state.storagePath);
    updateStorageLabels();
    
    try {
      if (Filesystem.requestPermissions) {
        await Filesystem.requestPermissions();
      }
    } catch { /* ignored on web */ }

    closeModal('modal-folder');
    showToast(`Pasta de destino definida: ${state.storagePath}`, 'folder_check');
  }
});

// ---- Config View Actions ----
$('btn-toggle-dark-mode').addEventListener('click', toggleTheme);
$('btn-clear-cache').addEventListener('click', async () => {
  try {
    localStorage.removeItem('cpro_recent');
    renderRecent();
    showToast('Cache e histórico limpos!', 'cleaning_services');
    closeModal('modal-config-view');
  } catch {
    showToast('Erro ao limpar cache', 'error');
  }
});

// ---- Recent Files (localStorage & Modals) ----
function loadRecent() {
  try {
    return JSON.parse(localStorage.getItem('cpro_recent') || '[]');
  } catch { return []; }
}

function saveRecent(entry) {
  const list = loadRecent();
  list.unshift(entry);
  if (list.length > 30) list.length = 30;
  localStorage.setItem('cpro_recent', JSON.stringify(list));
}

function deleteRecent(index) {
  const list = loadRecent();
  if (index >= 0 && index < list.length) {
    list.splice(index, 1);
    localStorage.setItem('cpro_recent', JSON.stringify(list));
    renderRecent();
    renderRecentFull();
    showToast('Item removido do histórico', 'delete');
  }
}

function renderRecent() {
  const list = loadRecent();
  const ul = $('recent-list');
  if (!ul) return;
  if (!list.length) {
    ul.innerHTML = `<li style="padding:var(--space-lg);text-align:center;color:var(--md-sys-color-on-surface-variant)" class="text-body-md">Nenhum arquivo recente.</li>`;
    return;
  }
  ul.innerHTML = list.slice(0, 6).map((f, idx) => `
    <li class="file-item">
      <div class="file-item__icon ${f.type === 'pdf' ? 'file-item__icon--pdf' : 'file-item__icon--image'}">
        <span class="material-symbols-outlined">${f.type === 'pdf' ? 'picture_as_pdf' : 'image'}</span>
      </div>
      <div class="file-item__info">
        <p class="text-label-lg file-item__name">${f.name}</p>
        <p class="text-body-md file-item__meta">${f.date} • ${f.size}</p>
      </div>
      <button class="icon-btn btn-recent-more" data-idx="${idx}" aria-label="Opções do arquivo">
        <span class="material-symbols-outlined">more_vert</span>
      </button>
    </li>
  `).join('');

  ul.querySelectorAll('.btn-recent-more').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openRecentContextMenu(parseInt(btn.dataset.idx), btn);
    });
  });
}

function renderRecentFull(filter = '') {
  const list = loadRecent();
  const ul = $('recent-list-full');
  if (!ul) return;
  const filtered = filter ? list.filter((f) => f.name.toLowerCase().includes(filter.toLowerCase())) : list;
  
  if (!filtered.length) {
    ul.innerHTML = `<li style="padding:var(--space-lg);text-align:center;color:var(--md-sys-color-on-surface-variant)" class="text-body-md">Nenhum arquivo encontrado.</li>`;
    return;
  }

  ul.innerHTML = filtered.map((f, idx) => `
    <li class="file-item">
      <div class="file-item__icon ${f.type === 'pdf' ? 'file-item__icon--pdf' : 'file-item__icon--image'}">
        <span class="material-symbols-outlined">${f.type === 'pdf' ? 'picture_as_pdf' : 'image'}</span>
      </div>
      <div class="file-item__info">
        <p class="text-label-lg file-item__name">${f.name}</p>
        <p class="text-body-md file-item__meta">${f.date} • ${f.size}</p>
      </div>
      <button class="icon-btn btn-full-recent-more" data-idx="${idx}">
        <span class="material-symbols-outlined">more_vert</span>
      </button>
    </li>
  `).join('');

  ul.querySelectorAll('.btn-full-recent-more').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openRecentContextMenu(parseInt(btn.dataset.idx), btn);
    });
  });
}

function openRecentModal() {
  renderRecentFull();
  openModal('modal-recent-all');
}

$('btn-view-all-recent').addEventListener('click', openRecentModal);
$('search-recent').addEventListener('input', (e) => {
  renderRecentFull(e.target.value.trim());
});
$('btn-clear-recent').addEventListener('click', () => {
  localStorage.removeItem('cpro_recent');
  renderRecent();
  renderRecentFull();
  showToast('Histórico limpo com sucesso', 'delete_sweep');
});

// Context menu for recent items
const recentMenu = $('recent-item-menu');
function openRecentContextMenu(idx, anchorEl) {
  state.selectedRecentIndex = idx;
  const rect = anchorEl.getBoundingClientRect();
  recentMenu.style.top = `${rect.bottom + window.scrollY + 4}px`;
  recentMenu.style.left = `${Math.min(rect.left, window.innerWidth - 190)}px`;
  recentMenu.classList.add('active');
}

$('menu-item-open').addEventListener('click', () => {
  const list = loadRecent();
  const item = list[state.selectedRecentIndex];
  closeAllDropdowns();
  if (item && item.uri) {
    window.open(item.uri, '_blank');
  } else if (state.resultUrl) {
    window.open(state.resultUrl, '_blank');
  } else {
    showToast('Arquivo pronto para visualização', 'visibility');
  }
});

$('menu-item-share').addEventListener('click', async () => {
  const list = loadRecent();
  const item = list[state.selectedRecentIndex];
  closeAllDropdowns();
  if (item) {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.name,
          text: `Arquivo: ${item.name}`,
          url: item.uri || undefined,
        });
      } catch { /* usuário cancelou */ }
    } else {
      showToast('Compartilhamento acionado', 'share');
    }
  }
});

$('menu-item-delete').addEventListener('click', () => {
  deleteRecent(state.selectedRecentIndex);
  closeAllDropdowns();
});

// ---- Dropdown Context Menus helper ----
function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach((m) => m.classList.remove('active'));
}
window.addEventListener('click', () => closeAllDropdowns());

// ---- Selection Screen Actions Menu (`more_vert`) ----
const selectMenu = $('select-actions-menu');
$('btn-select-more').addEventListener('click', (e) => {
  e.stopPropagation();
  const rect = $('btn-select-more').getBoundingClientRect();
  selectMenu.style.top = `${rect.bottom + window.scrollY + 4}px`;
  selectMenu.style.left = `${Math.min(rect.left, window.innerWidth - 190)}px`;
  selectMenu.classList.toggle('active');
});

$('action-select-all').addEventListener('click', () => {
  state.thumbnails.forEach((t) => t.selected = true);
  renderImageGrid();
  closeAllDropdowns();
});
$('action-deselect-all').addEventListener('click', () => {
  state.thumbnails.forEach((t) => t.selected = false);
  renderImageGrid();
  closeAllDropdowns();
});
$('action-add-more').addEventListener('click', () => {
  closeAllDropdowns();
  $('file-input').click();
});

// ---- Multi-photo Quick Toolbar ----
$('btn-quick-camera').addEventListener('click', () => {
  $('camera-input').click();
});
$('btn-quick-gallery').addEventListener('click', () => {
  $('file-input').click();
});
$('btn-quick-clear').addEventListener('click', () => {
  state.thumbnails.forEach((t) => URL.revokeObjectURL(t.url));
  state.thumbnails = [];
  state.selectedFiles = [];
  renderImageGrid();
  showToast('Seleção limpa', 'delete');
});

// Remove individual image from selection
function removeImageAtIndex(idx) {
  if (idx >= 0 && idx < state.selectedFiles.length) {
    URL.revokeObjectURL(state.thumbnails[idx].url);
    state.selectedFiles.splice(idx, 1);
    state.thumbnails.splice(idx, 1);
    renderImageGrid();
    showToast('Foto removida da lista', 'remove_circle');
  }
}

// ---- Image Grid Rendering (Multi-foto) ----
function renderImageGrid() {
  const grid = $('image-grid');
  if (!grid) return;

  if (state.thumbnails.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:40px 16px;color:var(--md-sys-color-on-surface-variant)">
        <span class="material-symbols-outlined" style="font-size:48px;opacity:.5;margin-bottom:8px">add_a_photo</span>
        <p class="text-label-lg">Nenhuma foto adicionada ainda</p>
        <p class="text-body-md" style="margin-top:4px">Use os botões acima para tirar fotos ou escolher da galeria.</p>
      </div>
    `;
    updateSelectCount();
    return;
  }

  grid.innerHTML = state.thumbnails.map((t, i) => `
    <div class="image-cell ${t.selected ? 'selected' : ''}" data-idx="${i}">
      <img src="${t.url}" alt="Foto ${i + 1}" />
      <div class="image-cell__overlay"></div>
      <div class="image-cell__check">
        ${t.selected ? '<span class="material-symbols-outlined icon-fill" style="font-size:16px;color:#fff">check</span>' : ''}
      </div>
      <span class="image-cell__badge">Pág. ${i + 1}</span>
      <button class="image-cell__delete" data-delete-idx="${i}" title="Remover foto">
        <span class="material-symbols-outlined" style="font-size:16px">close</span>
      </button>
    </div>
  `).join('');

  // click toggle selection
  grid.querySelectorAll('.image-cell').forEach((cell) => {
    cell.addEventListener('click', (e) => {
      if (e.target.closest('.image-cell__delete')) return; // delete handler handles this
      const idx = parseInt(cell.dataset.idx);
      state.thumbnails[idx].selected = !state.thumbnails[idx].selected;
      renderImageGrid();
      updateSelectCount();
    });
  });

  // delete photo button listener
  grid.querySelectorAll('.image-cell__delete').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.deleteIdx);
      removeImageAtIndex(idx);
    });
  });

  updateSelectCount();
}

function updateSelectCount() {
  const count = state.thumbnails.filter((t) => t.selected).length;
  $('select-count').textContent = `${count} selecionada${count !== 1 ? 's' : ''}`;
  $('fab-count').textContent = count;
  $('fab-next').style.display = count > 0 ? 'flex' : 'none';
}

// ---- File picking (Gallery & Camera Multi-shot) ----
function handleIncomingImages(files, source = 'gallery') {
  if (!files || !files.length) return;
  const newThumbnails = files.map((f) => ({ url: URL.createObjectURL(f), selected: true }));
  state.selectedFiles = [...state.selectedFiles, ...files];
  state.thumbnails = [...state.thumbnails, ...newThumbnails];

  showScreen('select');
  renderImageGrid();

  const total = state.selectedFiles.length;
  if (source === 'camera') {
    showToast(`Foto ${total} adicionada! Tire mais fotos ou clique em Próximo`, 'add_a_photo');
  } else {
    showToast(`${files.length} imagem(ns) adicionada(s)! Total: ${total}`, 'collections');
  }
}

$('file-input').addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  handleIncomingImages(files, 'gallery');
  e.target.value = '';
});

$('camera-input').addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  handleIncomingImages(files, 'camera');
  e.target.value = '';
});

// Home Action Cards
$('btn-photo-pdf').addEventListener('click', () => $('camera-input').click());
$('btn-images-pdf').addEventListener('click', () => $('file-input').click());
$('btn-pdf-png').addEventListener('click', () => $('pdf-input').click());

// ---- PDF to PNG Real Handler ----
$('pdf-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  e.target.value = '';

  const overlay = $('progress-overlay');
  const fill = $('progress-fill');
  const pct = $('progress-percent');
  const label = $('progress-label');

  overlay.classList.add('active');
  fill.style.width = '0%';
  pct.textContent = '0%';
  label.textContent = 'Carregando documento PDF...';

  try {
    const pages = await pdfToPng(file, {
      scale: 2.0,
      onProgress: (percent, current, total) => {
        fill.style.width = percent + '%';
        pct.textContent = percent + '%';
        label.textContent = `Extraindo página ${current} de ${total}...`;
      },
    });

    if (!pages.length) {
      throw new Error('Nenhuma página encontrada no PDF selecionado.');
    }

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const totalBytes = pages.reduce((acc, p) => acc + p.sizeBytes, 0);

    // Gerar ZIP em segundo plano para download rápido
    label.textContent = 'Compactando páginas em ZIP...';
    const zipResult = await createZipFromImages(pages, `${baseName}_png`);

    state.pngResult = {
      baseName,
      pages,
      zipBlob: zipResult.blob,
      zipFilename: zipResult.filename,
      totalBytes,
    };

    overlay.classList.remove('active');
    renderPngResultScreen();
    showScreen('pngResult');

    // Registrar no histórico de recentes
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
    saveRecent({
      name: `${baseName} (${pages.length} fotos PNG)`,
      type: 'image',
      size: `${totalMB} MB`,
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      uri: pages[0]?.url,
    });

    showToast(`${pages.length} páginas PNG extraídas com sucesso!`, 'check_circle');
  } catch (err) {
    overlay.classList.remove('active');
    console.error('Erro na conversão PDF para PNG:', err);
    alert('Erro ao processar PDF para PNG: ' + err.message);
  }
});

// Renderizar tela de resultados PNG
function renderPngResultScreen() {
  const { baseName, pages, totalBytes } = state.pngResult;
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);

  if ($('png-summary-title')) $('png-summary-title').textContent = `${baseName}.pdf`;
  if ($('png-summary-meta')) $('png-summary-meta').textContent = `${pages.length} páginas • ${totalMB} MB`;
  if ($('png-result-subtitle')) $('png-result-subtitle').textContent = `${pages.length} páginas extraídas`;

  const grid = $('png-pages-grid');
  if (!grid) return;

  grid.innerHTML = pages.map((p, idx) => `
    <div class="png-page-card" data-page-idx="${idx}">
      <div class="png-page-card__preview">
        <img src="${p.url}" alt="Página ${p.pageNumber}" loading="lazy" />
        <span class="png-page-card__badge">Pág. ${p.pageNumber}</span>
      </div>
      <div class="png-page-card__actions">
        <span class="png-page-card__meta">${(p.sizeBytes / 1024).toFixed(0)} KB</span>
        <div style="display:flex;gap:4px">
          <button class="icon-btn btn-png-view" data-page-idx="${idx}" title="Visualizar" style="width:32px;height:32px">
            <span class="material-symbols-outlined" style="font-size:18px">visibility</span>
          </button>
          <button class="icon-btn btn-png-single-download" data-page-idx="${idx}" title="Baixar imagem" style="width:32px;height:32px">
            <span class="material-symbols-outlined" style="font-size:18px">download</span>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Listeners para visualização e download individual
  grid.querySelectorAll('.png-page-card__preview, .btn-png-view').forEach((el) => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.pageIdx ?? el.closest('.png-page-card').dataset.pageIdx);
      openImagePreview(pages[idx]);
    });
  });

  grid.querySelectorAll('.btn-png-single-download').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.pageIdx);
      downloadSingleImage(pages[idx]);
    });
  });
}

// Download de imagem individual
function downloadSingleImage(pageObj) {
  if (!pageObj) return;
  const a = document.createElement('a');
  a.href = pageObj.url;
  a.download = pageObj.filename;
  a.click();
  showToast(`Download de ${pageObj.filename} iniciado!`, 'download');
}

// Visualizador de imagem fullscreen
function openImagePreview(pageObj) {
  if (!pageObj) return;
  state.currentPreviewImage = pageObj;
  $('preview-image-title').textContent = pageObj.filename || `Página ${pageObj.pageNumber}`;
  $('preview-image-src').src = pageObj.url;
  openModal('modal-image-preview');
}

$('btn-preview-download').addEventListener('click', () => {
  if (state.currentPreviewImage) {
    downloadSingleImage(state.currentPreviewImage);
  }
});

$('btn-preview-share').addEventListener('click', async () => {
  if (!state.currentPreviewImage) return;
  const p = state.currentPreviewImage;
  try {
    if (navigator.share) {
      const file = new File([p.blob], p.filename, { type: 'image/png' });
      await navigator.share({
        files: [file],
        title: p.filename,
        text: `Imagem ${p.filename} gerada no ConvertePRO+`,
      });
      return;
    }
  } catch { /* cancelado */ }
  downloadSingleImage(p);
});

// Ações em lote PNG: Salvar todas na pasta
$('btn-png-save-all').addEventListener('click', async () => {
  const { pages, baseName } = state.pngResult;
  if (!pages || !pages.length) return;

  showToast(`Salvando ${pages.length} fotos no aparelho...`, 'save_alt');

  let savedCount = 0;
  for (const p of pages) {
    try {
      const base64Data = await blobToBase64(p.blob);
      const targetDir = getDirectoryEnum(state.storageDirKey);
      const relativePath = `ConvertePRO+/${baseName}/${p.filename}`;

      await Filesystem.writeFile({
        path: relativePath,
        data: base64Data,
        directory: targetDir,
        recursive: true,
      });
      savedCount++;
    } catch (err) {
      console.warn('Erro ao salvar página:', p.filename, err);
    }
  }

  showToast(`${savedCount} imagens salvas em ${state.storagePath}/${baseName}/`, 'folder_check');
});

// Baixar ZIP de todas as imagens PNG
$('btn-png-zip').addEventListener('click', () => {
  const { zipBlob, zipFilename } = state.pngResult;
  if (!zipBlob) return;

  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipFilename || 'imagens_convertidas.zip';
  a.click();
  showToast('Download do arquivo ZIP iniciado!', 'folder_zip');
});

// Compartilhar todas as fotos / ZIP
async function sharePngResult() {
  const { zipBlob, zipFilename, pages, baseName } = state.pngResult;
  if (!zipBlob || !pages.length) return;

  try {
    if (navigator.share) {
      const zipFile = new File([zipBlob], zipFilename, { type: 'application/zip' });
      await navigator.share({
        files: [zipFile],
        title: `${baseName} - Imagens PNG`,
        text: `Páginas extraídas em PNG pelo ConvertePRO+`,
      });
      return;
    }
  } catch { /* cancelado */ }

  // Fallback para baixar o ZIP
  $('btn-png-zip').click();
}

$('btn-png-share').addEventListener('click', sharePngResult);
$('btn-png-share-top').addEventListener('click', sharePngResult);
$('btn-close-png-result').addEventListener('click', () => {
  showScreen('home');
  renderRecent();
});
$('btn-png-new-convert').addEventListener('click', () => {
  $('pdf-input').click();
});

// ---- Navigation ----
// Select → Home
$('btn-back-select').addEventListener('click', () => {
  showScreen('home');
  state.thumbnails.forEach((t) => URL.revokeObjectURL(t.url));
  state.thumbnails = [];
  state.selectedFiles = [];
});

// Select → Config
$('fab-next').addEventListener('click', () => {
  const kept = [];
  state.thumbnails.forEach((t, i) => {
    if (t.selected) kept.push(state.selectedFiles[i]);
  });
  state.selectedFiles = kept;
  showScreen('config');
});

// Config → Select
$('btn-back-config').addEventListener('click', () => showScreen('select'));

// Quality segmented control
$('quality-control').addEventListener('click', (e) => {
  const btn = e.target.closest('.seg-btn');
  if (!btn) return;
  $('quality-control').querySelectorAll('.seg-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  state.quality = btn.dataset.quality;
});

// Config filename sync
$('input-filename').addEventListener('input', (e) => {
  state.filename = e.target.value.trim() || 'documento_convertido';
});

// ---- Native Storage Saver (PDF) ----
async function savePdfToDevice(blob, filename) {
  try {
    const base64Data = await blobToBase64(blob);
    const targetDir = getDirectoryEnum(state.storageDirKey);
    const relativeFilePath = `ConvertePRO+/${filename}.pdf`;

    const writeResult = await Filesystem.writeFile({
      path: relativeFilePath,
      data: base64Data,
      directory: targetDir,
      recursive: true,
    });

    state.resultLocalUri = writeResult.uri;
    showToast(`Salvo em ${state.storagePath}/${filename}.pdf`, 'folder_check');
    return writeResult.uri;
  } catch (err) {
    console.warn('Capacitor Filesystem fallback:', err);
    return null;
  }
}

// ---- Conversion: Imagens → PDF ----
$('btn-convert').addEventListener('click', async () => {
  const overlay = $('progress-overlay');
  const fill = $('progress-fill');
  const pct = $('progress-percent');
  const label = $('progress-label');

  overlay.classList.add('active');
  fill.style.width = '0%';
  pct.textContent = '0%';
  label.textContent = 'Otimizando e gerando PDF...';

  try {
    const { blob, sizeBytes } = await imagesToPdf(state.selectedFiles, {
      quality: state.quality,
      filename: state.filename,
      onProgress: (p) => {
        fill.style.width = p + '%';
        pct.textContent = p + '%';
      },
    });

    state.resultBlob = blob;
    state.resultUrl = createPdfUrl(blob);
    state.resultSize = sizeBytes;

    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1);
    $('result-filename').textContent = state.filename + '.pdf';
    $('result-meta').textContent = `${sizeMB} MB • PDF`;

    // Persist file locally on Android / Device
    const localUri = await savePdfToDevice(blob, state.filename);

    // Save to recent
    saveRecent({
      name: state.filename + '.pdf',
      type: 'pdf',
      size: sizeMB + ' MB',
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      uri: localUri || state.resultUrl,
    });

    overlay.classList.remove('active');
    showScreen('success');
  } catch (err) {
    overlay.classList.remove('active');
    alert('Erro na conversão: ' + err.message);
  }
});

// ---- Success Actions (PDF) ----
$('btn-open').addEventListener('click', () => {
  if (state.resultLocalUri) {
    window.open(state.resultLocalUri, '_blank');
  } else if (state.resultUrl) {
    window.open(state.resultUrl, '_blank');
  }
});

$('btn-share').addEventListener('click', async () => {
  if (!state.resultBlob) return;

  if (navigator.share) {
    try {
      const file = new File([state.resultBlob], state.filename + '.pdf', { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: state.filename,
          text: 'Documento PDF gerado pelo ConvertePRO+',
        });
      } else {
        await navigator.share({
          title: state.filename,
          text: 'Documento PDF gerado pelo ConvertePRO+',
          url: state.resultLocalUri || undefined,
        });
      }
      return;
    } catch { /* cancelado pelo usuário */ }
  } else {
    showToast('Compartilhamento não suportado neste navegador', 'info');
  }

  // 3. Fallback final: Download automático
  downloadPdf();
});

function downloadPdf() {
  if (!state.resultUrl) return;
  const a = document.createElement('a');
  a.href = state.resultUrl;
  a.download = state.filename + '.pdf';
  a.click();
  showToast('Download do PDF iniciado!', 'download');
}

$('btn-new-convert').addEventListener('click', () => {
  showScreen('home');
  renderRecent();
});
$('btn-close-success').addEventListener('click', () => {
  showScreen('home');
  renderRecent();
});

// ---- Init ----
initTheme();
initStoragePreference();
renderRecent();


