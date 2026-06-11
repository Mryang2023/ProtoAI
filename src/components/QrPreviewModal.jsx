import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Smartphone, QrCode, ExternalLink, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';

export default function QrPreviewModal({ pages = [], onClose }) {
  const overlayRef = useRef(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [serverUrl, setServerUrl] = useState('');

  // Build the local dev server URL
  useEffect(() => {
    const host = window.location.hostname || 'localhost';
    const url = `http://${host}:5180`;
    setServerUrl(url);

    QRCode.toDataURL(url, {
      width: 480,
      margin: 2,
      color: { dark: '#111111', light: '#ffffff' },
    })
      .then(setQrDataUrl)
      .catch((err) => console.error('QR code generation failed:', err));
  }, []);

  // Close on overlay click
  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose],
  );

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Revoke Blob URL on unmount or when a new one is created
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  // Handle page selection: create Blob URL and show instructions
  const handleSelectPage = useCallback((page) => {
    // Revoke previous blob URL if any
    setBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    setSelectedPage(page);
    setCopied(false);

    if (page.html) {
      const blob = new Blob([page.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
    }
  }, []);

  // Copy the server URL to clipboard
  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(serverUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = serverUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [serverUrl]);

  // ── Inline Styles ──
  const styles = {
    overlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      animation: 'fadeIn 0.2s ease',
    },
    card: {
      background: 'var(--surface)',
      borderRadius: '12px',
      padding: '32px',
      maxWidth: '480px',
      width: '90vw',
      maxHeight: '90vh',
      overflowY: 'auto',
      position: 'relative',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 4px 20px rgba(0, 0, 0, 0.08)',
      animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    },
    closeBtn: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--fg-muted)',
      padding: '6px',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 0.15s, color 0.15s',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '8px',
    },
    headerIcon: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '36px',
      height: '36px',
      borderRadius: '10px',
      background: 'var(--accent-subtle)',
      color: 'var(--accent)',
      flexShrink: 0,
    },
    title: {
      fontSize: '18px',
      fontWeight: 600,
      color: 'var(--fg)',
      margin: 0,
    },
    subtitle: {
      fontSize: '13px',
      color: 'var(--fg-muted)',
      margin: '0 0 24px 0',
      lineHeight: 1.5,
    },
    qrWrapper: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: '24px',
    },
    qrFrame: {
      padding: '16px',
      background: '#ffffff',
      borderRadius: '12px',
      border: '1px solid var(--border-light)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    },
    qrImage: {
      width: '240px',
      height: '240px',
      display: 'block',
    },
    qrPlaceholder: {
      width: '240px',
      height: '240px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--fg-muted)',
      fontSize: '13px',
    },
    urlRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '12px',
      padding: '8px 12px',
      background: 'var(--surface-inset)',
      borderRadius: '8px',
      fontSize: '13px',
      color: 'var(--fg-secondary)',
      fontFamily: 'monospace',
      wordBreak: 'break-all',
    },
    copyBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 10px',
      border: 'none',
      borderRadius: '6px',
      background: 'var(--accent)',
      color: '#ffffff',
      fontSize: '12px',
      fontWeight: 500,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      flexShrink: 0,
      transition: 'background 0.15s',
    },
    networkNote: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      padding: '10px 12px',
      background: 'var(--accent-subtle)',
      borderRadius: '8px',
      fontSize: '12px',
      lineHeight: 1.5,
      color: 'var(--fg-secondary)',
      marginBottom: '20px',
    },
    networkNoteIcon: {
      flexShrink: 0,
      marginTop: '1px',
      color: 'var(--accent)',
    },
    divider: {
      border: 'none',
      borderTop: '1px solid var(--border-light)',
      margin: '0 0 16px 0',
    },
    sectionLabel: {
      fontSize: '13px',
      fontWeight: 600,
      color: 'var(--fg-secondary)',
      marginBottom: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    pageList: {
      maxHeight: '200px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      marginBottom: '4px',
    },
    pageItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 12px',
      border: '1px solid var(--border-light)',
      borderRadius: '8px',
      background: 'var(--surface)',
      cursor: 'pointer',
      fontSize: '13px',
      color: 'var(--fg)',
      transition: 'background 0.15s, border-color 0.15s',
    },
    pageItemActive: {
      borderColor: 'var(--accent)',
      background: 'var(--accent-subtle)',
    },
    pageItemName: {
      flex: 1,
      fontWeight: 500,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    selectedInfo: {
      padding: '12px',
      background: 'var(--surface-inset)',
      borderRadius: '8px',
      fontSize: '12px',
      color: 'var(--fg-secondary)',
      lineHeight: 1.6,
    },
    selectedInfoLabel: {
      fontWeight: 600,
      color: 'var(--fg)',
      marginBottom: '4px',
    },
    emptyState: {
      textAlign: 'center',
      padding: '16px',
      color: 'var(--fg-muted)',
      fontSize: '13px',
    },
  };

  return (
    <div
      ref={overlayRef}
      style={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="QR Code Preview"
    >
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          style={styles.closeBtn}
          onClick={onClose}
          aria-label="Close"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-hover)';
            e.currentTarget.style.color = 'var(--fg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--fg-muted)';
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerIcon}>
            <QrCode size={20} />
          </div>
          <h2 style={styles.title}>Mobile Preview</h2>
        </div>
        <p style={styles.subtitle}>
          Scan the QR code on your phone to open the local dev server in a mobile browser.
        </p>

        {/* QR Code */}
        <div style={styles.qrWrapper}>
          <div style={styles.qrFrame}>
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR code linking to local dev server"
                style={styles.qrImage}
              />
            ) : (
              <div style={styles.qrPlaceholder}>Generating QR code...</div>
            )}
          </div>

          {/* URL display + copy */}
          <div style={styles.urlRow}>
            <span style={{ flex: 1 }}>{serverUrl}</span>
            <button
              style={styles.copyBtn}
              onClick={handleCopyUrl}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--accent)';
              }}
            >
              {copied ? (
                <>
                  <Check size={12} /> Copied
                </>
              ) : (
                <>
                  <Copy size={12} /> Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Network note */}
        <div style={styles.networkNote}>
          <Smartphone size={14} style={styles.networkNoteIcon} />
          <span>
            The QR code links to the local dev server. Both your computer and phone must be
            connected to the <strong>same Wi-Fi network</strong> for the preview to work.
          </span>
        </div>

        {/* Page list */}
        <hr style={styles.divider} />

        <div style={styles.sectionLabel}>
          <ExternalLink size={14} />
          Available Pages
        </div>

        {pages.length === 0 ? (
          <div style={styles.emptyState}>
            No pages available yet. Generate a design first.
          </div>
        ) : (
          <>
            <div style={styles.pageList}>
              {pages.map((page, idx) => {
                const isActive = selectedPage?.name === page.name;
                return (
                  <div
                    key={page.name || idx}
                    style={{
                      ...styles.pageItem,
                      ...(isActive ? styles.pageItemActive : {}),
                    }}
                    onClick={() => handleSelectPage(page)}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--bg-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--surface)';
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectPage(page);
                      }
                    }}
                  >
                    <Smartphone
                      size={14}
                      style={{
                        flexShrink: 0,
                        color: isActive ? 'var(--accent)' : 'var(--fg-muted)',
                      }}
                    />
                    <span style={styles.pageItemName}>{page.name}</span>
                    {isActive && (
                      <Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected page info */}
            {selectedPage && (
              <div style={styles.selectedInfo}>
                <div style={styles.selectedInfoLabel}>
                  Previewing: {selectedPage.name}
                </div>
                <p style={{ margin: '4px 0 0 0' }}>
                  To view this page on your phone, open the dev server URL above in your mobile
                  browser. Navigate to the page from the app. For a quick local preview on this
                  device, you can also open the Blob URL below (note: Blob URLs only work on the
                  same device).
                </p>
                {blobUrl && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '8px',
                    }}
                  >
                    <a
                      href={blobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--accent)',
                        fontSize: '12px',
                        textDecoration: 'underline',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                      }}
                    >
                      Open local Blob preview
                    </a>
                    <button
                      style={{
                        ...styles.copyBtn,
                        fontSize: '11px',
                        padding: '3px 8px',
                      }}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(blobUrl);
                        } catch {
                          /* noop */
                        }
                      }}
                    >
                      <Copy size={11} /> Copy
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
