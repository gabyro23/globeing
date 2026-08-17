// Port de js/dnd.js — mismo contrato de drag-and-drop nativo (HTML5)
// compartido entre la lista de países, el mapa y la zona de comparación.
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
