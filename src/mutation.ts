import { charPickerMenuKeys } from "./charPickerMenu/charPickerMenu";
import { formateMenuKeys } from "./formateMenu/formateMenu";
import { doc } from "./state/siteState";

export function onEnter(currentElement: HTMLDivElement) {
  if (doc.charPickerMenuOpen) return;

  if (doc.mode === "Character") {
    const name = currentElement.textContent.toUpperCase();
    if (!doc.characters.includes(name)) doc.characters.push(name);
    doc.mode = "Dialogue";

    return;
  }

  if (doc.mode === "Dialogue") return (doc.mode = "Action");
}

export function onTab(currentElement: HTMLDivElement) {
  if (currentElement.textContent !== "") return;

  if (doc.mode === "Action") {
    doc.mode = "Character";
    doc.charPickerMenuOpen = doc.characters.length > 0;
  }
}

export function onKeyDown(ev: KeyboardEvent, currentElement: HTMLDivElement) {
  if (ev.key === "Enter") onEnter(currentElement);

  if (ev.key === "Tab") {
    ev.preventDefault();
    onTab(currentElement);
    return;
  }

  if (doc.mode === "Character") {
    setTimeout(() => {
      const char = currentElement.textContent?.toUpperCase();

      if (char === "") {
        doc.charactersFilter = [];
        doc.charPickerMenuOpen = true;
        return;
      }

      doc.charactersFilter = doc.characters.filter(
        (value) => value.slice(0, char.length) === char,
      );

      doc.charPickerMenuOpen = doc.charactersFilter.length > 0;
    }, 0);
  }

  if (doc.charPickerMenuOpen) return charPickerMenuKeys(ev, currentElement);
  if (doc.formateMenuOpen) return formateMenuKeys(ev);
}
