import { DexieDocumentStorage } from "./dexie/document.storage";
import { DexieTaskStorage } from "./dexie/task.storage";
import { DexieFolderStorage } from "./dexie/folder.storage";
import { DexieMetadataStorage } from "./dexie/metadata.storage";

export const storage = {
  documents: new DexieDocumentStorage(),
  tasks: new DexieTaskStorage(),
  folders: new DexieFolderStorage(),
  metadata: new DexieMetadataStorage()
};

export * from "./core/types";
