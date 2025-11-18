export default function decorate(block) {
  const [quoteWrapper] = block.children;

  const blockquote = document.createElement('blockquote');
  blockquote.textContent = quoteWrapper.textContent.trim();
  quoteWrapper.replaceChildren(blockquote);

  const author = document.createElement('p');
  author.textContent = quoteWrapper.textContent.trim();
  quoteWrapper.appendChild(author);
}
