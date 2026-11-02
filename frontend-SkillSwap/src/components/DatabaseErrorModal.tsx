'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Database, RefreshCw, X, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

export function DatabaseErrorModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{
    message: string;
    code: string;
  }>({
    message: 'Data fetching error from database. Unable to connect to MongoDB Atlas.',
    code: 'DATABASE_ERROR'
  });

  useEffect(() => {
    const handleDbError = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string; code?: string }>;
      const msg = customEvent.detail?.message || 'Data fetching error from database.';
      const code = customEvent.detail?.code || 'DATABASE_ERROR';

      setErrorDetails({
        message: msg,
        code
      });
      setIsOpen(true);
    };

    window.addEventListener('skillswap:database-error', handleDbError);
    return () => {
      window.removeEventListener('skillswap:database-error', handleDbError);
    };
  }, []);

  const handleRetry = () => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        style={{
          maxWidth: '480px',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          background: '#0d0d12',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(239, 68, 68, 0.15)'
        }}
      >
        <DialogHeader>
          <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Database size={18} className="text-destructive" style={{ color: '#f87171' }} />
              </div>
              <DialogTitle className="text-lg font-bold text-white">
                Database Error
              </DialogTitle>
            </div>
            <Badge variant="destructive" style={{ fontSize: '0.72rem' }}>
              {errorDetails.code}
            </Badge>
          </div>

          <DialogDescription className="text-secondary text-xs">
            Persistent storage check failed. In-memory fallback has been disabled to protect your data.
          </DialogDescription>
        </DialogHeader>

        <div style={{ margin: '14px 0' }}>
          <Alert variant="destructive">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-destructive mt-0.5 flex-shrink-0" style={{ color: '#f87171' }} />
              <div>
                <AlertTitle className="text-sm font-semibold" style={{ color: '#fca5a5' }}>
                  Data Fetching Error From Database
                </AlertTitle>
                <AlertDescription className="text-xs mt-1" style={{ color: '#fecaca', lineHeight: 1.5 }}>
                  {errorDetails.message}
                </AlertDescription>
              </div>
            </div>
          </Alert>

          <p className="text-xs text-secondary mt-3" style={{ lineHeight: 1.5 }}>
            All user accounts, profiles, virtual credits, and sessions are strictly persisted in live <strong>MongoDB Atlas</strong>. Volatile memory fallback was removed so no session data is silently lost.
          </p>
        </div>

        <DialogFooter style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <Button variant="outline" size="sm" onClick={handleDismiss}>
            Dismiss
          </Button>
          <Button variant="default" size="sm" onClick={handleRetry} className="flex items-center gap-2">
            <RefreshCw size={13} />
            <span>Retry Connection</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

