import React, { useState, useEffect } from 'react';
import type { InvoiceRelationshipType } from '../api';
import { createInvoice, getCompanyLoads } from '../api';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { useToast } from '../../../components/ui/Toast';
import { X, FilePlus, DollarSign, MapPin } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';

interface CreateInvoiceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({ onClose, onSuccess }) => {
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  const [loads, setLoads] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [selectedLoadId, setSelectedLoadId] = useState<string>('');
  const [recipientCompanyId, setRecipientCompanyId] = useState<string>('');
  const [relationshipType, setRelationshipType] = useState<InvoiceRelationshipType>('CARRIER_TO_SHIPPER');
  
  const [linehaulAmount, setLinehaulAmount] = useState<number>(0);
  const [fuelSurcharge, setFuelSurcharge] = useState<number>(0);
  const [accessorialsAmount, setAccessorialsAmount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30); // Default 30 days NET
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState<string>('Standard 30 Days NET Payment Terms. Please remit payment to account on file.');

  // Load company loads for auto-complete
  useEffect(() => {
    const fetchData = async () => {
      try {
        const loadsData = await getCompanyLoads();
        setLoads(loadsData);
      } catch (e) {
        console.error("Failed to load invoice loads", e);
      }
    };
    fetchData();
  }, []);

  // When user selects a load, auto-fill details
  const handleLoadSelect = (loadId: string) => {
    setSelectedLoadId(loadId);
    if (!loadId) return;

    const load = loads.find((l: any) => l.id === loadId);
    if (load) {
      setLinehaulAmount(load.rate || 0);

      // Auto-detect relationship type and recipient company
      const companyType = user?.company?.type;
      
      if (companyType === 'BROKER') {
        setRelationshipType('BROKER_TO_SHIPPER');
        if (load.shipper_id) setRecipientCompanyId(load.shipper_id);
      } else if (companyType === 'OWNER_OPERATOR') {
        if (load.broker_id) {
          setRelationshipType('OWNER_OPERATOR_TO_BROKER');
          setRecipientCompanyId(load.broker_id);
        } else if (load.carrier_id) {
          setRelationshipType('OWNER_OPERATOR_TO_CARRIER');
          setRecipientCompanyId(load.carrier_id);
        } else if (load.shipper_id) {
          setRelationshipType('OWNER_OPERATOR_TO_SHIPPER');
          setRecipientCompanyId(load.shipper_id);
        }
      } else if (companyType === 'CARRIER') {
        if (load.broker_id) {
          setRelationshipType('CARRIER_TO_BROKER');
          setRecipientCompanyId(load.broker_id);
        } else if (load.shipper_id) {
          setRelationshipType('CARRIER_TO_SHIPPER');
          setRecipientCompanyId(load.shipper_id);
        }
      }
    }
  };

  const calculateTotal = () => {
    return (
      (Number(linehaulAmount) || 0) +
      (Number(fuelSurcharge) || 0) +
      (Number(accessorialsAmount) || 0) +
      (Number(taxAmount) || 0)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientCompanyId) {
      toast('Please select a recipient company to bill', 'error');
      return;
    }

    if (linehaulAmount <= 0) {
      toast('Please enter a valid linehaul amount', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await createInvoice({
        recipient_company_id: recipientCompanyId,
        relationship_type: relationshipType,
        load_id: selectedLoadId || undefined,
        linehaul_amount: Number(linehaulAmount),
        fuel_surcharge: Number(fuelSurcharge),
        accessorials_amount: Number(accessorialsAmount),
        tax_amount: Number(taxAmount),
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        notes
      });

      toast('Invoice created & issued successfully!', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Failed to create invoice', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="max-w-2xl w-full shadow-2xl rounded-3xl border border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <FilePlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Create New Invoice</h2>
                <p className="text-xs text-muted-foreground">Issue an invoice to a shipper, broker, carrier, or partner</p>
              </div>
            </div>

            <Button size="sm" variant="ghost" onClick={onClose} className="rounded-xl p-2">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Step 1: Select Load (Optional auto-fill) */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Link Shipment / Load (Optional)
              </Label>
              <select
                value={selectedLoadId}
                onChange={(e) => handleLoadSelect(e.target.value)}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              >
                <option value="">-- Custom Invoice (No specific load) --</option>
                {loads.map((l: any) => (
                  <option key={l.id} value={l.id}>
                    {l.title || `Load #${l.id.substring(0, 8)}`} | {l.origin_address} ➔ {l.destination_address} (${l.rate})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Relationship & Recipient */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Invoicing Relationship</Label>
                <select
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value as InvoiceRelationshipType)}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                >
                  <option value="CARRIER_TO_SHIPPER">Carrier ➔ Shipper</option>
                  <option value="BROKER_TO_SHIPPER">Broker ➔ Shipper</option>
                  <option value="OWNER_OPERATOR_TO_SHIPPER">Owner-Operator ➔ Shipper</option>
                  <option value="CARRIER_TO_BROKER">Carrier ➔ Broker</option>
                  <option value="OWNER_OPERATOR_TO_BROKER">Owner-Operator ➔ Broker</option>
                  <option value="OWNER_OPERATOR_TO_CARRIER">Owner-Operator ➔ Carrier</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Recipient (Billed To Company ID)</Label>
                <Input
                  required
                  placeholder="Enter recipient company ID or partner"
                  value={recipientCompanyId}
                  onChange={(e) => setRecipientCompanyId(e.target.value)}
                  className="h-10 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Step 3: Financial Breakdown */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-4">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-500" /> Invoice Charges Breakdown
              </span>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Base Linehaul Rate ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={linehaulAmount}
                    onChange={(e) => setLinehaulAmount(parseFloat(e.target.value) || 0)}
                    className="h-9 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px]">Fuel Surcharge - FSC ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={fuelSurcharge}
                    onChange={(e) => setFuelSurcharge(parseFloat(e.target.value) || 0)}
                    className="h-9 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px]">Accessorials / Detention ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={accessorialsAmount}
                    onChange={(e) => setAccessorialsAmount(parseFloat(e.target.value) || 0)}
                    className="h-9 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px]">Taxes ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                    className="h-9 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {/* Total Display Box */}
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Calculated Invoice Total:</span>
                <span className="text-lg font-extrabold text-primary font-mono">${calculateTotal().toFixed(2)} USD</span>
              </div>
            </div>

            {/* Step 4: Terms & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Payment Due Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-10 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Payment Notes & Bank Details</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment instructions..."
                  className="h-10 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-xl text-xs bg-primary text-primary-foreground font-bold">
                {submitting ? 'Issuing...' : 'Create & Issue Invoice'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
