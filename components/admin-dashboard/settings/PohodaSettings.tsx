'use client';

import { useState, useRef, useEffect, useCallback, Fragment } from 'react';
import {
  Database,
  Loader2,
  CheckCircle2,
  XCircle,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Server,
  Building2,
  User,
  Lock,
  Link,
  Package,
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  ShoppingCart,
  Warehouse,
  RotateCw,
  ArrowDownUp,
  ChevronDown,
  Receipt,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePohodaStore } from '@/features/pohoda';
import { usePrevodkyStore } from '@/features/prevodky/prevodky-store';
import { cn } from '@/lib/utils';

export function PohodaSettings() {
  const {
    credentials,
    connectionStatus,
    sklady,
    isTestingConnection,
    isLoadingSklady,
    isExporting,
    isUploading,
    isGenerating,
    generateProgress,
    generateError,
    isGeneratingVsechnySklady,
    generateVsechnySkladyProgress,
    generateVsechnySkladyError,
    lastUploadedFile,
    pohodaView,
    setCredentials,
    savePohodaConfig,
    setConnectionStatus,
    setSklady,
    setIsTestingConnection,
    setIsLoadingSklady,
    setIsExporting,
    setIsUploading,
    setIsGenerating,
    setGenerateProgress,
    setGenerateError,
    setIsGeneratingVsechnySklady,
    setGenerateVsechnySkladyProgress,
    setGenerateVsechnySkladyError,
    setLastUploadedFile,
    setPohodaView,
    syncZasobyColumns,
    syncZasobySklad,
    isSyncingZasoby,
    syncZasobyProgress,
    syncZasobyLog,
    setSyncZasobyColumns,
    setSyncZasobySklad,
    saveSyncZasobyConfig,
    fetchSyncLog,
    syncZasoby,
    syncPohybyColumns,
    isSyncingPohyby,
    syncPohybyProgress,
    syncPohybyLog,
    setSyncPohybyColumns,
    saveSyncPohybyConfig,
    fetchSyncPohybyLog,
    syncPohyby,
    isSyncingProdejky,
    syncProdejkyProgress,
    syncProdejkyLog,
    fetchSyncProdejkyLog,
    syncProdejky,
    isUploadingPodklady,
    uploadPodkladyResult,
    uploadPodkladyError,
    podkladyLastUpload,
    podkladyRowCount,
    podkladyFileName,
    uploadPodklady,
  } = usePohodaStore();

  const [showPassword, setShowPassword] = useState(false);
  const [selectedSklad, setSelectedSklad] = useState<string>('all');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [podkladyFileInputKey, setPodkladyFileInputKey] = useState(0);
  const podkladyFileInputRef = useRef<HTMLInputElement>(null);

  // Test pripojeni k mServeru
  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus({ error: null });

    try {
      const response = await fetch('/api/pohoda/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success) {
        setConnectionStatus({
          isConnected: true,
          lastCheck: new Date().toISOString(),
          companyName: data.companyName || null,
          error: null,
        });
        // Po uspesnem pripojeni nacist sklady
        await loadSklady();
        // Auto-reset po 5 sekundach - test je jen informativni
        setTimeout(() => {
          setConnectionStatus({
            isConnected: false,
            companyName: null,
            error: null,
          });
        }, 5000);
      } else {
        setConnectionStatus({
          isConnected: false,
          lastCheck: new Date().toISOString(),
          companyName: null,
          error: data.error || 'Pripojeni selhalo',
        });
      }
    } catch {
      setConnectionStatus({
        isConnected: false,
        lastCheck: new Date().toISOString(),
        companyName: null,
        error: 'Chyba pri komunikaci se serverem',
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Nacist seznam skladu
  const loadSklady = async () => {
    setIsLoadingSklady(true);

    try {
      const response = await fetch('/api/pohoda/sklady/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success && data.sklady) {
        setSklady(data.sklady);
      }
    } catch (error) {
      console.error('Chyba pri nacitani skladu:', error);
    } finally {
      setIsLoadingSklady(false);
    }
  };

  // Stahnout Excel export
  const downloadExcel = async () => {
    setIsExporting(true);

    try {
      const response = await fetch('/api/pohoda/sklady/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...credentials,
          skladId: selectedSklad === 'all' ? null : selectedSklad,
        }),
      });

      // Zkontrolovat content-type - pokud je JSON, je to chyba
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export selhal');
      }

      if (!response.ok) {
        throw new Error('Export selhal');
      }

      // Stahnout jako soubor
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pohoda-sklady-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Chyba pri exportu:', error);
      const errorMessage = error instanceof Error ? error.message : 'Neznama chyba';
      toast.error(`Export se nezdaril: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Upload souboru do /export
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/pohoda/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setLastUploadedFile(data.filename);
        setUploadError(null);
      } else {
        setUploadError(data.error || 'Nahravani selhalo');
        setLastUploadedFile(null);
      }
    } catch {
      setUploadError('Chyba pri nahravani souboru');
      setLastUploadedFile(null);
    } finally {
      setIsUploading(false);
      // Reset file input - zmena key vynuti znovu-renderovani inputu
      setFileInputKey((prev) => prev + 1);
    }
  };

  // Upload podklady cilovych stavu
  const handlePodkladyUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadPodklady(file);
    setPodkladyFileInputKey((prev) => prev + 1);
  };

  // Generovat vsechny sklady
  const generateVsechnySklady = async () => {
    setIsGeneratingVsechnySklady(true);
    setGenerateVsechnySkladyProgress('Stahovani dat ze skladu...');
    setGenerateVsechnySkladyError(null);

    try {
      const response = await fetch('/api/pohoda/vsechny-sklady', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generovani selhalo');
      }

      setGenerateVsechnySkladyProgress('Stahovani souboru...');

      // Stahnout jako soubor
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vsechny-sklady-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      setGenerateVsechnySkladyProgress(null);
    } catch (error) {
      console.error('Chyba pri generovani vsech skladu:', error);
      setGenerateVsechnySkladyError(
        error instanceof Error ? error.message : 'Neznama chyba'
      );
      setGenerateVsechnySkladyProgress(null);
    } finally {
      setIsGeneratingVsechnySklady(false);
    }
  };

  // Generovat objednavku
  const generateOrder = async () => {
    setIsGenerating(true);
    setGenerateProgress('Nacitani podkladu...');
    setGenerateError(null);

    try {
      setGenerateProgress('Stahovani dat ze skladu...');

      const response = await fetch('/api/pohoda/generate-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generovani selhalo');
      }

      setGenerateProgress('Stahovani souboru...');

      // Stahnout jako soubor
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `objednavka-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      setGenerateProgress(null);
    } catch (error) {
      console.error('Chyba pri generovani objednavky:', error);
      setGenerateError(
        error instanceof Error ? error.message : 'Neznama chyba'
      );
      setGenerateProgress(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const isFormValid =
    credentials.url &&
    credentials.username &&
    credentials.password &&
    credentials.ico;

  // Detail view
  if (pohodaView === 'detail') {
    return (
      <div className="space-y-6">
        {/* Hlavicka s tlacitkem zpet */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPohodaView('settings')}
            className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all active:scale-[0.98]"
          >
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Pohoda - Detail
            </h2>
            <p className="text-sm text-slate-500">
              Podrobne informace o pripojeni
            </p>
          </div>
        </div>

        {/* Upload sekce */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-slate-400" />
            Nahrat soubor
          </h3>

          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Nahrajte Excel soubor (.xlsx, .xls) nebo CSV do slozky export.
            </p>

            {/* Skryty file input */}
            <input
              key={fileInputKey}
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Tlacitko pro upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all duration-200',
                isUploading
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'
              )}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Nahravani...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Nahrat soubor
                </>
              )}
            </button>

            {/* Status uploadu */}
            {lastUploadedFile && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Soubor uspesne nahran
                  </p>
                  <p className="text-xs text-green-600">{lastUploadedFile}</p>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm font-medium text-red-800">{uploadError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Objednat vsem sekce */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-slate-400" />
            Objednat vsem
          </h3>

          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Vygeneruje objednavku na zaklade souboru Podklady.xlsx a
              aktualnich stavu skladu z mServeru.
            </p>

            {/* Tlacitko pro generovani */}
            <button
              onClick={generateOrder}
              disabled={isGenerating}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all duration-200',
                isGenerating
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700 active:scale-[0.98]'
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generuji...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Vygenerovat
                </>
              )}
            </button>

            {/* Progress indikator */}
            {generateProgress && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <p className="text-sm font-medium text-blue-800">
                  {generateProgress}
                </p>
              </div>
            )}

            {/* Error */}
            {generateError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm font-medium text-red-800">
                  {generateError}
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Vsechny sklady sekce */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-slate-400" />
            Vsechny sklady
          </h3>

          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Stahne aktualni stavy vsech skladu z mServeru a zobrazi je v jedne
              tabulce. Radky = kody produktu, sloupce = jednotlive sklady s
              mnozstvim.
            </p>

            {/* Tlacitko pro generovani */}
            <button
              onClick={generateVsechnySklady}
              disabled={isGeneratingVsechnySklady}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all duration-200',
                isGeneratingVsechnySklady
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.98]'
              )}
            >
              {isGeneratingVsechnySklady ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generuji...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Vygenerovat
                </>
              )}
            </button>

            {/* Progress indikator */}
            {generateVsechnySkladyProgress && (
              <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                <p className="text-sm font-medium text-purple-800">
                  {generateVsechnySkladyProgress}
                </p>
              </div>
            )}

            {/* Error */}
            {generateVsechnySkladyError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm font-medium text-red-800">
                  {generateVsechnySkladyError}
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hlavicka */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setPohodaView('detail')}
          className="p-3 bg-blue-100 rounded-xl hover:bg-blue-200 transition-all active:scale-[0.98] cursor-pointer"
        >
          <Database className="w-6 h-6 text-blue-600" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Pohoda mServer
          </h2>
          <p className="text-sm text-slate-500">
            Pripojeni k ekonomickemu systemu Pohoda
          </p>
        </div>
      </div>

      {/* Upload podklady cilovych stavu */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-slate-400" />
          Podklady cilovych stavu
        </h3>

        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Nahrajte Excel soubor (.xlsx) s cilovymi stavy zasob pro prodejny.
            Kazdy upload kompletne nahradi predchozi data.
          </p>

          {/* Skryty file input */}
          <input
            key={podkladyFileInputKey}
            ref={podkladyFileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handlePodkladyUpload}
            className="hidden"
          />

          {/* Tlacitko pro upload */}
          <button
            onClick={() => podkladyFileInputRef.current?.click()}
            disabled={isUploadingPodklady}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all duration-200',
              isUploadingPodklady
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.98]'
            )}
          >
            {isUploadingPodklady ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Nahravani podkladu...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Nahrat podklady (.xlsx)
              </>
            )}
          </button>

          {/* Uspesny upload */}
          {uploadPodkladyResult?.success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Podklady uspesne nahrany
                </p>
                <p className="text-xs text-green-600">
                  {uploadPodkladyResult.filename} &middot;{' '}
                  {uploadPodkladyResult.pocetRadku.toLocaleString('cs-CZ')} radku
                </p>
              </div>
            </div>
          )}

          {/* Chyba */}
          {uploadPodkladyError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm font-medium text-red-800">{uploadPodkladyError}</p>
            </div>
          )}

          {/* Info o poslednim uploadu z DB */}
          {podkladyLastUpload && !uploadPodkladyResult && (
            <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Posledni upload:{' '}
                  {new Date(podkladyLastUpload).toLocaleString('cs-CZ')}
                </p>
                <p className="text-xs text-slate-500">
                  {podkladyFileName} &middot;{' '}
                  {podkladyRowCount.toLocaleString('cs-CZ')} radku
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status pripojeni */}
      <div
        className={cn(
          'p-4 rounded-xl border',
          connectionStatus.isConnected
            ? 'bg-green-50 border-green-200'
            : 'bg-slate-50 border-slate-200'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {connectionStatus.isConnected ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-slate-400" />
            )}
            <div>
              <p
                className={cn(
                  'font-medium',
                  connectionStatus.isConnected
                    ? 'text-green-800'
                    : 'text-slate-600'
                )}
              >
                {connectionStatus.isConnected ? 'Pripojeno' : 'Nepripojeno'}
              </p>
              {connectionStatus.companyName && (
                <p className="text-sm text-green-600">
                  Firma: {connectionStatus.companyName}
                </p>
              )}
              {connectionStatus.error && (
                <p className="text-sm text-red-600">{connectionStatus.error}</p>
              )}
              {connectionStatus.lastCheck && (
                <p className="text-xs text-slate-500">
                  Posledni kontrola:{' '}
                  {new Date(connectionStatus.lastCheck).toLocaleString('cs-CZ')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Formular pro prihlasovaci udaje */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Server className="w-5 h-5 text-slate-400" />
          Prihlasovaci udaje
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* URL */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              <Link className="w-4 h-4 inline mr-1.5" />
              URL mServeru
            </label>
            <input
              type="text"
              value={credentials.url}
              onChange={(e) => setCredentials({ url: e.target.value })}
              onBlur={() => savePohodaConfig()}
              placeholder="http://server:4444"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-blue-300 transition-all"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Napr. http://2HSER.ipodnik.com:4444
            </p>
          </div>

          {/* ICO */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              <Building2 className="w-4 h-4 inline mr-1.5" />
              ICO firmy
            </label>
            <input
              type="text"
              value={credentials.ico}
              onChange={(e) => setCredentials({ ico: e.target.value })}
              onBlur={() => savePohodaConfig()}
              placeholder="12345678"
              maxLength={8}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-blue-300 transition-all"
            />
          </div>

          {/* Uzivatel */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              <User className="w-4 h-4 inline mr-1.5" />
              Uzivatelske jmeno
            </label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({ username: e.target.value })}
              onBlur={() => savePohodaConfig()}
              placeholder="api_user"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-blue-300 transition-all"
            />
          </div>

          {/* Heslo */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              <Lock className="w-4 h-4 inline mr-1.5" />
              Heslo
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={(e) => setCredentials({ password: e.target.value })}
                onBlur={() => savePohodaConfig()}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 pr-12 text-base font-medium outline-none focus:border-blue-300 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tlacitko Test spojeni */}
        <div className="mt-6">
          <button
            onClick={testConnection}
            disabled={!isFormValid || isTestingConnection}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all duration-200',
              isFormValid && !isTestingConnection
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            )}
          >
            {isTestingConnection ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Testuji spojeni...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Otestovat spojeni
              </>
            )}
          </button>
        </div>
      </div>

      {/* Export skladu */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-slate-400" />
          Export skladu
        </h3>

        <div className="space-y-4">
          {/* Vyber skladu */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              Vyberte sklad
            </label>
            <div className="flex gap-3">
              <select
                value={selectedSklad}
                onChange={(e) => setSelectedSklad(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-semibold outline-none cursor-pointer focus:border-blue-300 transition-all"
                disabled={isLoadingSklady}
              >
                <option value="all">Vsechny sklady</option>
                {sklady.map((sklad) => (
                  <option key={sklad.id} value={sklad.ids}>
                    {sklad.name || sklad.ids}
                  </option>
                ))}
              </select>
              <button
                onClick={loadSklady}
                disabled={isLoadingSklady}
                className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                title="Obnovit seznam skladu"
              >
                {isLoadingSklady ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                ) : (
                  <RefreshCw className="w-5 h-5 text-slate-500" />
                )}
              </button>
            </div>
            {sklady.length > 0 && (
              <p className="text-xs text-slate-500 mt-1.5">
                Nalezeno {sklady.length} skladu
              </p>
            )}
          </div>

          {/* Tlacitko stahnout */}
          <button
            onClick={downloadExcel}
            disabled={isExporting}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all duration-200',
              isExporting
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 active:scale-[0.98]'
            )}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exportuji...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Stahnout jako Excel
              </>
            )}
          </button>
        </div>
      </div>

      {/* Synchronizace zasob */}
      <SyncZasobyBlock
        syncZasobyColumns={syncZasobyColumns}
        syncZasobySklad={syncZasobySklad}
        isSyncingZasoby={isSyncingZasoby}
        syncZasobyProgress={syncZasobyProgress}
        syncZasobyLog={syncZasobyLog}
        sklady={sklady}
        setSyncZasobyColumns={setSyncZasobyColumns}
        setSyncZasobySklad={setSyncZasobySklad}
        saveSyncZasobyConfig={saveSyncZasobyConfig}
        fetchSyncLog={fetchSyncLog}
        syncZasoby={syncZasoby}
      />

      {/* Synchronizace pohybu */}
      <SyncPohybyBlock
        syncPohybyColumns={syncPohybyColumns}
        isSyncingPohyby={isSyncingPohyby}
        syncPohybyProgress={syncPohybyProgress}
        syncPohybyLog={syncPohybyLog}
        setSyncPohybyColumns={setSyncPohybyColumns}
        saveSyncPohybyConfig={saveSyncPohybyConfig}
        fetchSyncPohybyLog={fetchSyncPohybyLog}
        syncPohyby={syncPohyby}
      />

      {/* Synchronizace prodejek */}
      <SyncProdejkyBlock
        isSyncingProdejky={isSyncingProdejky}
        syncProdejkyProgress={syncProdejkyProgress}
        syncProdejkyLog={syncProdejkyLog}
        fetchSyncProdejkyLog={fetchSyncProdejkyLog}
        syncProdejky={syncProdejky}
      />

      {/* Synchronizace prevodek */}
      <SyncPrevodkyBlock />

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h4 className="font-semibold text-blue-900 mb-2">
          Jak nastavit Pohoda mServer?
        </h4>
        <ol className="text-sm text-blue-800 space-y-1.5 list-decimal list-inside">
          <li>V Pohode vytvorte uzivatele s opravnenim pro mServer</li>
          <li>Pridelte mu prava k agendam: Sklady, Faktury, Objednavky</li>
          <li>Zkontrolujte, ze mServer bezi (iPodnik, port 4444)</li>
          <li>Vyplnte udaje vyse a otestujte spojeni</li>
        </ol>
      </div>
    </div>
  );
}

