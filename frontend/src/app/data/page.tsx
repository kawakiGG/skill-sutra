"use client";

import React, { useState } from "react";
import { uploadDataset, normalizeTitle } from "@/lib/api";
import { Database, Upload, FileText, CheckCircle, AlertCircle, Search, Sparkles, ShieldCheck } from "lucide-react";

export default function DataManagementPage() {
  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Normalizer state
  const [rawTitle, setRawTitle] = useState("Urgent Requirement: Senior CNC Machinist & Programmer");
  const [normalizing, setNormalizing] = useState(false);
  const [normResult, setNormResult] = useState<any | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const res = await uploadDataset(file);
      setUploadResult(res.data);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleNormalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawTitle.trim()) return;
    setNormalizing(true);
    try {
      const res = await normalizeTitle(rawTitle);
      setNormResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setNormalizing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-100 tracking-tight">
          Dataset Ingestion & Quality Intelligence Engine
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Source-agnostic data pipeline validator, quality scoring & job title NCO taxonomy normalizer.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Dataset Upload & Quality Score Section */}
        <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div className="flex items-center space-x-2 text-cyan-400">
              <Upload className="w-5 h-5" />
              <h2 className="text-sm font-extrabold text-white">Upload New Dataset (CSV / XLSX)</h2>
            </div>
            <a
              href="/data/sample/messy_job_postings.csv"
              download
              className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-mono"
            >
              <FileText className="w-3.5 h-3.5" /> Sample Demo File
            </a>
          </div>

          <form onSubmit={handleUpload} className="space-y-3">
            <div className="border-2 border-dashed border-gray-750 hover:border-cyan-500/50 rounded-xl p-6 text-center transition-colors bg-gray-950/50">
              <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-xs text-gray-300 font-semibold mb-1">
                {file ? file.name : "Drag & drop CSV/XLSX dataset or click to select"}
              </p>
              <p className="text-[10px] text-gray-500 font-mono">Supports Job Postings, ITI Capacity, PLFS Survey files</p>
              <input
                type="file"
                accept=".csv, .xlsx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload-input"
              />
              <label
                htmlFor="file-upload-input"
                className="mt-3 inline-block px-3.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-750 text-gray-200 text-xs font-bold cursor-pointer transition-colors"
              >
                Choose File
              </label>
            </div>

            {uploadError && (
              <div className="p-2.5 rounded-lg bg-red-950/50 border border-red-800 text-xs text-red-300">
                {uploadError}
              </div>
            )}

            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-cyan-600/20"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{uploading ? "Ingesting & Auditing Quality..." : "Upload & Run Data Quality Audit"}</span>
            </button>
          </form>

          {/* Upload & Quality Report Output */}
          {uploadResult && (
            <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-850 pb-2">
                <span className="text-xs font-bold text-gray-200">{uploadResult.filename} ({uploadResult.row_count} rows)</span>
                <span className="text-sm font-black text-emerald-400 font-mono">
                  Quality Score: {uploadResult.quality_score} / 100
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-gray-900 border border-gray-800">
                  <span className="text-[10px] text-gray-500 block">Null Cell Rate</span>
                  <span className="text-gray-200 font-bold">{(uploadResult.null_rate * 100).toFixed(1)}%</span>
                </div>
                <div className="p-2 rounded bg-gray-900 border border-gray-800">
                  <span className="text-[10px] text-gray-500 block">Duplicate Rows Rate</span>
                  <span className="text-gray-200 font-bold">{(uploadResult.duplicate_rate * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Job Title Normalizer Section */}
        <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 shadow-md space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-800 pb-3 text-cyan-400">
            <Sparkles className="w-5 h-5" />
            <h2 className="text-sm font-extrabold text-white">Job Title NCO Taxonomy Normalizer</h2>
          </div>

          <form onSubmit={handleNormalize} className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block font-semibold mb-1">
                Enter Raw Job Title from Posting:
              </label>
              <input
                type="text"
                value={rawTitle}
                onChange={(e) => setRawTitle(e.target.value)}
                placeholder="e.g. Urgent Hiring: Sr CNC Operator / Machinist"
                className="w-full bg-gray-950 border border-gray-750 text-gray-100 text-xs rounded-xl p-3 focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="text-gray-500">Quick Test Titles:</span>
              <button
                type="button"
                onClick={() => setRawTitle("Sr CNC Operator / Machinist")}
                className="text-cyan-400 hover:underline"
              >
                CNC Operator
              </button>
              <button
                type="button"
                onClick={() => setRawTitle("Solar PV Installation Tech")}
                className="text-cyan-400 hover:underline"
              >
                Solar Tech
              </button>
              <button
                type="button"
                onClick={() => setRawTitle("Phlebotomist & Blood Collection Associate")}
                className="text-cyan-400 hover:underline"
              >
                Phlebotomy
              </button>
            </div>

            <button
              type="submit"
              disabled={normalizing}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-cyan-600/20"
            >
              <Search className="w-4 h-4" />
              <span>{normalizing ? "Normalizing..." : "Normalize to NCO Code & Trade"}</span>
            </button>
          </form>

          {/* Normalization Result Box */}
          {normResult && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 via-gray-900 to-gray-950 border border-cyan-800/60 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-xs font-bold text-cyan-300">Normalization Output</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  {(normResult.confidence * 100).toFixed(0)}% Confidence
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-gray-500 block">RAW INPUT TITLE</span>
                  <span className="text-gray-300 font-semibold">{normResult.raw_title}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">STANDARDIZED TRADE NAME</span>
                  <span className="text-white text-sm font-bold">{normResult.normalized_title}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">NCO CODE</span>
                  <span className="text-cyan-400 font-bold">NCO-{normResult.nco_code}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">MATCHING METHOD</span>
                  <span className="text-gray-400">{normResult.method}</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
