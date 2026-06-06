import { createEditor, ParagraphNode, TextNode, $getRoot, $createParagraphNode, $createTextNode, $getNodeByKey, $isElementNode, LexicalNode } from 'lexical';

function cloneNode(node: LexicalNode): LexicalNode {
  const nodeClass = node.constructor as any
  const clone = nodeClass.clone(node)
  if ($isElementNode(node) && $isElementNode(clone)) {
    node.getChildren().forEach((child) => {
      clone.append(cloneNode(child))
    })
  }
  return clone
}

const editor = createEditor({
  nodes: [ParagraphNode, TextNode],
  onError: (e) => console.error(e),
});

editor.update(() => {
  const root = $getRoot();
  const p = $createParagraphNode();
  p.append($createTextNode("Hello"));
  root.append(p);
  
  try {
    const clone = cloneNode(p);
    p.insertAfter(clone);
    console.log("Clone success");
  } catch (e) {
    console.error("Clone failed", e);
  }
});
