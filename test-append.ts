import { createEditor, ParagraphNode, TextNode, $getRoot, $createParagraphNode } from 'lexical';

const editor = createEditor({
  nodes: [ParagraphNode, TextNode],
  onError: (e) => console.error(e),
});

editor.update(() => {
  const p = $createParagraphNode();
  p.append();
  console.log("Append empty works");
});
