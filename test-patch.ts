import { createEditor, ParagraphNode, $createParagraphNode, $getRoot, ElementNode } from 'lexical';

const originalExportJSON = ElementNode.prototype.exportJSON;
ElementNode.prototype.exportJSON = function () {
  const json = originalExportJSON.call(this) as any;
  if ((this as any).__style) {
    json.style = (this as any).__style;
  }
  return json;
};

const originalUpdateFromJSON = ElementNode.prototype.updateFromJSON;
ElementNode.prototype.updateFromJSON = function (serializedNode: any) {
  const node = originalUpdateFromJSON.call(this, serializedNode) as any;
  if (serializedNode.style) {
    node.setStyle(serializedNode.style);
  }
  return node;
};

const editor = createEditor({
  nodes: [ParagraphNode],
  onError: (e) => console.error(e),
});

let stateJSON;

editor.update(() => {
  const root = $getRoot();
  const p = $createParagraphNode();
  root.append(p);
  (p as ElementNode).setStyle("background-color: blue;");
}, { discrete: true });

stateJSON = editor.getEditorState().toJSON();
console.log("Exported JSON:");
console.log(JSON.stringify(stateJSON, null, 2));

const editor2 = createEditor({
  nodes: [ParagraphNode],
  onError: (e) => console.error(e),
});

const parsed = editor2.parseEditorState(stateJSON);
editor2.setEditorState(parsed);
console.log("Parsed state root children length:", parsed._nodeMap.size);
console.log("Successfully restored!");
