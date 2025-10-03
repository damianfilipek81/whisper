import Corestore from 'corestore';
import { log } from './logger.mjs';

import { state } from './state.mjs';

export async function initializeStorage(storagePath) {
  state.storagePath = storagePath;
  state.corestore = new Corestore(storagePath);
  await state.corestore.ready();
  state.localCore = state.corestore.get({ name: 'local' });
  await state.localCore.ready();
}

export async function closeStorage() {
  try {
    await state.corestore?.close();
  } catch {}
}

export async function saveMetadata() {
  if (!state.localCore) return;
  const peers = JSON.stringify(Array.from(state.peers.values()));
  const chats = JSON.stringify(
    Array.from(state.chats.values()).map((c) => ({
      id: c.id,
      peerId: c.peerId,
      // Don't persist connected status - it's ephemeral and should start as false
      messages: c.messages,
    }))
  );
  const profile = JSON.stringify(state.profile || {});
  await state.localCore.setUserData('v2_peers', peers);
  await state.localCore.setUserData('v2_chats', chats);
  await state.localCore.setUserData('v2_profile', profile);
}

let _saveTimer = null;
export async function saveMetadataDebounced(delay = 300) {
  try {
    if (_saveTimer) clearTimeout(_saveTimer);
  } catch {}
  return new Promise((resolve) => {
    _saveTimer = setTimeout(async () => {
      _saveTimer = null;
      try {
        await saveMetadata();
      } finally {
        resolve();
      }
    }, delay);
  });
}

export async function loadMetadata() {
  if (!state.localCore) return;
  log.i('[STORAGE] Loading metadata from storage...');
  const peersStr = await state.localCore.getUserData('v2_peers');
  const chatsStr = await state.localCore.getUserData('v2_chats');
  const profileStr = await state.localCore.getUserData('v2_profile');
  
  if (profileStr) {
    state.profile = JSON.parse(profileStr.toString());
    log.i(`[STORAGE] Loaded user profile: ${state.profile?.name || 'NONE'}`);
  }
  
  if (peersStr) {
    const peers = JSON.parse(peersStr.toString());
    log.i(`[STORAGE] Loaded ${peers.length} peers`);
    for (const p of peers) {
      state.peers.set(p.peerId, p);
      log.i(
        `[STORAGE] Peer ${p.peerId.slice(0, 8)}: profile.name=${
          p.profile?.name || 'NONE'
        }`
      );
    }
  }
  if (chatsStr) {
    const chats = JSON.parse(chatsStr.toString());
    log.i(
      `[STORAGE] Loaded ${chats.length} chats with ${chats.reduce(
        (sum, c) => sum + c.messages.length,
        0
      )} total messages`
    );
    for (const c of chats) {
      // Always start with connected: false - will update to true when peer actually connects
      c.connected = false;
      state.chats.set(c.id, c);
    }
  }
}
