import React, { useState, useEffect } from 'react';
import type { CollectionField, FieldType, CollectionFieldOption } from '../types';
import { useCollectionStore } from '../store/collectionStore';
import { Plus, Trash, DotsSixVertical, Check } from '@phosphor-icons/react';
import { PopupMenu } from '@/shared/ui/PopupMenu';

interface FieldSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string;
  field: CollectionField | null; // null if creating a new field
}

const FIELD_TYPES: { type: FieldType; label: string; description: string }[] = [
  { type: 'text', label: 'Text', description: 'Plain text field' },
  { type: 'number', label: 'Number', description: 'Numeric values' },
  { type: 'date', label: 'Date', description: 'Calendar date picker' },
  { type: 'checkbox', label: 'Checkbox', description: 'Yes/No checkbox' },
  { type: 'select', label: 'Select', description: 'Single option selection list' },
  { type: 'multi-select', label: 'Multi-select', description: 'Select multiple tag options' },
  { type: 'url', label: 'URL', description: 'Web addresses / links' },
  { type: 'email', label: 'Email', description: 'Email address validation' },
  { type: 'phone', label: 'Phone', description: 'Telephone numbers' },
  { type: 'document-relation', label: 'Document Relation', description: 'Link system Documents' },
  { type: 'task-relation', label: 'Task Relation', description: 'Link system Tasks' },
  { type: 'tag-relation', label: 'Tag Relation', description: 'Link system Tags' },
  { type: 'collection-relation', label: 'Collection Relation', description: 'Link rows from another database' },
  { type: 'media', label: 'Media', description: 'Images and files' },
  { type: 'rich-text', label: 'Rich Text', description: 'Formatted long-form text' }
];

const PASTEL_COLORS = [
  { name: 'Gray', hex: '#E2E8F0', text: '#475569' },
  { name: 'Red', hex: '#FEE2E2', text: '#B91C1C' },
  { name: 'Orange', hex: '#FFEDD5', text: '#C2410C' },
  { name: 'Yellow', hex: '#FEF3C7', text: '#B45309' },
  { name: 'Green', hex: '#D1FAE5', text: '#047857' },
  { name: 'Blue', hex: '#DBEAFE', text: '#1D4ED8' },
  { name: 'Purple', hex: '#F3E8FF', text: '#6D28D9' },
  { name: 'Pink', hex: '#FCE7F3', text: '#BE185D' }
];

