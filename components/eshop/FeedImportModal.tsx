'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Upload, ChevronRight, ChevronLeft, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useEshopFeedStore } from '@/features/eshop/eshop-feed-store';
import { useEshopProduktyStore } from '@/features/eshop/eshop-produkty-store';
import {
  parseCSV,
  parseXML,
  importProducts,
  MAPPABLE_FIELDS,
  type ParsedFeedData,
  type MappableField,
  type MatchField,
  type ImportResult,
} from '@/features/eshop/eshop-feed-helpers';

type Step = 'upload' | 'preview' | 'mapping' | 'result';

const STEPS: { id: Step; label: string }[] = [
  { id: 'upload', label: 'Nahrát soubor' },
  { id: 'preview', label: 'Náhled dat' },
  { id: 'mapping', label: 'Mapování' },
  { id: 'result', label: 'Výsledek' },
];

export function FeedImportModal() {
  const { importingFeedId, closeImportModal, feedConfigs, updateFeedConfig, createFeedLog } = useEshopFeedStore();
  const { fetchEshopProduktyData } = useEshopProduktyStore();
  const feedConfig = feedConfigs.find((fc) => fc.id === importingFeedId);

  const [step, setStep] = useState<Step>('upload');
  const [parsedData, setParsedData] = useState<ParsedFeedData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [columnMap, setColumnMap] = useState<Record<string, MappableField>>({});
  const [matchField, setMatchField] = useState<MatchField>('sku');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const feedId = feedConfig?.id ?? 0;

  const handleImport = useCallback(async () => {
    if (!parsedData || importing || !feedId) return;
    setImporting(true);
    setStep('result');

    const startedAt = new Date().toISOString();
    const importResult = await importProducts(
      parsedData.rows,
      { columnMap, matchField },
      feedId,
      (current, total) => setProgress({ current, total }),
    );

    setResult(importResult);
    setImporting(false);

    // Save log
    const status = importResult.errors === 0
      ? 'success'
      : importResult.newProducts + importResult.updatedProducts > 0
        ? 'partial'
        : 'error';

    await createFeedLog({
      feedId,
      type: 'manual',
      status,
      newProducts: importResult.newProducts,
      updatedProducts: importResult.updatedProducts,
      errors: importResult.errors,
      details: importResult.errorDetails.length > 0
        ? { errors: importResult.errorDetails.slice(0, 100) }
        : undefined,
      startedAt,
      completedAt: new Date().toISOString(),
    });

    // Update feed config with last sync info
    await updateFeedConfig(feedId, {
      lastSync: new Date().toISOString(),
      lastSyncStatus: status,
    });

    // Refresh products store
    await fetchEshopProduktyData();
  }, [parsedData, importing, columnMap, matchField, feedId, createFeedLog, updateFeedConfig, fetchEshopProduktyData]);

  if (!feedConfig) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);

    try {
      const data = feedConfig.type === 'csv'
        ? await parseCSV(file, feedConfig.delimiter, feedConfig.encoding)
        : await parseXML(file);

      setParsedData(data);

      // Pre-fill mapping from saved config
      const savedMapping = feedConfig.mapping ?? {};
      const initialMap: Record<string, MappableField> = {};
      for (const header of data.headers) {
        initialMap[header] = (savedMapping[header] as MappableField) ?? '';
      }
      setColumnMap(initialMap);

      setStep('preview');
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Neznámá chyba parsování');
    }
  };

  const handleSaveMapping = async () => {
    const mappingToSave: Record<string, string> = {};
    for (const [col, field] of Object.entries(columnMap)) {
      if (field) mappingToSave[col] = field;
    }
    await updateFeedConfig(feedConfig.id, { mapping: mappingToSave });
  };

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-[900px] max-h-[90vh] flex flex-col animate-in slide-in-from-top-2 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Import dat</h2>
            <p className="text-sm text-slate-500 mt-0.5">{feedConfig.name}</p>
          </div>
          <button
            onClick={closeImportModal}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-8 pt-4 pb-2">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  idx === stepIndex
                    ? 'bg-emerald-50 text-emerald-700'
                    : idx < stepIndex
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'text-slate-400'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  idx < stepIndex
                    ? 'bg-emerald-500 text-white'
                    : idx === stepIndex
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                }`}>
                  {idx < stepIndex ? '✓' : idx + 1}
                </span>
                {s.label}
              </div>
              {idx < STEPS.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-4">
          {step === 'upload' && (
            <UploadStep
              feedConfig={feedConfig}
              fileRef={fileRef}
              parseError={parseError}
              onFileSelect={handleFileSelect}
            />
          )}
          {step === 'preview' && parsedData && (
            <PreviewStep data={parsedData} />
          )}
          {step === 'mapping' && parsedData && (
            <MappingStep
              headers={parsedData.headers}
              columnMap={columnMap}
              matchField={matchField}
              sampleRow={parsedData.rows[0]}
              onColumnMapChange={setColumnMap}
              onMatchFieldChange={setMatchField}
            />
          )}
          {step === 'result' && (
            <ResultStep
              importing={importing}
              progress={progress}
              result={result}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-slate-200">
          <div>
            {step === 'result' && result && !importing && (
              <button
                onClick={handleSaveMapping}
                className="px-4 py-2 rounded-lg text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                Uložit mapování
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {step !== 'upload' && step !== 'result' && (
              <button
                onClick={() => setStep(step === 'mapping' ? 'preview' : 'upload')}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Zpět
              </button>
            )}
            {step === 'preview' && (
              <button
                onClick={() => setStep('mapping')}
                className="flex items-center gap-1 px-6 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-all"
              >
                Mapování
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 'mapping' && (
              <button
                onClick={handleImport}
                disabled={!Object.values(columnMap).some((v) => v !== '')}
                className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                Spustit import
              </button>
            )}
            {step === 'result' && !importing && (
              <button
                onClick={closeImportModal}
                className="px-6 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-all"
              >
                Hotovo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// STEP COMPONENTS
// =============================================================================

function UploadStep({
  feedConfig,
  fileRef,
  parseError,
  onFileSelect,
}: {
  feedConfig: { type: string; delimiter: string; encoding: string };
  fileRef: React.RefObject<HTMLInputElement | null>;
  parseError: string | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-sm font-medium text-slate-600">
            <span className="text-slate-500">Typ:</span>{' '}
            <span className="font-semibold">{feedConfig.type.toUpperCase()}</span>
          </div>
          {feedConfig.type === 'csv' && (
            <div className="text-sm font-medium text-slate-600">
              <span className="text-slate-500">Oddělovač:</span>{' '}
              <code className="bg-white px-1.5 py-0.5 rounded text-xs border border-slate-200">
                {feedConfig.delimiter}
              </code>
            </div>
          )}
          <div className="text-sm font-medium text-slate-600">
            <span className="text-slate-500">Kódování:</span>{' '}
            <span className="font-semibold">{feedConfig.encoding}</span>
          </div>
        </div>
      </div>

      {/* Drop zone */}
      <label className="flex flex-col items-center justify-center gap-3 p-12 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all">
        <Upload className="w-10 h-10 text-slate-400" />
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">Klikněte pro výběr souboru</p>
          <p className="text-xs text-slate-400 mt-1">
            Podporované formáty: {feedConfig.type === 'csv' ? '.csv, .txt' : '.xml'}
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={feedConfig.type === 'csv' ? '.csv,.txt' : '.xml'}
          onChange={onFileSelect}
          className="hidden"
        />
      </label>

      {parseError && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm font-medium text-red-700">{parseError}</p>
        </div>
      )}
    </div>
  );
}

function PreviewStep({ data }: { data: ParsedFeedData }) {
  const previewRows = data.rows.slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium text-slate-600">
          Detekováno <span className="font-bold text-slate-800">{data.totalRows}</span> záznamů,{' '}
          <span className="font-bold text-slate-800">{data.headers.length}</span> sloupců
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                  #
                </th>
                {data.headers.map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100">
                  <td className="px-3 py-2 text-slate-400 font-mono">{idx + 1}</td>
                  {data.headers.map((h) => (
                    <td
                      key={h}
                      className="px-3 py-2 text-slate-600 max-w-[200px] truncate"
                      title={row[h]}
                    >
                      {row[h] ?? ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {data.totalRows > 10 && (
        <p className="text-xs text-slate-400 text-center">
          Zobrazeno prvních 10 z {data.totalRows} záznamů
        </p>
      )}
    </div>
  );
}

function MappingStep({
  headers,
  columnMap,
  matchField,
  sampleRow,
  onColumnMapChange,
  onMatchFieldChange,
}: {
  headers: string[];
  columnMap: Record<string, MappableField>;
  matchField: MatchField;
  sampleRow?: Record<string, string>;
  onColumnMapChange: (map: Record<string, MappableField>) => void;
  onMatchFieldChange: (field: MatchField) => void;
}) {
  const handleChange = (header: string, value: MappableField) => {
    onColumnMapChange({ ...columnMap, [header]: value });
  };

  return (
    <div className="space-y-5">
      {/* Match field selector */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          Párovat produkty podle
        </label>
        <select
          value={matchField}
          onChange={(e) => onMatchFieldChange(e.target.value as MatchField)}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold outline-none cursor-pointer focus:border-emerald-300"
        >
          <option value="sku">SKU</option>
          <option value="ean">EAN</option>
          <option value="name">Název produktu</option>
        </select>
        <p className="text-xs text-slate-400 mt-1.5">
          Existující produkty se aktualizují, nové se vytvoří
        </p>
      </div>

      {/* Column mapping */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Sloupec v souboru
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Ukázka
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Mapovat na
              </th>
            </tr>
          </thead>
          <tbody>
            {headers.map((header) => (
              <tr key={header} className="border-b border-slate-100">
                <td className="px-5 py-3">
                  <code className="text-sm font-semibold text-slate-800 bg-slate-50 px-2 py-0.5 rounded">
                    {header}
                  </code>
                </td>
                <td className="px-5 py-3 text-sm text-slate-500 max-w-[200px] truncate">
                  {sampleRow?.[header] ?? '—'}
                </td>
                <td className="px-5 py-3">
                  <select
                    value={columnMap[header] ?? ''}
                    onChange={(e) => handleChange(header, e.target.value as MappableField)}
                    className={`bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium outline-none cursor-pointer focus:border-emerald-300 w-full max-w-[220px] ${
                      columnMap[header] ? 'text-emerald-700 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {MAPPABLE_FIELDS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="text-xs text-slate-400 text-center">
        {Object.values(columnMap).filter((v) => v !== '').length} z {headers.length} sloupců namapováno
      </div>
    </div>
  );
}

