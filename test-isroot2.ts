import { createEditor, ParagraphNode, TextNode, $getRoot, $createParagraphNode, $isRootNode } from 'lexical';

const editor = createEditor({
  nodes: [ParagraphNode, TextNode],
  onError: (e) => console.error(e),
});

editor.update(() => {
  const root = $getRoot();
  console.log("Is root?", $isRootNode(root));
});
