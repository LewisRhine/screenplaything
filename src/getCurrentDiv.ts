export function getCurrentDiv(): HTMLDivElement | null {
  const selection = window.getSelection()

  if (!selection || selection.rangeCount === 0) return null

  const node = selection.getRangeAt(0).startContainer

  const element =
    node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement

  return element?.closest("div") as HTMLDivElement | null
}
