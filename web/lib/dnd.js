// Port of js/dnd.js — same native (HTML5) drag-and-drop contract shared
// between the country list, the map, and the comparison zone.
export const DND_MIME = "application/x-country-alpha3";

export function handleDragStart(alpha3) {
  return (event) => {
    event.dataTransfer.setData(DND_MIME, alpha3);
    event.dataTransfer.setData("text/plain", alpha3);
    event.dataTransfer.effectAllowed = "copyMove";
  };
}

export function readDraggedAlpha3(event) {
  return event.dataTransfer.getData(DND_MIME) || event.dataTransfer.getData("text/plain");
}
