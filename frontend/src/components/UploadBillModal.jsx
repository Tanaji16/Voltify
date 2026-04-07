import { useState, useRef } from 'react';
import { useTheme } from '../App.jsx';
import { uploadBill } from '../api/bills.js';
import { UploadCloud, FileText, Image as ImageIcon, X, AlertCircle, CheckCircle } from 'lucide-react';

export default function UploadBillModal({ isOpen, onClose, onSuccess, activeMeterId }) {
  const { dark } = useTheme();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const bg = dark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900';
  const overlay = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleFileChange = (selectedFile) => {
    setError('');
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      return setError('Please upload a valid PDF or Image file.');
    }
    setFile(selectedFile);
  };

  const submitFile = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await uploadBill(file, activeMeterId);
      setSuccess(data.message || 'Scanned successfully!');
      setTimeout(() => {
        onSuccess(data.records);
        reset();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to scan bill. Please try again.');
    } finally {
      if(!success) setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setError('');
    setSuccess('');
    setLoading(false);
    onClose();
  };

  return (
    <div className={overlay} onClick={reset}>
      <div className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl relative ${bg} animate-scale-up`} onClick={e => e.stopPropagation()}>
        
        {/* Close Button */}
        <button onClick={reset} className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${dark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}>
          <X size={20} className={dark ? 'text-slate-400' : 'text-gray-500'} />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-black">Scan Electricity Bill</h2>
          <p className={`text-sm mt-1 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Upload a Mahavitaran PDF or photo to automatically build your graphs.</p>
        </div>

        {/* Drag & Drop Zone */}
        {!file && !loading && !success && (
          <div 
            className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center transition-all cursor-pointer ${
              dragActive 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : dark ? 'border-slate-600 hover:border-slate-400 hover:bg-slate-800' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,image/*" onChange={handleChange} />
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${dark ? 'bg-slate-800 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              <UploadCloud size={24} />
            </div>
            <p className="font-bold mb-1">Click or drag file to this area</p>
            <p className={`text-xs ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Supports .pdf, .jpg, .png</p>
          </div>
        )}

        {/* Selected File State */}
        {file && !loading && !success && (
           <div className={`rounded-xl p-4 flex items-center gap-4 border ${dark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
             <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex flex-shrink-0 items-center justify-center text-blue-600 dark:text-blue-400">
               {file.type === 'application/pdf' ? <FileText size={20}/> : <ImageIcon size={20}/>}
             </div>
             <div className="overflow-hidden flex-1">
               <p className="font-semibold text-sm truncate">{file.name}</p>
               <p className={`text-xs ${dark ? 'text-slate-400' : 'text-gray-500'}`}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
             </div>
             <button onClick={() => setFile(null)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors">
               <X size={16}/>
             </button>
           </div>
        )}

        {/* Loading State */}
        {loading && !success && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="font-bold text-center">AI is scanning your bill...</p>
            <p className={`text-sm mt-2 text-center px-4 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
              Images may take up to 10 seconds. PDFs are instant.
            </p>
          </div>
        )}

        {/* Success State */}
        {success && (
          <div className="flex flex-col items-center justify-center py-6 text-center animate-scale-up">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center text-green-500 mb-4 shadow-sm shadow-green-500/20">
              <CheckCircle size={28} />
            </div>
            <h3 className="font-black text-xl mb-1 text-green-600 dark:text-green-400">Scan Complete!</h3>
            <p className={`text-sm ${dark ? 'text-slate-300' : 'text-gray-600'}`}>{success}</p>
          </div>
        )}

        {/* Output Error */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 flex items-start gap-2 text-red-600 dark:text-red-400 text-xs">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Action Button */}
        {!loading && !success && (
           <div className="mt-6">
             <button 
                onClick={submitFile} 
                disabled={!file}
                className={`w-full py-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2 ${
                  file 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25' 
                    : `${dark ? 'bg-slate-800 text-slate-500' : 'bg-gray-100 text-gray-400'} cursor-not-allowed`
                }`}
              >
                Start OCR Extraction
             </button>
           </div>
        )}

      </div>
    </div>
  );
}
