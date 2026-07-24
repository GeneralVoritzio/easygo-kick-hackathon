"use strict";

// Thin wrapper around the Kick public API. Everything here directly calls a
// Kick endpoint. OAuth/PKCE/token persistence live in auth.js.
// Docs: https://docs.kick.com/

const crypto = require("crypto");

const ID_BASE = "https://id.kick.com"; // OAuth token endpoint
const API_BASE = "https://api.kick.com/public/v1"; // REST API + webhook subscriptions

// ---------------------------------------------------------------------------
// OAuth token exchange (hits id.kick.com/oauth/token)
// ---------------------------------------------------------------------------

function exchangeCodeForToken({ clientId, clientSecret, redirectUri, code, codeVerifier }) {
  return tokenRequest({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
    code_verifier: codeVerifier,
  });
}

// Trade a refresh token for a fresh access token. The response carries a NEW
// refresh_token (rotation) — the caller must persist it or the next refresh fails.
// redirect_uri is not required here, unlike the authorization_code grant.
function refreshAccessToken({ clientId, clientSecret, refreshToken }) {
  return tokenRequest({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });
}

async function tokenRequest(params) {
  const res = await fetch(`${ID_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(`Token request failed (${res.status})`);
    err.status = res.status;
    err.detail = json;
    throw err;
  }
  return json;
}

// ---------------------------------------------------------------------------
// Authenticated API calls
// ---------------------------------------------------------------------------

async function apiRequest(accessToken, method, endpoint, jsonBody) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...(jsonBody ? { "Content-Type": "application/json" } : {}),
    },
    body: jsonBody ? JSON.stringify(jsonBody) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(`Kick API ${method} ${endpoint} failed (${res.status})`);
    err.status = res.status;
    err.detail = json;
    throw err;
  }
  return json;
}

// Fetch the authorized user's own profile (the token owner).
function getCurrentUser(accessToken) {
  return apiRequest(accessToken, "GET", "/users");
}

// Subscribe to webhook events. `events` is an array like
// [{ name: "chat.message.sent", version: 1 }]. Delivery goes to the callback
// URL configured on your Kick app dashboard.
function subscribeToEvents(accessToken, events) {
  return apiRequest(accessToken, "POST", "/events/subscriptions", {
    method: "webhook",
    events,
  });
}

// Send a chat message as the authorized user (type "user"), into the channel
// `broadcasterUserId` names. type:"bot" is not used — see CLAUDE.md.
function sendChatMessage(accessToken, { content, broadcasterUserId }) {
  const body = { content, type: "user" };
  // Omit rather than send null when absent — Kick rejects a null id.
  if (broadcasterUserId != null) body.broadcaster_user_id = Number(broadcasterUserId);
  return apiRequest(accessToken, "POST", "/chat", body);
}

// ---------------------------------------------------------------------------
// Webhook signature verification
// ---------------------------------------------------------------------------
// Kick signs each webhook with its private key. We verify using Kick's public
// key. The signed payload is: `${messageId}.${timestamp}.${rawBody}`.

let cachedPublicKey = null;

async function getKickPublicKey() {
  if (cachedPublicKey) return cachedPublicKey;
  const res = await fetch(`${API_BASE}/public-key`);
  const json = await res.json();
  // API returns { data: { public_key: "-----BEGIN PUBLIC KEY----- ..." } }
  const pem = json?.data?.public_key || json?.public_key;
  if (!pem) throw new Error("Could not fetch Kick public key");
  cachedPublicKey = pem;
  return pem;
}

async function verifyWebhookSignature({ messageId, timestamp, rawBody, signatureBase64 }) {
  if (!messageId || !timestamp || !signatureBase64) return false;
  const publicKey = await getKickPublicKey();
  const signedContent = `${messageId}.${timestamp}.${rawBody}`;
  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(signedContent);
  verifier.end();
  try {
    return verifier.verify(publicKey, Buffer.from(signatureBase64, "base64"));
  } catch {
    return false;
  }
}

module.exports = {
  exchangeCodeForToken,
  refreshAccessToken,
  getCurrentUser,
  subscribeToEvents,
  sendChatMessage,
  verifyWebhookSignature,
};
