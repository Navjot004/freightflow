import React, { useState, useRef } from 'react';
import { ShipmentAPI } from '../api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { useToast } from '../../../components/ui/Toast';
import { X, Upload, Camera } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

interface PODUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipmentId: string;
  onUploadSuccess: () => void;
}

export function PODUploadModal({ isOpen, onClose, shipmentId, onUploadSuccess }: PODUploadModalProps) {
  const { toast } = useToast();
  
  const [receiverName, setReceiverName] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [osdReported, setOsdReported] = useState(false);
  const [osdNotes, setOsdNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'upload'>('draw');

  const sigInputRef = useRef<HTMLInputElement>(null);
  const sigPadRef = useRef<SignatureCanvas>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverName.trim()) {
      toast('Receiver name is required.', 'error');
      return;
    }

    let finalSignatureFile = signatureFile;

    if (signatureMode === 'draw') {
      if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
        toast('Receiver signature is required.', 'error');
        return;
      }
      const dataUrl = sigPadRef.current.getCanvas().toDataURL('image/png');
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)![1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      finalSignatureFile = new window.File([u8arr], 'signature.png', { type: mime });
    } else {
      if (!finalSignatureFile) {
        toast('Receiver signature is required.', 'error');
        return;
      }
    }

    if (osdReported && photoFiles.length === 0) {
      toast('Photos are required when OS&D is reported.', 'error');
      return;
    }

    setLoading(true);
    try {
      await ShipmentAPI.uploadPODComplete(shipmentId, receiverName, deliveryNotes, finalSignatureFile, photoFiles, osdReported, osdNotes);
      toast('Proof of Delivery submitted successfully.', 'success');
      onUploadSuccess();
      onClose();
    } catch (err: any) {
      let errorMsg = 'Failed to submit POD';
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMsg = err.response.data.detail[0].msg || errorMsg;
        } else if (typeof err.response.data.detail === 'string') {
          errorMsg = err.response.data.detail;
        }
      }
      toast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setPhotoFiles(prev => [...prev, ...files]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Upload Proof of Delivery</h3>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5"/></Button>
        </div>
        <div className="p-4 overflow-y-auto">
          <form id="pod-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="receiver-name">Receiver Name <span className="text-red-500">*</span></Label>
              <Input 
                id="receiver-name" 
                value={receiverName} 
                onChange={(e) => setReceiverName(e.target.value)} 
                placeholder="e.g. John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Receiver Signature <span className="text-red-500">*</span></Label>
              
              <div className="flex bg-muted p-1 rounded-md mb-2">
                <button
                  type="button"
                  className={`flex-1 py-1 text-sm font-medium rounded-sm transition-colors ${signatureMode === 'draw' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                  onClick={() => setSignatureMode('draw')}
                >
                  Draw
                </button>
                <button
                  type="button"
                  className={`flex-1 py-1 text-sm font-medium rounded-sm transition-colors ${signatureMode === 'upload' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                  onClick={() => setSignatureMode('upload')}
                >
                  Upload Image
                </button>
              </div>

              {signatureMode === 'draw' ? (
                <div className="border rounded-lg bg-white overflow-hidden relative">
                  <SignatureCanvas 
                    ref={sigPadRef} 
                    backgroundColor="white"
                    canvasProps={{className: 'w-full h-40 bg-white cursor-crosshair'}}
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-2 right-2 h-7 px-2 text-xs"
                    onClick={() => sigPadRef.current?.clear()}
                  >
                    Clear
                  </Button>
                </div>
              ) : (
                <div 
                  className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => sigInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={sigInputRef} 
                    accept="image/*,.pdf" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSignatureFile(e.target.files[0]);
                      }
                    }} 
                  />
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {signatureFile ? signatureFile.name : 'Click to select signature file'}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Delivery Photos {osdReported ? <span className="text-red-500">*</span> : '(Optional)'}</Label>
              <div 
                className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => photoInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  className="hidden" 
                  ref={photoInputRef} 
                  accept="image/*" 
                  multiple
                  onChange={handlePhotoSelect} 
                />
                <Camera className="h-6 w-6 text-muted-foreground mb-2" />
                <span className="text-sm font-medium text-muted-foreground">Click to add photos</span>
              </div>
              
              {photoFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {photoFiles.map((file, idx) => (
                    <div key={idx} className="relative border rounded p-1 flex items-center justify-between group">
                      <span className="text-xs truncate max-w-[80%]">{file.name}</span>
                      <button 
                        type="button" 
                        onClick={() => removePhoto(idx)} 
                        className="text-red-500 bg-red-50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery-notes">Delivery Notes (Optional)</Label>
              <Textarea 
                id="delivery-notes" 
                value={deliveryNotes} 
                onChange={(e) => setDeliveryNotes(e.target.value)} 
                placeholder="Any issues, delays, or additional info"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="osd-reported"
                checked={osdReported}
                onChange={(e) => setOsdReported(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <Label htmlFor="osd-reported">Report OS&D (Over, Short, and Damaged)</Label>
            </div>

            {osdReported && (
              <div className="space-y-2">
                <Label htmlFor="osd-notes">OS&D Details <span className="text-red-500">*</span></Label>
                <Textarea 
                  id="osd-notes" 
                  value={osdNotes} 
                  onChange={(e) => setOsdNotes(e.target.value)} 
                  placeholder="Describe what was over, short, or damaged..."
                  rows={3}
                  required
                />
              </div>
            )}

            <div className="pt-4 border-t flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit POD'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
