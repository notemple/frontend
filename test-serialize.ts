import { createEditor, ParagraphNode, $createParagraphNode, $getRoot, ElementNode } from 'lexical';

const editor = createEditor({
  nodes: [ParagraphNode],
  onError: (e) => console.error(e),
});

editor.update(() => {
  const root = $getRoot();
  const p = $createParagraphNode();
  root.append(p);
  // simulate setStyle
  (p as ElementNode).setStyle("background-color: red;");
}, { discrete: true });

const state = editor.getEditorState();
console.log(JSON.stringify(state.toJSON(), null, 2));
