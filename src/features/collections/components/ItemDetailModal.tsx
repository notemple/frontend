import React, { useState } from 'react';
import type { Collection, CollectionItem, CollectionField, FieldType } from '../types';
import { useCollectionStore } from '../store/collectionStore';
import { useDocumentStore } from '@/features/documents/store';
import { useTaskStore } from '@/features/tasks/store';
import { useUiStore } from '@/shared/store/uiStore';
import { RelationPickerDialog } from './RelationPickerDialog';
import { PopupMenu } from '@/shared/ui/PopupMenu';
import { 
  Calendar, CheckSquare, Tag, FileText, Link, 
  Envelope, Phone, Plus, Trash, Database, Article, Image, X
} from '@phosphor-icons/react';
import { cn } from '@/shared/lib/utils';
import { getPastelTextColor } from '../colorUtils';

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string;
  itemId: string;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  isOpen,
  onClose,
  collectionId,
  itemId
}) => {
  const collections = useCollectionStore(state => state.collections);
  const items = useCollectionStore(state => state.items[collectionId] || []);
  const updateItemValue = useCollectionStore(state => state.updateItemValue);
  const deleteItem = useCollectionStore(state => state.deleteItem);

  const documents = useDocumentStore(state => state.documents);
  const tasks = useTaskStore(state => state.tasks);
  const openDocument = useUiStore(state => state.openDocument);
  const activePaneId = useUiStore(state => state.activePaneId);

  const [activePicker, setActivePicker] = useState<{
    fieldId: string;
    type: 'document-relation' | 'task-relation' | 'tag-relation' | 'collection-relation';
    relationCollectionId?: string;
  } | null>(null);

  const collection = collections[collectionId];
  const item = items.find(i => i.id === itemId);

  if (!isOpen || !collection || !item) return null;

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this item?")) {
      await deleteItem(collectionId, itemId);
      onClose();
    }
  };

  const handleUpdateValue = (fieldId: string, val: any) => {
    updateItemValue(collectionId, itemId, fieldId, val);
  };

  const renderRelationBadges = (field: CollectionField, ids: string[]) => {
    if (!Array.isArray(ids) || ids.length === 0) {
      return <span className="text-[11px] text-muted-foreground/60 italic">No relations linked</span>;
    }

    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {ids.map(id => {
          let label = id;
          let icon = <Database size={12} />;
          let onClick: (() => void) | undefined;

          if (field.type === 'document-relation') {
            const doc = documents[id];
            label = doc?.title || 'Untitled Document';
            icon = <FileText size={12} className="text-blue-500" />;
            onClick = () => {
              openDocument(id, activePaneId || undefined);
              onClose();
            };
          } else if (field.type === 'task-relation') {
            const t = tasks.find(x => x.id === id);
            label = t?.title || 'Untitled Task';
            icon = <CheckSquare size={12} className="text-rose-500" />;
            onClick = () => {
              window.dispatchEvent(new CustomEvent('task-editor-open', { detail: { id } }));
            };
          } else if (field.type === 'tag-relation') {
            label = id;
            icon = <Tag size={12} className="text-emerald-500" />;
          } else if (field.type === 'collection-relation' && field.relationCollectionId) {
            const targetCol = collections[field.relationCollectionId];
            const targetItems = useCollectionStore.getState().items[field.relationCollectionId] || [];
            const targetItem = targetItems.find(x => x.id === id);
            const nameField = targetCol?.fields[0];
            label = nameField ? String(targetItem?.values[nameField.id] || '') : 'Unnamed Item';
            label = label || 'Unnamed Item';
            icon = <Database size={12} className="text-purple-500" />;
          }

          return (
            <div
              key={id}
              onClick={onClick}
              className={cn(
                "flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted/65 border border-border text-[11px] font-medium text-foreground/80 hover:text-foreground hover:bg-muted transition-all select-none",
                onClick ? "cursor-pointer" : ""
              )}
            >
              {icon}
              <span className="truncate max-w-[150px]">{label}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateValue(field.id, ids.filter(x => x !== id));
                }}
                className="hover:text-red-500 text-muted-foreground/60 transition-colors cursor-pointer shrink-0 ml-0.5"
              >
                <X size={10} weight="bold" />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  const renderFieldInput = (field: CollectionField) => {
    const value = item.values[field.id];

    switch (field.type) {
      case 'text':
      case 'url':
      case 'email':
      case 'phone':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleUpdateValue(field.id, e.target.value)}
            placeholder={`Enter ${field.name.toLowerCase()}...`}
            className="w-full bg-muted/30 hover:bg-muted/50 border border-border rounded px-3 py-1.5 text-xs text-foreground outline-none focus:border-purple-500/50 focus:bg-background transition-all"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value !== undefined ? String(value) : ''}
            onChange={(e) => {
              const val = e.target.value === '' ? undefined : Number(e.target.value);
              handleUpdateValue(field.id, val);
            }}
            placeholder="0"
            className="w-full bg-muted/30 hover:bg-muted/50 border border-border rounded px-3 py-1.5 text-xs text-foreground outline-none focus:border-purple-500/50 focus:bg-background transition-all"
          />
        );

      case 'date':
        return (
          <div className="flex items-center gap-2 bg-muted/30 hover:bg-muted/50 border border-border rounded px-3 py-1.5 transition-all">
            <Calendar size={14} className="text-muted-foreground" />
            <input
              type="date"
              value={value || ''}
              onChange={(e) => handleUpdateValue(field.id, e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-foreground w-full cursor-pointer"
            />
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleUpdateValue(field.id, e.target.checked)}
              className="w-4 h-4 accent-purple-600 rounded border-border cursor-pointer"
            />
            <span className="text-[11px] text-muted-foreground">{value ? 'Checked' : 'Unchecked'}</span>
          </div>
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleUpdateValue(field.id, e.target.value || undefined)}
            className="bg-muted/30 hover:bg-muted/50 border border-border rounded px-3 py-1.5 text-xs w-full outline-none text-foreground cursor-pointer focus:border-purple-500/50 transition-all"
          >
            <option value="">Select option...</option>
            {field.options?.map(opt => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        );

      case 'multi-select': {
        const selectedIds = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-1">
              {selectedIds.map(optId => {
                const opt = field.options?.find(o => o.id === optId);
                if (!opt) return null;
                return (
                  <div
                    key={optId}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-semibold border text-[var(--tag-color)] dark:text-[var(--tag-color-dark)]"
                    style={{
                      // @ts-ignore
                      '--tag-color': getPastelTextColor(opt.color).light,
                      '--tag-color-dark': getPastelTextColor(opt.color).dark,
                      backgroundColor: `${opt.color}25`,
                      borderColor: `${opt.color}50`
                    }}
                  >
                    <span>{opt.name}</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateValue(field.id, selectedIds.filter(x => x !== optId))}
                      className="hover:opacity-75 transition-opacity cursor-pointer shrink-0"
                    >
                      <X size={10} weight="bold" />
                    </button>
                  </div>
                );
              })}
            </div>
            <select
              value=""
              onChange={(e) => {
                const addId = e.target.value;
                if (addId && !selectedIds.includes(addId)) {
                  handleUpdateValue(field.id, [...selectedIds, addId]);
                }
                e.target.value = "";
              }}
              className="bg-muted/30 hover:bg-muted/50 border border-border rounded px-2.5 py-1 text-[11px] outline-none text-muted-foreground cursor-pointer transition-all"
            >
              <option value="">+ Add Option...</option>
              {field.options?.filter(o => !selectedIds.includes(o.id)).map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
        );
      }

      case 'document-relation':
      case 'task-relation':
      case 'tag-relation':
      case 'collection-relation': {
        const selectedIds = Array.isArray(value) ? value : [];
        return (
          <div className="flex flex-col gap-1">
            {renderRelationBadges(field, selectedIds)}
            <button
              type="button"
              onClick={() => setActivePicker({
                fieldId: field.id,
                type: field.type as any,
                relationCollectionId: field.relationCollectionId
              })}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 px-2.5 py-1 self-start rounded mt-1.5 transition-colors cursor-pointer border border-transparent hover:border-purple-500/20"
            >
              <Plus size={12} weight="bold" />
              Link Items
            </button>
          </div>
        );
      }

      case 'media':
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleUpdateValue(field.id, e.target.value)}
              placeholder="Paste image URL..."
              className="w-full bg-muted/30 hover:bg-muted/50 border border-border rounded px-3 py-1.5 text-xs text-foreground outline-none focus:border-purple-500/50 focus:bg-background transition-all"
            />
            {value && (
              <div className="relative border border-border rounded overflow-hidden max-h-[140px] w-full flex items-center justify-center bg-muted/20">
                <img src={value} alt="Preview" className="max-h-[140px] object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
            )}
          </div>
        );

      case 'rich-text':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleUpdateValue(field.id, e.target.value)}
            placeholder="Type long formatted note content..."
            rows={4}
            className="w-full bg-muted/30 hover:bg-muted/50 border border-border rounded px-3 py-2 text-xs text-foreground outline-none focus:border-purple-500/50 focus:bg-background transition-all resize-y font-sans leading-relaxed"
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <PopupMenu
        isOpen={isOpen}
        onClose={onClose}
        variant="slideout"
        className="collection-pastel-popup"
        backdropClassName="backdrop-blur-[2px]"
        header={
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0 bg-muted/10">
            <div className="flex items-center gap-2">
              <span className="text-lg">{collection.icon}</span>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground/90 uppercase tracking-wider">{collection.name} Item</span>
                <span className="text-[10px] text-muted-foreground/60">ID: {item.id.replace('item-', '')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  openDocument(`section-collection-${collectionId}`, activePaneId || undefined);
                  onClose();
                }}
                className="px-2 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-[10px] font-bold text-purple-600 dark:text-purple-400 transition-colors flex items-center gap-1 cursor-pointer border border-purple-500/15 mr-2 shadow-sm-sm"
                title="Navigate to full collection page"
              >
                <Database size={11} />
                Open Collection
              </button>
              <button
                onClick={handleDelete}
                className="text-muted-foreground hover:text-red-500 p-2 rounded hover:bg-red-500/5 transition-all cursor-pointer"
                title="Delete Item"
              >
                <Trash size={16} />
              </button>
              <button 
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground p-2 rounded hover:bg-muted/80 transition-all cursor-pointer border border-border"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        }
      >
        {/* Loop over fields */}
        {collection.fields.map((field) => {
          const isNameField = field.id === 'f-title' || field.id === collection.fields[0]?.id;
          
          return (
            <div key={field.id} className="flex flex-col gap-2 border-b border-border/40 pb-4 last:border-b-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {field.name}
                </span>
                {field.required && (
                  <span className="text-[10px] text-red-500 font-semibold" title="Required">*</span>
                )}
              </div>
              <div>{renderFieldInput(field)}</div>
            </div>
          );
        })}
      </PopupMenu>

      {/* Picker Dialog wrapper */}
      {activePicker && (
        <RelationPickerDialog
          isOpen={true}
          onClose={() => setActivePicker(null)}
          type={activePicker.type}
          relationCollectionId={activePicker.relationCollectionId}
          selectedIds={item.values[activePicker.fieldId] || []}
          onSelect={(selected) => handleUpdateValue(activePicker.fieldId, selected)}
        />
      )}
    </>
  );
};
