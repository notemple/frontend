import { createEditor, ParagraphNode, TextNode, $getRoot, $createParagraphNode, $createTextNode, $getNodeByKey, $isElementNode } from 'lexical';
import { HeadingNode, $createHeadingNode } from '@lexical/rich-text';

const editor = createEditor({
  nodes: [ParagraphNode, TextNode, HeadingNode],
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
  const h1 = $createHeadingNode("h1");
  node.replace(h1, true); // true = include children!
  console.log("Replaced using replace(..., true)");
});

editor.getEditorState().read(() => {
  console.log("Root children types:", $getRoot().getChildren().map(n => n.getType()));
});
