import React, { useState, useMemo, useCallback, memo } from 'react';
import type { Collection, CollectionItem, CollectionField, FieldType, CollectionViewState, CollectionFilter, CollectionSort } from '../types';
import { useCollectionStore } from '../store/collectionStore';
import { useDocumentStore } from '@/features/documents/store';
import { useTaskStore } from '@/features/tasks/store';
import { useUiStore } from '@/shared/store/uiStore';
import { ItemDetailModal } from './ItemDetailModal';
import { FieldSettingsModal } from './FieldSettingsModal';
import { RelationPickerDialog } from './RelationPickerDialog';
import { 
  Plus, ArrowUp, ArrowDown, Funnel, Columns, MagnifyingGlass, 
  Trash, Copy, ArrowsOutSimple, Check, X, DotsThreeOutlineVertical, 
  Database, Calendar, CheckSquare, FileText, Tag, Image, TextT
} from '@phosphor-icons/react';
import { cn } from '@/shared/lib/utils';

interface TableViewProps {
  collectionId: string;
}

// ---------------------------------------------------------
// MEMOIZED CELL COMPONENT
// ---------------------------------------------------------
interface TableCellProps {
  field: CollectionField;
  item: CollectionItem;
  collectionId: string;
  onUpdate: (fieldId: string, val: any) => void;
  onOpenDetail: () => void;
  onOpenRelationPicker: (fieldId: string, type: string, relationCollectionId?: string) => void;
}

