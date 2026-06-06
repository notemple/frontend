import { createEditor, ParagraphNode, TextNode, $getRoot, $createParagraphNode, $createTextNode } from 'lexical';

const editor = createEditor({
  nodes: [ParagraphNode, TextNode],
  onError: (e) => console.error(e),
});

editor.update(() => {
  const root = $getRoot();
  const p = $createParagraphNode();
  root.append(p);
  
  // @ts-ignore
  console.log("isRoot exists on root:", typeof root.isRoot === 'function');
  // @ts-ignore
  console.log("isRoot exists on para:", typeof p.isRoot === 'function');
});
