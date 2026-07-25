# Kick API Map — every object, endpoint, webhook & scope

> Generated 2026-07-23 by a 25-agent docs sweep of https://docs.kick.com/llms.txt (one extractor per docs page).
> Strategy mapping for the hackathon is at the top; the full per-section inventory follows.
>
> Checked against the live docs on 2026-07-25: the page list, the 10 webhook events, the 11 scopes,
> the 4 Livestreams endpoints, the `LivestreamV2` fields and the `Stream` fields all still match.
> The newest changelog entry is 03/07/2026, so no API surface was added after the sweep. Two counts
> in the line below were wrong and are now corrected.

# TL;DR — the surface that matters

**Base URL** `https://api.kick.com` · **Auth** OAuth 2.1 w/ PKCE at `id.kick.com` (user tokens) or client-credentials (app tokens) · **35 endpoint operations on 26 paths · 10 webhook events · 11 scopes**

## For the KICK Circles brief ("what data would you use?")

| Brief requirement | Real Kick API surface |
|---|---|
| Shared watch behaviour → detect Circles | `GET /public/v2/livestreams` (viewer_count, category, custom_tags, broadcaster), `GET /public/v1/users/livestreams` (which creators of a Circle are live), Categories V2 for interest clustering |
| Follow / participation signals | `channel.followed` webhook (live follow-graph edges), `chat.message.sent` webhook (who participates where — includes `identity`, `replies_to`, `created_at`) |
| Circle Score inputs | chat velocity per channel (`chat.message.sent`), loyalty (`channel.subscription.new/renewal/gifts`), financial support (`kicks.gifted`), watch overlap (client-side/dummy for the prototype) |
| Leaderboards | `GET /public/v1/kicks/leaderboard` — per-channel gifter rankings, ready-made |
| Rewards / collectibles | Channel Rewards CRUD + redemptions accept/reject + `channel.reward.redemption.updated` webhook — a full collectible/claim loop |
| "Circle became active" notifications | `livestream.status.updated` + `livestream.metadata.updated` webhooks — fire when a Circle's creators go live |
| Safety & moderation (judged!) | `POST/DELETE /public/v1/moderation/bans`, `DELETE /public/v1/chat/{message_id}`, `moderation.banned` webhook |
| Profiles / avatars | `GET /public/v1/users`, `GET /public/v1/channels` (by slug too) |

The prototype is judged on dummy data — but the presentation page can cite these as the real signals, which directly answers "technical thinking."

## For HypeProps (if we fuse the two)

- **`kicks.gifted` webhook is literally our SponsorEvent** — it even carries `pinned_time_seconds`, Kick's own "paid placement duration" concept. Our mock event bus was shaped for this swap.
- Hype feeds: `chat.message.sent` (chat velocity), `channel.followed` / `channel.subscription.gifts` (surge events), Livestreams V2 polling for `viewer_count`.
- Prop-drop as a **Channel Reward** redemption is an alternative trigger path with a built-in accept/reject moderation gate.
- Webhook verification: signed payloads against `GET /public/v1/public-key`.

## Gotchas worth knowing on stage

- Webhooks that fail processing for >1 day get auto-unsubscribed; disabling webhooks unsubscribes everything.
- Categories V1, Livestreams V1, and the old token-introspect path are deprecated — use V2 / `/oauth` variants.
- 2FA is required on the Kick account before the Developer tab appears.
- Per-section scope lists below may echo the full global scope table (extraction artifact); the authoritative list is on the Scopes page.

<!-- STRATEGY -->

---

# Full inventory by docs section

## Welcome

_Source: https://docs.kick.com/readme.md_

Non-API prose page: intro to KICK's Public API launch, feedback channels (GitHub Issues, public roadmap, Discord), and a changelog table of API updates. No endpoint/object/webhook/scope definitions on this page itself, but the changelog reveals concrete API surface additions over time: DELETE /chat/:message_id, GET /kicks/leaderboard, kicks.gifted webhook (with pinned_time_seconds field added later), reusable/flexible refresh tokens, tags and viewer_count on GET /categories/:id, custom_tags on GET /livestreams and GET /channels, multiple broadcaster_user_id params allowed on livestreams, created_at on chat message payload, moderation banned webhook event, moderation endpoints, livestream metadata webhook event, reply chat message support, get channels by slug, thumbnail field on channels response, expires_at on channel subscriptions payload, identity object on chat sender payload, and the livestreams endpoint itself (added 01/04/2025).

**Project uses**

- kicks.gifted webhook (with pinned_time_seconds) could drive HypeProps: a gifted-kicks event triggers a brand face-prop placement and pinned_time_seconds could inform how long the prop stays pinned on screen.
- GET /kicks/leaderboard could power KICK Circles leaderboards, ranking members by kicks/tips within a circle.
- Moderation endpoints and moderation banned webhook could help KICK Circles enforce community health/anti-abuse rules within circle chat.
- custom_tags on livestreams/channels could be used to auto-group or tag streams into relevant Circles by shared category/interest.
- Chat message webhooks (with identity object, replies_to, created_at) could feed KICK Circles' community chat and activity notifications, or trigger HypeProps hype-extension logic from chat reactions.

## Changelog

_Source: https://docs.kick.com/changelog.md_

This is the Kick developer docs Changelog page, pure prose listing dated release notes with links to other doc pages (no inline API specs itself). Key items: (03/07/2026) added "Livestreams by user IDs" endpoint (GET /public/v1/users/livestreams), Livestreams V1 fully migrated off. (23/06/2026) added paginated Livestreams V2 endpoint (GET /public/v2/livestreams), V1 (GET /public/v1/livestreams) deprecated. (15/01/2026) added Categories V2 endpoint (GET /public/v2/categories) with better filters/pagination, Categories V1 deprecated; Token Introspect endpoint moved from /public/v1/token/introspect to /oauth (old one deprecated); APIs can now be tested directly in the Kick Dev Docs UI; added Channel Reward Redemptions APIs (GET /public/v1/channels/rewards/redemptions - fetch by ID/status/reward, accept pending, reject pending). (19/12/2025) disabling webhooks now auto-unsubscribes app from all webhook events; PATCH /channels custom tags update bug fixed; GET /livestreams now returns broadcaster profile picture. (12/12/2025) apps that repeatedly fail processing a webhook event for over a day get auto-unsubscribed from that event; profile picture and category detail bugs fixed. (03/12/2025) added Channel Rewards APIs and a "Channel Reward Redemption Updated" webhook event.

**Project uses**

- Channel Rewards + Reward Redemption webhook/APIs (03/12/2025, 15/01/2026) map directly onto KICK Circles' rewards/collectibles system - redeem/accept/reject flows and the redemption-updated webhook can drive real-time reward notifications to circle members.
- Livestreams V2 paginated endpoint and Livestreams-by-user-IDs endpoint let KICK Circles efficiently poll which circle members are currently live, powering activity feeds and leaderboards based on shared watch behaviour.
- The auto-unsubscribe-on-repeated-failure and disable-cascades-unsubscribe webhook behaviors are operational gotchas HypeProps and KICK Circles must handle to keep chat-hype/tip-triggered webhook subscriptions (e.g. reward redemption events) reliably delivering face-prop trigger events.
- Categories V2 endpoint with better filters could help KICK Circles group/segment communities by stream category for more relevant circle formation.

## App Setup

_Source: https://docs.kick.com/getting-started/kick-apps-setup.md_

