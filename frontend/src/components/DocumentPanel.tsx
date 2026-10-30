import { useEffect } from 'react';
import { Database } from 'lucide-react';
import UploadZone from './UploadZone';
import DocumentCard from './DocumentCard';
import { EmptyStateUpload } from './EmptyState';
import type { DocumentInfo } from '../types';
import { useAppSettings } from '../appSettings';

interface Props {
  documents: DocumentInfo[];
  uploading: boolean;
  onUploadComplete: (results: any[]) => void;
  onDelete: (id: string) => Promise<any>;
  onReplace: (id: string, doc: DocumentInfo) => void;
  onRefresh: () => Promise<any>;
}

export default function DocumentPanel({ documents, uploading, onUploadComplete, onDelete, onReplace, onRefresh }: Props) {
  const { t } = useAppSettings();
  useEffect(() => {
    onRefresh();
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Panel header */}
      <div className="flex-shrink-0 flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4" style={{ color: "var(--text-strong)" }} />
          <h2
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-secondary)", letterSpacing: '0.05em' }}
          >
            {t('doc.kb')}
          </h2>
        </div>
        {documents.length > 0 && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: 'var(--surface-muted)',
              color: "var(--text-secondary)",
            }}
          >
            {documents.length} {t('common.sources')}
          </span>
        )}
      </div>

      {/* Upload zone */}
      <div className="mb-4">
        <UploadZone onUploadComplete={onUploadComplete} uploading={uploading} />
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
        {documents.length === 0 ? (
          <EmptyStateUpload />
        ) : (
          <div className="space-y-2">
            {documents.map((doc, i) => (
              <div key={doc.id} style={{ animationDelay: `${i * 50}ms` }}>
                <DocumentCard doc={doc} onDelete={onDelete} onReplace={onReplace} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