export const FieldSettingsModal: React.FC<FieldSettingsModalProps> = ({
  isOpen,
  onClose,
  collectionId,
  field
}) => {
  const collections = useCollectionStore(state => state.collections);
  const addField = useCollectionStore(state => state.addField);
  const updateField = useCollectionStore(state => state.updateField);

  const [name, setName] = useState('');
  const [type, setType] = useState<FieldType>('text');
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState<CollectionFieldOption[]>([]);
  const [relationCollectionId, setRelationCollectionId] = useState<string>('');
  const [showColorPickerForId, setShowColorPickerForId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (field) {
        setName(field.name);
        setType(field.type);
        setRequired(field.required);
        setOptions(field.options || []);
        setRelationCollectionId(field.relationCollectionId || '');
      } else {
        setName('');
        setType('text');
        setRequired(false);
        setOptions([]);
        setRelationCollectionId('');
      }
      setShowColorPickerForId(null);
    }
  }, [isOpen, field]);

  if (!isOpen) return null;

  const handleAddOption = () => {
    const id = `opt-${crypto.randomUUID()}`;
    const randomColor = PASTEL_COLORS[options.length % PASTEL_COLORS.length];
    setOptions([...options, { id, name: `Option ${options.length + 1}`, color: randomColor.hex }]);
  };

  const handleUpdateOptionName = (id: string, newName: string) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, name: newName } : opt));
  };

  const handleUpdateOptionColor = (id: string, hex: string) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, color: hex } : opt));
    setShowColorPickerForId(null);
  };

  const handleDeleteOption = (id: string) => {
    setOptions(options.filter(opt => opt.id !== id));
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    const savedOptions = (type === 'select' || type === 'multi-select') ? options : undefined;
    const savedRelationId = (type === 'collection-relation') ? relationCollectionId : undefined;

    if (field) {
      // Edit existing
      await updateField(collectionId, field.id, {
        name: name.trim(),
        type,
        required,
        options: savedOptions,
        relationCollectionId: savedRelationId
      });
    } else {
      // Add new
      await addField(collectionId, name.trim(), type, required, savedOptions, savedRelationId);
    }

    onClose();
  };

  const isSelectType = type === 'select' || type === 'multi-select';
  const isRelationType = type === 'collection-relation';

  return (
    <PopupMenu
      isOpen={isOpen}
      onClose={onClose}
      title={field ? `Edit Field: ${field.name}` : 'Create New Field'}
      variant="center"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded bg-muted hover:bg-muted/80 text-xs font-semibold text-muted-foreground transition-all cursor-pointer border border-border"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || (isRelationType && !relationCollectionId)}
            className="px-3.5 py-1.5 rounded bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-white transition-all cursor-pointer shadow-sm-sm"
          >
            Save Field
          </button>
        </>
      }
    >
          {/* Field Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Field Name</label>
            <input
              type="text"
              placeholder="e.g. Status, Due Date, Budget..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-muted/30 border border-border rounded px-3 py-2 text-sm w-full outline-none text-foreground focus:border-purple-500/50 transition-colors"
              autoFocus
            />
          </div>

          {/* Field Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Field Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as FieldType)}
              className="bg-muted/30 border border-border rounded px-3 py-2 text-sm w-full outline-none text-foreground focus:border-purple-500/50 transition-colors cursor-pointer"
            >
              {FIELD_TYPES.map(ft => (
                <option key={ft.type} value={ft.type} className="bg-background text-foreground">
                  {ft.label}
                </option>
              ))}
            </select>
          </div>

          {/* Required constraint toggle */}
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground/90">Required Field</span>
              <span className="text-[10px] text-muted-foreground/80 mt-0.5">Force a value to be set for this column</span>
            </div>
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="w-4 h-4 accent-purple-600 rounded border-border cursor-pointer"
            />
          </div>

          {/* Relation settings */}
          {isRelationType && (
            <div className="flex flex-col gap-1.5 p-3 rounded bg-purple-500/5 border border-purple-500/10">
              <label className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Target Database</label>
              <select
                value={relationCollectionId}
                onChange={(e) => setRelationCollectionId(e.target.value)}
                className="bg-muted/30 border border-border rounded px-3 py-2 text-sm w-full outline-none text-foreground focus:border-purple-500/50 transition-colors cursor-pointer"
              >
                <option value="">Select a collection...</option>
                {Object.values(collections)
                  .filter(c => c.id !== collectionId)
                  .map(c => (
                    <option key={c.id} value={c.id} className="bg-background text-foreground">
                      {c.icon} {c.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Select & Multi-select Options builder */}
          {isSelectType && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Options</label>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 px-2 py-1 rounded transition-colors cursor-pointer"
                >
                  <Plus size={12} weight="bold" />
                  Add Option
                </button>
              </div>

              <div className="space-y-1.5 max-h-[200px] overflow-y-auto no-scrollbar border border-border/60 rounded p-2 bg-muted/10">
                {options.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-2 bg-background border border-border/80 rounded px-2.5 py-1.5 relative">
                    <DotsSixVertical size={14} className="text-muted-foreground/45 cursor-grab shrink-0" />
                    
                    {/* Color bubble */}
                    <button
                      type="button"
                      onClick={() => setShowColorPickerForId(showColorPickerForId === opt.id ? null : opt.id)}
                      className="w-4 h-4 rounded-sm-full border border-border/80 cursor-pointer shrink-0 transition-transform hover:scale-110"
                      style={{ backgroundColor: opt.color }}
                      title="Change color"
                    />

                    {/* Option Text */}
                    <input
                      type="text"
                      value={opt.name}
                      onChange={(e) => handleUpdateOptionName(opt.id, e.target.value)}
                      className="bg-transparent border-none outline-none text-xs w-full text-foreground/90 font-medium"
                    />

                    {/* Delete option */}
                    <button
                      type="button"
                      onClick={() => handleDeleteOption(opt.id)}
                      className="text-muted-foreground hover:text-red-500 p-0.5 rounded transition-colors cursor-pointer"
                    >
                      <Trash size={14} />
                    </button>

                    {/* Simple Color dropdown overlay */}
                    {showColorPickerForId === opt.id && (
                      <div className="absolute top-8 left-6 z-50 bg-background border border-border rounded shadow-sm-md p-1.5 grid grid-cols-4 gap-1 w-[120px] animate-fadeIn">
                        {PASTEL_COLORS.map(c => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => handleUpdateOptionColor(opt.id, c.hex)}
                            className="w-5 h-5 rounded-sm-full border border-border/80 hover:scale-110 transition-transform cursor-pointer relative"
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          >
                            {opt.color === c.hex && (
                              <Check size={10} className="absolute inset-0 m-auto text-zinc-950 font-bold" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {options.length === 0 && (
                  <div className="py-6 text-center text-[11px] text-muted-foreground/60">
                    No options defined. Click "Add Option" above.
                  </div>
                )}
              </div>
            </div>
          )}
    </PopupMenu>
  );
};
