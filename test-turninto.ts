import { createEditor, ParagraphNode, TextNode, $getRoot, $createParagraphNode, $createTextNode, $getNodeByKey, $isElementNode } from 'lexical';
import { HeadingNode, $createHeadingNode } from '@lexical/rich-text';

const editor = createEditor({
  nodes: [ParagraphNode, TextNode, HeadingNode],
  onError: (e) => console.error(e),
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
  
  // Try to append children
  if ($isElementNode(node)) {
    const children = node.getChildren();
    // In Lexical, appending an existing node moves it. Let's just move them!
    children.forEach((child) => {
      newNode.append(child);
    });
  }
  
  node.replace(newNode);
});

editor.getEditorState().read(() => {
  const root = $getRoot();
  console.log(root.getTextContent());
  console.log(root.getChildren()[0].getType());
});