// =============================================================================
// Column categories for sync
// =============================================================================

const SYNC_COLUMN_CATEGORIES = [
  {
    label: 'Zakladni',
    columns: [
      { key: 'kod', label: 'Kod' },
      { key: 'nazev', label: 'Nazev' },
      { key: 'ean', label: 'EAN' },
      { key: 'plu', label: 'PLU' },
      { key: 'zkraceny_nazev', label: 'Zkraceny nazev' },
      { key: 'doplnkovy_text', label: 'Doplnkovy text' },
    ],
  },
  {
    label: 'Stav',
    columns: [
      { key: 'stav_zasoby', label: 'Stav zasoby' },
      { key: 'mnozstvi_k_vydeji', label: 'K vydeji' },
      { key: 'prijate_objednavky', label: 'Prijate obj.' },
      { key: 'rezervace', label: 'Rezervace' },
      { key: 'mnozstvi_objednane', label: 'Objednane' },
    ],
  },
  {
    label: 'Ceny',
    columns: [
      { key: 'nakupni_cena', label: 'Nakupni cena' },
      { key: 'prodejni_cena', label: 'Prodejni cena' },
      { key: 'vazena_nakupni_cena', label: 'Vazena nakupni' },
      { key: 'fixace_ceny', label: 'Fixace ceny' },
    ],
  },
  {
    label: 'Jednotky',
    columns: [
      { key: 'merna_jednotka', label: 'MJ' },
      { key: 'merna_jednotka_2', label: 'MJ 2' },
      { key: 'merna_jednotka_3', label: 'MJ 3' },
      { key: 'koeficient_2', label: 'Koef. 2' },
      { key: 'koeficient_3', label: 'Koef. 3' },
    ],
  },
  {
    label: 'Sklad',
    columns: [
      { key: 'cleneni_skladu', label: 'Cleneni skladu' },
      { key: 'cenova_skupina', label: 'Cenova skupina' },
      { key: 'dodavatel', label: 'Dodavatel' },
    ],
  },
  {
    label: 'Objednavky',
    columns: [
      { key: 'limit_min', label: 'Limit min' },
      { key: 'limit_max', label: 'Limit max' },
      { key: 'nazev_pro_objednavku', label: 'Nazev obj.' },
      { key: 'mnozstvi_objednavka', label: 'Mnozstvi obj.' },
    ],
  },
  {
    label: 'Fyzicke',
    columns: [
      { key: 'hmotnost', label: 'Hmotnost' },
      { key: 'objem', label: 'Objem' },
    ],
  },
  {
    label: 'E-shop',
    columns: [
      { key: 'novinka', label: 'Novinka' },
      { key: 'doprodej', label: 'Doprodej' },
      { key: 'akce', label: 'Akce' },
      { key: 'doporucujeme', label: 'Doporucujeme' },
      { key: 'sleva', label: 'Sleva' },
      { key: 'pripravujeme', label: 'Pripravujeme' },
      { key: 'dostupnost', label: 'Dostupnost' },
    ],
  },
  {
    label: 'Ucetni',
    columns: [
      { key: 'stredisko', label: 'Stredisko' },
      { key: 'cinnost', label: 'Cinnost' },
      { key: 'zakazka', label: 'Zakazka' },
      { key: 'vynosovy_ucet', label: 'Vynosovy ucet' },
      { key: 'nakladovy_ucet', label: 'Nakladovy ucet' },
    ],
  },
  {
    label: 'Ostatni',
    columns: [
      { key: 'typ_zasoby', label: 'Typ zasoby' },
      { key: 'sazba_dph_nakup', label: 'DPH nakup' },
      { key: 'sazba_dph_prodej', label: 'DPH prodej' },
      { key: 'vyrobce', label: 'Vyrobce' },
      { key: 'typ_zaruky', label: 'Typ zaruky' },
      { key: 'delka_zaruky', label: 'Delka zaruky' },
      { key: 'poznamka', label: 'Poznamka' },
      { key: 'strucny_popis', label: 'Strucny popis' },
      { key: 'podrobny_popis', label: 'Podrobny popis' },
      { key: 'oznaceni_zaznamu', label: 'Oznaceni' },
    ],
  },
];

