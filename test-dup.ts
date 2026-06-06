import { createEditor, ParagraphNode, TextNode, $getRoot, $createParagraphNode, $createTextNode, $getNodeByKey, $isElementNode, $parseSerializedNode } from 'lexical';

const editor = createEditor({
  nodes: [ParagraphNode, TextNode],
  onError: (e) => console.error(e),
});

let pKey = '';

editor.update(() => {
  const root = $getRoot();
  const p = $createParagraphNode();
  p.append($createTextNode("Hello"));
  root.append(p);
  pKey = p.getKey();
});

editor.update(() => {
  const node = $getNodeByKey(pKey);
  const clone = $parseSerializedNode(node.exportJSON());
  node.insertAfter(clone);
  console.log("Clone inserted!", clone.isAttached());
});

editor.getEditorState().read(() => {
  console.log("Root children size:", $getRoot().getChildren().length);
});
