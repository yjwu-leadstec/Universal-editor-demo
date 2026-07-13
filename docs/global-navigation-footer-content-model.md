# Global Navigation and Footer Content Model

## Content Model: Nav Fragment

### Page Structure

| Section | Semantic content |
| --- | --- |
| Brand | A linked Li Auto logo image. The image alt text supplies the accessible brand label. |
| Primary navigation | One top-level unordered list. Each top-level item contains a link. Items with a dropdown also contain a nested list. An emphasized list item starts an optional group; linked list items are cards. Card links may contain one or two images, a strong title, subtitle text, and optional emphasized CTA text. |
| Tools | A language link. The header presents this as the globe control while retaining the authored label and URL. |

### How It Works

The top-level list is a collection of primary navigation items. A nested list turns that item into an expandable panel. Within a nested list, an unlinked emphasized item names a group, while each linked item becomes a panel card. The same markup remains readable before decoration.

EDS may normalize a single authored card into several sibling paragraphs whose anchors repeat the same URL (for example, one paragraph per image and one paragraph for title/subtitle/CTA). The block treats those siblings inside the same list item as one logical card.

### Key Points

- The first image in a card is treated as its background when two images are supplied; the second is the foreground vehicle image.
- With one image, the image is rendered as a normal card image.
- Strong text is the card title, normal text is the subtitle, and emphasized text inside the link is the optional CTA label.
- Top-level items without nested lists are ordinary links.
- The fragment can be selected per page with `nav` metadata; fallback is `/nav`.

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

- Uses semantic headings, lists, links, emphasis, and images instead of positional configuration fields.
- Keeps repeating items predictable and author-controlled.
- Does not exceed four cells per row because these fragments use default content rather than table blocks.
- Optional content is inferred from the supplied semantic elements, so authors do not maintain presentation flags.
