# Inkstone editor reference

## Verified routes and controls

- Book workspace: `/novels/view/{bookId}`
- New chapter: `/novels/chapter/create/{bookId}`
- Existing chapter: `/novels/chapter/edit/{bookId}/{chapterId}`
- New chapters expose **save** and **Publish**.
- Published chapters expose **update**.
- Publishing opens **confirm publish** with title, volume, word count, chapter type, timer, and **confirm**.

Control labels and DOM references can change. Locate controls by accessible name rather than saved element references.

## Exact source transfer

Start a temporary loopback server from the repository root:

```text
python -m http.server 8765 --bind 127.0.0.1
```

Use `page.request.get()` to read the Markdown through localhost. This avoids manually copying long chapters. Stop the server after verification.

## Conversion contract

1. Keep only text after the `## Chapter Text` line.
2. Escape `&`, `<`, and `>` before adding HTML.
3. Convert `**text**` to `<strong>text</strong>`.
4. Convert `*text*` to `<em>text</em>`.
5. Wrap each nonempty prose line in `<p>...</p>`.
6. Convert a Markdown scene-break line (`---`) to `<p style="text-align: center;">* * *</p>`.
7. Convert each Markdown bullet (`- item`) to its own `<p>• item</p>`.

Inkstone's TinyMCE configuration strips `<ul>/<li>` and merges consecutive list items into one paragraph. Use separate bullet paragraphs to preserve readability.

## TinyMCE insertion

The editor iframe name begins with `tiny-react_`. Set content through the page's TinyMCE instance, not only the iframe DOM:

```javascript
await page.evaluate((html) => {
  const editor = globalThis.tinymce?.activeEditor;
  if (!editor) throw new Error('TinyMCE editor not found');
  editor.setContent(html, { format: 'html' });
  editor.fire('SetContent');
  editor.fire('input');
  editor.fire('change');
  editor.save();
}, convertedHtml);
```

Direct iframe `innerHTML` can look correct while Inkstone still shows `0 words`; it is not proof that the application captured the content.

Wait for both `globalThis.tinymce?.activeEditor` and the editor iframe's editable body. If either is absent, wait for the editor to initialize rather than retrying insertion immediately.

Even with TinyMCE events, Inkstone's visible counter may remain `0 words` on the create page. Save as a draft first. The edit page must then show a nonzero count. Inkstone's word count may differ slightly from the local CLI because the tokenization rules differ.

## Pre-save verification

Inspect the editor and confirm:

- first sentence equals the local first sentence
- at least one sample from the middle equals the local text
- final sentence equals the local final sentence
- expected `<strong>` count is nonzero when the chapter contains bold Markdown
- scene-break count matches local `---` lines
- bullet count matches local `- ` lines
- title matches frontmatter

After selecting **save**, require all of:

- `Chapter saved!`
- edit URL with `{bookId}/{chapterId}`
- nonzero displayed word count after the edit page loads
- editor still contains the expected first, middle, and last samples

Inkstone counted the verified 2,388-word local chapter as 2,376 words. Treat a difference under 5% as a tokenizer difference when the text samples and formatting counts match. Stop and investigate larger differences.

## Immediate publishing verification

After **Publish** → **confirm**:

- Draft count decreases or remains zero
- Published count increases
- Published tab contains `000N {Title}`
- A publication time is shown

The book summary can temporarily continue to display `0 Chapters`; the Published tab is the authoritative immediate check.

For a published edit, make the replacement on the existing edit URL and select **update**. Never use **CREATE CHAPTER** to revise an existing chapter.
