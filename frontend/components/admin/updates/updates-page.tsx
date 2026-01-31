'use client';

import { SidebarTrigger } from '@/components/layout/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { config } from '@/lib/configuration';
import { useSession } from 'next-auth/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

type GatewayVersionManifest = {
  version: string;
  filename?: string;
  size?: number;
  md5?: string;
  uploadedAt?: string;
};

export function UpdatesPage() {
  const t = useTranslations('adminUpdates');
  const tToast = useTranslations('toast.adminUpdates');
  const { data: session } = useSession();
  const token = session?.accessToken;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [versions, setVersions] = useState<GatewayVersionManifest[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [versionsError, setVersionsError] = useState<string | null>(null);
  const [activeVersion, setActiveVersion] = useState<string | null>(null);
  const [isLoadingActive, setIsLoadingActive] = useState(false);
  const [activeError, setActiveError] = useState<string | null>(null);
  const [settingActiveVersion, setSettingActiveVersion] = useState<string | null>(null);

  const sortedVersions = useMemo(() => {
    return [...versions].sort((a, b) => {
      const aDate = a.uploadedAt ? Date.parse(a.uploadedAt) : 0;
      const bDate = b.uploadedAt ? Date.parse(b.uploadedAt) : 0;
      return bDate - aDate;
    });
  }, [versions]);

  const loadVersions = async () => {
    setIsLoadingVersions(true);
    setVersionsError(null);
    try {
      const response = await fetch(`${config.apiUrl}/gateway-versions/bundles`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`Failed to load versions (${response.status})`);
      }
      const data = await response.json();
      setVersions(Array.isArray(data?.versions) ? data.versions : []);
    } catch (err) {
      setVersionsError(err instanceof Error ? err.message : 'Failed to load versions');
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const loadActiveVersion = async () => {
    if (!token) {
      setActiveVersion(null);
      return;
    }
    setIsLoadingActive(true);
    setActiveError(null);
    try {
      const response = await fetch(`${config.apiUrl}/gateway-versions/active`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });
      if (response.status === 404) {
        setActiveVersion(null);
        return;
      }
      if (!response.ok) {
        throw new Error(`Failed to load active version (${response.status})`);
      }
      const data = await response.json();
      setActiveVersion(data?.version ?? null);
    } catch (err) {
      setActiveError(err instanceof Error ? err.message : 'Failed to load active version');
    } finally {
      setIsLoadingActive(false);
    }
  };

  useEffect(() => {
    void loadVersions();
  }, []);

  useEffect(() => {
    void loadActiveVersion();
  }, [token]);

  const handleFileSelect = (selected: File | null) => {
    setFile(selected);
    setError(null);
    setUploadNotice(null);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    handleFileSelect(dropped ?? null);
  };

  const handleSetActive = async (version: string) => {
    if (!token) {
      const message = tToast('authRequired');
      setActiveError(message);
      toast.error(message);
      return;
    }
    setActiveError(null);
    setSettingActiveVersion(version);
    try {
      const response = await fetch(`${config.apiUrl}/gateway-versions/active`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ version }),
      });

      if (response.ok) {
        const data = await response.json();
        setActiveVersion(data?.version ?? version);
        toast.success(tToast('setActiveSuccess'));
        return;
      }

      if (response.status === 404) {
        const createResponse = await fetch(`${config.apiUrl}/gateway-versions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ version, isActive: true }),
        });
        if (!createResponse.ok) {
          const errorData = await createResponse.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to set active (${createResponse.status})`);
        }
        const created = await createResponse.json();
        setActiveVersion(created?.version ?? version);
        toast.success(tToast('setActiveSuccess'));
        return;
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to set active (${response.status})`);
    } catch (err) {
      const message = err instanceof Error ? err.message : tToast('setActiveError');
      setActiveError(message);
      toast.error(message);
    } finally {
      setSettingActiveVersion(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      const message = tToast('fileRequired');
      setError(message);
      toast.error(message);
      return;
    }
    if (!token) {
      const message = tToast('authRequired');
      setError(message);
      toast.error(message);
      return;
    }
    setError(null);
    setUploadNotice(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${config.apiUrl}/gateway-versions/upload`, {
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
      const filename = data?.manifest?.filename;
      const successMessage = filename
        ? tToast('uploadSuccessWithFile', { filename })
        : tToast('uploadSuccess');
      setUploadNotice(successMessage);
      toast.success(successMessage);
      await loadVersions();
    } catch (err) {
      const message = err instanceof Error ? err.message : tToast('uploadError');
      setError(message);
      toast.error(message);
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
          <div>
            <div
              className={`flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center transition ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50/60'
                  : 'border-muted-foreground/40 bg-muted/20'
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                id="gateway-tar"
                type="file"
                accept=".tar,.tar.gz,.gz,application/x-tar,application/gzip"
                className="hidden"
                onChange={(event) => handleFileSelect(event.target.files?.[0] ?? null)}
              />
              <p className="text-sm font-medium text-foreground">{t('dropTitle')}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('fileHelper')}</p>
              {file && (
                <p className="mt-3 text-sm text-foreground">
                  {t('selectedFile')}: <span className="font-medium">{file.name}</span>
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => fileInputRef.current?.click()}
              >
                {t('browseButton')}
              </Button>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {uploadNotice && <p className="text-sm text-emerald-600">{uploadNotice}</p>}
          <Button type="button" onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? 'Uploading...' : t('uploadButton')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('versionsTitle')}</CardTitle>
          <CardDescription>{t('versionsDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {versionsError && <p className="text-sm text-destructive">{versionsError}</p>}
          {activeError && <p className="text-sm text-destructive">{activeError}</p>}
          {isLoadingVersions ? (
            <p className="text-sm text-muted-foreground">{t('loadingVersions')}</p>
          ) : sortedVersions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noVersions')}</p>
          ) : (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('versionLabel')}</TableHead>
                    <TableHead>{t('statusLabel')}</TableHead>
                    <TableHead>{t('filenameLabel')}</TableHead>
                    <TableHead>{t('uploadedAtLabel')}</TableHead>
                    <TableHead>{t('sizeLabel')}</TableHead>
                    <TableHead className="text-right">{t('actionsLabel')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedVersions.map((version) => (
                    <TableRow key={version.version}>
                      <TableCell className="font-medium">{version.version}</TableCell>
                      <TableCell>
                        {isLoadingActive ? (
                          <span className="text-xs text-muted-foreground">{t('loadingActive')}</span>
                        ) : activeVersion === version.version ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            {t('activeBadge')}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{version.filename ?? '-'}</TableCell>
                      <TableCell>
                        {version.uploadedAt
                          ? new Date(version.uploadedAt).toLocaleString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {typeof version.size === 'number'
                          ? `${version.size} bytes`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {activeVersion === version.version ? (
                          <Button size="sm" variant="outline" disabled>
                            {t('activeButton')}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetActive(version.version)}
                            disabled={settingActiveVersion === version.version}
                          >
                            {settingActiveVersion === version.version
                              ? t('settingActive')
                              : t('setActive')}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
