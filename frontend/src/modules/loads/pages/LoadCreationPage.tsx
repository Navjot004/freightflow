import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../core/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { LocationSearchInput } from '../../../components/ui/LocationSearchInput';
import { Label } from '../../../components/ui/label';
import {
  MapPin, Calendar, Truck, Scale, Package, FileText, ShieldCheck,
  ArrowRight, ArrowLeft, CheckCircle2, DollarSign, AlertCircle
} from 'lucide-react';

export default function LoadCreationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState<1 | 2>(1);

  // Focus-reveal preset states
  const [showWeightPresets, setShowWeightPresets] = useState(false);
  const [showDimPresets, setShowDimPresets] = useState(false);

  // Structured Cargo Dimensions states
  const [dimLength, setDimLength] = useState('');
  const [dimWidth, setDimWidth] = useState('');
  const [dimHeight, setDimHeight] = useState('');
  const [dimUnit, setDimUnit] = useState('ft');

  const handleDimensionChange = (l: string, w: string, h: string, u: string) => {
    setDimLength(l);
    setDimWidth(w);
    setDimHeight(h);
    setDimUnit(u);

    if (l || w || h) {
      const formatted = `${l || '0'}${u} × ${w || '0'}${u} × ${h || '0'}${u}`;
      setFormData(prev => ({ ...prev, dimensions: formatted }));
    } else {
      setFormData(prev => ({ ...prev, dimensions: '' }));
    }
  };

  const [formData, setFormData] = useState({
    origin_address: '',
    destination_address: '',
    pickup_date: '',
    delivery_date: '',
    equipment_type: 'DRY_VAN',
    weight_lbs: '',
    rate: '',
    commodity: '',
    dimensions: '',
    special_instructions: '',
    pickup_appointment_date: '',
    pickup_appointment_time: '',
    pickup_contact_person: '',
    pickup_contact_number: '',
    pickup_dock_number: '',
    pickup_reference_number: '',
    pickup_special_instructions: '',
    delivery_appointment_date: '',
    delivery_appointment_time: '',
    delivery_contact_person: '',
    delivery_contact_number: '',
    delivery_dock_number: '',
    delivery_reference_number: '',
    delivery_special_instructions: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      // Auto-populate Step 2 appointment date & time when Step 1 expected date is selected
      if (name === 'pickup_date' && value) {
        const parts = value.split('T');
        const datePart = parts[0];
        const timePart = parts[1];

        if (datePart && (!prev.pickup_appointment_date || prev.pickup_appointment_date === prev.pickup_date.split('T')[0])) {
          updated.pickup_appointment_date = datePart;
        }
        if (timePart && (!prev.pickup_appointment_time || prev.pickup_appointment_time === prev.pickup_date.split('T')[1])) {
          updated.pickup_appointment_time = timePart;
        }
      }

      if (name === 'delivery_date' && value) {
        const parts = value.split('T');
        const datePart = parts[0];
        const timePart = parts[1];

        if (datePart && (!prev.delivery_appointment_date || prev.delivery_appointment_date === prev.delivery_date.split('T')[0])) {
          updated.delivery_appointment_date = datePart;
        }
        if (timePart && (!prev.delivery_appointment_time || prev.delivery_appointment_time === prev.delivery_date.split('T')[1])) {
          updated.delivery_appointment_time = timePart;
        }
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload: any = {
        ...formData,
        pickup_date: new Date(formData.pickup_date).toISOString(),
        delivery_date: new Date(formData.delivery_date).toISOString(),
        weight_lbs: parseInt(formData.weight_lbs) || 0,
        rate: formData.rate ? parseFloat(formData.rate) : null
      };

      if (formData.pickup_appointment_date) {
        payload.pickup_appointment_date = new Date(formData.pickup_appointment_date).toISOString();
      } else {
        delete payload.pickup_appointment_date;
      }
      
      if (formData.delivery_appointment_date) {
        payload.delivery_appointment_date = new Date(formData.delivery_appointment_date).toISOString();
      } else {
        delete payload.delivery_appointment_date;
      }

      await api.post('/loads', payload);
      navigate('/loads/my-loads');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create load. Please check required fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Title & Step Progress Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Post a Freight Load</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Publish your shipment details to the marketplace or assign directly to carriers.
          </p>
        </div>

        <Button variant="outline" onClick={() => navigate('/loads/my-loads')} className="rounded-xl text-xs">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to My Loads
        </Button>
      </div>

      {/* Step Indicator Pills Bar */}
      <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-2xl border border-border">
        <button
          type="button"
          onClick={() => setActiveStep(1)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs transition-all ${
            activeStep === 1
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px] font-bold">1</div>
          <span>Route & Cargo Specifications</span>
        </button>

        <div className="text-muted-foreground font-mono text-xs">➔</div>

        <button
          type="button"
          onClick={() => setActiveStep(2)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs transition-all ${
            activeStep === 2
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px] font-bold">2</div>
          <span>Confidential Appointments & Contact Info</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900 rounded-2xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Main 2-Column Grid Layout (Left: Form Card | Right: Live Marketplace Preview Card) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Form Section (2 Columns Wide) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* STEP 1: Route & Freight Specs */}
            {activeStep === 1 && (
              <Card className="rounded-3xl shadow-sm border border-border overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border p-5">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                    <MapPin className="w-5 h-5 text-emerald-500" /> Route & Cargo Details
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-6 space-y-5">
                  
                  {/* Origin & Destination */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Origin Location *
                      </Label>
                      <LocationSearchInput
                        id="origin_address"
                        name="origin_address"
                        value={formData.origin_address}
                        onChange={(val) => setFormData(prev => ({...prev, origin_address: val}))}
                        required
                        placeholder="City, State or ZIP Code"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" /> Destination Location *
                      </Label>
                      <LocationSearchInput
                        id="destination_address"
                        name="destination_address"
                        value={formData.destination_address}
                        onChange={(val) => setFormData(prev => ({...prev, destination_address: val}))}
                        required
                        placeholder="City, State or ZIP Code"
                      />
                    </div>
                  </div>

                  {/* Pickup & Delivery Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" /> Expected Pickup Date & Time *
                      </Label>
                      <Input
                        type="datetime-local"
                        id="pickup_date"
                        name="pickup_date"
                        value={formData.pickup_date}
                        onChange={handleChange}
                        required
                        className="rounded-xl text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-purple-500" /> Expected Delivery Date & Time *
                      </Label>
                      <Input
                        type="datetime-local"
                        id="delivery_date"
                        name="delivery_date"
                        value={formData.delivery_date}
                        onChange={handleChange}
                        required
                        className="rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  {/* Equipment, Weight & Offered Rate */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-amber-500" /> Equipment Type *
                      </Label>
                      <select
                        id="equipment_type"
                        name="equipment_type"
                        value={formData.equipment_type}
                        onChange={handleChange}
                        className="h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="DRY_VAN">Dry Van</option>
                        <option value="REEFER">Reefer</option>
                        <option value="FLATBED">Flatbed</option>
                        <option value="POWER_ONLY">Power Only</option>
                      </select>
                    </div>

                    <div className="space-y-2 relative">
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-cyan-500" /> Total Weight (lbs) *
                      </Label>
                      <Input
                        type="number"
                        id="weight_lbs"
                        name="weight_lbs"
                        value={formData.weight_lbs}
                        onChange={handleChange}
                        onFocus={() => setShowWeightPresets(true)}
                        onBlur={() => setTimeout(() => setShowWeightPresets(false), 200)}
                        required
                        min={1}
                        placeholder="Click to pick or type weight e.g. 42000"
                        className="rounded-xl text-xs font-mono"
                      />

                      {/* Focus Revealed Quick Weight Presets */}
                      {showWeightPresets && (
                        <div
                          onMouseDown={(e) => e.preventDefault()}
                          className="flex flex-wrap items-center gap-1.5 pt-1.5 pb-1 transition-all animate-in fade-in slide-in-from-top-1 duration-150"
                        >
                          <span className="text-[11px] font-bold text-muted-foreground mr-1">Quick Select:</span>
                          {[
                            { label: '10,000 lbs (LTL)', val: '10000' },
                            { label: '24,000 lbs (Partial)', val: '24000' },
                            { label: '42,000 lbs (Standard FTL)', val: '42000' },
                            { label: '45,000 lbs (Max FTL)', val: '45000' }
                          ].map((preset) => (
                            <button
                              key={preset.val}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, weight_lbs: preset.val }));
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-xs ${
                                formData.weight_lbs === preset.val
                                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-600/20'
                                  : 'bg-background hover:bg-muted text-foreground border-border hover:border-cyan-500/50'
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Target Rate ($)
                      </Label>
                      <Input
                        type="number"
                        id="rate"
                        name="rate"
                        value={formData.rate}
                        onChange={handleChange}
                        placeholder="e.g. 2500"
                        className="rounded-xl text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Commodity & Dimensions */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-indigo-500" /> Commodity Description
                      </Label>
                      <Input
                        type="text"
                        id="commodity"
                        name="commodity"
                        value={formData.commodity}
                        onChange={handleChange}
                        placeholder="e.g. Electronics, Frozen Poultry, Pallets"
                        className="rounded-xl text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-slate-500" /> Cargo Dimensions (Length × Width × Height)
                        </Label>
                        {formData.dimensions && (
                          <span className="text-[11px] font-mono text-primary font-bold">
                            Total: {formData.dimensions}
                          </span>
                        )}
                      </div>

                      <div
                        className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center"
                        onFocus={() => setShowDimPresets(true)}
                        onBlur={() => setTimeout(() => setShowDimPresets(false), 200)}
                      >
                        {/* Length */}
                        <div className="relative">
                          <Input
                            type="number"
                            step="any"
                            placeholder="Length (L)"
                            value={dimLength}
                            onChange={(e) => handleDimensionChange(e.target.value, dimWidth, dimHeight, dimUnit)}
                            className="rounded-xl text-xs font-mono pr-8"
                            min={0}
                          />
                          <span className="absolute right-3 top-2.5 text-[10px] font-bold text-muted-foreground uppercase">{dimUnit}</span>
                        </div>

                        {/* Width */}
                        <div className="relative">
                          <Input
                            type="number"
                            step="any"
                            placeholder="Width (W)"
                            value={dimWidth}
                            onChange={(e) => handleDimensionChange(dimLength, e.target.value, dimHeight, dimUnit)}
                            className="rounded-xl text-xs font-mono pr-8"
                            min={0}
                          />
                          <span className="absolute right-3 top-2.5 text-[10px] font-bold text-muted-foreground uppercase">{dimUnit}</span>
                        </div>

                        {/* Height */}
                        <div className="relative">
                          <Input
                            type="number"
                            step="any"
                            placeholder="Height (H)"
                            value={dimHeight}
                            onChange={(e) => handleDimensionChange(dimLength, dimWidth, e.target.value, dimUnit)}
                            className="rounded-xl text-xs font-mono pr-8"
                            min={0}
                          />
                          <span className="absolute right-3 top-2.5 text-[10px] font-bold text-muted-foreground uppercase">{dimUnit}</span>
                        </div>

                        {/* Unit Selection Dropdown */}
                        <div>
                          <select
                            value={dimUnit}
                            onChange={(e) => handleDimensionChange(dimLength, dimWidth, dimHeight, e.target.value)}
                            className="h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="ft">Feet (ft)</option>
                            <option value="in">Inches (in)</option>
                            <option value="m">Meters (m)</option>
                            <option value="cm">Centimeters (cm)</option>
                          </select>
                        </div>
                      </div>

                      {/* Focus Revealed Quick Dimension Presets */}
                      {showDimPresets && (
                        <div
                          onMouseDown={(e) => e.preventDefault()}
                          className="flex flex-wrap items-center gap-1.5 pt-1.5 pb-1 transition-all animate-in fade-in slide-in-from-top-1 duration-150"
                        >
                          <span className="text-[11px] font-bold text-muted-foreground mr-1">Quick Dimensions:</span>
                          {[
                            { label: '53ft Dry Van (53 × 8.5 × 9 ft)', l: '53', w: '8.5', h: '9', u: 'ft' },
                            { label: '48ft Flatbed (48 × 8.5 × 8.5 ft)', l: '48', w: '8.5', h: '8.5', u: 'ft' },
                            { label: '26ft Box Truck (26 × 8 × 8 ft)', l: '26', w: '8', h: '8', u: 'ft' }
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => handleDimensionChange(preset.l, preset.w, preset.h, preset.u)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-background hover:bg-muted text-foreground border border-border hover:border-primary/50 transition-all shadow-xs"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Special Instructions */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-500" /> Special Handling Instructions
                    </Label>
                    <textarea
                      id="special_instructions"
                      name="special_instructions"
                      value={formData.special_instructions}
                      onChange={handleChange}
                      placeholder="e.g. Driver assist required, tarps needed, food grade trailer only"
                      className="flex min-h-[90px] w-full rounded-2xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {/* Next Step Button */}
                  <div className="pt-4 border-t border-border flex justify-end">
                    <Button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      className="rounded-xl text-xs bg-primary text-primary-foreground font-bold px-6 py-2.5 gap-2"
                    >
                      Next: Facility Appointments & Contacts <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>

                </CardContent>
              </Card>
            )}

            {/* STEP 2: Confidential Appointments & Contact Info */}
            {activeStep === 2 && (
              <Card className="rounded-3xl shadow-sm border border-border overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border p-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                      <ShieldCheck className="w-5 h-5 text-indigo-500" /> Confidential Facility Appointments & Contacts
                    </CardTitle>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                      Hidden from Marketplace (Carrier Only)
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  
                  {/* Pickup Facility Section */}
                  <div className="p-5 rounded-2xl border border-border bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                      <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-500" /> Pickup Facility Information
                      </h4>
                      <span className="text-[10px] text-muted-foreground">Origin Stop</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-[11px]">Appointment Date</Label>
                          {formData.pickup_appointment_date && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              ✓ Auto-filled
                            </span>
                          )}
                        </div>
                        <Input
                          type="date"
                          id="pickup_appointment_date"
                          name="pickup_appointment_date"
                          value={formData.pickup_appointment_date}
                          onChange={handleChange}
                          className="rounded-xl text-xs h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-[11px]">Appointment Time</Label>
                          {formData.pickup_appointment_time && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              ✓ Auto-filled
                            </span>
                          )}
                        </div>
                        <Input
                          type="time"
                          id="pickup_appointment_time"
                          name="pickup_appointment_time"
                          value={formData.pickup_appointment_time}
                          onChange={handleChange}
                          className="rounded-xl text-xs h-9"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[11px]">Contact Person</Label>
                        <Input
                          type="text"
                          id="pickup_contact_person"
                          name="pickup_contact_person"
                          value={formData.pickup_contact_person}
                          onChange={handleChange}
                          placeholder="e.g. John Doe (Shipping Mgr)"
                          className="rounded-xl text-xs h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px]">Contact Phone Number</Label>
                        <Input
                          type="tel"
                          id="pickup_contact_number"
                          name="pickup_contact_number"
                          value={formData.pickup_contact_number}
                          onChange={handleChange}
                          placeholder="e.g. +1 (555) 019-2834"
                          className="rounded-xl text-xs h-9"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[11px]">Dock Bay #</Label>
                        <Input
                          type="text"
                          id="pickup_dock_number"
                          name="pickup_dock_number"
                          value={formData.pickup_dock_number}
                          onChange={handleChange}
                          placeholder="e.g. Bay 14"
                          className="rounded-xl text-xs h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px]">Pickup Reference / BOL #</Label>
                        <Input
                          type="text"
                          id="pickup_reference_number"
                          name="pickup_reference_number"
                          value={formData.pickup_reference_number}
                          onChange={handleChange}
                          placeholder="e.g. PU-98231"
                          className="rounded-xl text-xs h-9 font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px]">Facility Access / Gate Code Instructions</Label>
                      <Input
                        type="text"
                        id="pickup_special_instructions"
                        name="pickup_special_instructions"
                        value={formData.pickup_special_instructions}
                        onChange={handleChange}
                        placeholder="e.g. Check in at Guard Gate 2, Gate code #4092"
                        className="rounded-xl text-xs h-9"
                      />
                    </div>
                  </div>

                  {/* Delivery Facility Section */}
                  <div className="p-5 rounded-2xl border border-border bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                      <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-rose-500" /> Delivery Facility Information
                      </h4>
                      <span className="text-[10px] text-muted-foreground">Destination Stop</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-[11px]">Appointment Date</Label>
                          {formData.delivery_appointment_date && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              ✓ Auto-filled
                            </span>
                          )}
                        </div>
                        <Input
                          type="date"
                          id="delivery_appointment_date"
                          name="delivery_appointment_date"
                          value={formData.delivery_appointment_date}
                          onChange={handleChange}
                          className="rounded-xl text-xs h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-[11px]">Appointment Time</Label>
                          {formData.delivery_appointment_time && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              ✓ Auto-filled
                            </span>
                          )}
                        </div>
                        <Input
                          type="time"
                          id="delivery_appointment_time"
                          name="delivery_appointment_time"
                          value={formData.delivery_appointment_time}
                          onChange={handleChange}
                          className="rounded-xl text-xs h-9"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[11px]">Contact Person</Label>
                        <Input
                          type="text"
                          id="delivery_contact_person"
                          name="delivery_contact_person"
                          value={formData.delivery_contact_person}
                          onChange={handleChange}
                          placeholder="e.g. Receiver Desk"
                          className="rounded-xl text-xs h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px]">Contact Phone Number</Label>
                        <Input
                          type="tel"
                          id="delivery_contact_number"
                          name="delivery_contact_number"
                          value={formData.delivery_contact_number}
                          onChange={handleChange}
                          placeholder="e.g. +1 (555) 012-9843"
                          className="rounded-xl text-xs h-9"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[11px]">Dock Door #</Label>
                        <Input
                          type="text"
                          id="delivery_dock_number"
                          name="delivery_dock_number"
                          value={formData.delivery_dock_number}
                          onChange={handleChange}
                          placeholder="e.g. Door 8"
                          className="rounded-xl text-xs h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px]">Purchase Order / PO #</Label>
                        <Input
                          type="text"
                          id="delivery_reference_number"
                          name="delivery_reference_number"
                          value={formData.delivery_reference_number}
                          onChange={handleChange}
                          placeholder="e.g. PO-88741"
                          className="rounded-xl text-xs h-9 font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px]">Receiver Delivery Instructions</Label>
                      <Input
                        type="text"
                        id="delivery_special_instructions"
                        name="delivery_special_instructions"
                        value={formData.delivery_special_instructions}
                        onChange={handleChange}
                        placeholder="e.g. Call 1 hour prior to arrival for dock assignment"
                        className="rounded-xl text-xs h-9"
                      />
                    </div>
                  </div>

                  {/* Step Buttons */}
                  <div className="pt-4 border-t border-border flex items-center justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveStep(1)}
                      className="rounded-xl text-xs gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to Route & Specs
                    </Button>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="rounded-xl text-xs bg-primary text-primary-foreground font-bold px-6 py-2.5 gap-2"
                    >
                      {loading ? 'Publishing Load...' : 'Post Load to Marketplace'} <CheckCircle2 className="w-4 h-4" />
                    </Button>
                  </div>

                </CardContent>
              </Card>
            )}
          </form>
        </div>

        {/* Right Column: Live Marketplace Card Preview */}
        <div className="space-y-6">
          <div className="sticky top-6">
            <Card className="rounded-3xl shadow-xl border border-primary/20 bg-gradient-to-b from-card to-muted/30 overflow-hidden">
              <CardHeader className="bg-primary/10 border-b border-primary/20 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Truck className="w-4 h-4" /> Live Card Preview
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                    Marketplace Ready
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                
                {/* Route Header */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0 mt-1" />
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">ORIGIN</span>
                      <div className="text-sm font-bold text-foreground">
                        {formData.origin_address || 'Origin Address (City, State)'}
                      </div>
                    </div>
                  </div>

                  <div className="pl-1.5 py-1">
                    <div className="w-0.5 h-6 bg-border border-dashed border-l-2" />
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-rose-500 shrink-0 mt-1" />
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">DESTINATION</span>
                      <div className="text-sm font-bold text-foreground">
                        {formData.destination_address || 'Destination Address (City, State)'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-background border border-border/80 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">EQUIPMENT</span>
                    <span className="font-semibold text-foreground">{formData.equipment_type.replace('_', ' ')}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground block">WEIGHT</span>
                    <span className="font-semibold text-foreground font-mono">{formData.weight_lbs ? `${formData.weight_lbs} lbs` : 'Not set'}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground block">TARGET RATE</span>
                    <span className="font-extrabold text-primary font-mono">{formData.rate ? `$${formData.rate}` : 'Open to Bids'}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground block">COMMODITY</span>
                    <span className="font-semibold text-foreground truncate block">{formData.commodity || 'General Freight'}</span>
                  </div>
                </div>

                {/* Schedule info */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Pickup Date:</span>
                    <span className="font-medium text-foreground">
                      {formData.pickup_date ? new Date(formData.pickup_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Delivery Date:</span>
                    <span className="font-medium text-foreground">
                      {formData.delivery_date ? new Date(formData.delivery_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Submit CTA */}
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !formData.origin_address || !formData.destination_address || !formData.pickup_date || !formData.delivery_date || !formData.weight_lbs}
                  className="w-full h-12 rounded-2xl text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-[0.98]"
                >
                  {loading ? 'Posting Load...' : 'Post Load Now'}
                </Button>

                <p className="text-[11px] text-center text-muted-foreground">
                  Loads posted to the marketplace are immediately visible to eligible carriers and brokers.
                </p>

              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
