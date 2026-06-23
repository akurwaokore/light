# Complete Technical Analysis & Interactive Roadmap: Social Media Module

This document provides a highly detailed, comprehensive analysis of the Light Alumni network's **Social Media Module**. It reviews existing frontend views and widgets, backend REST API routes, the underlying Supabase database schema, and identifies implementation gaps along with a concrete roadmap to achieve 100% interactivity and robust operations.

---

## 1. Executive Summary

The **Social Media Module** is designed to foster professional networking, casual community building, and informational updates among alumni. It allows users to write posts, customize post visibility, react with rich emojis, thread conversations via nested comments, share posts across their networks, and bookmark items for later retrieval. 

The underlying schema and backend API structures are largely complete and support most features. However, several integration gaps exist where the visual components are not yet wired to their backend counterparts, or where secondary views (like a bookmark manager) are missing.

---

## 2. Database Schema & Data Models

The relational database layer is managed through PostgreSQL in Supabase. The primary tables and triggers powering the feed are located in the schema configuration file `scripts/create-social-media-system-v1.sql`.

### A. Table Schemas

#### 1. Core Posts Table (`posts`)
Contains all user-generated status updates, media attachments, and visibility tags.
* `id` (`UUID`, Primary Key, Defaults to `gen_random_uuid()`)
* `author_id` (`UUID`, Foreign Key to `profiles.id`, Cascade on Delete)
* `content` (`TEXT`, validated and sanitized)
* `image_url` (`TEXT`, Nullable)
* `video_url` (`TEXT`, Nullable)
* `media_urls` (`TEXT[]`, for carousel support)
* `visibility` (`VARCHAR(20)`, Default: `'public'`; constraints: `'public'`, `'friends'`, `'private'`)
* `shared_post_id` (`UUID`, Self-referencing Foreign Key to `posts.id` on delete set null)
* `location` / `feeling` (`TEXT`, Nullable metadata)
* `status` (`VARCHAR(20)`, Default: `'active'`)
* `created_at` / `updated_at` (`TIMESTAMPTZ`, Default: `NOW()`)

#### 2. Friendships & Connections (`friendships`)
Controls bidirectional connections which dictate "Friends-Only" post visibility.
* `id` (`UUID`, Primary Key)
* `user_id` / `friend_id` (`UUID`, Foreign Keys to `profiles.id`)
* `status` (`VARCHAR(20)`, Default: `'pending'`; constraints: `'pending'`, `'accepted'`, `'blocked'`)
* `requested_at` / `accepted_at` (`TIMESTAMPTZ`)
* *Constraints*: Unique pair index `(user_id, friend_id)`, and a check constraint ensuring `user_id != friend_id`.

#### 3. Post Reactions Table (`post_reactions`)
Tracks granular user sentiments instead of a basic boolean like.
* `id` (`UUID`, Primary Key)
* `post_id` (`UUID`, Foreign Key to `posts.id`)
* `user_id` (`UUID`, Foreign Key to `profiles.id`)
* `reaction_type` (`VARCHAR(20)`, constraints: `'like'`, `'love'`, `'haha'`, `'wow'`, `'sad'`, `'angry'`)
* *Constraints*: Unique combination of `(post_id, user_id)` preventing duplicate user reactions.

#### 4. Threaded Comments Table (`comments`)
Allows threaded discussion using adjacency lists and PostgreSQL path trees (`LTREE`).
* `id` (`UUID`, Primary Key)
* `post_id` (`UUID`, Foreign Key to `posts.id`)
* `author_id` (`UUID`, Foreign Key to `profiles.id`)
* `content` (`TEXT`)
* `parent_comment_id` (`UUID`, Self-referencing Foreign Key to `comments.id` for nested replies)
* `path` (`LTREE`, tracks hierarchy path tree)
* `created_at` / `updated_at` (`TIMESTAMPTZ`)

#### 5. Saved Posts & Bookmarks (`saved_posts`)
Maintains a collection of bookmarked posts per user.
* `id` (`UUID`, Primary Key)
* `post_id` (`UUID`, Foreign Key to `posts.id`)
* `user_id` (`UUID`, Foreign Key to `profiles.id`)
* `saved_at` (`TIMESTAMPTZ`, Default: `NOW()`)

---

## 3. Backend Endpoints (REST API)

All endpoints reside in `app/api/posts/` and utilize standard Next.js Route Handlers. They authenticate requests through the Supabase server client.

