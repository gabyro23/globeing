import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import * as topojson from 'https://cdn.jsdelivr.net/npm/topojson-client@3/+esm';
import { formatArea, formatPopulation } from '../format.js';

export function createMapView(container, { world, countries, selectedAlpha3, onToggleCountry, onDropAlpha3 }) {
  const normalizeId = (id) => String(Number(id));
  const byId = new Map(countries.map((c) => [normalizeId(c.id), c]));
  const land = topojson.feature(world, world.objects.countries).features.filter((f) => byId.has(normalizeId(f.id)));
  const countryOf = (feature) => byId.get(normalizeId(feature.id));

  const width = 960;
  const height = 520;
  const projection = d3.geoNaturalEarth1().fitSize([width - 16, height - 16], { type: 'FeatureCollection', features: land });
  const path = d3.geoPath(projection);

  container.innerHTML = '';
  const wrapper = d3.select(container).append('div').attr('class', 'map-view');

  const tooltip = wrapper.append('div').attr('class', 'map-tooltip').attr('hidden', true);

  const svg = wrapper
    .append('svg')
    .attr('class', 'map-view__svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('role', 'img')
    .attr('aria-label', 'Interactive world map of countries');

  const zoomLayer = svg.append('g');

  zoomLayer
    .append('rect')
    .attr('class', 'map-view__ocean')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', width)
    .attr('height', height);

  const countryPaths = zoomLayer
    .selectAll('path.country')
    .data(land, (d) => d.id)
    .join('path')
    .attr('class', 'country')
    .attr('d', path)
    .attr('tabindex', 0)
    .attr('role', 'button')
    .attr('aria-label', (d) => countryOf(d).name)
    .on('click', (event, d) => onToggleCountry(countryOf(d).alpha3))
    .on('keydown', (event, d) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onToggleCountry(countryOf(d).alpha3);
      }
    })
    .on('mousemove', (event, d) => {
      const c = countryOf(d);
      const [x, y] = d3.pointer(event, container);
      tooltip
        .attr('hidden', null)
        .style('left', `${x + 14}px`)
        .style('top', `${y + 10}px`)
        .html(`<strong>${c.flag} ${c.name}</strong><br>${formatPopulation(c.population)}<br>${formatArea(c.area)}`);
    })
    .on('mouseleave', () => tooltip.attr('hidden', true));

  function refreshSelection() {
    wrapper.classed('has-selection', selectedAlpha3.size > 0);
    countryPaths.classed('is-selected', (d) => selectedAlpha3.has(countryOf(d).alpha3));
  }
  refreshSelection();

  // Zoom & pan
  const zoom = d3
    .zoom()
    .scaleExtent([1, 8])
    .translateExtent([[0, 0], [width, height]])
    .on('zoom', (event) => zoomLayer.attr('transform', event.transform));
  svg.call(zoom);

  // Native HTML5 drag-and-drop: the map itself is also a drop target,
  // so a card from the country list can be dropped straight onto it.
  container.addEventListener('dragover', (event) => event.preventDefault());
  container.addEventListener('drop', (event) => {
    event.preventDefault();
    onDropAlpha3?.(event);
  });

  return {
    setSelection(nextSelectedAlpha3) {
      selectedAlpha3 = nextSelectedAlpha3;
      refreshSelection();
    },
    setFilteredAlpha3(alpha3Set) {
      countryPaths.classed('is-dimmed', (d) => alpha3Set && !alpha3Set.has(countryOf(d).alpha3));
    },
  };
}
