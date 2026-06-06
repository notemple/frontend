import { createEditor, ParagraphNode, TextNode, $getRoot, $createParagraphNode, $createTextNode, $getNearestNodeFromDOMNode } from 'lexical';

// We can't easily test DOM events in JSDOM via this simple script, 
// but we can check if there's any obvious syntax issue.
