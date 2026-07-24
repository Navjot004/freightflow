import React from 'react';
import type { Invoice } from '../api';
import { updateInvoiceStatus } from '../api';
import { Button } from '../../../components/ui/button';
import { useToast } from '../../../components/ui/Toast';
import { Printer, CheckCircle2, X, FileText, MapPin } from 'lucide-react';

interface InvoiceDetailModalProps {
  invoice: Invoice;
  onClose: () => void;
  onRefresh: () => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  onClose,
  onRefresh
}) => {
  const { toast } = useToast();
  const [updating, setUpdating] = React.useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleMarkPaid = async () => {
    try {
      setUpdating(true);
      await updateInvoiceStatus(invoice.id, 'PAID');
      toast('Invoice marked as PAID', 'success');
      onRefresh();
      onClose();
    } catch (e: any) {
      toast(e.response?.data?.detail || 'Failed to update invoice', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const formatRelationshipLabel = (rel: string) => {
    switch (rel) {
      case 'BROKER_TO_SHIPPER': return 'Broker ➔ Shipper';
      case 'CARRIER_TO_SHIPPER': return 'Carrier ➔ Shipper';
      case 'OWNER_OPERATOR_TO_SHIPPER': return 'Owner-Operator ➔ Shipper';
      case 'CARRIER_TO_BROKER': return 'Carrier ➔ Broker';
      case 'OWNER_OPERATOR_TO_BROKER': return 'Owner-Operator ➔ Broker';
      case 'OWNER_OPERATOR_TO_CARRIER': return 'Owner-Operator ➔ Carrier';
      default: return rel.replace(/_/g, ' ');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold rounded-full text-xs border border-emerald-200">PAID</span>;
      case 'ISSUED':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-semibold rounded-full text-xs border border-blue-200">ISSUED (PENDING)</span>;
      case 'OVERDUE':
        return <span className="px-3 py-1 bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-semibold rounded-full text-xs border border-rose-200">OVERDUE</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 font-semibold rounded-full text-xs border border-gray-200">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative max-w-3xl w-full bg-background rounded-3xl shadow-2xl border border-border overflow-hidden print:border-none print:shadow-none print:max-w-none">
        
        {/* Action Header Bar (Hidden in Print) */}
        <div className="p-4 border-b border-border bg-muted/40 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm text-foreground">Invoice #{invoice.invoice_number}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5 rounded-xl">
              <Printer className="w-4 h-4" /> Print / PDF
            </Button>

            {invoice.status !== 'PAID' && (
              <Button
                size="sm"
                onClick={handleMarkPaid}
                disabled={updating}
                className="gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="w-4 h-4" /> Mark as Paid
              </Button>
            )}

            <Button size="sm" variant="ghost" onClick={onClose} className="rounded-xl p-2">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div className="p-8 space-y-8 bg-background text-foreground print:p-6" id="printable-invoice">
          
          {/* Header Row */}
          <div className="flex justify-between items-start border-b border-border pb-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-primary">INVOICE</h1>
              <p className="text-sm font-mono text-muted-foreground mt-1">#{invoice.invoice_number}</p>
              <div className="mt-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-muted text-muted-foreground border">
                  {formatRelationshipLabel(invoice.relationship_type)}
                </span>
              </div>
            </div>

            <div className="text-right space-y-1.5">
              <div>{getStatusBadge(invoice.status)}</div>
              <div className="text-xs text-muted-foreground mt-2">
                <strong>Issued Date:</strong> {new Date(invoice.created_at).toLocaleDateString()}
              </div>
              {invoice.due_date && (
                <div className="text-xs text-muted-foreground">
                  <strong>Due Date:</strong> {new Date(invoice.due_date).toLocaleDateString()}
                </div>
              )}
              {invoice.paid_at && (
                <div className="text-xs text-emerald-600 font-semibold">
                  <strong>Paid On:</strong> {new Date(invoice.paid_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Issuer & Recipient Company Cards */}
          <div className="grid grid-cols-2 gap-6">
            {/* Issuer (Billed By) */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/60">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Billed By (Issuer)</span>
              <h3 className="font-bold text-base text-foreground mt-1">{invoice.issuer_company?.name || 'Company'}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Type: {invoice.issuer_company?.type || 'Logistics Partner'}</p>
              {invoice.issuer_company?.mc_number && (
                <p className="text-xs text-muted-foreground font-mono">MC #: {invoice.issuer_company.mc_number}</p>
              )}
              {invoice.issuer_company?.dot_number && (
                <p className="text-xs text-muted-foreground font-mono">DOT #: {invoice.issuer_company.dot_number}</p>
              )}
            </div>

            {/* Recipient (Billed To) */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/60">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Billed To (Recipient)</span>
              <h3 className="font-bold text-base text-foreground mt-1">{invoice.recipient_company?.name || 'Recipient Company'}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Type: {invoice.recipient_company?.type || 'Customer'}</p>
              {invoice.recipient_company?.mc_number && (
                <p className="text-xs text-muted-foreground font-mono">MC #: {invoice.recipient_company.mc_number}</p>
              )}
            </div>
          </div>

          {/* Load & Route Information */}
          {invoice.load && (
            <div className="p-4 rounded-2xl border border-border bg-card space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Shipment Route Details
                </span>
                <span className="text-xs font-mono text-muted-foreground">Load ID: {invoice.load.id.substring(0, 8)}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px]">ORIGIN</span>
                  <span className="font-medium">{invoice.load.origin_address}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">DESTINATION</span>
                  <span className="font-medium">{invoice.load.destination_address}</span>
                </div>
              </div>
            </div>
          )}

          {/* Financial Breakdown Table */}
          <div className="border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/60 text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-right">Amount (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">Base Linehaul Freight Charge</td>
                  <td className="px-4 py-3 text-right font-mono">${invoice.linehaul_amount.toFixed(2)}</td>
                </tr>
                {invoice.fuel_surcharge > 0 && (
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground">Fuel Surcharge (FSC)</td>
                    <td className="px-4 py-3 text-right font-mono">${invoice.fuel_surcharge.toFixed(2)}</td>
                  </tr>
                )}
                {invoice.accessorials_amount > 0 && (
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground">Accessorials & Detention Charges</td>
                    <td className="px-4 py-3 text-right font-mono">${invoice.accessorials_amount.toFixed(2)}</td>
                  </tr>
                )}
                {invoice.tax_amount > 0 && (
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground">Applicable Taxes</td>
                    <td className="px-4 py-3 text-right font-mono">${invoice.tax_amount.toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-muted/30 font-bold border-t border-border">
                <tr>
                  <td className="px-4 py-3 text-sm text-foreground">Total Invoice Amount</td>
                  <td className="px-4 py-3 text-right text-base text-primary font-mono">${invoice.amount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment Notes & Terms */}
          {invoice.notes && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs">
              <span className="font-bold block mb-1">Payment Instructions & Notes:</span>
              <p className="whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-6 border-t border-border text-[11px] text-muted-foreground">
            Thank you for working with FreightFlow Transportation Management Platform.
          </div>

        </div>
      </div>
    </div>
  );
};