| Route | Method | Description | Current Status / Completeness |
| :--- | :---: | :--- | :--- |
| `/api/posts` | `GET` | Paginated feed retrieval. Handles friend checks, filtering out private posts, and mapping reactions/comments counts. | **100% Functional** |
| `/api/posts` | `POST` | Validates and sanitizes text before inserting a new post. Checks settings for auto-approval. | **100% Functional** |
| `/api/posts/[id]` | `PUT` | Updates existing post content. | **100% Functional** |
| `/api/posts/[id]` | `DELETE` | Deletes a post. | **100% Functional** |
| `/api/posts/[id]/comments` | `GET` | Fetches post-specific comments sorted by hierarchical paths. | **100% Functional** |
| `/api/posts/[id]/comments` | `POST` | Inserts a comment or nested reply, appends to the `LTREE` path, triggers automated notifications, and awards `0.2` gamification points. | **100% Functional** |
| `/api/posts/[id]/comments` | `DELETE` | Removes the requesting user's own comment. | **100% Functional** |
| `/api/posts/[id]/react` | `POST` | Multi-emoji reaction toggler. Adds, changes, or deletes post reactions. Generates notifications and awards `0.1` points. | **100% Functional** |
| `/api/posts/[id]/share` | `POST` | Shares a post, creating a new post entry referring back to the original `shared_post_id`. Awards `0.3` points. | **100% Functional** |
| `/api/posts/[id]/save` | `POST` / `GET` | Toggles or fetches saved status on a specific post. | **Missing** |

---

## 4. Frontend Component Inventory

### A. Main Feed View (`app/(dashboard)/feed/page.tsx`)
A full-screen, dedicated community feed.
* **Likes**: Only supports binary, non-emoji likes (renders simple Heart toggling state).
* **Comments**: Fully handles flat and nested reply input text boxes. Refreshing relies on clicking a manual refresh trigger.
* **Editing/Deletion**: Contains helper handlers (`handleUpdatePost`, `handleDeletePost`) but does not expose visual triggers in the dropdown context menu to execute them.
* **Sharing**: Renders a floating share box inside a dropdown element. Currently partially disconnected from the main feed view state.

### B. Dashboard Social Feed Widget (`components/feed/social-feed-widget.tsx`)
A compact widget designed for the main home portal.
* **Likes**: Includes a fully interactive reaction floating bar showing Love, Haha, Wow, Sad, and Angry emojis when hovered or long-pressed.
* **Visuals**: Displays professional badges indicating whether the author's profile has been marked as `"Hiring"` or `"Open to Work"`.

---

## 5. Identified Gaps (Technical Debt & Disconnects)

Through deep file exploration, several minor gaps are identified that prevent a perfectly synchronized and interactive social experience:

1. **Inconsistent Reaction Mechanics**:
   * The home dashboard widget has a rich emoji reaction popover picker.
   * The full `/feed` page fallback is a simple binary like/heart button.
2. **Missing Post-Management Dropdown Actions**:
   * While the frontend code contains functions to delete or update posts, the visual 3-dot menu dropdown currently does not show edit or delete options for the authors.
3. **Save Post API Route is Not Implemented**:
   * Renders bookmark icons in the layout, but the API endpoint to add or remove bookmarks from the `saved_posts` table does not exist.
4. **Rich Media Visual Carousels**:
   * The create-post card supports uploading and attaching multiple files, but the renderer card does not layout an image carousel or direct video rendering if `video_url` or `media_urls` are provided.
5. **Real-time Optimistic Refreshing**:
   * Adding a comment or a nested reply causes the entire thread to fetch again, rather than modifying the state client-side for ultra-fast perceived speeds.

---

## 6. Actionable Implementation Roadmap

To resolve all identified gaps and make the social media module exceptionally interactive, the following technical checklist has been architected:

### Phase 1: API Enhancements
1. **Create Save Post Route**:
   - Write `app/api/posts/[id]/save/route.ts` supporting `POST` to toggle insertion/deletion inside the `saved_posts` table.
   - Support a `GET` parameter or additional route `/api/posts/saved` to fetch all user bookmarks.

### Phase 2: Frontend Convergence & Polish
2. **Synchronize Emojis across Pages**:
   - Refactor the reaction buttons in `app/(dashboard)/feed/page.tsx` to use the reaction picker logic (matching `components/feed/social-feed-widget.tsx`).
3. **Expose Management Controls**:
   - Add "Edit Post" and "Delete Post" dropdown options under the 3-dot icon in `FeedPage` if the post's `author_id` is equal to the logged-in user's profile ID.
4. **Wired Bookmark Mechanics**:
   - Update the Bookmark icon buttons in both `FeedPage` and `SocialFeedWidget` to call `/api/posts/${id}/save` upon activation.
5. **Attach Media Carousel Rendering**:
   - Add a thumbnail grid component to the post card. If a video file is attached, display a styled video element instead of a generic text link.
6. **Side Panel Filters**:
   - Add a sticky side bar with filters for "My Posts", "Friends Feed", and "Saved Bookmarks" to allow seamless browsing of content categories.

---

This complete guide outlines the structure, files, and exact steps required to elevate the social media experience from its current functional baseline to a top-tier interactive platform!
