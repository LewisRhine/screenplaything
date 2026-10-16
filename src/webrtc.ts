export type PeerStatus =
  | "idle"
  | "preparing"
  | "waiting-for-answer"
  | "waiting-for-connection"
  | "connected"
  | "disconnected"
  | "failed";

interface PeerCallbacks {
  onStatus: (status: PeerStatus, message: string) => void;
  onMessage: (message: string) => void;
}

function parseCode(code: string, type: "offer" | "answer"): RTCSessionDescriptionInit {
  const name = type === "offer" ? "invitation" : "reply";
  if (!code.trim()) throw new Error(`Paste the ${name} code first.`);
  let description: unknown;
  try {
    description = JSON.parse(code);
  } catch {
    throw new Error("Invalid connection code. Paste the complete code and try again.");
  }
  if (!description || typeof description !== "object"
    || !("type" in description) || description.type !== type
    || !("sdp" in description) || typeof description.sdp !== "string"
    || !description.sdp.trim()) {
    throw new Error(`This is not a valid ${name} code.`);
  }
  return { type, sdp: description.sdp };
}

export function createPeerSession(
  callbacks: PeerCallbacks,
  configuration: RTCConfiguration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  },
) {
  let peer: RTCPeerConnection | null = null;
  let channel: RTCDataChannel | null = null;
  let connectionTimer = 0;
  let cancelGathering: (() => void) | null = null;
  let gatheringIncomplete = false;

  function cleanup() {
    const closingPeer = peer;
    const closingChannel = channel;
    peer = null;
    channel = null;
    gatheringIncomplete = false;
    window.clearTimeout(connectionTimer);
    cancelGathering?.();
    closingChannel?.close();
    closingPeer?.close();
  }

  function finish(status: PeerStatus, message: string) {
    cleanup();
    callbacks.onStatus(status, message);
  }

  function ensureCurrent(connection: RTCPeerConnection) {
    if (peer !== connection) throw new DOMException("Connection was reset.", "AbortError");
  }

  function attachChannel(connection: RTCPeerConnection, incoming: RTCDataChannel) {
    if (channel) {
      incoming.close();
      return;
    }
    channel = incoming;
    incoming.addEventListener("open", () => {
      if (peer !== connection) return;
      window.clearTimeout(connectionTimer);
      callbacks.onStatus("connected", "Connected. You can send test messages.");
    });
    incoming.addEventListener("message", (event: MessageEvent<unknown>) => {
      if (peer === connection && typeof event.data === "string" && event.data.length <= 1000) {
        callbacks.onMessage(event.data);
      }
    });
    incoming.addEventListener("close", () => {
      if (peer === connection) finish("disconnected", "Disconnected. Reset to connect again.");
    });
    incoming.addEventListener("error", () => {
      if (peer === connection) finish("failed", "The message connection failed. Reset and try again.");
    });
  }

  function open() {
    if (peer) throw new Error("Reset the current connection before starting another one.");
    const connection = new RTCPeerConnection(configuration);
    peer = connection;
    callbacks.onStatus("preparing", "Preparing your connection code…");
    connection.addEventListener("datachannel", (event) => {
      if (peer === connection) attachChannel(connection, event.channel);
    });
    connection.addEventListener("connectionstatechange", () => {
      if (peer !== connection) return;
      if (connection.connectionState === "failed") {
        finish("failed", "Could not connect. Try again; some networks require a relay server.");
      } else if (connection.connectionState === "disconnected"
        || connection.connectionState === "closed") {
        finish("disconnected", "Disconnected. Reset to connect again.");
      }
    });
    return connection;
  }

  function waitForCandidates(connection: RTCPeerConnection): Promise<boolean> {
    ensureCurrent(connection);
    const hasCandidates = () => /^a=candidate:/m.test(connection.localDescription?.sdp ?? "");
    const noCandidates = () => new Error("No connection addresses were found. Check your network or browser WebRTC settings and try again.");
    if (connection.iceGatheringState === "complete") {
      return hasCandidates() ? Promise.resolve(true) : Promise.reject(noCandidates());
    }
    return new Promise((resolve, reject) => {
      const started = performance.now();
      function complete(finished: boolean, error?: Error) {
        window.clearTimeout(fallbackTimer);
        window.clearTimeout(deadlineTimer);
        connection.removeEventListener("icegatheringstatechange", check);
        connection.removeEventListener("icecandidate", check);
        cancelGathering = null;
        if (error) reject(error);
        else if (!hasCandidates()) reject(noCandidates());
        else resolve(finished);
      }
      function check() {
        if (connection.iceGatheringState === "complete") complete(true);
        else if (performance.now() - started >= 5000 && hasCandidates()) complete(false);
      }
      const fallbackTimer = window.setTimeout(() => {
        if (hasCandidates()) complete(false);
      }, 5000);
      const deadlineTimer = window.setTimeout(() => {
        complete(false);
      }, 15000);
      cancelGathering = () => complete(false, new DOMException("Connection was reset.", "AbortError"));
      connection.addEventListener("icegatheringstatechange", check);
      connection.addEventListener("icecandidate", check);
      check();
    });
  }

  function connectionHint(message: string): string {
    return gatheringIncomplete
      ? `${message} Some connection checks did not finish; you can still try this code.`
      : message;
  }

  function watchConnection(connection: RTCPeerConnection) {
    window.clearTimeout(connectionTimer);
    if (channel?.readyState === "open") return;
    callbacks.onStatus("waiting-for-connection", connectionHint("Waiting for the other browser to connect…"));
    connectionTimer = window.setTimeout(() => {
      if (peer === connection) {
        finish("failed", "Connection timed out. Exchange fresh codes and try again. Some networks require a relay server.");
      }
    }, 120000);
  }

  function setupError(connection: RTCPeerConnection, error: unknown): never {
    if (peer !== connection) throw new DOMException("Connection was reset.", "AbortError");
    const message = error instanceof Error && error.name === "Error"
      ? error.message
      : "Could not use this connection code. Reset and exchange fresh codes.";
    finish("failed", message);
    throw new Error(message);
  }

  return {
    async createInvitation(): Promise<string> {
      const connection = open();
      try {
        attachChannel(connection, connection.createDataChannel("messages", { ordered: true }));
        await connection.setLocalDescription(await connection.createOffer());
        const gathered = await waitForCandidates(connection);
        ensureCurrent(connection);
        gatheringIncomplete = !gathered;
        callbacks.onStatus("waiting-for-answer", connectionHint("Send your invitation code, then paste the reply and click Connect reply."));
        return JSON.stringify(connection.localDescription!.toJSON());
      } catch (error) {
        return setupError(connection, error);
      }
    },

    async joinInvitation(code: string): Promise<string> {
      const description = parseCode(code, "offer");
      const connection = open();
      try {
        await connection.setRemoteDescription(description);
        ensureCurrent(connection);
        await connection.setLocalDescription(await connection.createAnswer());
        const gathered = await waitForCandidates(connection);
        ensureCurrent(connection);
        gatheringIncomplete = !gathered;
        watchConnection(connection);
        return JSON.stringify(connection.localDescription!.toJSON());
      } catch (error) {
        return setupError(connection, error);
      }
    },

    async connectReply(code: string): Promise<void> {
      const description = parseCode(code, "answer");
      const connection = peer;
      if (!connection || connection.signalingState !== "have-local-offer") {
        throw new Error("Create an invitation before accepting a reply.");
      }
      try {
        await connection.setRemoteDescription(description);
        ensureCurrent(connection);
        watchConnection(connection);
      } catch (error) {
        setupError(connection, error);
      }
    },

    sendMessage(message: string): void {
      if (channel?.readyState !== "open") throw new Error("Connect both browsers before sending a message.");
      if (!message.trim() || message.length > 1000) throw new Error("Enter a message between 1 and 1,000 characters.");
      channel.send(message);
    },

    disconnect(): void {
      finish("idle", "Not connected.");
    },
  };
}
