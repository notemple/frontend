import { DexieDocumentStorage } from "./dexie/document.storage";
import { DexieFolderStorage } from "./dexie/folder.storage";
import { DexieMetadataStorage } from "./dexie/metadata.storage";
import { DexieTaskStorage } from "./dexie/task.storage";
import { DexieCollectionStorage } from "./collections/dexie/collections.storage";
import { DexieCollectionFieldStorage } from "./collections/dexie/collectionFields.storage";
import { DexieCollectionItemStorage } from "./collections/dexie/collectionItems.storage";

export const storage = {
  documents: new DexieDocumentStorage(),
  tasks: new DexieTaskStorage(),
  folders: new DexieFolderStorage(),
  metadata: new DexieMetadataStorage(),
  collections: new DexieCollectionStorage(),
  collectionFields: new DexieCollectionFieldStorage(),
  collectionItems: new DexieCollectionItemStorage()
};

export * from "./core/types";
export * from "./collections/types";