This is a non-API prose guide walking developers through creating a Kick app: sign up for a Kick account, enable 2FA (required to access developer tools), navigate to Account Settings > Developer tab, create an app to get a ClientID/ClientSecret/redirectURL, and complete the OAuth 2.0 Authorization Code flow with PKCE (Kick redirects to the specified redirectURL with a code). No endpoints, objects, webhooks, or scopes are documented on this page; it links out to the Developer Terms and Conditions and a Contributing Guide.

**Project uses**

- Not directly applicable — this page only covers app registration/OAuth setup steps, not API capabilities. See other Kick docs pages (OAuth scopes, endpoints, webhooks) for concrete KICK Circles / HypeProps integration points.

## OAuth 2.1

_Source: https://docs.kick.com/getting-started/generating-tokens-oauth2-flow.md_

This page documents Kick's OAuth 2.1 authentication system, hosted at id.kick.com (distinct from the api.kick.com API host). It covers two token types: App Access Tokens (Client Credentials flow, server-to-server, public data only) and User Access Tokens (Authorization Code + PKCE flow, scoped, user-delegated access). It details six operations against /oauth/authorize, /oauth/token (three grant types), /oauth/revoke, and /oauth/token/introspect, plus a workaround for 127.0.0.1 redirect URIs breaking on NextJS-based frontends due to a query-param rewrite bug.

**Objects**

