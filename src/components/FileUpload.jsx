import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FileText,
  Image,
  File,
  X,
  Paperclip,
  AlertCircle,
} from 'lucide-react';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/markdown',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
];

const ACCEPT_STRING = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.csv,.png,.jpg,.jpeg,.webp,.svg';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

function getFileIcon(type) {
  if (type?.startsWith('image/')) return Image;
  if (type?.includes('pdf') || type?.includes('word') || type?.includes('document') || type?.includes('excel') || type?.includes('spreadsheet')) return FileText;
  return File;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function FileUpload({ files, onFilesAdd, onFileRemove }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);

  const processFiles = useCallback((fileList) => {
    const valid = [];
    const errors = [];

    Array.from(fileList).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name} 超过 20MB 限制`);
        return;
      }
      // Accept based on extension if MIME type is missing (some browsers)
      const ext = file.name.split('.').pop()?.toLowerCase();
      const allowedExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'md', 'csv', 'png', 'jpg', 'jpeg', 'webp', 'svg'];
      if (!ACCEPTED_TYPES.includes(file.type) && !allowedExts.includes(ext)) {
        errors.push(`${file.name} 格式不支持`);
        return;
      }
      // Avoid duplicates by name+size
      const exists = files.some((f) => f.name === file.name && f.size === file.size);
      if (exists) return;
      valid.push(file);
    });

    if (valid.length > 0) {
      onFilesAdd(valid);
    }
  }, [files, onFilesAdd]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files?.length) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleClick = () => inputRef.current?.click();

  const handleInputChange = (e) => {
    if (e.target.files?.length) {
      processFiles(e.target.files);
      e.target.value = ''; // reset so same file can be re-added
    }
  };

  return (
    <section className="panel-section" data-component="File Upload" data-od-id="file-upload">
      <div className="panel-section-header">
        <Paperclip size={14} style={{ color: 'var(--fg-muted)' }} />
        <span className="section-label">需求文件</span>
      </div>
      <p className="section-hint">上传 PRD、设计稿、截图等文件辅助生成</p>

      {/* Drop zone */}
      <div
        className={`file-dropzone${isDragOver ? ' drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        aria-label="点击或拖拽上传文件"
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_STRING}
          onChange={handleInputChange}
          className="sr-only"
          aria-hidden="true"
        />
        <Upload size={20} style={{ color: 'var(--fg-muted)' }} />
        <span className="file-dropzone-text">
          {isDragOver ? '松开即可上传' : '拖拽文件到此处，或点击选择'}
        </span>
        <span className="file-dropzone-hint">
          支持 PDF、Word、Excel、TXT、Markdown、图片，单文件 ≤ 20MB
        </span>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="file-list">
          {files.map((file, index) => {
            const Icon = getFileIcon(file.type);
            return (
              <div key={`${file.name}-${index}`} className="file-item">
                <div className="file-item-icon">
                  <Icon size={16} />
                </div>
                <div className="file-item-info">
                  <span className="file-item-name" title={file.name}>{file.name}</span>
                  <span className="file-item-size">{formatFileSize(file.size)}</span>
                </div>
                <button
                  className="file-item-remove"
                  onClick={() => onFileRemove(index)}
                  aria-label={`移除文件 ${file.name}`}
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
