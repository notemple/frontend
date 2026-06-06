import { createEditor, ParagraphNode, TextNode, $getRoot, $createParagraphNode, $createTextNode, $getNodeByKey, $isElementNode, $parseSerializedNode } from 'lexical';
import { HeadingNode } from '@lexical/rich-text';

const editor = createEditor({
  nodes: [ParagraphNode, TextNode, HeadingNode],
  onError: (e) => console.error(e),
});

editor.update(() => {
  const root = $getRoot();
  const p = $createParagraphNode();
  p.append($createTextNode("Hello"));
  root.append(p);
  
  try {
    const json = p.exportJSON();
    const clone = $parseSerializedNode(json);
    p.insertAfter(clone);
    console.log("Clone success! Children:", root.getChildren().length);
    console.log("Original key:", p.getKey(), "Clone key:", clone.getKey());
  } catch (e) {
    console.error("Clone failed", e);
  }
});
