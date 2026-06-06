import { createEditor, ParagraphNode, TextNode, $getRoot, $createParagraphNode, $createTextNode, $getNodeByKey, $isElementNode } from 'lexical';
import { HeadingNode, $createHeadingNode } from '@lexical/rich-text';

const editor = createEditor({
  nodes: [ParagraphNode, TextNode, HeadingNode],
  onError: (e) => console.error("Editor Error:", e),
});

let keyToTurnInto = '';

editor.update(() => {
  const root = $getRoot();
  const p = $createParagraphNode();
  p.append($createTextNode("Hello World"));
  root.append(p);
  keyToTurnInto = p.getKey();
});

editor.update(() => {
  const node = $getNodeByKey(keyToTurnInto);
  if (!node) { console.log("Node not found!"); return; }
  
  let newNode = $createHeadingNode("h1");
  
  node.replace(newNode, true); // true = include children?
});

editor.getEditorState().read(() => {
  const root = $getRoot();
  console.log("Root children size:", root.getChildren().length);
});
