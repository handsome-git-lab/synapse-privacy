'use strict';
// No network calls, analytics, external dependencies or storage. Never decrypts answers.
let previousBlob;
function showInvitation() {
  const status = document.getElementById('status');
  document.getElementById('actions').hidden = true;
  document.getElementById('manual').hidden = true;
  if (previousBlob) { URL.revokeObjectURL(previousBlob); previousBlob = undefined; }
  const token = location.hash.slice(1);
  let bytes;
  try {
    if (token.length > 2048 || !/^SYNAPSE1\.[A-Za-z0-9_-]+$/.test(token)) throw new Error();
    bytes = Uint8Array.from(atob(token.slice(9).replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0));
    if (bytes.length < 7 || new DataView(bytes.buffer).getUint32(0) !== 0x53594331 || bytes[4] !== 1 || bytes[5] !== 1 || ![1,2].includes(bytes[6])) throw new Error();
    if ((bytes[6] === 1 && bytes.length !== 341) || (bytes[6] === 2 && bytes.length !== 311)) throw new Error();
  } catch (_) {
    status.textContent = 'This link is incomplete or unsupported. Ask the sender to share it again, or paste their complete message into Synapse.';
    return;
  }
  const reply = bytes[6] === 2;
  document.getElementById('title').textContent = reply ? 'Your reply is here.' : "Let's explore this together.";
  document.getElementById('intro').textContent = reply
    ? 'Open this protected reply on the phone that created the invitation to discover your shared result.'
    : '12 light questions. Answer privately on your phone, then send your protected reply back to explore your shared preferences.';
  status.textContent = 'Ready to open. Synapse will check this invitation on your phone.';
  document.getElementById('actions').hidden = false;
  // Fixed package names and a validated base64url payload; no sender-supplied intent fields.
  for (const [id,pkg] of [['open','com.synapseapp.synapse'],['open-dev','com.synapseapp.synapse.dev']]) {
    document.getElementById(id).href = `intent://connection#${token}#Intent;scheme=synapse;package=${pkg};end`;
  }
  const blobUrl = URL.createObjectURL(new Blob([token],{type:'application/vnd.synapse.connection'}));
  previousBlob = blobUrl;
  const download = document.getElementById('download');
  download.href = blobUrl;
  download.download = reply ? 'synapse-reply.synapse' : 'synapse-invitation.synapse';
  document.getElementById('copy').onclick = async () => {
    try {
      await navigator.clipboard.writeText(token);
      status.textContent = 'Copied. Open Synapse → Invitations → Import.';
    } catch (_) {
      const manual = document.getElementById('manual');
      manual.value = token; manual.hidden = false; manual.focus(); manual.select();
      status.textContent = 'Select and copy the invitation below, then import it in Synapse.';
    }
  };
}
window.addEventListener('hashchange',showInvitation);
showInvitation();