const TableCell: React.FC<TableCellProps> = memo(({ 
  field, 
  item, 
  collectionId, 
  onUpdate, 
  onOpenDetail,
  onOpenRelationPicker 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const val = item.values[field.id];
  const documents = useDocumentStore(state => state.documents);
  const tasks = useTaskStore(state => state.tasks);
  const collections = useCollectionStore(state => state.collections);

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
    }
  };

  // Render cell content based on field type
  const renderContent = () => {
    if (isEditing) {
      if (field.type === 'checkbox') {
        return (
          <input
            type="checkbox"
            checked={!!val}
            onChange={(e) => onUpdate(field.id, e.target.checked)}
            onBlur={handleBlur}
            autoFocus
            className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
          />
        );
      }
      
      if (field.type === 'select') {
        return (
          <select
            value={val || ''}
            onChange={(e) => {
              onUpdate(field.id, e.target.value || undefined);
              setIsEditing(false);
            }}
            onBlur={handleBlur}
            autoFocus
            className="w-full bg-background border border-border rounded px-1.5 py-0.5 text-xs text-foreground outline-none cursor-pointer"
          >
            <option value="">None</option>
            {field.options?.map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        );
      }

      if (field.type === 'date') {
        return (
          <input
            type="date"
            value={val || ''}
            onChange={(e) => onUpdate(field.id, e.target.value)}
            onBlur={handleBlur}
            autoFocus
            className="w-full bg-background border border-border rounded px-1.5 py-0.5 text-xs text-foreground outline-none cursor-pointer"
          />
        );
      }

      return (
        <input
          type={field.type === 'number' ? 'number' : 'text'}
          value={val !== undefined ? String(val) : ''}
          onChange={(e) => {
            const finalVal = field.type === 'number' 
              ? (e.target.value === '' ? undefined : Number(e.target.value))
              : e.target.value;
            onUpdate(field.id, finalVal);
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full bg-background border border-purple-500/50 rounded px-1.5 py-0.5 text-xs text-foreground outline-none"
        />
      );
    }

    // Default view modes
    if (field.type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={!!val}
          onChange={(e) => onUpdate(field.id, e.target.checked)}
          className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
        />
      );
    }

    if (val === undefined || val === null || val === '') {
      return <span className="text-muted-foreground/30 italic text-[11px]">Empty</span>;
    }

    if (field.type === 'select') {
      const opt = field.options?.find(o => o.id === val);
      if (!opt) return <span className="text-muted-foreground/30 italic text-[11px]">Empty</span>;
      return (
        <span 
          className="px-2 py-0.5 rounded-sm text-[10px] font-semibold border truncate max-w-full"
          style={{ backgroundColor: `${opt.color}15`, borderColor: `${opt.color}35`, color: opt.color }}
        >
          {opt.name}
        </span>
      );
    }

    if (field.type === 'multi-select') {
      const selectedIds = Array.isArray(val) ? val : [];
      if (selectedIds.length === 0) return <span className="text-muted-foreground/30 italic text-[11px]">Empty</span>;
      return (
        <div className="flex flex-wrap gap-1 max-w-full overflow-hidden truncate">
          {selectedIds.map(optId => {
            const opt = field.options?.find(o => o.id === optId);
            if (!opt) return null;
            return (
              <span
                key={optId}
                className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold border"
                style={{ backgroundColor: `${opt.color}12`, borderColor: `${opt.color}25`, color: opt.color }}
              >
                {opt.name}
              </span>
            );
          })}
        </div>
      );
    }

    if (['document-relation', 'task-relation', 'tag-relation', 'collection-relation'].includes(field.type)) {
      const relationIds = Array.isArray(val) ? val : [];
      if (relationIds.length === 0) return <span className="text-muted-foreground/30 italic text-[11px]">Empty</span>;
      return (
        <div className="flex items-center gap-1 overflow-hidden truncate max-w-full">
          {relationIds.slice(0, 2).map(rId => {
            let label = rId;
            if (field.type === 'document-relation') {
              label = documents[rId]?.title || 'Untitled Doc';
            } else if (field.type === 'task-relation') {
              label = tasks.find(x => x.id === rId)?.title || 'Untitled Task';
            } else if (field.type === 'collection-relation' && field.relationCollectionId) {
              const targetItems = useCollectionStore.getState().items[field.relationCollectionId] || [];
              const targetItem = targetItems.find(x => x.id === rId);
              const targetCol = collections[field.relationCollectionId];
              const displayField = targetCol?.fields[0];
              label = displayField ? String(targetItem?.values[displayField.id] || '') : 'Unnamed Item';
              label = label || 'Unnamed Item';
            }
            return (
              <span 
                key={rId} 
                className="px-1.5 py-0.5 bg-muted/65 border border-border text-[9px] font-semibold text-muted-foreground rounded-sm truncate"
              >
                {label}
              </span>
            );
          })}
          {relationIds.length > 2 && (
            <span className="text-[9px] text-muted-foreground/50">+{relationIds.length - 2}</span>
          )}
        </div>
      );
    }

    if (field.type === 'media') {
      return (
        <div className="flex items-center gap-1.5 truncate max-w-full">
          <Image size={12} className="text-purple-500 shrink-0" />
          <span className="truncate text-xs font-mono text-muted-foreground">{String(val)}</span>
        </div>
      );
    }

    return <span className="truncate text-xs text-foreground/90 font-medium">{String(val)}</span>;
  };

  const handleClick = () => {
    if (['document-relation', 'task-relation', 'tag-relation', 'collection-relation'].includes(field.type)) {
      onOpenRelationPicker(
        field.id,
        field.type,
        field.relationCollectionId
      );
    } else if (field.type === 'multi-select' || field.type === 'rich-text') {
      onOpenDetail();
    } else {
      setIsEditing(true);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={cn(
        "px-3 py-2 border-r border-border/60 flex items-center min-w-0 overflow-hidden truncate h-9 hover:bg-muted/10 transition-colors cursor-pointer select-none",
        field.type === 'checkbox' ? "justify-center" : "justify-start"
      )}
    >
      {renderContent()}
    </div>
  );
}, (prevProps, nextProps) => {
  // Deep comparison logic to check if cell should rerender
  const valChanged = prevProps.item.values[prevProps.field.id] !== nextProps.item.values[nextProps.field.id];
  const fieldChanged = prevProps.field !== nextProps.field;
  return !valChanged && !fieldChanged;
});

TableCell.displayName = 'TableCell';

// ---------------------------------------------------------
// MEMOIZED ROW COMPONENT
// ---------------------------------------------------------
interface TableRowProps {
  item: CollectionItem;
  fields: CollectionField[];
  fieldOrder: string[];
  visibleFields: string[];
  fieldWidths: Record<string, number>;
  collectionId: string;
  onUpdate: (itemId: string, fieldId: string, val: any) => void;
  onDelete: (itemId: string) => void;
  onDuplicate: (itemId: string) => void;
  onOpenDetail: (itemId: string) => void;
  onOpenRelationPicker: (itemId: string, fieldId: string, type: string, relationCollectionId?: string) => void;
}

const TableRow: React.FC<TableRowProps> = memo(({
  item,
  fields,
  fieldOrder,
  visibleFields,
  fieldWidths,
  collectionId,
  onUpdate,
  onDelete,
  onDuplicate,
  onOpenDetail,
  onOpenRelationPicker
}) => {
  const [showRowMenu, setShowRowMenu] = useState(false);

  return (
    <div 
      className="flex items-center group/row border-b border-border/50 hover:bg-muted/20 h-9 shrink-0 relative"
      onMouseLeave={() => setShowRowMenu(false)}
    >
      {/* Row Index / Hover Menu control */}
      <div className="w-12 border-r border-border/60 flex items-center justify-center shrink-0 h-9 relative">
        <span className="text-[10px] text-muted-foreground/45 font-mono group-hover/row:opacity-0">
          {item.id.substring(item.id.length - 3)}
        </span>
        <div className="absolute inset-0 m-auto flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity">
          <button
            onClick={() => setShowRowMenu(!showRowMenu)}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center"
          >
            <DotsThreeOutlineVertical size={13} weight="fill" />
          </button>
        </div>

        {/* Row Operations drop down */}
        {showRowMenu && (
          <div className="absolute top-8 left-2 z-50 bg-background border border-border rounded shadow-sm-lg py-1 min-w-[120px] animate-fadeIn text-[11px] font-semibold text-muted-foreground">
            <button
              onClick={() => {
                onOpenDetail(item.id);
                setShowRowMenu(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 w-full hover:bg-muted text-left hover:text-foreground cursor-pointer"
            >
              <ArrowsOutSimple size={13} />
              Open Detail
            </button>
            <button
              onClick={() => {
                onDuplicate(item.id);
                setShowRowMenu(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 w-full hover:bg-muted text-left hover:text-foreground cursor-pointer"
            >
              <Copy size={13} />
              Duplicate
            </button>
            <button
              onClick={() => {
                onDelete(item.id);
                setShowRowMenu(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 w-full hover:bg-muted text-left text-red-500 hover:bg-red-500/5 cursor-pointer"
            >
              <Trash size={13} />
              Delete Row
            </button>
          </div>
        )}
      </div>

      {/* Render cells in correct order */}
      {fieldOrder
        .filter(fId => visibleFields.includes(fId))
        .map(fId => {
          const field = fields.find(f => f.id === fId);
          if (!field) return null;
          const width = fieldWidths[fId] || 150;
          return (
            <div key={fId} style={{ width: `${width}px` }} className="shrink-0">
              <TableCell
                field={field}
                item={item}
                collectionId={collectionId}
                onUpdate={(fid, val) => onUpdate(item.id, fid, val)}
                onOpenDetail={() => onOpenDetail(item.id)}
                onOpenRelationPicker={(fid, type, relId) => onOpenRelationPicker(item.id, fid, type, relId)}
              />
            </div>
          );
        })}
      
      {/* End spacing cell */}
      <div className="flex-1 min-w-[50px] h-9" />
    </div>
  );
}, (prevProps, nextProps) => {
  // Row will only rerender if the item reference is different,
  // or layout/visibility configuration changes.
  const itemEqual = prevProps.item === nextProps.item;
  const fieldOrderEqual = prevProps.fieldOrder === nextProps.fieldOrder;
  const visibleFieldsEqual = prevProps.visibleFields === nextProps.visibleFields;
  const widthsEqual = prevProps.fieldWidths === nextProps.fieldWidths;
  return itemEqual && fieldOrderEqual && visibleFieldsEqual && widthsEqual;
});

TableRow.displayName = 'TableRow';

// ---------------------------------------------------------
// TABLE VIEW COORDINATOR
// ---------------------------------------------------------
export const TableView: React.FC<TableViewProps> = ({ collectionId }) => {
  const collections = useCollectionStore(state => state.collections);
  const items = useCollectionStore(state => state.items[collectionId] || []);
  const viewStates = useCollectionStore(state => state.viewStates);
  
  const updateItemValue = useCollectionStore(state => state.updateItemValue);
  const deleteItem = useCollectionStore(state => state.deleteItem);
  const duplicateItem = useCollectionStore(state => state.duplicateItem);
  const addItem = useCollectionStore(state => state.addItem);
  const deleteField = useCollectionStore(state => state.deleteField);
  const reorderFields = useCollectionStore(state => state.reorderFields);
  
  const setFilters = useCollectionStore(state => state.setFilters);
  const setSorts = useCollectionStore(state => state.setSorts);
  const setFieldWidths = useCollectionStore(state => state.setFieldWidths);
  const setFieldVisibility = useCollectionStore(state => state.setFieldVisibility);

  const [search, setSearch] = useState('');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<CollectionField | null>(null);
  const [fieldSettingsOpen, setFieldSettingsOpen] = useState(false);
  
  // Filtering states
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  
  // Hiding Columns properties panel state
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);

  const collection = collections[collectionId];
  const viewState = viewStates[collectionId];
  const { fieldOrder, visibleFields, fieldWidths, filters, sorts } = viewState || {};

  // Random color scheme for filter button
  const FILTER_COLOR_SCHEMES = [
    {
      active: "bg-blush-pop/70 dark:bg-blush-pop/20 text-foreground dark:text-blush-pop border-blush-pop dark:border-blush-pop hover:bg-blush-pop/80 dark:hover:bg-blush-pop/35",
      indicator: "bg-blush-pop dark:bg-blush-pop",
      badge: "bg-blush-pop",
    },
    {
      active: "bg-sky-blue/70 dark:bg-sky-blue/20 text-foreground dark:text-sky-blue border-sky-blue dark:border-sky-blue hover:bg-sky-blue/80 dark:hover:bg-sky-blue/35",
      indicator: "bg-sky-blue dark:bg-sky-blue",
      badge: "bg-sky-blue",
    },
    {
      active: "bg-pink-orchid/70 dark:bg-pink-orchid/20 text-foreground dark:text-pink-orchid border-pink-orchid dark:border-pink-orchid hover:bg-pink-orchid/80 dark:hover:bg-pink-orchid/35",
      indicator: "bg-pink-orchid dark:bg-pink-orchid",
      badge: "bg-pink-orchid",
    },
    {
      active: "bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500 dark:border-rose-500 hover:bg-rose-500/15 dark:hover:bg-rose-500/30",
      indicator: "bg-rose-500 dark:bg-rose-400",
      badge: "bg-rose-500",
    },
  ];

  const filterScheme = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < collectionId.length; i++) {
      hash = collectionId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % FILTER_COLOR_SCHEMES.length;
    return FILTER_COLOR_SCHEMES[index];
  }, [collectionId]);

  // Picker states
  const [relationPickerConfig, setRelationPickerConfig] = useState<{
    itemId: string;
    fieldId: string;
    type: 'document-relation' | 'task-relation' | 'tag-relation' | 'collection-relation';
    relationCollectionId?: string;
  } | null>(null);

  // Drag-and-drop state for reordering columns
  const [draggedHeaderId, setDraggedHeaderId] = useState<string | null>(null);

  if (!collection || !viewState) {
    return (
      <div className="py-20 text-center text-xs text-muted-foreground/60">
        Loading view state...
      </div>
    );
  }

  const { fields } = collection;

  // 1. Filter, Search, and Sort items
  const processedItems = useMemo(() => {
    let result = [...items];

    // Filter by text search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(item => {
        return fields.some(f => {
          const val = item.values[f.id];
          return val !== undefined && String(val).toLowerCase().includes(q);
        });
      });
    }

    // Filter by custom criteria
    if (filters && filters.length > 0) {
      result = result.filter(item => {
        return filters.every(f => {
          const val = item.values[f.fieldId];
          const field = fields.find(x => x.id === f.fieldId);
          if (!field) return true;

          switch (f.operator) {
            case 'contains':
              return val !== undefined && String(val).toLowerCase().includes(String(f.value || '').toLowerCase());
            case 'equals':
              return val !== undefined && String(val) === String(f.value || '');
            case 'not-equals':
              return val !== undefined && String(val) !== String(f.value || '');
            case 'isEmpty':
              return val === undefined || val === null || val === '';
            case 'isNotEmpty':
              return val !== undefined && val !== null && val !== '';
            case 'checked':
              return !!val;
            case 'unchecked':
              return !val;
            case 'greaterThan':
              return val !== undefined && Number(val) > Number(f.value || 0);
            case 'lessThan':
              return val !== undefined && Number(val) < Number(f.value || 0);
            default:
              return true;
          }
        });
      });
    }

    // Sort items
    if (sorts && sorts.length > 0) {
      result.sort((a, b) => {
        for (const sort of sorts) {
          const field = fields.find(f => f.id === sort.fieldId);
          if (!field) continue;
          
          let valA = a.values[sort.fieldId];
          let valB = b.values[sort.fieldId];

          if (valA === undefined || valA === null) return 1;
          if (valB === undefined || valB === null) return -1;

          if (field.type === 'number') {
            const numA = Number(valA);
            const numB = Number(valB);
            if (numA !== numB) {
              return sort.direction === 'asc' ? numA - numB : numB - numA;
            }
          } else {
            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();
            if (strA !== strB) {
              return sort.direction === 'asc' 
                ? strA.localeCompare(strB) 
                : strB.localeCompare(strA);
            }
          }
        }
        return 0;
      });
    }

    return result;
  }, [items, fields, search, filters, sorts]);

  // Handle cell updates
  const handleCellUpdate = useCallback((itemId: string, fieldId: string, val: any) => {
    updateItemValue(collectionId, itemId, fieldId, val);
  }, [collectionId, updateItemValue]);

  // Handle column resizing
  const handleColumnResize = (e: React.MouseEvent, fieldId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = fieldWidths[fieldId] || 150;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const newWidth = Math.max(80, startWidth + dx);
      setFieldWidths(collectionId, { [fieldId]: newWidth });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Drag and drop for headers reordering
  const handleHeaderDragStart = (e: React.DragEvent, fieldId: string) => {
    e.dataTransfer.setData('text/plain', fieldId);
    setDraggedHeaderId(fieldId);
  };

  const handleHeaderDrop = (e: React.DragEvent, targetFieldId: string) => {
    e.preventDefault();
    const sourceFieldId = e.dataTransfer.getData('text/plain');
    if (!sourceFieldId || sourceFieldId === targetFieldId) return;

    const newOrder = [...fieldOrder];
    const sourceIndex = newOrder.indexOf(sourceFieldId);
    const targetIndex = newOrder.indexOf(targetFieldId);

    if (sourceIndex > -1 && targetIndex > -1) {
      newOrder.splice(sourceIndex, 1);
      newOrder.splice(targetIndex, 0, sourceFieldId);
      reorderFields(collectionId, newOrder);
    }
    setDraggedHeaderId(null);
  };

  // Toggle sorting on column click
  const handleToggleSort = (fieldId: string) => {
    const existing = sorts.find(s => s.fieldId === fieldId);
    if (!existing) {
      setSorts(collectionId, [{ fieldId, direction: 'asc' }]);
    } else if (existing.direction === 'asc') {
      setSorts(collectionId, [{ fieldId, direction: 'desc' }]);
    } else {
      setSorts(collectionId, []);
    }
  };

  // Add a filter rule
  const handleAddFilter = () => {
    const availableField = fields[0];
    if (!availableField) return;
    const newFilter: CollectionFilter = {
      id: `filter-${Date.now()}`,
      fieldId: availableField.id,
      operator: 'contains',
      value: ''
    };
    setFilters(collectionId, [...(filters || []), newFilter]);
  };

  const handleUpdateFilterRule = (filterId: string, updates: Partial<CollectionFilter>) => {
    const updated = (filters || []).map(f => {
      if (f.id === filterId) {
        const next = { ...f, ...updates };
        // Clean value on operator switch
        if (updates.operator && ['isEmpty', 'isNotEmpty', 'checked', 'unchecked'].includes(updates.operator)) {
          next.value = undefined;
        }
        return next;
      }
      return f;
    });
    setFilters(collectionId, updated);
  };

  const handleDeleteFilterRule = (filterId: string) => {
    setFilters(collectionId, (filters || []).filter(f => f.id !== filterId));
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      
      {/* 1. TABLE VIEW TOOLBAR */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/10 shrink-0 select-none">
        
        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/40 border border-border rounded px-2.5 py-1 text-xs text-muted-foreground w-64 shadow-sm-sm">
            <MagnifyingGlass size={14} className="text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Search rows..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-full text-foreground placeholder-muted-foreground/50"
            />
            {search && (
              <button onClick={() => setSearch('')} className="hover:text-foreground cursor-pointer">
                <X size={12} weight="bold" />
              </button>
            )}
          </div>

          {/* Filter button */}
          <div className="relative">
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-sm-sm border text-xs font-semibold shadow-sm-sm cursor-pointer transition-all duration-250 ease-out outline-none relative hover:border-muted-foreground/30 select-none",
                filters?.length > 0 
                  ? filterScheme.active
                  : "bg-muted/60 text-muted-foreground border-border hover:text-foreground hover:bg-muted/95"
              )}
            >
              <Funnel size={13} />
              <span>Filter</span>
              {filters?.length > 0 && (
                <span className={cn("w-4 h-4 text-white rounded-full flex items-center justify-center text-[9px] font-bold", filterScheme.badge)}>
                  {filters.length}
                </span>
              )}
              {filters?.length > 0 && (
                <div className={cn("absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-sm-full shadow-sm-sm", filterScheme.indicator)} />
              )}
            </button>

            {/* Filter configuration popup overlay */}
            {showFiltersPanel && (
              <div className="absolute top-8 left-0 z-50 bg-background border border-border rounded shadow-sm-lg p-4 w-[400px] animate-fadeIn">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/80">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Filter Rules</span>
                  <button
                    onClick={handleAddFilter}
                    className="text-[10px] font-bold bg-pink-orchid/70 dark:bg-pink-orchid/20 text-foreground dark:text-pink-orchid border-pink-orchid/50 dark:border-pink-orchid/30 hover:bg-pink-orchid/80 dark:hover:bg-pink-orchid/35 px-2 py-0.5 rounded-sm border cursor-pointer transition-all"
                  >
                    + Add Filter
                  </button>
                </div>

                <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar">
                  {(filters || []).map((f) => {
                    const field = fields.find(x => x.id === f.fieldId);
                    return (
                      <div key={f.id} className="flex items-center gap-1.5 bg-muted/15 p-2 border border-border/60 rounded">
                        <select
                          value={f.fieldId}
                          onChange={(e) => handleUpdateFilterRule(f.id, { fieldId: e.target.value })}
                          className="bg-background border border-border text-[11px] px-1.5 py-0.5 rounded outline-none text-foreground/80 cursor-pointer"
                        >
                          {fields.map(x => (
                            <option key={x.id} value={x.id}>{x.name}</option>
                          ))}
                        </select>

                        <select
                          value={f.operator}
                          onChange={(e) => handleUpdateFilterRule(f.id, { operator: e.target.value as any })}
                          className="bg-background border border-border text-[11px] px-1.5 py-0.5 rounded outline-none text-foreground/80 cursor-pointer"
                        >
                          <option value="contains">contains</option>
                          <option value="equals">equals</option>
                          <option value="not-equals">not equals</option>
                          <option value="isEmpty">is empty</option>
                          <option value="isNotEmpty">is not empty</option>
                          {field?.type === 'checkbox' && (
                            <>
                              <option value="checked">checked</option>
                              <option value="unchecked">unchecked</option>
                            </>
                          )}
                          {field?.type === 'number' && (
                            <>
                              <option value="greaterThan">&gt;</option>
                              <option value="lessThan">&lt;</option>
                            </>
                          )}
                        </select>

                        {!['isEmpty', 'isNotEmpty', 'checked', 'unchecked'].includes(f.operator) && (
                          <input
                            type="text"
                            placeholder="Value..."
                            value={f.value || ''}
                            onChange={(e) => handleUpdateFilterRule(f.id, { value: e.target.value })}
                            className="bg-background border border-border text-[11px] px-2 py-0.5 rounded outline-none text-foreground w-20 flex-1"
                          />
                        )}

                        <button
                          onClick={() => handleDeleteFilterRule(f.id)}
                          className="text-muted-foreground hover:text-red-500 transition-colors p-0.5"
                        >
                          <X size={12} weight="bold" />
                        </button>
                      </div>
                    );
                  })}

                  {(filters || []).length === 0 && (
                    <div className="py-8 text-center text-[10px] text-muted-foreground/60 italic">
                      No filter rules set. Click "+ Add Filter" above.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Properties Panel (Hide/Show Columns) */}
          <div className="relative">
            <button
              onClick={() => setShowPropertiesPanel(!showPropertiesPanel)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-sm-sm border text-xs font-semibold shadow-sm-sm cursor-pointer transition-all duration-200 select-none bg-blush-pop/70 dark:bg-blush-pop/20 text-foreground dark:text-blush-pop border-blush-pop/50 dark:border-blush-pop/30 hover:bg-blush-pop/80 dark:hover:bg-blush-pop/35"
            >
              <Columns size={13} />
              <span>Columns</span>
            </button>

            {showPropertiesPanel && (
              <div className="absolute top-8 left-0 z-50 bg-background border border-border rounded shadow-sm-lg p-3 w-56 animate-fadeIn">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2 border-b border-border/80 pb-1">Show/Hide Columns</span>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto no-scrollbar">
                  {fields.map(f => {
                    const isVisible = visibleFields.includes(f.id);
                    const isFirstField = f.id === fields[0]?.id; // Usually name, should not be easily hidden
                    return (
                      <label 
                        key={f.id} 
                        className={cn(
                          "flex items-center gap-2 text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground",
                          isFirstField ? "opacity-50 cursor-not-allowed" : ""
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isVisible}
                          disabled={isFirstField}
                          onChange={(e) => setFieldVisibility(collectionId, f.id, e.target.checked)}
                          className="accent-purple-600 rounded border-border"
                        />
                        <span className="truncate">{f.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side controls: Add Columns & Rows */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedField(null);
              setFieldSettingsOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-sm-sm border text-xs font-semibold shadow-sm-sm cursor-pointer transition-all duration-200 select-none bg-sky-blue/70 dark:bg-sky-blue/20 text-foreground dark:text-sky-blue border-sky-blue/50 dark:border-sky-blue/30 hover:bg-sky-blue/80 dark:hover:bg-sky-blue/35"
          >
            <Plus size={13} weight="bold" />
            Add Field
          </button>

          <button
            onClick={async () => {
              const rowTitle = 'New Item';
              const nameField = fields[0];
              const initVals = nameField ? { [nameField.id]: rowTitle } : {};
              const newItem = await addItem(collectionId, initVals);
              setSelectedRowId(newItem.id);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-sm-sm border text-xs font-semibold shadow-sm-sm cursor-pointer transition-all duration-200 select-none bg-pink-orchid/70 dark:bg-pink-orchid/20 text-foreground dark:text-pink-orchid border-pink-orchid/50 dark:border-pink-orchid/30 hover:bg-pink-orchid/80 dark:hover:bg-pink-orchid/35"
          >
            <Plus size={13} weight="bold" />
            Add Row
          </button>
        </div>
      </div>

      {/* 2. EXQUISITE SPREADSHEET TABLE ENGINE */}
      <div className="flex-1 overflow-auto bg-workspace flex flex-col no-scrollbar">
        <div className="min-w-max flex flex-col">
          
          {/* A. TABLE HEADERS */}
          <div className="flex items-center border-b border-border/80 bg-muted/30 h-9 shrink-0 select-none">
            {/* Index header */}
            <div className="w-12 border-r border-border flex items-center justify-center shrink-0 text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">
              #
            </div>

            {/* Field Headers */}
            {fieldOrder
              .filter(fId => visibleFields.includes(fId))
              .map(fId => {
                const field = fields.find(f => f.id === fId);
                if (!field) return null;
                const width = fieldWidths[fId] || 150;
                const activeSort = sorts.find(s => s.fieldId === fId);

                return (
                  <div
                    key={fId}
                    style={{ width: `${width}px` }}
                    className="flex items-center justify-between border-r border-border shrink-0 h-9 relative px-3 group/header"
                    draggable
                    onDragStart={(e) => handleHeaderDragStart(e, fId)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleHeaderDrop(e, fId)}
                  >
                    <div 
                      onClick={() => handleToggleSort(fId)}
                      className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
                    >
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                        {field.name}
                      </span>
                      {activeSort && (
                        <span>
                          {activeSort.direction === 'asc' 
                            ? <ArrowUp size={11} className="text-purple-500 font-bold" />
                            : <ArrowDown size={11} className="text-purple-500 font-bold" />
                          }
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                      {/* Column settings button */}
                      <button
                        onClick={() => {
                          setSelectedField(field);
                          setFieldSettingsOpen(true);
                        }}
                        className="p-0.5 hover:bg-muted rounded text-muted-foreground/60 hover:text-foreground cursor-pointer flex items-center justify-center shrink-0"
                        title="Edit field settings"
                      >
                        <DotsThreeOutlineVertical size={11} weight="fill" />
                      </button>

                      {/* Column delete button (except if it is the first/name field) */}
                      {field.id !== fields[0]?.id && (
                        <button
                          onClick={async () => {
                            if (confirm(`Are you sure you want to delete column "${field.name}"? This deletes all row data for this field.`)) {
                              await deleteField(collectionId, field.id);
                            }
                          }}
                          className="p-0.5 hover:bg-red-500/10 rounded text-muted-foreground/60 hover:text-red-500 cursor-pointer flex items-center justify-center shrink-0"
                          title="Delete column"
                        >
                          <Trash size={11} />
                        </button>
                      )}
                    </div>

                    {/* Resize Handle */}
                    <div
                      onMouseDown={(e) => handleColumnResize(e, fId)}
                      className="absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize hover:bg-purple-500/30 active:bg-purple-500/50 z-10 transition-colors"
                    />
                  </div>
                );
              })}
            
            {/* Spacing Header */}
            <div className="flex-1 min-w-[50px] h-9" />
          </div>

          {/* B. TABLE ROWS */}
          <div className="flex flex-col">
            {processedItems.map(item => (
              <TableRow
                key={item.id}
                item={item}
                fields={fields}
                fieldOrder={fieldOrder}
                visibleFields={visibleFields}
                fieldWidths={fieldWidths}
                collectionId={collectionId}
                onUpdate={handleCellUpdate}
                onDelete={(itemId) => deleteItem(collectionId, itemId)}
                onDuplicate={(itemId) => duplicateItem(collectionId, itemId)}
                onOpenDetail={setSelectedRowId}
                onOpenRelationPicker={(rowId, fId, type, relColId) => {
                  setRelationPickerConfig({
                    itemId: rowId,
                    fieldId: fId,
                    type: type as any,
                    relationCollectionId: relColId
                  });
                }}
              />
            ))}

            {processedItems.length === 0 && (
              <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
                <Database size={28} className="text-muted-foreground/30 animate-pulse" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-foreground/70">No rows found</span>
                  <span className="text-[10px] text-muted-foreground/50">Add a row or clear your search/filters</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 3. ROW DETAIL SLIDEOUT MODAL */}
      {selectedRowId && (
        <ItemDetailModal
          isOpen={true}
          onClose={() => setSelectedRowId(null)}
          collectionId={collectionId}
          itemId={selectedRowId}
        />
      )}

      {/* 4. FIELD SETTINGS EDITOR MODAL */}
      {fieldSettingsOpen && (
        <FieldSettingsModal
          isOpen={true}
          onClose={() => setFieldSettingsOpen(false)}
          collectionId={collectionId}
          field={selectedField}
        />
      )}

      {/* 5. RELATION PICKER MODAL */}
      {relationPickerConfig && (
        <RelationPickerDialog
          isOpen={true}
          onClose={() => setRelationPickerConfig(null)}
          type={relationPickerConfig.type}
          relationCollectionId={relationPickerConfig.relationCollectionId}
          selectedIds={
            items.find(i => i.id === relationPickerConfig.itemId)?.values[relationPickerConfig.fieldId] || []
          }
          onSelect={(selected) => {
            handleCellUpdate(relationPickerConfig.itemId, relationPickerConfig.fieldId, selected);
          }}
        />
      )}

    </div>
  );
};
