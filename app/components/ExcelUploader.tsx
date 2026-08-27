'use client';

import { useRef, useState } from 'react';
import { FileSpreadsheet, LockKeyhole, Upload, XCircle } from 'lucide-react';
import Image from 'next/image';
import type { BulletinLocale } from '../types/bulletin';

interface ExcelUploaderProps {
  busy: boolean;
  error: string;
  onFile: (file: File, preferredLocale?: BulletinLocale) => void;
}

export function ExcelUploader({ busy, error, onFile }: ExcelUploaderProps) {
  const englishInputRef = useRef<HTMLInputElement>(null);
  const vietnameseInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const acceptFile = (file?: File) => {
    if (file) onFile(file);
  };

  return (
    <main className="generator-shell">
      <div className="ambient-grid" aria-hidden="true" />
      <header className="app-header">
        <div className="brand-lockup">
          <Image src="/vietinbank-logo.png" alt="VietinBank" width={252} height={76} priority />
          <span className="brand-divider" />
          <span className="brand-product">FX Bulletin Studio</span>
        </div>
        <div className="secure-note"><LockKeyhole size={16} /><span>Processed privately in your browser</span></div>
      </header>

      <section className="upload-hero">
        <div className="hero-art" aria-hidden="true"><Image src="/market-globe.png" alt="" fill priority sizes="720px" /></div>
        <div className="hero-copy">
          <span className="eyebrow">Foreign Exchange Sales Department · HO</span>
          <h1>Turn your daily Excel into a client-ready FX bulletin.</h1>
          <p>Upload the VietinBank workbook to generate a polished, responsive market brief—ready to review, print, or save as PDF.</p>
          <div className="workflow-line" aria-label="Workflow"><span>Excel</span><i /><span>Preview</span><i /><span>PDF</span></div>
        </div>

        <div
          className={`upload-panel${dragging ? ' is-dragging' : ''}`}
          onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            acceptFile(event.dataTransfer.files[0]);
          }}
        >
          <div className="upload-icon"><FileSpreadsheet size={31} /></div>
          <h2>{busy ? 'Reading your workbook…' : 'FX Bulletin Generator'}</h2>
          <p>{busy ? 'Mapping sections, tables, and embedded analysis text.' : 'Drag and drop the completed bulletin workbook here.'}</p>
          {error && <div className="upload-error" role="alert"><XCircle size={18} /><span>{error}</span></div>}
          <div className="upload-choice-buttons">
            <button className="upload-button" type="button" disabled={busy} onClick={() => englishInputRef.current?.click()}>
              <Upload size={18} /><span>{busy ? 'Parsing Excel…' : 'Upload Ver Eng'}</span>
            </button>
            <button className="upload-button upload-button-vietnamese" type="button" disabled={busy} onClick={() => vietnameseInputRef.current?.click()}>
              <Upload size={18} /><span>{busy ? 'Đang đọc Excel…' : 'Upload Ver Vie'}</span>
            </button>
          </div>
          <input
            ref={englishInputRef}
            className="visually-hidden"
            aria-label="Upload English Excel workbook"
            type="file"
            accept=".xlsx,.xls"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onFile(file, 'en');
              event.currentTarget.value = '';
            }}
          />
          <input
            ref={vietnameseInputRef}
            className="visually-hidden"
            aria-label="Upload Vietnamese Excel workbook"
            type="file"
            accept=".xlsx,.xls"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onFile(file, 'vi');
              event.currentTarget.value = '';
            }}
          />
          <span className="file-help">English / Vietnamese · supports .xlsx and .xls · no external upload</span>
        </div>
      </section>

      <footer className="app-footer"><span>VietinBank · Corporate Customer Segment</span><span>Market Research &amp; Business Development</span></footer>
    </main>
  );
}
