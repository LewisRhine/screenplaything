import { createPeerSession, type PeerStatus } from "./webrtc";
import "./webrtc.css";

export function attachWebrtcPanel(container: HTMLElement): void {
  container.innerHTML = `
    <details class="connection-panel">
      <summary>Peer connection</summary>
      <div class="connection-content">
        <p>Connect two browsers by exchanging codes. This demo sends test messages only.</p>
        <p class="connection-status" role="status" aria-live="polite">Not connected.</p>
        <button type="button" data-action="create">Create invitation</button>
        <label>Incoming invitation or reply
          <textarea data-field="incoming" rows="3" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea>
        </label>
        <div class="connection-actions">
          <button type="button" data-action="join">Join invitation</button>
          <button type="button" data-action="connect" disabled>Connect reply</button>
        </div>
        <label>Your code — send this to the other person
          <textarea data-field="outgoing" rows="3" readonly spellcheck="false"></textarea>
        </label>
        <div class="connection-actions">
          <button type="button" data-action="copy" disabled>Copy code</button>
          <button type="button" data-action="reset">Disconnect / Reset</button>
        </div>
        <p class="connection-error" role="alert"></p>
        <form class="connection-message-form">
          <label>Test message
            <input name="message" maxlength="1000" autocomplete="off" required disabled />
          </label>
          <button type="submit" disabled>Send</button>
        </form>
        <ol class="connection-messages" role="log" aria-label="Test messages" aria-live="polite"></ol>
      </div>
    </details>
  `;

  const createButton = container.querySelector<HTMLButtonElement>('[data-action="create"]')!;
  const joinButton = container.querySelector<HTMLButtonElement>('[data-action="join"]')!;
  const connectButton = container.querySelector<HTMLButtonElement>('[data-action="connect"]')!;
  const copyButton = container.querySelector<HTMLButtonElement>('[data-action="copy"]')!;
  const resetButton = container.querySelector<HTMLButtonElement>('[data-action="reset"]')!;
  const incoming = container.querySelector<HTMLTextAreaElement>('[data-field="incoming"]')!;
  const outgoing = container.querySelector<HTMLTextAreaElement>('[data-field="outgoing"]')!;
  const statusElement = container.querySelector<HTMLElement>(".connection-status")!;
  const errorElement = container.querySelector<HTMLElement>(".connection-error")!;
  const messageForm = container.querySelector<HTMLFormElement>("form")!;
  const messageInput = container.querySelector<HTMLInputElement>('input[name="message"]')!;
  const sendButton = messageForm.querySelector<HTMLButtonElement>("button")!;
  const messages = container.querySelector<HTMLOListElement>(".connection-messages")!;
  const supported = typeof RTCPeerConnection !== "undefined";
  let status: PeerStatus = "idle";
  let busy = false;
  let generation = 0;
        
  function updateControls() {
    const canStart = status === "idle" && supported && !busy;
    createButton.disabled = !canStart;
    joinButton.disabled = !canStart;
    connectButton.disabled = status !== "waiting-for-answer" || busy;
    incoming.disabled = !canStart && (status !== "waiting-for-answer" || busy);
    copyButton.disabled = !outgoing.value || busy;
    messageInput.disabled = status !== "connected";
    sendButton.disabled = status !== "connected";
  }

  function addMessage(sender: string, text: string) {
    const item = document.createElement("li");
    item.textContent = `${sender}: ${text}`;
    messages.append(item);
    if (messages.children.length > 100) messages.firstElementChild!.remove();
    messages.scrollTop = messages.scrollHeight;
  }

  const session = createPeerSession({
    onStatus(nextStatus, message) {
      status = nextStatus;
      statusElement.textContent = message;
      updateControls();
    },
      onMessage(message) {        
      addMessage("Peer", message);
    },
  });

  async function run(action: () => Promise<string | void>) {
    if (busy) return;
    const operation = generation;
    busy = true;
    errorElement.textContent = "";
    updateControls();
    try {
      const code = await action();
      if (operation !== generation) return;
      if (code) outgoing.value = code;
    } catch (error) {
      if (operation !== generation) return;
      errorElement.textContent = error instanceof Error ? error.message : "Could not complete the connection. Reset and try again.";
    } finally {
      if (operation === generation) {
        busy = false;
        updateControls();
      }
    }
  }

  createButton.addEventListener("click", () => void run(() => session.createInvitation()));
  joinButton.addEventListener("click", () => void run(() => session.joinInvitation(incoming.value)));
  connectButton.addEventListener("click", () => void run(() => session.connectReply(incoming.value)));
  copyButton.addEventListener("click", () => void run(async () => {
    if (!navigator.clipboard?.writeText) {
      outgoing.focus();
      outgoing.select();
      throw new Error("Select your code and copy it manually.");
    }
    try {
      await navigator.clipboard.writeText(outgoing.value);
    } catch {
      outgoing.focus();
      outgoing.select();
      throw new Error("Could not copy automatically. Select your code and copy it manually.");
    }
  }));
  resetButton.addEventListener("click", () => {
    generation += 1;
    busy = false;
    incoming.value = "";
    outgoing.value = "";
    messageInput.value = "";
    errorElement.textContent = "";
    messages.replaceChildren();
    session.disconnect();
  });
  messageForm.addEventListener("submit", (event) => {
    event.preventDefault();
    errorElement.textContent = "";
    try {
      session.sendMessage(messageInput.value);
      addMessage("You", messageInput.value);
      messageInput.value = "";
    } catch (error) {
      errorElement.textContent = error instanceof Error ? error.message : "Could not send the message.";
    }
  });
  window.addEventListener("pagehide", () => session.disconnect());
  if (!supported) statusElement.textContent = "This browser does not support WebRTC connections.";
    updateControls();                
                    
}
