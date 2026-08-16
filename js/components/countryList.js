import { createCountryCard } from './countryCard.js';

export function createCountryList(container) {
  const list = document.createElement('div');
  list.className = 'country-list';
  container.innerHTML = '';
  container.appendChild(list);

  const countEl = document.createElement('p');
  countEl.className = 'country-list__count';
  container.insertBefore(countEl, list);

  return {
    render(countries, { selectedAlpha3, onToggle }) {
      countEl.textContent = `${countries.length} ${countries.length === 1 ? 'country' : 'countries'}`;
      list.innerHTML = '';
      if (countries.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'country-list__empty';
        empty.textContent = 'No countries match your filters.';
        list.appendChild(empty);
        return;
      }
      const fragment = document.createDocumentFragment();
      for (const country of countries) {
        fragment.appendChild(createCountryCard(country, { selected: selectedAlpha3.has(country.alpha3), onToggle }));
      }
      list.appendChild(fragment);
    },
  };
}
