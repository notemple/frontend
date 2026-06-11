import React, { useState } from 'react';
import { useCollectionStore } from '../store/collectionStore';
import { useUiStore } from '@/shared/store/uiStore';
import { CreateCollectionDialog } from '../components/CreateCollectionDialog';
import { 
  Database, Plus, Folder, Calendar, Book, 
  ArrowRight, Sparkle, SquaresFour, Files, PlusCircle
} from '@phosphor-icons/react';
import { cn } from '@/shared/lib/utils';

interface CollectionsDashboardPageProps {
  paneId: string;
}

export const CollectionsDashboardPage: React.FC<CollectionsDashboardPageProps> = ({ paneId }) => {
  const collections = useCollectionStore(state => state.collections);
  const items = useCollectionStore(state => state.items);
  const openDocument = useUiStore(state => state.openDocument);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const collectionsList = Object.values(collections).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar relative w-full items-center p-8 bg-transparent">
      {/* Background Decorative Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/[0.01] to-transparent pointer-events-none" />
      
      <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-10 pt-8 flex-1 relative z-10">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-border/60 pb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-10 h-10 rounded-sm-sm border border-purple-600 dark:border-purple-900/40 bg-purple-600 dark:bg-purple-950/25 text-white dark:text-purple-400 flex items-center justify-center hover:bg-purple-700 dark:hover:bg-purple-950/40 hover:border-purple-700 dark:hover:text-purple-300 transition-all shadow-sm-sm hover:scale-105 active:scale-95 cursor-pointer relative z-10 shrink-0"
            title="Create Collection"
          >
            <PlusCircle size={20} weight="fill" />
          </button>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">
              Collections
            </h1>
            <p className="text-sm text-muted-foreground/80 font-medium">
              Organize your documents, data tables, and structured databases.
            </p>
          </div>
        </div>

        {/* Collections Cards Grid */}
        {collectionsList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 border border-dashed border-border/80 rounded-2xl bg-muted/10">
            <div className="p-4 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 mb-4 animate-pulse">
              <Database size={32} />
            </div>
            <h3 className="text-base font-semibold text-foreground/90">No collections yet</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs text-center leading-relaxed">
              Create a custom structured database with custom fields to start organizing your books, recipes, projects, or tasks.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-5 flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-all rounded-sm-md cursor-pointer shadow-sm-md"
            >
              <Plus size={14} weight="bold" />
              <span>Get Started</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
            {collectionsList.map((col) => {
              const itemCount = (items[col.id] || []).length;
              const fieldCount = col.fields.length;
              
              // Custom themes using the collection color
              const accentColor = col.color || '#8B5CF6';
              const cardBgStyle = {
                '--col-accent': accentColor,
              } as React.CSSProperties;

              return (
                <div
                  key={col.id}
                  style={cardBgStyle}
                  onClick={() => openDocument(`section-collection-${col.id}`, paneId)}
                  className="group relative flex flex-col justify-between p-4 rounded-xl border border-border/80 bg-background/50 hover:bg-background/90 hover:border-[var(--col-accent)]/50 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer overflow-hidden transform hover:-translate-y-1"
                >
                  {/* Decorative background glow matching color theme */}
                  <div className="absolute top-0 right-0 w-16 h-16 -mr-4 -mt-4 rounded-full blur-2xl opacity-10 group-hover:opacity-25 transition-opacity duration-300 pointer-events-none" style={{ backgroundColor: accentColor }} />
                  
                  <div>
                    {/* Top row: Emoji & Item Count badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-sans leading-none select-none filter drop-shadow-sm transform group-hover:scale-110 transition-transform duration-300">
                        {col.icon || '📚'}
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-muted border border-border/50 text-muted-foreground/90">
                        {itemCount} {itemCount === 1 ? 'row' : 'rows'}
                      </span>
                    </div>

                    {/* Collection Title & Description */}
                    <h3 className="text-sm font-semibold text-foreground font-sans group-hover:text-[var(--col-accent)] transition-colors duration-200 truncate">
                      {col.name}
                    </h3>
                    <p className="text-xs text-muted-foreground/80 line-clamp-2 mt-1 leading-relaxed min-h-[2rem]">
                      {col.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Footer Stats / Properties */}
                  <div className="flex items-center justify-between border-t border-border/40 pt-3 mt-4">
                    <span className="text-[10px] font-medium text-muted-foreground/85 flex items-center gap-1">
                      <Files size={12} className="opacity-70" />
                      <span>{fieldCount} {fieldCount === 1 ? 'property' : 'properties'}</span>
                    </span>
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                      <span>Open</span>
                      <ArrowRight size={12} weight="bold" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      <CreateCollectionDialog
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};
