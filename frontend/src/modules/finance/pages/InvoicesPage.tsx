import React, { useState, useEffect, useMemo } from 'react';
import type { Invoice } from '../api';
import { getInvoices, updateInvoiceStatus } from '../api';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useToast } from '../../../components/ui/Toast';
import {
  FileText, Plus, Search, RefreshCw, X, DollarSign,
  CheckCircle2, Clock, AlertCircle, Printer, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';

import { CreateInvoiceModal } from '../components/CreateInvoiceModal';
import { InvoiceDetailModal } from '../components/InvoiceDetailModal';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab: ISSUED (AR) vs RECEIVED (AP)
  const [activeTab, setActiveTab] = useState<'ISSUED' | 'RECEIVED'>('ISSUED');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [relationshipFilter, setRelationshipFilter] = useState<string>('ALL');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const { toast } = useToast();

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await getInvoices(activeTab);
      setInvoices(data);
    } catch (e) {
      console.error(e);
      toast('Failed to load invoices', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [activeTab]);

  const handleMarkPaid = async (e: React.MouseEvent, invoiceId: string) => {
    e.stopPropagation();
    try {
      await updateInvoiceStatus(invoiceId, 'PAID');
      toast('Invoice marked as PAID', 'success');
      fetchInvoices();
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Failed to update invoice', 'error');
    }
  };

  // Relationship Label Helper
  const formatRelationshipLabel = (rel: string) => {
    switch (rel) {
      case 'BROKER_TO_SHIPPER': return 'Broker ➔ Shipper';
      case 'CARRIER_TO_SHIPPER': return 'Carrier ➔ Shipper';
      case 'OWNER_OPERATOR_TO_SHIPPER': return 'Owner-Op ➔ Shipper';
      case 'CARRIER_TO_BROKER': return 'Carrier ➔ Broker';
      case 'OWNER_OPERATOR_TO_BROKER': return 'Owner-Op ➔ Broker';
      case 'OWNER_OPERATOR_TO_CARRIER': return 'Owner-Op ➔ Carrier';
      default: return rel.replace(/_/g, ' ');
    }
  };

  // Filtered Invoices Calculation
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // 1. Search Query match
      const q = searchQuery.toLowerCase().trim();
      const invNum = (inv.invoice_number || '').toLowerCase();
      const issuerName = (inv.issuer_company?.name || '').toLowerCase();
      const recipientName = (inv.recipient_company?.name || '').toLowerCase();
      const loadTitle = (inv.load?.title || '').toLowerCase();

      const matchesSearch =
        !q ||
        invNum.includes(q) ||
        issuerName.includes(q) ||
        recipientName.includes(q) ||
        loadTitle.includes(q);

      // 2. Status Match
      const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;

      // 3. Relationship Match
      const matchesRelationship =
        relationshipFilter === 'ALL' || inv.relationship_type === relationshipFilter;

      return matchesSearch && matchesStatus && matchesRelationship;
    });
  }, [invoices, searchQuery, statusFilter, relationshipFilter]);

  // Statistics Summary
  const stats = useMemo(() => {
    const totalAmount = filteredInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);
    const paidCount = filteredInvoices.filter((i) => i.status === 'PAID').length;
    const pendingAmount = filteredInvoices
      .filter((i) => i.status !== 'PAID' && i.status !== 'VOID')
      .reduce((sum, i) => sum + (i.amount || 0), 0);
    const overdueCount = filteredInvoices.filter((i) => i.status === 'OVERDUE').length;

    return { totalAmount, paidCount, pendingAmount, overdueCount };
  }, [filteredInvoices]);

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'ALL' || relationshipFilter !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setRelationshipFilter('ALL');
  };

  return (
    <div className="space-y-6">
      {/* Top Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Invoicing & Financials</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage, issue, and track multi-party freight invoices across shippers, brokers, carriers, and owner-operators.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchInvoices} disabled={loading} className="gap-2 rounded-xl">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>

          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Create Invoice
          </Button>
        </div>
      </div>

      {/* Summary KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border border-border shadow-sm p-4 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Total Invoiced</span>
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-foreground">${stats.totalAmount.toFixed(2)}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Across {filteredInvoices.length} invoices</p>
        </Card>

        <Card className="rounded-2xl border border-border shadow-sm p-4 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Outstanding Balance</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400">${stats.pendingAmount.toFixed(2)}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Awaiting payment settlement</p>
        </Card>

        <Card className="rounded-2xl border border-border shadow-sm p-4 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Paid Invoices</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{stats.paidCount}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Completed & settled</p>
        </Card>

        <Card className="rounded-2xl border border-border shadow-sm p-4 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Overdue</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-rose-600 dark:text-rose-400">{stats.overdueCount}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Passed due date</p>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="rounded-2xl shadow-sm border border-border">
        {/* Navigation Tabs Header */}
        <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-4 bg-muted/20">
          <div className="flex items-center gap-2 bg-muted p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('ISSUED')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'ISSUED'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-blue-500" /> Receivables (Issued Invoices)
            </button>

            <button
              onClick={() => setActiveTab('RECEIVED')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'RECEIVED'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-indigo-500" /> Payables (Received Invoices)
            </button>
          </div>
        </div>

        {/* Toolbar Search & Filters */}
        <CardHeader className="p-4 border-b border-border space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice #, company name, or load..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm rounded-xl"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Relationship Filter */}
            <div className="min-w-[190px]">
              <select
                value={relationshipFilter}
                onChange={(e) => setRelationshipFilter(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              >
                <option value="ALL">All Relationships</option>
                <option value="BROKER_TO_SHIPPER">Broker ➔ Shipper</option>
                <option value="CARRIER_TO_SHIPPER">Carrier ➔ Shipper</option>
                <option value="OWNER_OPERATOR_TO_SHIPPER">Owner-Operator ➔ Shipper</option>
                <option value="CARRIER_TO_BROKER">Carrier ➔ Broker</option>
                <option value="OWNER_OPERATOR_TO_BROKER">Owner-Operator ➔ Broker</option>
                <option value="OWNER_OPERATOR_TO_CARRIER">Owner-Operator ➔ Carrier</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="min-w-[140px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              >
                <option value="ALL">All Statuses</option>
                <option value="ISSUED">Issued (Pending)</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="DRAFT">Draft</option>
                <option value="VOID">Void</option>
              </select>
            </div>

            {/* Clear filters button */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs gap-1 text-muted-foreground">
                <X className="w-3.5 h-3.5" /> Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>

        {/* Invoices Table */}
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center">
              <FileText className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <h3 className="text-base font-bold text-foreground">No invoices found</h3>
              <p className="text-xs text-muted-foreground mt-1">There are no invoices matching your current tab & filter criteria.</p>
              <Button onClick={() => setShowCreateModal(true)} className="mt-4 rounded-xl text-xs bg-primary text-primary-foreground font-bold">
                + Issue New Invoice
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>{activeTab === 'ISSUED' ? 'Billed To (Recipient)' : 'Billed By (Issuer)'}</TableHead>
                  <TableHead>Route / Load</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredInvoices.map((inv) => {
                  const partnerCompany = activeTab === 'ISSUED' ? inv.recipient_company : inv.issuer_company;

                  return (
                    <TableRow
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                    >
                      {/* Invoice # */}
                      <TableCell className="font-bold text-foreground font-mono">
                        #{inv.invoice_number}
                      </TableCell>

                      {/* Relationship */}
                      <TableCell>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted border text-muted-foreground">
                          {formatRelationshipLabel(inv.relationship_type)}
                        </span>
                      </TableCell>

                      {/* Partner Company */}
                      <TableCell>
                        <div className="font-medium text-foreground">{partnerCompany?.name || 'Partner Company'}</div>
                        <div className="text-[10px] text-muted-foreground">{partnerCompany?.type || 'Logistics'}</div>
                      </TableCell>

                      {/* Load / Route */}
                      <TableCell className="text-xs">
                        {inv.load ? (
                          <div>
                            <div className="font-medium text-foreground truncate max-w-[200px]">
                              {inv.load.origin_address} ➔ {inv.load.destination_address}
                            </div>
                            <div className="text-[10px] font-mono text-muted-foreground">Load #{inv.load.id.substring(0, 8)}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Custom Charge</span>
                        )}
                      </TableCell>

                      {/* Total Amount */}
                      <TableCell className="font-extrabold text-foreground font-mono text-sm">
                        ${inv.amount.toFixed(2)}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {inv.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" /> Paid
                          </span>
                        ) : inv.status === 'ISSUED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                            <Clock className="w-3 h-3" /> Issued
                          </span>
                        ) : inv.status === 'OVERDUE' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                            <AlertCircle className="w-3 h-3" /> Overdue
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                            {inv.status}
                          </span>
                        )}
                      </TableCell>

                      {/* Due Date */}
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'N/A'}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedInvoice(inv)}
                            className="rounded-xl text-xs h-8"
                          >
                            <Printer className="w-3.5 h-3.5 mr-1" /> View / Print
                          </Button>

                          {inv.status !== 'PAID' && (
                            <Button
                              size="sm"
                              onClick={(e) => handleMarkPaid(e, inv.id)}
                              className="rounded-xl text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Paid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <CreateInvoiceModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => fetchInvoices()}
        />
      )}

      {/* Detailed Printable Invoice Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onRefresh={() => fetchInvoices()}
        />
      )}
    </div>
  );
}