// =============================================================================
// SyncZasobyBlock component
// =============================================================================

interface SyncZasobyBlockProps {
  syncZasobyColumns: string[];
  syncZasobySklad: string | null;
  isSyncingZasoby: boolean;
  syncZasobyProgress: string | null;
  syncZasobyLog: import('@/shared/types').PohodaSyncLog[];
  sklady: import('@/features/pohoda/pohoda-store').PohodaSklad[];
  setSyncZasobyColumns: (cols: string[]) => void;
  setSyncZasobySklad: (sklad: string | null) => void;
  saveSyncZasobyConfig: () => Promise<void>;
  fetchSyncLog: (typ: string) => Promise<void>;
  syncZasoby: () => Promise<void>;
}

function SyncZasobyBlock({
  syncZasobyColumns,
  syncZasobySklad,
  isSyncingZasoby,
  syncZasobyProgress,
  syncZasobyLog,
  sklady,
  setSyncZasobyColumns,
  setSyncZasobySklad,
  saveSyncZasobyConfig,
  fetchSyncLog,
  syncZasoby,
}: SyncZasobyBlockProps) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [showColumns, setShowColumns] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  // Load log on mount
  useEffect(() => {
    fetchSyncLog('zasoby');
  }, [fetchSyncLog]);

  const toggleColumn = useCallback(
    (key: string) => {
      const next = syncZasobyColumns.includes(key)
        ? syncZasobyColumns.filter((c) => c !== key)
        : [...syncZasobyColumns, key];
      setSyncZasobyColumns(next);
      // Debounced save
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveSyncZasobyConfig();
      }, 500);
    },
    [syncZasobyColumns, setSyncZasobyColumns, saveSyncZasobyConfig]
  );

  const handleSkladChange = useCallback(
    (value: string) => {
      const sklad = value === 'all' ? null : value;
      setSyncZasobySklad(sklad);
      saveSyncZasobyConfig();
    },
    [setSyncZasobySklad, saveSyncZasobyConfig]
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-in fade-in duration-300">
      <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <RotateCw className="w-5 h-5 text-slate-400" />
        Synchronizace zasob
      </h3>

      <div className="space-y-5">
        {/* Column selection - collapsible */}
        <div>
          <button
            type="button"
            onClick={() => setShowColumns(!showColumns)}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform duration-200',
                !showColumns && '-rotate-90'
              )}
            />
            Nastaveni sloupcu
            {syncZasobyColumns.length > 0 && (
              <span className="text-xs text-slate-400">
                ({syncZasobyColumns.length} vybrano)
              </span>
            )}
          </button>

          {showColumns && (
            <div className="mt-3 space-y-4">
              {SYNC_COLUMN_CATEGORIES.map((category) => (
                <div key={category.label}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                    {category.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {category.columns.map((col) => {
                      const isChecked = syncZasobyColumns.includes(col.key);
                      return (
                        <button
                          key={col.key}
                          type="button"
                          onClick={() => toggleColumn(col.key)}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 select-none',
                            isChecked
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                          )}
                        >
                          <span
                            className={cn(
                              'w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0',
                              isChecked
                                ? 'bg-blue-600 border-blue-600'
                                : 'border-slate-300'
                            )}
                          >
                            {isChecked && (
                              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </span>
                          {col.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sklad filter */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">
            Vyberte sklad
          </label>
          <select
            value={syncZasobySklad || 'all'}
            onChange={(e) => handleSkladChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-semibold outline-none cursor-pointer focus:border-blue-300 transition-all"
          >
            <option value="all">Vsechny sklady</option>
            {sklady.map((sklad) => (
              <option key={sklad.id} value={sklad.ids}>
                {sklad.name || sklad.ids}
              </option>
            ))}
          </select>
        </div>

        {/* Sync button */}
        <button
          onClick={syncZasoby}
          disabled={isSyncingZasoby || syncZasobyColumns.length === 0}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all duration-200',
            isSyncingZasoby || syncZasobyColumns.length === 0
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'
          )}
        >
          {isSyncingZasoby ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Synchronizuji...
            </>
          ) : (
            <>
              <RotateCw className="w-4 h-4" />
              Synchronizovat zasoby
            </>
          )}
        </button>

        {/* Progress */}
        {syncZasobyProgress && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <p className="text-sm font-medium text-blue-800">{syncZasobyProgress}</p>
          </div>
        )}

        {/* Sync log */}
        {syncZasobyLog.length > 0 && (
          <div>
            <p className="text-sm font-medium text-slate-600 mb-2">
              Posledni synchronizace:
            </p>
            <div className="shadow-sm border border-slate-200 bg-white rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Datum
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Zaznamy
                    </th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Doba trvani
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {syncZasobyLog.map((log) => {
                    const hasDetail = log.detail && log.detail.length > 0;
                    const isExpanded = expandedLogId === log.id;
                    return (
                      <Fragment key={log.id}>
                        <tr
                          className={cn(
                            'border-t border-slate-100 transition-colors',
                            hasDetail ? 'cursor-pointer hover:bg-slate-50' : '',
                            isExpanded && 'bg-slate-50'
                          )}
                          onClick={() => hasDetail && setExpandedLogId(isExpanded ? null : log.id)}
                        >
                          <td className="px-4 py-2.5 text-sm font-medium text-slate-600">
                            <span className="flex items-center gap-1.5">
                              {hasDetail && (
                                <ChevronDown className={cn(
                                  'w-3.5 h-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0',
                                  !isExpanded && '-rotate-90'
                                )} />
                              )}
                              {new Date(log.vytvoreno).toLocaleString('cs-CZ', {
                                day: 'numeric',
                                month: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            {log.stav === 'success' ? (
                              <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
                                <CheckCircle2 className="w-4 h-4" />
                                {hasDetail ? `${log.detail!.length} skladů` : 'OK'}
                              </span>
                            ) : log.stav === 'error' ? (
                              <span className="inline-flex items-center gap-1 text-sm font-medium text-red-700" title={log.zprava || undefined}>
                                <XCircle className="w-4 h-4" />
                                Chyba
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-700">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Probiha
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-sm font-medium text-slate-600 text-right">
                            {log.pocetZaznamu.toLocaleString('cs-CZ')}
                          </td>
                          <td className="px-4 py-2.5 text-sm font-medium text-slate-600 text-right">
                            {(log.trvaniMs / 1000).toFixed(1)}s
                          </td>
                        </tr>
                        {isExpanded && hasDetail && (
                          <tr>
                            <td colSpan={4} className="px-4 pb-3 pt-0">
                              <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                                <table className="w-full">
                                  <tbody>
                                    {log.detail!.map((d, i) => (
                                      <tr key={i} className={i > 0 ? 'border-t border-slate-100' : ''}>
                                        <td className="px-3 py-1.5 text-xs font-medium text-slate-600">
                                          {d.sklad}
                                        </td>
                                        <td className="px-3 py-1.5 text-xs font-medium text-slate-500 text-right">
                                          {d.pocetZaznamu.toLocaleString('cs-CZ')}
                                        </td>
                                        <td className="px-3 py-1.5 text-xs font-medium text-slate-500 text-right w-20">
                                          {(d.trvaniMs / 1000).toFixed(1)}s
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Column categories for pohyby sync
// =============================================================================

const SYNC_POHYBY_COLUMN_CATEGORIES = [
  {
    label: 'Zakladni',
    columns: [
      { key: 'agenda', label: 'Agenda' },
      { key: 'typ_pohybu', label: 'Typ pohybu' },
      { key: 'datum', label: 'Datum' },
      { key: 'cislo_dokladu', label: 'Cislo dokladu' },
      { key: 'reg_cislo', label: 'Reg. cislo' },
    ],
  },
  {
    label: 'Zasoba',
    columns: [
      { key: 'zasoba_kod', label: 'Kod zasoby' },
      { key: 'zasoba_nazev', label: 'Nazev zasoby' },
      { key: 'zasoba_ean', label: 'EAN' },
      { key: 'zasoba_plu', label: 'PLU' },
      { key: 'typ_zasoby', label: 'Typ zasoby' },
    ],
  },
  {
    label: 'Mnozstvi',
    columns: [
      { key: 'mnozstvi', label: 'Mnozstvi' },
      { key: 'merna_jednotka', label: 'MJ' },
      { key: 'stav_po_pohybu', label: 'Stav po pohybu' },
    ],
  },
  {
    label: 'Ceny',
    columns: [
      { key: 'jednotkova_cena', label: 'Jednotkova cena' },
      { key: 'celkova_cena', label: 'Celkova cena' },
      { key: 'vazena_nakupni_cena', label: 'Vazena nakupni' },
      { key: 'oceneni', label: 'Oceneni' },
      { key: 'zisk_jednotka', label: 'Zisk/jednotka' },
      { key: 'zisk_celkem', label: 'Zisk celkem' },
    ],
  },
  {
    label: 'Sklad',
    columns: [
      { key: 'cleneni_skladu', label: 'Cleneni skladu' },
      { key: 'cenova_skupina', label: 'Cenova skupina' },
    ],
  },
  {
    label: 'Adresa',
    columns: [
      { key: 'adresa_firma', label: 'Firma' },
      { key: 'adresa_jmeno', label: 'Jmeno' },
      { key: 'adresa_ulice', label: 'Ulice' },
      { key: 'adresa_mesto', label: 'Mesto' },
      { key: 'adresa_psc', label: 'PSC' },
    ],
  },
  {
    label: 'Ucetni',
    columns: [
      { key: 'stredisko', label: 'Stredisko' },
      { key: 'cinnost', label: 'Cinnost' },
      { key: 'zakazka', label: 'Zakazka' },
    ],
  },
  {
    label: 'Ostatni',
    columns: [
      { key: 'oznaceni_zaznamu', label: 'Oznaceni' },
    ],
  },
];

// =============================================================================
// SyncPohybyBlock component
// =============================================================================

interface SyncPohybyBlockProps {
  syncPohybyColumns: string[];
  isSyncingPohyby: boolean;
  syncPohybyProgress: string | null;
  syncPohybyLog: import('@/shared/types').PohodaSyncLog[];
  setSyncPohybyColumns: (cols: string[]) => void;
  saveSyncPohybyConfig: () => Promise<void>;
  fetchSyncPohybyLog: () => Promise<void>;
  syncPohyby: () => Promise<void>;
}

function SyncPohybyBlock({
  syncPohybyColumns,
  isSyncingPohyby,
  syncPohybyProgress,
  syncPohybyLog,
  setSyncPohybyColumns,
  saveSyncPohybyConfig,
  fetchSyncPohybyLog,
  syncPohyby,
}: SyncPohybyBlockProps) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [showColumns, setShowColumns] = useState(false);

  useEffect(() => {
    fetchSyncPohybyLog();
  }, [fetchSyncPohybyLog]);

  const toggleColumn = useCallback(
    (key: string) => {
      const next = syncPohybyColumns.includes(key)
        ? syncPohybyColumns.filter((c) => c !== key)
        : [...syncPohybyColumns, key];
      setSyncPohybyColumns(next);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveSyncPohybyConfig();
      }, 500);
    },
    [syncPohybyColumns, setSyncPohybyColumns, saveSyncPohybyConfig]
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-in fade-in duration-300">
      <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <ArrowDownUp className="w-5 h-5 text-slate-400" />
        Synchronizace pohybu
      </h3>

      <div className="space-y-5">
        {/* Column selection - collapsible */}
        <div>
          <button
            type="button"
            onClick={() => setShowColumns(!showColumns)}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform duration-200',
                !showColumns && '-rotate-90'
              )}
            />
            Nastaveni sloupcu
            {syncPohybyColumns.length > 0 && (
              <span className="text-xs text-slate-400">
                ({syncPohybyColumns.length} vybrano)
              </span>
            )}
          </button>

          {showColumns && (
            <div className="mt-3 space-y-4">
              {SYNC_POHYBY_COLUMN_CATEGORIES.map((category) => (
                <div key={category.label}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                    {category.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {category.columns.map((col) => {
                      const isChecked = syncPohybyColumns.includes(col.key);
                      return (
                        <button
                          key={col.key}
                          type="button"
                          onClick={() => toggleColumn(col.key)}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 select-none',
                            isChecked
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                          )}
                        >
                          <span
                            className={cn(
                              'w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0',
                              isChecked
                                ? 'bg-blue-600 border-blue-600'
                                : 'border-slate-300'
                            )}
                          >
                            {isChecked && (
                              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </span>
                          {col.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-slate-500">
          Stahuje pohyby od 1.11.2025. Pohoda API nepodporuje filtr na sklad pro pohyby.
        </p>

        {/* Sync button */}
        <button
          onClick={syncPohyby}
          disabled={isSyncingPohyby || syncPohybyColumns.length === 0}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all duration-200',
            isSyncingPohyby || syncPohybyColumns.length === 0
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'
          )}
        >
          {isSyncingPohyby ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Synchronizuji...
            </>
          ) : (
            <>
              <ArrowDownUp className="w-4 h-4" />
              Synchronizovat pohyby
            </>
          )}
        </button>

        {/* Progress */}
        {syncPohybyProgress && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <p className="text-sm font-medium text-blue-800">{syncPohybyProgress}</p>
          </div>
        )}

        {/* Sync log */}
        {syncPohybyLog.length > 0 && (
          <div>
            <p className="text-sm font-medium text-slate-600 mb-2">
              Posledni synchronizace:
            </p>
            <div className="shadow-sm border border-slate-200 bg-white rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Datum
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Zaznamy
                    </th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Doba trvani
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {syncPohybyLog.map((log) => (
                    <tr key={log.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-sm font-medium text-slate-600">
                        {new Date(log.vytvoreno).toLocaleString('cs-CZ', {
                          day: 'numeric',
                          month: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-2.5">
                        {log.stav === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
                            <CheckCircle2 className="w-4 h-4" />
                            OK
                          </span>
                        ) : log.stav === 'error' ? (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-red-700" title={log.zprava || undefined}>
                            <XCircle className="w-4 h-4" />
                            Chyba
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-700">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Probiha
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-medium text-slate-600 text-right">
                        {log.pocetZaznamu.toLocaleString('cs-CZ')}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-medium text-slate-600 text-right">
                        {(log.trvaniMs / 1000).toFixed(1)}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SyncProdejkyBlock component
// =============================================================================

interface SyncProdejkyBlockProps {
  isSyncingProdejky: boolean;
  syncProdejkyProgress: string | null;
  syncProdejkyLog: import('@/shared/types').PohodaSyncLog[];
  fetchSyncProdejkyLog: () => Promise<void>;
  syncProdejky: () => Promise<void>;
}

function SyncProdejkyBlock({
  isSyncingProdejky,
  syncProdejkyProgress,
  syncProdejkyLog,
  fetchSyncProdejkyLog,
  syncProdejky,
}: SyncProdejkyBlockProps) {
  useEffect(() => {
    fetchSyncProdejkyLog();
  }, [fetchSyncProdejkyLog]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-in fade-in duration-300">
      <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Receipt className="w-5 h-5 text-slate-400" />
        Synchronizace prodejek
      </h3>

      <div className="space-y-5">
        <p className="text-xs text-slate-500">
          Stahuje prodejky od 1.2.2026. Pouziva se pro sloupec POHODA ve Vykazu trzeb.
        </p>

        {/* Sync button */}
        <button
          onClick={syncProdejky}
          disabled={isSyncingProdejky}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all duration-200',
            isSyncingProdejky
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'
          )}
        >
          {isSyncingProdejky ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Synchronizuji...
            </>
          ) : (
            <>
              <Receipt className="w-4 h-4" />
              Synchronizovat prodejky
            </>
          )}
        </button>

        {/* Progress */}
        {syncProdejkyProgress && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <p className="text-sm font-medium text-blue-800">{syncProdejkyProgress}</p>
          </div>
        )}

        {/* Sync log */}
        {syncProdejkyLog.length > 0 && (
          <div>
            <p className="text-sm font-medium text-slate-600 mb-2">
              Posledni synchronizace:
            </p>
            <div className="shadow-sm border border-slate-200 bg-white rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Datum
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Zaznamy
                    </th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Doba trvani
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {syncProdejkyLog.map((log) => (
                    <tr key={log.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-sm font-medium text-slate-600">
                        {new Date(log.vytvoreno).toLocaleString('cs-CZ', {
                          day: 'numeric',
                          month: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-2.5">
                        {log.stav === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
                            <CheckCircle2 className="w-4 h-4" />
                            OK
                          </span>
                        ) : log.stav === 'error' ? (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-red-700" title={log.zprava || undefined}>
                            <XCircle className="w-4 h-4" />
                            Chyba
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-700">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Probiha
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-medium text-slate-600 text-right">
                        {log.pocetZaznamu.toLocaleString('cs-CZ')}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-medium text-slate-600 text-right">
                        {(log.trvaniMs / 1000).toFixed(1)}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SyncPrevodkyBlock component
// =============================================================================

function SyncPrevodkyBlock() {
  const {
    prevodky,
    _loaded,
    isSendingToPohoda,
    sendToPohoda,
  } = usePrevodkyStore();

  const [sendingId, setSendingId] = useState<string | null>(null);

  // Převodky ready to send (vychystano, not yet sent to Pohoda)
  const readyToSend = prevodky.filter(
    (p) => p.stav === 'vychystano' && !p.pohodaOdeslano
  );

  // All relevant převodky (ready, sent, or with error)
  const allRelevant = prevodky
    .filter(
      (p) =>
        p.stav === 'vychystano' ||
        p.stav === 'odeslano' ||
        p.pohodaOdeslano ||
        p.pohodaChyba
    )
    .sort((a, b) => new Date(b.vytvoreno).getTime() - new Date(a.vytvoreno).getTime());

  const handleSend = async (prevodkaId: string) => {
    setSendingId(prevodkaId);
    await sendToPohoda(prevodkaId);
    setSendingId(null);
  };

  const handleSendAll = async () => {
    for (const p of readyToSend) {
      setSendingId(p.id);
      const result = await sendToPohoda(p.id);
      if (!result.success) break;
    }
    setSendingId(null);
  };

  if (!_loaded) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-in fade-in duration-300">
      <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <ArrowDownUp className="w-5 h-5 text-slate-400" />
        Synchronizace prevodek
      </h3>

      <div className="space-y-5">
        <p className="text-xs text-slate-500">
          Odesila vychystane prevodky do Pohody jako prevodky mezi sklady.
        </p>

        {/* Send all button */}
        {readyToSend.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSendAll}
              disabled={isSendingToPohoda}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all duration-200',
                isSendingToPohoda
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'
              )}
            >
              {isSendingToPohoda ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Odesilam...
                </>
              ) : (
                <>
                  <ArrowDownUp className="w-4 h-4" />
                  Odeslat vse ({readyToSend.length})
                </>
              )}
            </button>
            <span className="text-sm text-slate-500">
              {readyToSend.length} {readyToSend.length === 1 ? 'prevodka ceka' : 'prevodek ceka'} na odeslani
            </span>
          </div>
        )}

        {allRelevant.length === 0 && (
          <div className="text-sm text-slate-400 italic">
            Zadne prevodky k odeslani.
          </div>
        )}

        {/* Table of převodky */}
        {allRelevant.length > 0 && (
          <div className="shadow-sm border border-slate-200 bg-white rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Cislo
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Trasa
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Stav
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Pohoda
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Akce
                  </th>
                </tr>
              </thead>
              <tbody>
                {allRelevant.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-sm font-semibold text-slate-800">
                      {p.cisloPrevodky}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-slate-600">
                      {p.zdrojovySklad} → {p.cilovySklad}
                    </td>
                    <td className="px-4 py-2.5">
                      {p.stav === 'vychystano' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full">
                          Vychystano
                        </span>
                      )}
                      {p.stav === 'odeslano' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          Odeslano
                        </span>
                      )}
                      {p.stav === 'potvrzeno' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                          Potvrzeno
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {p.pohodaOdeslano ? (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
                          <CheckCircle2 className="w-4 h-4" />
                          {p.pohodaCisloDokladu || 'OK'}
                        </span>
                      ) : p.pohodaChyba ? (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-red-700" title={p.pohodaChyba}>
                          <XCircle className="w-4 h-4" />
                          Chyba
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {p.stav === 'vychystano' && !p.pohodaOdeslano && (
                        <button
                          onClick={() => handleSend(p.id)}
                          disabled={isSendingToPohoda}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all',
                            sendingId === p.id
                              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700 active:scale-[0.98]'
                          )}
                        >
                          {sendingId === p.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Odesilam
                            </>
                          ) : (
                            'Odeslat'
                          )}
                        </button>
                      )}
                      {p.pohodaChyba && !p.pohodaOdeslano && p.stav !== 'vychystano' && (
                        <button
                          onClick={() => handleSend(p.id)}
                          disabled={isSendingToPohoda}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all',
                            sendingId === p.id
                              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                              : 'bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.98]'
                          )}
                        >
                          {sendingId === p.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Zkousim
                            </>
                          ) : (
                            <>
                              <RotateCw className="w-3.5 h-3.5" />
                              Zkusit znovu
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
