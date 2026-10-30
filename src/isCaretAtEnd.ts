export function isCaretAtEnd(element: HTMLElement): boolean {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return false;
  }

  console.log(element)
//   // Ensure the element is currently focused
//   if (document.activeElement !== element) {
// 
//     return false;
//   }

  const range = selection.getRangeAt(0);
  
  // Create a temporary range to select everything from the current cursor position to the end of the container
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(element);
  preCaretRange.setStart(range.endContainer, range.endOffset);

  // Clean text from the trailing selection to see if anything remains
  const trailingContent = preCaretRange.toString();

  // If there's text remaining, the cursor is not at the end
  if (trailingContent.length > 0) {
    return false;
  }

  // Handle edge cases like empty blocks or trailing <br> elements inside contenteditables
  // Check if there are any trailing element nodes (like <br> or <div> blocks) after the cursor
  const container = range.endContainer;
  if (container.nodeType === Node.TEXT_NODE) {
    const nextSibling = container.nextSibling;
    // If the text node has a next sibling that isn't an empty/ignored element, we aren't at the end
    if (nextSibling && !(nextSibling.nodeName === 'BR' && !nextSibling.nextSibling)) {
      return false;
    }
  }

  return true;
}