function ResultStep({
  importing,
  progress,
  result,
}: {
  importing: boolean;
  progress: { current: number; total: number };
  result: ImportResult | null;
}) {
  if (importing) {
    const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-700">Importuji...</p>
        <div className="w-64">
          <div className="bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 text-center mt-1">
            {progress.current} / {progress.total} ({pct}%)
          </p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const hasErrors = result.errors > 0;
  const isSuccess = result.newProducts + result.updatedProducts > 0;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{result.newProducts}</p>
          <p className="text-xs font-semibold text-green-600 mt-1">Nových produktů</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{result.updatedProducts}</p>
          <p className="text-xs font-semibold text-blue-600 mt-1">Aktualizováno</p>
        </div>
        <div className={`${hasErrors ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'} border rounded-xl p-4 text-center`}>
          <p className={`text-2xl font-bold ${hasErrors ? 'text-red-700' : 'text-slate-400'}`}>
            {result.errors}
          </p>
          <p className={`text-xs font-semibold mt-1 ${hasErrors ? 'text-red-600' : 'text-slate-400'}`}>
            Chyb
          </p>
        </div>
      </div>

      {/* Status message */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${
        isSuccess && !hasErrors
          ? 'bg-green-50 border-green-200'
          : isSuccess && hasErrors
            ? 'bg-orange-50 border-orange-200'
            : 'bg-red-50 border-red-200'
      }`}>
        {isSuccess && !hasErrors ? (
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
        )}
        <p className={`text-sm font-medium ${
          isSuccess && !hasErrors ? 'text-green-700' : isSuccess ? 'text-orange-700' : 'text-red-700'
        }`}>
          {isSuccess && !hasErrors
            ? 'Import proběhl úspěšně!'
            : isSuccess && hasErrors
              ? 'Import proběhl částečně. Některé řádky se nepodařilo zpracovat.'
              : 'Import selhal. Žádné produkty nebyly naimportovány.'}
        </p>
      </div>

      {/* Error details */}
      {result.errorDetails.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
            Detail chyb
          </h3>
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden max-h-[200px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-2 font-semibold text-slate-500">Řádek</th>
                  <th className="text-left px-4 py-2 font-semibold text-slate-500">Chyba</th>
                </tr>
              </thead>
              <tbody>
                {result.errorDetails.slice(0, 50).map((err, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="px-4 py-2 text-slate-600 font-mono">{err.row}</td>
                    <td className="px-4 py-2 text-red-600">{err.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.errorDetails.length > 50 && (
            <p className="text-xs text-slate-400 mt-1">
              Zobrazeno prvních 50 z {result.errorDetails.length} chyb
            </p>
          )}
        </div>
      )}
    </div>
  );
}
