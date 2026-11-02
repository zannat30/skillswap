'use client';

import React from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  id?: string;
}

export function Dialog({ open, onClose, title, children, footer, id }: DialogProps) {
  return (
    <div className={`modal-overlay ${open ? 'active' : ''}`} id={id}>
      <div className="modal-content glass-panel">
        {title && (
          <div className="modal-header">
            <h3>{title}</h3>
            {onClose && (
              <button className="icon-btn close-modal" onClick={onClose} type="button">
                <X size={20} />
              </button>
            )}
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
