const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'population-desc', label: 'Population (high to low)' },
  { value: 'population-asc', label: 'Population (low to high)' },
  { value: 'area-desc', label: 'Area (high to low)' },
  { value: 'area-asc', label: 'Area (low to high)' },
];

export function createFilterPanel(container, { regions, filters, onChange }) {
  container.innerHTML = `
    <div class="filter-panel">
      <div class="filter-field filter-field--search">
        <label for="filter-search">Search country</label>
        <div class="filter-search-box">
          <span class="filter-search-box__icon" aria-hidden="true">⌕</span>
          <input id="filter-search" type="search" placeholder="e.g. Argentina, Japan..." autocomplete="off" />
        </div>
      </div>

      <fieldset class="filter-field filter-field--regions">
        <legend>Region</legend>
        <div class="filter-regions" id="filter-regions"></div>
      </fieldset>

      <div class="filter-field">
        <label for="filter-sort">Sort by</label>
        <select id="filter-sort">
          ${SORT_OPTIONS.map((o) => `<option value="${o.value}">${o.label}</option>`).join('')}
        </select>
      </div>

      <button type="button" class="filter-reset" id="filter-reset">↺ Clear filters</button>
    </div>
  `;

  const searchInput = container.querySelector('#filter-search');
  const regionsBox = container.querySelector('#filter-regions');
  const sortSelect = container.querySelector('#filter-sort');
  const resetButton = container.querySelector('#filter-reset');

  regionsBox.innerHTML = regions
    .map(
      (region) => `
      <label class="filter-region-chip">
        <input type="checkbox" value="${region}" checked />
        <span>${region}</span>
      </label>`
    )
    .join('');

  searchInput.value = filters.search;
  sortSelect.value = filters.sort;

  let searchDebounce;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => onChange({ search: searchInput.value.trim() }), 150);
  });

  regionsBox.addEventListener('change', () => {
    const checked = [...regionsBox.querySelectorAll('input:checked')].map((i) => i.value);
    onChange({ regions: checked });
  });

  sortSelect.addEventListener('change', () => onChange({ sort: sortSelect.value }));

  resetButton.addEventListener('click', () => {
    searchInput.value = '';
    sortSelect.value = 'name-asc';
    regionsBox.querySelectorAll('input').forEach((i) => (i.checked = true));
    onChange({ search: '', sort: 'name-asc', regions: [...regions] });
  });
}
