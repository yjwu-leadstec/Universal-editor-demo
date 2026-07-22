# Global Navigation and Footer Content Model

## Content Model: Nav Fragment

### Page Structure

| Section | Semantic content |
| --- | --- |
| Brand | A linked Li Auto logo image. The image alt text supplies the accessible brand label. |
| Primary navigation | A `header-navigation` container with ordered `header-navigation-top`, `header-navigation-group`, and `header-navigation-card` items. The legacy nested unordered list remains a migration fallback. |
| Tools | A language link. The header presents this as the globe control while retaining the authored label and using the URL for the Global English option. |

### How It Works

Each Main Navigation Link starts a new primary entry. Following Dropdown Section Heading and Dropdown Link Card items belong to that entry until the next Main Navigation Link. This flat container/item pattern avoids nested multi-fields and lets authors add, duplicate, remove, and reorder items from the Universal Editor content tree.

On the nav source page, Universal Editor shows every item as a flat editing card with its item type, order, target, and missing-field state. Select exactly one card and open Properties to edit it. The nested semantic list exists only as a delivery projection, so it cannot trap or duplicate item selection in the editor.

EDS may normalize a single authored card into several sibling paragraphs whose anchors repeat the same URL (for example, one paragraph per image and one paragraph for title/subtitle/CTA). The block treats those siblings inside the same list item as one logical card.

### Key Points

- Main Navigation Link and Dropdown Link Card targets use `aem-content` with `rootPath=/content/demo-site`, so authors select internal Sites pages with the folder button instead of typing paths.
- The first selected card image is treated as its background; the second optional image is the foreground vehicle wordmark.
- With one image, the image is rendered as a normal card image.
- Card title and description are separate short fields; the shared CTA label is configured once on the Header Navigation container.
- Top-level items without nested lists are ordinary links.
- The fragment resolves from the current language root and can be overridden safely with page `nav` metadata.
- If no valid structured container exists, the parser continues to accept the previous semantic nested list during migration.

## Content Model: Footer Fragment

### Page Structure

| Section | Semantic content |
| --- | --- |
| Navigation | Repeating heading followed by unordered list. Each heading/list pair becomes one footer column. |
| Legal | Paragraphs containing legal links or plain copyright text. They may share the same section as the heading/list pairs or live in a following section. |

### How It Works

The footer navigation is a collection model expressed as semantic default content. Authors add or remove columns by adding or removing heading/list pairs. Desktop renders the pairs as columns; mobile reuses the same content as accordion items.

### Key Points

- Headings are required for columns; an absent or empty list omits the column.
- Links remain in authored order.
- Legal links and copyright text are optional and render only when present.
- The fragment can be selected per page with `footer` metadata; fallback is `/footer`.

## Best-Practice Validation

- Uses a supported container + item pattern instead of an unstable nested multi-field.
- Keeps repeating items predictable and author-controlled.
- Every child item contains at most four fields.
- Internal destinations use the AEM Sites content picker; assets use the DAM reference picker.
