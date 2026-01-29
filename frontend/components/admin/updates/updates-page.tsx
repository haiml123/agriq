'use client';

import { SidebarTrigger } from '@/components/layout/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { config } from '@/lib/configuration';
import { useSession } from 'next-auth/react';

export function UpdatesPage() {
  const t = useTranslations('adminUpdates');
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    filename: string;
    size: number;
    md5: string;
    uploadedAt: string;
  } | null>(null);

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a tar file.');
      return;
    }
    if (!token) {
      setError('You must be signed in to upload gateway bundles.');
      return;
    }
    setError(null);
    setResult(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${config.apiUrl}/gateways/upload-version`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed (${response.status})`);
      }

      const data = await response.json();
      setResult(data?.manifest ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('description')}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('uploadTitle')}</CardTitle>
          <CardDescription>{t('uploadDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gateway-tar">{t('fileLabel')}</Label>
            <Input
              id="gateway-tar"
              type="file"
              accept=".tar,.tar.gz,.gz,application/x-tar,application/gzip"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">{t('fileHelper')}</p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {result && (
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
              <div className="font-medium text-foreground">{result.filename}</div>
              <div className="text-muted-foreground">MD5: {result.md5}</div>
              <div className="text-muted-foreground">Size: {result.size} bytes</div>
              <div className="text-muted-foreground">Uploaded: {result.uploadedAt}</div>
            </div>
          )}
          <Button type="button" onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? 'Uploading...' : t('uploadButton')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
