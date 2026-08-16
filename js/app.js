import { loadCountries, loadWorldTopology } from './data.js';
import { createStore } from './state.js';
import { createFilterPanel } from './components/filterPanel.js';
import { createCountryList } from './components/countryList.js';
import { createMapView } from './components/mapView.js';
import { createCompareZone } from './components/compareZone.js';
import { MAX_COMPARE } from './selectionColors.js';
import { initSiteHeader } from './components/siteHeader.js';

const DEFAULT_COMPARE_ALPHA3 = ['ARG', 'JPN'];

initSiteHeader();

function applyFilters(countries, filters) {
  const term = filters.search.toLowerCase();
  const filtered = countries.filter(
    (c) => filters.regions.includes(c.region) && (term === '' || c.name.toLowerCase().includes(term))
  );

  const [key, direction] = filters.sort.split('-');
  const sign = direction === 'asc' ? 1 : -1;
  filtered.sort((a, b) => {
    if (key === 'name') return a.name.localeCompare(b.name) * sign;
    return (a[key] - b[key]) * sign;
  });

  return filtered;
}

async function main() {
  const statusEl = document.getElementById('status');
  try {
    const [countries, world] = await Promise.all([loadCountries(), loadWorldTopology()]);
    statusEl.remove();

    const byAlpha3 = new Map(countries.map((c) => [c.alpha3, c]));
    const regions = [...new Set(countries.map((c) => c.region))].sort();

    const countBadge = document.getElementById('country-count-badge');
    countBadge.textContent = `${countries.length} countries · public data`;
    countBadge.hidden = false;

    const store = createStore({
      filters: { search: '', regions: [...regions], sort: 'name-asc' },
      compareAlpha3: DEFAULT_COMPARE_ALPHA3.filter((a) => byAlpha3.has(a)),
    });

    function toggleCompare(alpha3) {
      store.setState(({ compareAlpha3 }) => {
        if (compareAlpha3.includes(alpha3)) {
          return { compareAlpha3: compareAlpha3.filter((a) => a !== alpha3) };
        }
        if (compareAlpha3.length >= MAX_COMPARE) return {};
        return { compareAlpha3: [...compareAlpha3, alpha3] };
      });
    }

    function reorderCompare(draggedAlpha3, targetIndex, before) {
      store.setState(({ compareAlpha3 }) => {
        const withoutDragged = compareAlpha3.filter((a) => a !== draggedAlpha3);
        const targetAlpha3 = compareAlpha3[targetIndex];
        let insertAt = withoutDragged.indexOf(targetAlpha3);
        if (insertAt === -1) insertAt = withoutDragged.length;
        if (!before) insertAt += 1;
        withoutDragged.splice(insertAt, 0, draggedAlpha3);
        return { compareAlpha3: withoutDragged };
      });
    }

    const filterPanel = createFilterPanel(document.getElementById('filter-panel'), {
      regions,
      filters: store.getState().filters,
      onChange: (patch) => store.setState((s) => ({ filters: { ...s.filters, ...patch } })),
    });

    const countryList = createCountryList(document.getElementById('country-list'));

    const map = createMapView(document.getElementById('map-view'), {
      world,
      countries,
      selectedAlpha3: new Set(store.getState().compareAlpha3),
      onToggleCountry: toggleCompare,
      onDropAlpha3: (event) => {
        const alpha3 = event.dataTransfer.getData('application/x-country-alpha3') || event.dataTransfer.getData('text/plain');
        if (alpha3 && byAlpha3.has(alpha3)) toggleCompare(alpha3);
      },
    });

    const compareZone = createCompareZone(document.getElementById('compare-zone'), {
      onDropAlpha3: (alpha3) => {
        if (!byAlpha3.has(alpha3)) return;
        const { compareAlpha3 } = store.getState();
        if (!compareAlpha3.includes(alpha3) && compareAlpha3.length < MAX_COMPARE) {
          store.setState({ compareAlpha3: [...compareAlpha3, alpha3] });
        }
      },
      onRemove: (alpha3) =>
        store.setState(({ compareAlpha3 }) => ({ compareAlpha3: compareAlpha3.filter((a) => a !== alpha3) })),
      onReorder: reorderCompare,
    });

    function render(state) {
      const filtered = applyFilters(countries, state.filters);
      const selectedAlpha3 = new Set(state.compareAlpha3);

      countryList.render(filtered, { selectedAlpha3, onToggle: toggleCompare });
      map.setSelection(selectedAlpha3);
      map.setFilteredAlpha3(new Set(filtered.map((c) => c.alpha3)));
      compareZone.render(state.compareAlpha3.map((a) => byAlpha3.get(a)).filter(Boolean));
    }

    store.subscribe(render);
    render(store.getState());
  } catch (error) {
    console.error(error);
    statusEl.textContent = `Couldn't load the app: ${error.message}`;
    statusEl.classList.add('status--error');
  }
}

main();