| Object | Description | Key fields |
|---|---|---|
| Token Response | Response body returned by the /oauth/token endpoint for authorization_code and refresh_token grants. | access_token, token_type, refresh_token, expires_in, scope |
| App Access Token Response | Response body returned by /oauth/token for client_credentials grant (no refresh_token or scope since it's app-level). | access_token, token_type, expires_in |
| Token Introspection Response | Response body from /oauth/token/introspect describing token validity and metadata. | data.active, data.client_id, data.token_type (app or user), data.scope, data.exp, message |

**Endpoints**

| Method | Path | Description | Auth | Scopes |
|---|---|---|---|---|
| GET | `https://id.kick.com/oauth/authorize` | Directs the user to the authorization server where they can log in and approve the application's access request (Authorization Code + PKCE flow start). | none |  |
| POST | `https://id.kick.com/oauth/token` | Exchanges an authorization code for a User Access Token and Refresh Token (grant_type=authorization_code). | none (uses client_id/client_secret in body) |  |
| POST | `https://id.kick.com/oauth/token` | Generates an App Access Token via Client Credentials flow for accessing public data server-to-server. | none (uses client_id/client_secret in body) |  |
| POST | `https://id.kick.com/oauth/token` | Refreshes an access token and refresh token pair using a valid refresh token (grant_type=refresh_token). | none (uses client_id/client_secret in body) |  |
| POST | `https://id.kick.com/oauth/revoke` | Revokes a given access or refresh token. | none |  |
| POST | `https://id.kick.com/oauth/token/introspect` | Checks if an access token is valid and returns metadata about it (active, client_id, token_type, scope, exp). | user access token or app access token (Bearer) |  |

**Scopes:** `user:read`, `channel:read`

**Project uses**

- KICK Circles: Use User Access Tokens (Authorization Code + PKCE flow) to let viewers log in and grant read scopes, enabling the app to pull per-user watch/chat activity to compute circle scores and leaderboards.
- KICK Circles: Use App Access Tokens (Client Credentials flow) for server-to-server background jobs that poll public channel/livestream data across many channels to power community discovery and activity notifications without requiring each viewer to individually authorize.
- HypeProps: Use User Access Tokens to authenticate streamers so the app can act on their behalf (e.g., manage their stream/cam overlay settings) once they grant the appropriate scopes during OAuth.
- HypeProps: Use the Refresh Token endpoint to maintain long-lived sessions for streamers so face-prop overlays and hype-driven extensions keep working without repeated re-authorization during a live broadcast.
- Both products: Use the Token Introspect endpoint to validate incoming tokens server-side (checking token_type and scope) before granting access to circle data or allowing brands to trigger prop placements, and the Revoke endpoint to cleanly log users out or handle disconnects.

## Scopes

_Source: https://docs.kick.com/getting-started/scopes.md_

Reference table of OAuth 2.1 authorization-code-grant scopes for Kick apps. Each scope string maps to a consent-screen title/description controlling access to user info, channel info/metadata, channel points rewards, chat writing, stream key, channel event subscriptions (chat messages, follows, subscriptions), moderation (ban/unban, chat message moderation), and KICKs (currency/leaderboard) data. No endpoints, objects, or webhook payloads are described on this page — it is purely the scope catalog used elsewhere in the API/OAuth flow and webhook subscription docs.

**Scopes:** `user:read`, `channel:read`, `channel:write`, `channel:rewards:read`, `channel:rewards:write`, `chat:write`, `streamkey:read`, `events:subscribe`, `moderation:ban`, `moderation:chat_message:manage`, `kicks:read`

**Project uses**

- KICK Circles: use events:subscribe + channel:read + user:read to ingest chat messages, follows, and subscriptions across channels to compute shared-watch-behaviour signals feeding a circle score and leaderboard
- KICK Circles: use kicks:read to pull KICKs leaderboard data as a basis for community rewards/collectibles and cross-referencing with circle leaderboards
- KICK Circles: use channel:rewards:read/write to create custom channel-points rewards tied to circle membership or activity milestones
- HypeProps: use events:subscribe + chat:write to detect tip/chat-hype messages in real time and post bot confirmations when a face prop is triggered or extended
- HypeProps: use channel:write and streamkey:read to manage livestream metadata/stream key access needed to overlay or extend sponsored face props on a streamer's cam

## Categories API

_Source: https://docs.kick.com/apis/categories.md_

Kick's Categories APIs let apps browse/search the categories (games/content types) available on Kick. Base URL is https://api.kick.com. Endpoints accept either a user access token or an app access token (OAuth2, authorization at id.kick.com/oauth/authorize, token at id.kick.com/oauth/token) — no category-specific scope is required beyond having a valid token. There is a current v2 list endpoint plus two deprecated v1 endpoints (search-by-query list and get-by-id) retained for backward compatibility. Categories include id, name, thumbnail, and (in detail/v2 views) tags and viewer_count.

**Objects**

| Object | Description | Key fields |
|---|---|---|
| CategoryWithTags | Category object returned by the current v2 list endpoint | id (integer), name (string), tags (array of strings), thumbnail (string) |
| CategoryResponse | Category object returned by the deprecated v1 list endpoint | id (integer), name (string), thumbnail (string) |
| CategoryDetail | Category detail object returned by the deprecated v1 single-category endpoint | id (integer), name (string), tags (array of strings), thumbnail (string), viewer_count (integer) |
| Pagination | Cursor-based pagination metadata wrapping list responses | next_cursor (string) |

**Endpoints**

| Method | Path | Description | Auth | Scopes |
|---|---|---|---|---|
| GET | `/public/v2/categories (base https://api.kick.com)` | Get Categories based on the cursor, limit, names, and tags; or ids. | user access token / app access token |  |
| GET | `/public/v1/categories (base https://api.kick.com) [DEPRECATED]` | Get Categories based on the search word. Returns up to 100 results at a time; use the page parameter to get more results. | user access token / app access token |  |
| GET | `/public/v1/categories/{category_id} (base https://api.kick.com) [DEPRECATED]` | Get Category based on the id. | user access token / app access token |  |

**Scopes:** `channel:read`, `channel:rewards:read`, `channel:rewards:write`, `channel:write`, `chat:write`, `events:subscribe`, `kicks:read`, `moderation:ban`, `moderation:chat_message:manage`, `streamkey:read`, `user:read`

**Project uses**

- KICK Circles: Use category tags/names to auto-cluster users into circles by shared watched content category (e.g. same game/category), forming the basis for 'shared watch behaviour' communities.
- KICK Circles: Use viewer_count from the category detail endpoint to surface trending categories in circle leaderboards or activity notifications ('this category is heating up in your circle').
- KICK Circles: Let users search/browse categories (by name, tag, or id) to discover and join category-centered circles.
- HypeProps: Use a streamer's current category (id, name, tags, thumbnail) to contextually theme which brand face-props are eligible/available for that stream (e.g. only offer racing-themed props during a racing-game category), though this page provides no tipping, chat, or webhook data to trigger prop placement itself.

## Users API

_Source: https://docs.kick.com/apis/users.md_

The Users API (Kick Dev Public API, base https://api.kick.com) exposes two endpoints: GET /public/v1/users to fetch user info (user_id, name, email, profile_picture) by ID list or the current authorised user if no IDs given, requiring user:read scope via UserAccessToken or an AppAccessToken; and a deprecated POST /public/v1/token/introspect implementing OAuth 2.0 token introspection (RFC 7662), returning active/client_id/exp/scope/token_type, usable with either UserAccessToken or AppAccessToken and no specific scope. The page's embedded OpenAPI spec also enumerates the full set of OAuth scopes available across the Kick API (channel, chat, moderation, kicks, events, streamkey, user). OAuth authorization/token URLs are https://id.kick.com/oauth/authorize and https://id.kick.com/oauth/token.

**Objects**

| Object | Description | Key fields |
|---|---|---|
| GetUser (endpoints.GetUser) | User object returned by Get Users endpoint | user_id (integer), name (string), email (string), profile_picture (string) |
| httpx.Response | Generic wrapper response envelope used across Kick API responses | data, message (string) |
| PostTokenIntrospectResponse (endpoints.PostTokenIntrospectResponse) | Response shape for token introspection | active (boolean), client_id (string), exp (integer), scope (string), token_type (string) |

**Endpoints**

| Method | Path | Description | Auth | Scopes |
|---|---|---|---|---|
| GET | `/public/v1/users (base: https://api.kick.com)` | Retrieve user information based on provided user IDs. If no user IDs specified, returns info for currently authorised user. | user access token (user:read) or app access token | user:read |
| POST | `/public/v1/token/introspect (base: https://api.kick.com)` | Get information about the token passed in via the Authorization header (OAuth 2.0 token introspection, RFC 7662). Deprecated. When active=false, no additional info is returned. | user access token or app access token (no explicit scope required) |  |

**Scopes:** `channel:read`, `channel:rewards:read`, `channel:rewards:write`, `channel:write`, `chat:write`, `events:subscribe`, `kicks:read`, `moderation:ban`, `moderation:chat_message:manage`, `streamkey:read`, `user:read`

**Project uses**

- KICK Circles: use GET /users with an id list to resolve user_id/name/profile_picture for members of a circle, powering leaderboard display names and avatars
- KICK Circles: use Token Introspect to validate a user's access token and confirm granted scopes (e.g. user:read) before syncing their identity into a circle profile
- HypeProps: use GET /users (self, no id param) to fetch the authorised viewer's user_id and profile_picture when they tip to trigger a face prop, for attribution/display in the hype overlay
- HypeProps: use Token Introspect to check scope/expiry of a tipper's token before allowing them to trigger a prop placement action tied to their identity

## Channels API

_Source: https://docs.kick.com/apis/channels.md_

The Channels API (base URL https://api.kick.com) exposes two endpoints for reading and updating Kick channel/livestream data: GET /public/v1/channels to fetch channel info (description, category, banner, stream state/metadata, subscriber counts) by broadcaster_user_id or slug (up to 50 each, mutually exclusive, no params defaults to the authenticated user), and PATCH /public/v1/channels to update livestream metadata (category, custom tags, title) for the authenticated user's channel. GET supports either a user access token with channel:read scope or an app access token; PATCH requires a user access token with channel:write scope. The page also documents the full OAuth scope catalog available across the Kick Dev Public API (channel, chat, moderation, kicks, streamkey, user, events scopes), even though only a subset applies directly to these two endpoints.

**Objects**

| Object | Description | Key fields |
|---|---|---|
| GetChannel | Channel data payload returned by GET /public/v1/channels | broadcaster_user_id, slug, channel_description, stream_title, banner_picture, category (CategoryResponse), stream (Stream), active_subscribers_count, canceled_subscribers_count |
| CategoryResponse | Category/game info attached to a channel | id, name, thumbnail |
| Stream | Live stream state and metadata for a channel | is_live, is_mature, key, language, start_time, thumbnail, url, viewer_count, custom_tags |
| PatchChannelsParams | Request body for updating channel/livestream metadata | category_id, custom_tags, stream_title |
| httpx.Response | Generic API response envelope | data, message |

**Endpoints**

| Method | Path | Description | Auth | Scopes |
|---|---|---|---|---|
| GET | `/public/v1/channels` | Retrieve channel information based on provided broadcaster user IDs or channel slugs. No params returns authenticated user's channel; up to 50 broadcaster_user_id OR up to 50 slugs (max 25 chars each) - cannot mix. | user access token (channel:read) or app access token | channel:read |
| PATCH | `/public/v1/channels` | Updates livestream metadata for a channel (category, custom tags, stream title). At least one field must be set. | user access token | channel:write |

**Scopes:** `channel:read`, `channel:rewards:read`, `channel:rewards:write`, `channel:write`, `chat:write`, `events:subscribe`, `kicks:read`, `moderation:ban`, `moderation:chat_message:manage`, `streamkey:read`, `user:read`

**Project uses**

- KICK Circles: use GET /public/v1/channels (is_live, viewer_count, category, custom_tags, start_time) to detect shared watch behaviour across members and compute a circle score based on co-viewing the same live channel/category
- KICK Circles: pull category/game and custom_tags from Stream to auto-group followers into topic/category-based circles (e.g. all viewers currently watching the same category)
- HypeProps: poll is_live and viewer_count via GET /public/v1/channels to know when a streamer's cam is live and gauge audience size for scaling hype-driven prop placements
- HypeProps: use PATCH /public/v1/channels stream_title/custom_tags as a lightweight way to broadcast an active brand sponsorship or hype-prop campaign name onto the stream metadata during a placement window

## Channel Rewards API

_Source: https://docs.kick.com/apis/channel-rewards.md_

Documents Kick's Channel Rewards (channel-points) API on base URL https://api.kick.com, auth via OAuth2 user access token (id.kick.com authorize/token endpoints). Covers full CRUD for channel rewards (max 15 per channel, enabled+disabled combined) and management of reward redemptions (list with cursor pagination and status/reward_id/id filters, batch accept/reject up to 25 IDs per request). Only the app that created a reward may update or delete it. No webhook events are documented on this page.

**Objects**

| Object | Description | Key fields |
|---|---|---|
| ChannelReward | A channel-points reward configured on a broadcaster's channel. | id (ulid), title, description, cost (integer), background_color (hexcolor), is_enabled (bool), is_paused (bool), is_user_input_required (bool), should_redemptions_skip_request_queue (bool) |
| MinimalChannelReward | Lightweight reward reference attached to a group of redemptions. | id (ulid, required), title (required), cost (uint64), description, can_manage (bool, whether your app can manage the reward/redemptions), is_deleted (bool, present only if reward deleted) |
| ChannelRewardRedemption | A single redemption of a channel reward by a user. | id (ulid, required), redeemed_at (date-time, required), redeemer (UserInfo, required), status (enum: pending/accepted/rejected, required), user_input (string, required) |
| RedemptionsByReward | Grouping of redemptions under their parent reward, returned by the list-redemptions endpoint. | reward (MinimalChannelReward), redemptions (array of ChannelRewardRedemption) |
| UserInfo | Minimal user reference (the redeemer). | user_id (uint64, required) |
| FailedRedemption | Entry returned when a redemption failed to be accepted/rejected in a batch operation. | id (ulid), reason (enum: UNKNOWN, NOT_PENDING, NOT_FOUND, NOT_OWNED) |
| Pagination | Cursor-based pagination wrapper. | next_cursor (string) |
| httpx.Response | Generic API response envelope. | data, message |

**Endpoints**

| Method | Path | Description | Auth | Scopes |
|---|---|---|---|---|
| GET | `/public/v1/channels/rewards` | Get channel rewards for a broadcaster's channel. Channels may have up to 15 rewards, including both enabled and disabled rewards. | user access token | channel:rewards:read, channel:rewards:write |
| POST | `/public/v1/channels/rewards` | Creates a channel reward in the broadcaster's channel. Max 15 rewards (enabled+disabled). | user access token | channel:rewards:write |
| PATCH | `/public/v1/channels/rewards/{id}` | Updates a channel reward. Only the app that created the reward can update it. At least one field required. | user access token | channel:rewards:write |
| DELETE | `/public/v1/channels/rewards/{id}` | Deletes a channel reward. Only the app that created the reward can delete it. Returns 204 No Content on success. | user access token | channel:rewards:write |
| GET | `/public/v1/channels/rewards/redemptions` | Get channel reward redemptions for a broadcaster's channel, grouped by reward, paginated via cursor. | user access token | channel:rewards:read, channel:rewards:write |
| POST | `/public/v1/channels/rewards/redemptions/accept` | Accept channel reward redemptions. Response only includes data for redemptions that failed to be accepted. | user access token | channel:rewards:write |
| POST | `/public/v1/channels/rewards/redemptions/reject` | Reject channel reward redemptions. Response only includes data for redemptions that failed to be rejected. | user access token | channel:rewards:write |

**Scopes:** `channel:read`, `channel:rewards:read`, `channel:rewards:write`, `channel:write`, `chat:write`, `events:subscribe`, `kicks:read`, `moderation:ban`, `moderation:chat_message:manage`, `streamkey:read`, `user:read`

**Project uses**

- HypeProps: define 'Trigger a Face Prop' as a channel reward (channel:rewards:write) so viewers spend channel points to place a brand prop, then poll/accept the redemption via the accept endpoint to fire the prop overlay and start the hype countdown.
- HypeProps: use redemption status filtering (pending/accepted/rejected) and user_input field to let viewers type which prop or custom message accompanies their triggered prop, moderated via accept/reject before it renders on stream.
- KICK Circles: award a special 'Circle Badge' or 'Community Perk' as a channel reward that members redeem, using redemption history (redeemer user_id, redeemed_at) as a data source for community activity feeds and circle score contributions.
- KICK Circles: use GET redemptions as an engagement signal (redemption counts per user/channel) to feed leaderboards ranking most active reward-redeemers within a circle.
- HypeProps: use should_redemptions_skip_request_queue and is_paused reward flags to let brands control whether tipped prop redemptions auto-trigger instantly or queue for streamer approval during a hype event.

## Chat API

_Source: https://docs.kick.com/apis/chat.md_

Documents the Kick Public API's Chat endpoints, base URL https://api.kick.com, OAuth2 authorization code flow via id.kick.com. Two endpoints: POST /public/v1/chat to send a message as a user (requires broadcaster_user_id) or as a bot (posts to the bot's attached channel, broadcaster_user_id ignored), and DELETE /public/v1/chat/{message_id} to remove a message. Messages capped at 500 characters; replies supported via reply_to_message_id. Also enumerates the full OAuth scope list available across the Kick Public API (not all specific to chat).

**Objects**

| Object | Description | Key fields |
|---|---|---|
| PostChatParams | Request body for posting a chat message. | content (string, max 500 chars), type (user|bot), broadcaster_user_id (integer, required if type=user), reply_to_message_id (uuid, optional, for threaded replies) |
| ChatResp | Response data for a successful chat post. | is_sent (boolean), message_id (uuid) |
| httpx.Response | Generic API envelope used across responses. | data, message |
| endpoints.ErrorResponse | Error envelope for 500 responses. | data, message |

**Endpoints**

| Method | Path | Description | Auth | Scopes |
|---|---|---|---|---|
| POST | `/public/v1/chat` | Post a chat message to a channel as a user or a bot. When sending as a user, broadcaster_user_id is required; when sending as a bot, broadcaster_user_id is not required/ignored and message goes to the channel attached to the bot's token. | user access token | chat:write |
| DELETE | `/public/v1/chat/{message_id}` | Delete a chat message from a channel. | user access token | moderation:chat_message:manage |

**Scopes:** `channel:read`, `channel:rewards:read`, `channel:rewards:write`, `channel:write`, `chat:write`, `events:subscribe`, `kicks:read`, `moderation:ban`, `moderation:chat_message:manage`, `streamkey:read`, `user:read`

**Project uses**

- KICK Circles: bot account posts automated community/circle-score updates, leaderboard shoutouts, and reward notifications directly into a streamer's chat using chat:write with type=bot.
- KICK Circles: reply_to_message_id lets a circle-bot thread responses to specific viewer messages (e.g. confirming a reward claim or leaderboard rank) for clearer community interaction.
- HypeProps: when a brand tip triggers a face-prop placement, a bot can post a chat message announcing the prop and its countdown, driving chat hype that could be tied to extending placement time.
- HypeProps/KICK Circles: moderation:chat_message:manage scope allows auto-deleting spam or abuse messages tied to tip/hype events to keep chat clean during high-activity moments.
- KICK Circles: chat:write plus the broadcaster_user_id targeting lets a single circle-wide bot post synchronized messages across multiple member channels for cross-community events.

## Moderation API

_Source: https://docs.kick.com/apis/moderation.md_

Documents Kick's two Moderation endpoints on base URL https://api.kick.com: POST /public/v1/moderation/bans to ban or timeout a user in a broadcaster's chat, and DELETE /public/v1/moderation/bans to unban/remove a timeout. Both require a user access token with the moderation:ban scope (OAuth2 authorization code flow via id.kick.com). Ban duration is specified in minutes (1-10080, i.e. up to 7 days) via the duration field; omitting it results in a permanent ban. The OpenAPI spec embedded on the page also enumerates the full set of OAuth scopes available across the Kick Dev Public API.

**Objects**

| Object | Description | Key fields |
|---|---|---|
| PostModerationBansParams | Request body for banning/timing out a user. | broadcaster_user_id, user_id, duration, reason |
| DeleteModerationBansParams | Request body for unbanning/removing timeout. | broadcaster_user_id, user_id |
| httpx.Response (generic wrapper) | Standard response envelope used across Kick public API endpoints. | data, message |

**Endpoints**

| Method | Path | Description | Auth | Scopes |
|---|---|---|---|---|
| POST | `/public/v1/moderation/bans` | Ban or timeout a user from participating in a broadcaster's chat room. | user access token | moderation:ban |
| DELETE | `/public/v1/moderation/bans` | Unban or remove timeout that was placed on a specific user. | user access token | moderation:ban |

**Scopes:** `channel:read`, `channel:rewards:read`, `channel:rewards:write`, `channel:write`, `chat:write`, `events:subscribe`, `kicks:read`, `moderation:ban`, `moderation:chat_message:manage`, `streamkey:read`, `user:read`

**Project uses**

- KICK Circles: auto-enforce circle community guidelines by timing out/banning disruptive members via POST /moderation/bans when circle-moderation bots detect abuse, keeping circle chat healthy and protecting circle score integrity
- KICK Circles: expose a 'community health' leaderboard signal by tracking ban/timeout counts per circle (fewer moderation actions = healthier, higher-scoring circle)
- HypeProps: let moderators instantly timeout/ban users who spam or abuse the hype-prop tipping/chat-extension flow, preventing griefing of the countdown extension mechanic
- HypeProps: build a moderator dashboard that pairs prop-tip events with one-click ban/unban controls using the same user access token already granted for chat/events scopes

## Livestreams API

_Source: https://docs.kick.com/apis/livestreams.md_

Kick Public API (base https://api.kick.com) endpoints for active livestreams: v2 list (cursor-paginated), a deprecated v1 list, list-by-user-ids, and global stats. Auth via UserAccessToken (OAuth2 authorization code via id.kick.com) or AppAccessToken (client credentials); no endpoint requires a specific scope beyond a valid access token.

**Objects**

| Object | Description | Key fields |
|---|---|---|
| LivestreamV2 | Current (v2) livestream object returned by /public/v2/livestreams and /public/v1/users/livestreams | id (uuid), broadcaster_user (LivestreamUser), category (LivestreamCategory), channel (LivestreamChannel), has_mature_content, language_code, started_at, tags, thumbnail, title, viewer_count (0 if streamer opts out of sharing) |
| LivestreamUser | Embedded broadcaster info on a LivestreamV2 | id, profile_picture, username |
| LivestreamCategory | Embedded category info on a LivestreamV2 | id, name, thumbnail |
| LivestreamChannel | Embedded channel info on a LivestreamV2 | slug |
| LivestreamWithCategory | Deprecated v1 livestream object returned by /public/v1/livestreams | broadcaster_user_id, channel_id, category (CategoryResponse), custom_tags, has_mature_content, language, profile_picture, slug, started_at, stream_title, thumbnail, viewer_count |
| CategoryResponse | Category shape used in deprecated v1 livestream object | id, name, thumbnail |
| LivestreamStats | Aggregate stats payload | total_count |
| Pagination | Cursor pagination wrapper used by v2 list endpoint | next_cursor |

**Endpoints**

| Method | Path | Description | Auth | Scopes |
|---|---|---|---|---|
| GET | `/public/v2/livestreams` | Get active livestreams, sorted oldest to newest, cursor-paginated (current, non-deprecated). | UserAccessToken or AppAccessToken |  |
| GET | `/public/v1/livestreams` | DEPRECATED. Get livestreams filtered by broadcaster_user_id, category_id, language, limit, and sort. | UserAccessToken or AppAccessToken |  |
| GET | `/public/v1/users/livestreams` | Get active livestreams for given user IDs. | UserAccessToken or AppAccessToken |  |
| GET | `/public/v1/livestreams/stats` | Get global livestream stats (currently just total active livestream count). | UserAccessToken or AppAccessToken |  |

**Scopes:** `channel:read`, `channel:rewards:read`, `channel:rewards:write`, `channel:write`, `chat:write`, `events:subscribe`, `kicks:read`, `moderation:ban`, `moderation:chat_message:manage`, `streamkey:read`, `user:read`

**Project uses**

- KICK Circles: poll /public/v2/livestreams or /public/v1/users/livestreams for a set of member user_ids to detect who's live now and build 'shared watch behaviour' signals (co-viewing same category/streamer) feeding circle scores and activity notifications.
- KICK Circles: use category_id/language_code filters on /public/v2/livestreams to surface trending categories a circle follows, powering leaderboards or discovery feeds of what the community is watching.
- KICK Circles: use /public/v1/livestreams/stats as a lightweight platform-wide activity signal (e.g. total live count) for a dashboard widget.
- HypeProps: use /public/v1/users/livestreams or /public/v2/livestreams to confirm a target streamer is currently live and fetch viewer_count/title/thumbnail context before triggering a tipped face-prop placement or displaying it on an overlay.
- HypeProps: viewer_count from the livestream object could scale the visual intensity or duration of a triggered prop placement (e.g. higher viewer count streams get bigger effects); chat-hype countdown logic itself is not documented on this page (see chat/events APIs).

## Public Key API

_Source: https://docs.kick.com/apis/public-key.md_

This page documents a single endpoint, GET /public/v1/public-key on the Kick Dev Public API (base URL https://api.kick.com), which returns the public key used to verify signatures on Kick's signed payloads (e.g., webhooks). The response wraps a PublicKey object (public_key string) inside a data field alongside a message field. Standard error responses (401 Unauthorized, 500 Internal Server Error) return a generic httpx.Response shape with data and message fields. No auth requirements, scopes, or query parameters are documented on this page.

**Objects**

| Object | Description | Key fields |
|---|---|---|
| GetPublicKeyResponse | Response wrapper containing the public key data and a message. | data (PublicKey), message |
| PublicKey | Object holding the actual public key string. | public_key |
| httpx.Response | Generic error response shape used for 401/500 responses. | data, message |

**Endpoints**

| Method | Path | Description | Auth | Scopes |
|---|---|---|---|---|
| GET | `https://api.kick.com/public/v1/public-key` | Retrieve the public key used for verifying signatures (e.g. webhook signature verification). | none specified on page |  |

**Project uses**

- KICK Circles: use the public key to verify authenticity of incoming Kick webhook events (e.g. livestream/chat events) before trusting them to update circle scores or leaderboards, preventing spoofed activity
- HypeProps: verify signed webhook payloads (tips/chat events) with this public key before triggering face-prop placements, ensuring hype-triggered prop extensions can't be forged
- Both products: fetch and cache this public key at startup/rotation to validate all Kick-signed callbacks server-side, forming the trust root for any event-driven feature

## KICKs API

_Source: https://docs.kick.com/apis/kicks.md_

This page documents Kick's public KICKs API, which exposes a single endpoint for retrieving a broadcaster's KICKs gifting leaderboard. Base URL is https://api.kick.com, and this endpoint requires a user access token with the `kicks:read` scope obtained via OAuth (authorization at id.kick.com/oauth/authorize, token at id.kick.com/oauth/token). The leaderboard returns top gifters ranked by gifted_amount across lifetime, month, and week windows, each entry including user_id, username, and rank. The full OpenAPI spec on this page also lists all OAuth scopes used across the broader Kick Dev Public API (channel, chat, moderation, events, streamkey, user, kicks).

**Objects**

| Object | Description | Key fields |
|---|---|---|
| KicksLeaderboard | Response payload containing leaderboard entries grouped by time period. | lifetime (array of KicksLeaderboardEntry), month (array of KicksLeaderboardEntry), week (array of KicksLeaderboardEntry) |
| KicksLeaderboardEntry | A single leaderboard entry representing a user's KICKs gifting rank. | gifted_amount (integer), rank (integer), user_id (integer), username (string) |
| httpx.Response | Generic API response wrapper. | data, message (string) |

**Endpoints**

| Method | Path | Description | Auth | Scopes |
|---|---|---|---|---|
| GET | `/public/v1/kicks/leaderboard` | Gets the KICKs leaderboard for the authenticated broadcaster. Query param `top` selects how many entries to return (default 10, range 1 to 100). | user access token | kicks:read |

**Scopes:** `channel:read`, `channel:rewards:read`, `channel:rewards:write`, `channel:write`, `chat:write`, `events:subscribe`, `kicks:read`, `moderation:ban`, `moderation:chat_message:manage`, `streamkey:read`, `user:read`

**Project uses**

- KICK Circles: use the KICKs leaderboard (week/month/lifetime gifted_amount + rank) as a direct input to a circle's 'top supporters' leaderboard and circle score weighting, rewarding top KICKs gifters with badges/collectibles
- KICK Circles: surface week-over-week leaderboard movement as activity notifications to circle members (e.g. 'X entered the top 10 gifters this week')
- HypeProps: use gifted_amount from the leaderboard as a proxy signal for a viewer's spending tier to unlock premium/rare face props or extend prop placement duration for top KICKs gifters
- HypeProps: combine kicks:read leaderboard data with chat:write/events:subscribe scopes (documented elsewhere in the API) to trigger a shoutout or on-stream celebration when a top-ranked KICKs gifter tips a face prop

## API FAQs

_Source: https://docs.kick.com/apis/faqs.md_

Non-API prose FAQ page. Covers: App Verification (verified badge on bot account, chat subscription limit increase from 1,000 to 10,000 subscriptions for verified apps); how to request verification (email developers@kick.com with Client ID, App Name, whether bot needs verification, reason, supporting evidence); and how to test the APIs without hosting an app (use OAuth 2.1 credentials — client ID + secret — from Kick Developer settings, use the "Test it" button on endpoint pages, select UserAccessToken or AppAccessToken auth type; for UserAccessToken set Redirect URL to https://docs.kick.com, fill Client ID/Secret, set Use PKCE to SHA-256, select scope, click Authorize; for AppAccessToken just fill Client ID/Secret and Authorize).

**Project uses**

- Verified-app chat subscription limit (1,000 -> 10,000) is relevant if KICK Circles or HypeProps needs to subscribe to many chat/webhook events at scale for large communities or high-tip-volume brand campaigns - plan for app verification early to avoid hitting the 1,000 subscription ceiling.
- The OAuth 2.1 + PKCE UserAccessToken flow described here is the mechanism KICK Circles would use to let members authorize the app to read their watch/follow data, and HypeProps would use to let streamers authorize brand tip-triggered prop placements.

## Events Introduction

_Source: https://docs.kick.com/events/introduction.md_

Non-API prose/setup guide. Explains Kick's Events API: subscribe to real-time webhooks for actions like follows, subscriptions, gifted subs, and chat messages. App access tokens can subscribe to events from any channel by supplying that channel's user ID (referenced: Post Event Subscriptions endpoint at docs.kick.com/events/subscribe-to-events#post-events-subscriptions). Setup requires enabling webhooks in the Kick Developer tab (kick.com/settings/developer), providing a publicly accessible webhook URL (localhost not supported without tunneling via e.g. ngrok/Cloudflare Tunnel) — Kick delivers events as POST requests to this URL. Notes that payloads should be verified using a public key to confirm authenticity, and points to a separate Webhook Payloads page (on GitHub: KickEngineering/KickDevDocs event-types README) for full payload structures and available event types — not included on this page.

**Project uses**

- KICK Circles: webhook events for follows and subscriptions/gifted subs could trigger real-time updates to a member's circle score and leaderboard position as soon as the action happens on Kick
- KICK Circles: chat message webhook events could feed a live activity/notification feed for community engagement tracking
- HypeProps: gifted subscription and follow webhooks could be adapted as alternate trigger signals (alongside tips) for placing sponsored face props on a streamer's cam
- Both: app access token support for subscribing to events across any channel (via channel user ID) enables a single backend service to listen to events from many streamers at once, which is needed for a multi-community/multi-streamer product

## Webhook Security

_Source: https://docs.kick.com/events/webhook-security.md_

Documents how to verify Kick webhook requests are authentic. Both App Access Tokens and User Access Tokens can access webhooks. Every webhook carries six headers (message id, subscription id, signature, timestamp, event type, event version). Sender validation is done via RSA signature verification: concatenate Kick-Event-Message-Id + "." + Kick-Event-Message-Timestamp + "." + raw request body, then verify the base64-decoded Kick-Event-Signature against this string using Kick's RSA public key (SHA256/PKCS1v15). The static public key is given inline (PEM) and is also fetchable live from GET https://api.kick.com/public/v1/public-key. A Go code example demonstrates parsing the key and verifying. Gotcha: if a webhook endpoint continually fails to process an event for over a day, Kick automatically unsubscribes the app from that event type, and the app must resubscribe manually.

**Objects**

| Object | Description | Key fields |
|---|---|---|
| Webhook Headers | Headers attached to every webhook request Kick sends to a subscribed app. | Kick-Event-Message-Id (ULID, idempotency key), Kick-Event-Subscription-Id (ULID), Kick-Event-Signature (Base64-encoded RSA signature), Kick-Event-Message-Timestamp (RFC3339 datetime), Kick-Event-Type (string, e.g. chat.message.sent), Kick-Event-Version (string, e.g. 1) |

**Endpoints**

| Method | Path | Description | Auth | Scopes |
|---|---|---|---|---|
| GET | `https://api.kick.com/public/v1/public-key` | Fetch the Kick public key used to verify webhook signatures. | App or User access token |  |

**Project uses**

- KICK Circles: verify inbound Kick webhooks (e.g. chat.message.sent, follow/subscription events) server-side using the signature scheme before trusting payloads that feed circle-score calculations, leaderboards, and activity notifications.
- HypeProps: securely trust incoming tip/chat-hype webhook events (validated via Kick-Event-Signature) before triggering face-prop placement or extending hype countdowns, preventing spoofed tip events from faking prop unlocks.
- Both products: use Kick-Event-Message-Id as an idempotency key to dedupe webhook retries so circle scores or hype-extension timers aren't double-counted.
- Both products: monitor for webhook auto-unsubscription (after a day of failures) and build a resubscribe/health-check job so live features (leaderboards, hype extensions) don't silently stop receiving events.
- HypeProps: use Kick-Event-Version/Kick-Event-Type headers to route different event types (tips vs chat messages) to distinct handlers for prop-triggering vs countdown-extension logic.

## Subscribe to Events

_Source: https://docs.kick.com/events/subscribe-to-events.md_

Documents the three CRUD endpoints (GET/POST/DELETE) at base URL https://api.kick.com/public/v1/events/subscriptions for managing webhook event subscriptions. Auth is via OAuth2 - either a User Access Token (authorizationCode flow, requiring the events:subscribe scope for POST/DELETE) or an App Access Token (clientCredentials flow). Notable limits: 10,000 subscriptions per event type per app; 'chat.message.sent' capped at 1,000 for unverified apps. When creating subscriptions with a user access token, broadcaster_user_id is inferred from the token and any supplied value is ignored; with an app access token it is required. Subscription method is currently only 'webhook'. The 'event' field in GET responses maps to event names defined in a separate Events table (not on this page).

**Objects**

| Object | Description | Key fields |
|---|---|---|
| GetEventSubscription | A single event subscription record returned by GET endpoint | app_id (string), broadcaster_user_id (integer), created_at (string), event (string, maps to Event name in Events table), id (string), method (string), updated_at (string), version (integer) |
| PostEventSubscription | Result of creating a single event subscription | name (string, required), version (integer, required), subscription_id (string), error (string, present if that subscription failed) |
| PostEventsSubscriptionsParams | Request body for creating subscriptions | events (array of Event, required), method (enum: 'webhook'), broadcaster_user_id (integer) |
| Event | An event name/version pair to subscribe to | name (string, required), version (integer, required) |
| httpx.Response | Generic wrapper response shape | data, message (string) |
| endpoints.ErrorResponse | Generic error response shape | data, message (string) |

**Endpoints**

| Method | Path | Description | Auth | Scopes |
|---|---|---|---|---|
| GET | `/public/v1/events/subscriptions` | Get events subscriptions for the authenticated app/user | user access token or app access token |  |
| POST | `/public/v1/events/subscriptions` | Subscribe to events via webhooks. Limit of 10,000 subscriptions per event type per app. For 'chat.message.sent' event, limit of 1,000 for unverified apps. | user access token (scope events:subscribe) or app access token | events:subscribe |
| DELETE | `/public/v1/events/subscriptions` | Delete events subscriptions by ID | user access token (scope events:subscribe) or app access token | events:subscribe |

**Scopes:** `channel:read`, `channel:rewards:read`, `channel:rewards:write`, `channel:write`, `chat:write`, `events:subscribe`, `kicks:read`, `moderation:ban`, `moderation:chat_message:manage`, `streamkey:read`, `user:read`

**Project uses**

- KICK Circles: Subscribe (POST) to follow/subscription/chat events per broadcaster_user_id via webhook to build real-time 'circle score' updates as members' watch/chat activity streams in
- KICK Circles: Use GET subscriptions to audit which channels/events a circle's bot is currently tracking, and DELETE to clean up when a channel leaves a circle
- HypeProps: Subscribe to chat.message.sent and subscription/follow events (respecting the 1,000 unverified-app limit) to detect tip/hype chat volume in real time and trigger face-prop placement or extend its countdown
- HypeProps: Use app access token with broadcaster_user_id to provision webhook subscriptions server-side for every streamer opted into the HypeProps integration without requiring each streamer to individually re-auth

## Webhook Payloads

_Source: https://docs.kick.com/events/event-types.md_

This page documents the 10 webhook event types Kick delivers to registered endpoints, each with a Kick-Event-Type/Kick-Event-Version header pair and a JSON payload example (all currently version 1): chat.message.sent, channel.followed, channel.subscription.renewal, channel.subscription.gifts, channel.subscription.new, channel.reward.redemption.updated, livestream.status.updated, livestream.metadata.updated, moderation.banned, and kicks.gifted. Payloads consistently reuse a compact user/subject object (is_anonymous, user_id, username, is_verified, profile_picture, channel_slug, identity) for broadcaster/sender/subscriber/follower/moderator/banned_user roles; anonymous senders null out identifying fields. No REST endpoints or OAuth scopes are documented on this page — it is purely webhook payload reference.

**Objects**

| Object | Description | Key fields |
|---|---|---|
| User/Broadcaster-Subject reference | Common shape used for broadcaster, follower, subscriber, sender, moderator, banned_user, redeemer, gifter, giftee fields across events | is_anonymous, user_id, username, is_verified, profile_picture, channel_slug, identity |
| Identity | Chat identity info attached to a sender in chat.message.sent | username_color, badges |
| Badge | Chat badge shown next to a sender | text, type, count |
| Emote | Emote reference within a chat message | emote_id, positions |
| EmotePosition | Start/end character index of an emote in message content | s, e |
| RepliesTo | Parent message referenced by a reply chat message | message_id, content, sender |
| Reward | Channel point reward metadata in a redemption event | id, title, cost, description |
| RedemptionMetadata | Ban metadata (reason/timestamps) nested under moderation.banned event | reason, created_at, expires_at |
| LivestreamMetadataCategory | Stream category info in livestream.metadata.updated | id, name, thumbnail |
| Gift | Kicks gift details in kicks.gifted event | amount, name, type, tier, message, pinned_time_seconds |

**Webhook events**

| Event | Ver | Description | Payload fields |
|---|---|---|---|
| `chat.message.sent` | 1 | Fired when a message has been sent in a stream's chat. | message_id, replies_to, broadcaster, sender, content, emotes, created_at |
| `channel.followed` | 1 | Fired when a user follows a channel. | broadcaster, follower |
| `channel.subscription.renewal` | 1 | Fired when a user's subscription to a channel is renewed. | broadcaster, subscriber, duration, created_at, expires_at |
| `channel.subscription.gifts` | 1 | Fired when a user gifts subscriptions to a channel. | broadcaster, gifter, giftees, created_at, expires_at |
| `channel.subscription.new` | 1 | Fired when a user first subscribes to a channel. | broadcaster, subscriber, duration, created_at, expires_at |
| `channel.reward.redemption.updated` | 1 | Fired when a channel reward is redeemed by a user; status is pending/accepted/rejected. | id, user_input, status, redeemed_at, reward, redeemer, broadcaster |
| `livestream.status.updated` | 1 | Fired when a stream's status has been updated (started/ended). | broadcaster, is_live, title, started_at, ended_at |
| `livestream.metadata.updated` | 1 | Fired when a stream's metadata (e.g. title) has been updated. | broadcaster, metadata |
| `moderation.banned` | 1 | Fired when a user has been banned from a channel. | broadcaster, moderator, banned_user, metadata |
| `kicks.gifted` | 1 | Fired when a user gifts kicks to a channel. | broadcaster, sender, gift, created_at |

**Project uses**

- KICK Circles: use channel.followed and livestream.status.updated events to detect shared watch behaviour (co-follows, simultaneous viewing across streams) to seed circle membership and compute a circle score.
- KICK Circles: aggregate chat.message.sent activity (volume, emote usage, badges) per user across a circle's channels to drive leaderboards and activity feeds.
- KICK Circles: use channel.subscription.new/renewal/gifts and kicks.gifted events as reward/collectible triggers (e.g. badges or points) for circle members who support tracked streamers.
- HypeProps: trigger a 3D face prop placement from kicks.gifted (amount/tier/message fields map directly to prop size/rarity) or channel.reward.redemption.updated (custom 'place a prop' channel point reward).
- HypeProps: use chat.message.sent volume/emote bursts after a prop is placed to detect 'chat hype' and extend the prop's on-screen placement timer.

## Organization Management

_Source: https://docs.kick.com/organizations/organization-management.md_

Non-API guide page. Kick Organizations let teams manage Drops campaigns, rewards, and members collaboratively (and, coming soon, own OAuth apps together). Registration is manual: email developers@kick.com with org name, org URL, logo URL, stream category to claim, member Kick usernames (all must have 2FA enabled), OAuth app client ID, a webhook URL (for reward-claim webhooks), and a Connection Page URL. Kick staff review and create the org after submission. Currently only an Owner role exists (owners can add/remove any user including other owners, but cannot remove themselves); more roles planned. Members are added/removed by username via a Members page UI; new members must have a Kick account with 2FA enabled. No endpoints, objects, webhooks payloads, or scopes are documented on this page — it references Token Generation and Webhook Security docs for related detail.

**Webhook events**

| Event | Ver | Description | Payload fields |
|---|---|---|---|
| `reward claimed (Drops)` |  | Sent to the organization's registered Webhook URL when a reward is claimed as part of a Drops campaign. No version or payload field details given on this page. |  |

**Project uses**

- KICK Circles: Organizations' Drops campaign/reward-claim webhook model could inform a similar 'circle rewards' claim-and-notify flow, but this page provides no reusable API surface, only the manual, non-programmatic registration process.
- HypeProps: The reward-claim webhook concept (server notified when a reward is claimed) is conceptually similar to notifying a brand when a tipped face-prop placement occurs, but again this page has no concrete endpoint/schema to build on.
- Neither product can currently be powered directly by this page since it documents a manual email-based org registration process with no public API, objects, or endpoints.

## Drops Guide

_Source: https://docs.kick.com/drops/drops-guide.md_

Non-API prose guide explaining how Kick Drops campaigns work end-to-end: org owners create rewards then campaigns (up to 12 rewards/campaign, unlimited campaigns/org) with watch-to-redeem rules, grace/announcement periods, and optional channel whitelisting or test mode. Viewers earn rewards by watching, link Kick and game accounts via org-built OAuth flows, then claim via their Inventory. Fulfillment is via a synchronous, signed, idempotent webhook POST (keyed on claim_id) that must be acked with 200 OK; signature verification uses a public key fetched from api.kick.com/public/v1/public-key. Streamers can opt out of global campaigns unless whitelisted. Links out to the separate Drops Public API and Organization Management API pages for actual endpoint definitions.

**Objects**

| Object | Description | Key fields |
|---|---|---|
| Campaign | A Drops campaign created under an org's dashboard on dev.kick.com | name, category, campaign info URL, start_at, end_at, rule: watch-to-redeem minutes per reward, grace period (days), announcement period (days before start_at), whitelisted channels (optional), attached rewards (up to 12), test mode flag |
| Reward | A reward attached to a campaign, created before the campaign | name, image, category, external_id (optional) |
| Claim (Webhook Payload) | Payload sent synchronously via webhook POST when a viewer claims a reward | claim_id (ULID), user_id (uint64), campaign_id (ULID), reward_id (ULID), external_id (string, optional) |

**Endpoints**

| Method | Path | Description | Auth | Scopes |
|---|---|---|---|---|
| GET | `api.kick.com/public/v1/public-key` | Retrieve Kick's public key used to verify webhook signatures. | none/public |  |

**Webhook events**

| Event | Ver | Description | Payload fields |
|---|---|---|---|
| `Drops claim fulfillment webhook` | unspecified | Synchronous POST sent to the org's provided webhook URL when a reward is claimed by a viewer. Must respond 200 OK immediately; idempotent on claim_id. | claim_id (ULID), user_id (uint64), campaign_id (ULID), reward_id (ULID), external_id (optional) |

**Project uses**

- KICK Circles: Drops watch-to-redeem tracking data (watched minutes, claimed rewards, unique users watched) could feed a Circle Score — rewarding members who collectively hit watch-time thresholds together.
- KICK Circles: Reward claims (with external_id linking to game/brand accounts) could become collectible badges displayed on member profiles and leaderboards within a Circle.
- KICK Circles: The claim webhook could trigger activity notifications to a Circle ('Member X just claimed a Drop reward') to surface real-time community engagement.
- HypeProps: The webhook signature verification pattern (Kick-Event-Signature, public key at /public-key) is directly reusable for securely receiving HypeProps' own tip/hype event webhooks.
- HypeProps: The org-owned campaign/reward model (rewards with images, categories, external IDs) is a structural analog for brand-sponsored 3D face props that could be 'claimed'/unlocked via chat hype thresholds.

## Drops FAQs

_Source: https://docs.kick.com/drops/drops-faqs.md_

Pure FAQ/prose page, no API objects, endpoints, webhooks, or scopes documented. Covers user-facing Drops mechanics: need a Kick account; watch-time accrual works on any device but only one active stream counts toward progress at a time (multiple simultaneous campaigns on the same streamer's channel do accrue together); progress tracked every ~2 minutes (avoid tab switching/refreshing); must link Kick account to game account via OAuth-style "Connect" flow (one game account per game per Kick account, unlinkable via Settings > Connections); claiming requires linked account and meeting watch-time milestones; rewards must be claimed within a grace period set by game developers or they expire; closed/expired campaigns visible in Inventory/All Campaigns for a limited window (expired campaigns shown until grace period ends, closed campaigns viewable for last 30 days); support split between support@kick.com (general Drops issues) and game developer support (reward fulfilment issues).

**Project uses**

- KICK Circles: use Drops campaign co-participation (same category/streamer watch-time accrual) as a signal for grouping viewers into circles around shared game/category interest
- KICK Circles: surface a member's claimed/expired Drops history (from Inventory) as collectible badges or activity feed items feeding a circle's leaderboard or score
- HypeProps: less directly applicable since this page is consumer-facing Drops FAQ with no tipping/chat API, but the 'watch-time tracked every 2 minutes' mechanic could inspire a similar timed-accrual pattern for extending face-prop placements via sustained chat hype

## Drops Public API

_Source: https://docs.kick.com/drops/public-api.md_

This page documents the Kick Drops Public API, which lets organizations retrieve and update reward claims for their Drops campaigns. Access is restricted to app access tokens from OAuth apps associated with the organization (no user access token option, no scopes listed). Base path is /public/v1/drops/claims; supports paginated retrieval (cursor-based, max limit 1000) and batch updates of claim external_status (max 100 claims per PATCH, returns 204 No Content). No webhooks or OAuth scopes are documented on this page.

**Objects**

| Object | Description | Key fields |
|---|---|---|
| Claim | A Drops campaign reward claim record | claim_id, user_id, campaign_id, reward_id, external_id, external_status, created_at, updated_at |

**Endpoints**

| Method | Path | Description | Auth | Scopes |
|---|---|---|---|---|
| GET | `/public/v1/drops/claims` | Retrieve Drops campaign reward claims | app access token |  |
| PATCH | `/public/v1/drops/claims` | Update external_status for one or more claims (max 100 per request); returns 204 No Content | app access token |  |

**Project uses**

- KICK Circles: award or track Drops reward claims tied to a campaign to grant circle members exclusive collectibles/rewards for watch participation
- KICK Circles: use claim_id/user_id/campaign_id data to feed a leaderboard or activity feed showing which members redeemed drops
- HypeProps: mark a Drops claim's external_status as 'processed' once a brand-sponsored face prop reward has been fulfilled to a viewer
- HypeProps: use campaign_id filtering to tie a specific brand sponsorship campaign's drop claims to prop unlock eligibility

## Contributing

_Source: https://docs.kick.com/how-do-i-contribute/contributing.md_

This page is not API reference material — it's a contribution guide for Kick's developer documentation. It explains how to give feedback: submit bug reports/feature requests/endpoint requests via GitHub Issues (KickEngineering/KickDevDocs), discuss with other developers on Discord, submit documentation fixes via Pull Request to the same GitHub repo, or email developers@kick.com for non-bug/feature support queries (bugs and feature requests must go through GitHub Issues, not email). No endpoints, objects, webhooks, scopes, limits, or upcoming features are documented on this page.

## Community Projects

_Source: https://docs.kick.com/how-do-i-contribute/community-projects.md_

This is a non-API prose page listing community-driven projects in the Kick Dev ecosystem. It contains a disclaimer that Kick does not own/operate or guarantee the accuracy/security of linked third-party resources and recommends independent verification before use. It links to community-built SDK libraries for Kick.com across Python (Kick.com Python Package, pyKickAPI, kickcom.py), JS/TypeScript (NodeJS Client, kick-auth NodeJS OAuth, Kient TS client, Kick-API-TYPES typings), PHP (kick-php-sdk), C#/.NET (KickLib), Java (Kick4J), and Golang (gokick, kick-go-sdk). It also links community documentation/guides for the OAuth flow (a basic Node OAuth example gist, and Better-Auth's Kick integration docs). No endpoints, objects, scopes, or webhooks are documented on this page.
