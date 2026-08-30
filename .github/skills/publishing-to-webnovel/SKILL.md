---
name: publishing-to-webnovel
description: Use when publishing, uploading, updating, editing, scheduling, or verifying story chapters in Webnovel Inkstone from local Story Skills Markdown files.
---

# Publishing to Webnovel

## Overview

Publish through Inkstone's authenticated browser UI. Preserve the local chapter as the source of truth, save a draft before publishing, and verify the result in Inkstone.

## Required inputs

- Inkstone book URL or book ID
- Local `chapters/chapter-NN.md` path
- Action: create draft, publish now, schedule, or update an existing chapter

If the requested chapter already exists in Draft or Published, update it instead of creating a duplicate.
Derive the book ID from `/novels/view/{bookId}` or recorded `webnovel-book-id`. A chapter mapping is stored as flat YAML keys in that chapter's existing frontmatter.

## Workflow

1. Read the current local chapter immediately before upload.
2. Extract the title from frontmatter and content only after `## Chapter Text`. Never upload frontmatter, headings, or the outline.
3. Open the Inkstone book page in the existing authenticated browser session. If redirected to login or the requested title is absent, stop for human login/confirmation.
4. Check both Draft and Published for the same chapter number/title.
5. For a new chapter, select **CREATE CHAPTER**, fill the title, and load the prose into the TinyMCE editor using the verified conversion in [references/inkstone-editor.md](references/inkstone-editor.md).
	Wait until `globalThis.tinymce?.activeEditor` and its editable body exist before inserting.
6. Verify the editor's first, middle, and last text samples, bold system text, scene breaks, and bullet lines. Direct insertion may leave Inkstone's counter at `0 words` until the first save.
7. Select **save** first. Confirm the `Chapter saved!` message and an edit URL containing both book ID and chapter ID.
8. For immediate publication, select **Publish**, leave **Publish Timer** off, review title/volume/type/word count, and select **confirm**.
9. Verify **published (N)** increased and the Published tab contains `000N {Title}` with a publication time. Do not rely on the book summary's chapter count immediately after publishing because it may lag.
10. Record the verified IDs and state in flat chapter frontmatter fields: `webnovel-book-id`, `webnovel-chapter-id`, `webnovel-status`, and `webnovel-published-at`. Set local `status: final` only when the published prose is intended to be the current final revision.
11. Stop the temporary localhost server used for content transfer.

## Updating a chapter

1. Open **published** or **draft**, then select the existing chapter.
	Use recorded IDs as navigation hints, but still confirm the visible title and book before editing.
2. Replace title/content from the latest local file using the same conversion and checks.
3. Drafts use **save**. Published chapters use **update**.
4. Return to the chapter list and reopen the chapter to verify the saved beginning, ending, formatting, and word count.

## Safety rules

- Use the browser's existing login. Never extract, print, store, or replay cookies, tokens, private API payloads, or authorization headers.
- Never use undocumented Inkstone HTTP APIs; they are unstable and risk duplicate or malformed chapters.
- Never publish when title, chapter number, book, or existing-chapter identity is ambiguous.
- Never assume direct DOM insertion saved. A successful draft save, nonzero Inkstone word count, edit URL, and chapter-list entry are required evidence.
- Preserve local prose exactly except for Markdown-to-editor formatting conversion.
- If any step fails after starting a localhost server, stop that server before reporting the failure.
- After a timeout or uncertain response, reopen Draft and Published before retrying. Never repeat create, save, publish, or update blindly.
