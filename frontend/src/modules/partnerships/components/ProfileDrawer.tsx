import React from 'react';
import { X, MapPin, Truck, Star, FileText, Activity, Building, User } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import type { PartnerDirectoryItem, Company } from '../api';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  partner: PartnerDirectoryItem | null;
  onAction?: (action: 'partner' | 'assign', partner: PartnerDirectoryItem) => void;
}

export function ProfileDrawer({ isOpen, onClose, partner, onAction }: ProfileDrawerProps) {
  if (!isOpen || !partner) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto border-l border-border`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background/95 dark:bg-slate-900/95 backdrop-blur z-10">
          <h2 className="text-lg font-semibold text-foreground">Company Profile</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Header Info */}
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 bg-slate-100 bg-muted rounded-lg flex items-center justify-center border border-border">
                {partner.company.type === 'BROKER' ? <Building className="h-8 w-8 text-slate-400" /> : partner.company.type === 'CARRIER' ? <Truck className="h-8 w-8 text-slate-400" /> : <User className="h-8 w-8 text-slate-400" />}
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">{partner.company.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {partner.company.type === 'BROKER' ? 'Brokerage' : partner.company.type === 'CARRIER' ? 'Carrier Company' : 'Owner Operator'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">
                <Star className="h-4 w-4 fill-current mr-1" />
                <span className="font-semibold text-yellow-700 dark:text-yellow-500">{partner.rating}</span>
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-foreground">{partner.completed_shipments}</span> Shipments
              </div>
            </div>
          </div>

          {/* Details */}
          {partner.company.type !== 'BROKER' && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Equipment & Fleet</h4>
              <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-4 border border-border space-y-3">
                {partner.company.type === 'CARRIER' ? (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Fleet Size</span>
                    <span className="text-foreground font-medium">{partner.profile?.fleet_size || 0} Trucks</span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Vehicle Type</span>
                    <span className="text-foreground font-medium">{partner.vehicle?.equipment_type || 'Unknown'}</span>
                  </div>
                )}
                
                {partner.company.type === 'CARRIER' && (
                  <div>
                    <span className="text-muted-foreground text-sm block mb-2">Equipment Types</span>
                    <div className="flex flex-wrap gap-2">
                      {(partner.profile?.equipment_types?.length ? partner.profile.equipment_types : ['Dry Van', 'Reefer']).map(eq => (
                        <span key={eq} className="bg-background border border-border text-foreground px-2.5 py-1 rounded-full text-xs font-medium">
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Operations */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Operations</h4>
            <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-4 border border-border space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">Operating Regions</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {partner.company.type === 'CARRIER' 
                      ? (partner.profile?.operating_regions?.length ? partner.profile.operating_regions : ['National']).join(', ')
                      : 'National'
                    }
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">Performance Metrics</div>
                  <div className="text-sm text-muted-foreground mt-1 flex gap-4">
                    <span>On-time: <strong className="text-foreground">{partner.on_time_percentage}%</strong></span>
                    <span>Acceptance: <strong className="text-foreground">{partner.acceptance_rate}%</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* About/Documents */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Documents</h4>
            <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-slate-400" />
                <span className="text-sm font-medium text-foreground">Insurance Certificate</span>
              </div>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">Verified</span>
            </div>
            <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-slate-400" />
                <span className="text-sm font-medium text-foreground">Operating Authority</span>
              </div>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">Verified</span>
            </div>
          </div>

        </div>

        {/* Actions Footer */}
        {onAction && (
          <div className="sticky bottom-0 p-4 bg-background border-t border-border flex gap-3">
            {partner.partnership_status !== 'CONNECTED' && partner.partnership_status !== 'PENDING' && (
              <Button className="flex-1" onClick={() => onAction('partner', partner)}>
                Send Partnership Request
              </Button>
            )}
            {partner.partnership_status === 'CONNECTED' && (
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => onAction('assign', partner)}>
                Assign Shipment
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
