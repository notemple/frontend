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
  let newNode = $createHeadingNode("h1");
  
  if ($isElementNode(node)) {
    // try appending the children
    newNode.append(...node.getChildren());
  }
  
  node.replace(newNode, true);
  console.log("After replace");
});

editor.getEditorState().read(() => {
  console.log("Root children size:", $getRoot().getChildren().length);
});
