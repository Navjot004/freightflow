import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { getDriverHOSSummary, updateDriverHOS } from '../api';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useToast } from '../../../components/ui/Toast';
import {
  Activity,
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Clock,
  Coffee,
  Gauge,
  Moon,
  RefreshCw,
  X,
} from 'lucide-react';

type HOSSummary = {
  current_status: 'DRIVING' | 'ON_DUTY_NOT_DRIVING' | 'OFF_DUTY' | 'SLEEPER';
  time_in_current_status_minutes: number;
  driving_hours_remaining: number;
  on_duty_hours_remaining: number;
  cycle_hours_remaining: number;
  time_until_break_required_minutes: number;
};

type HOSWidgetProps = {
  driverId: string;
};

const clampNumber = (value: number, min = 0, max = 999) => {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
};

const formatHours = (hours: number) => `${Math.max(0, hours).toFixed(1)}h`;

const formatStatus = (status: HOSSummary['current_status']) =>
  status
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');

export const HOSWidget = ({ driverId }: HOSWidgetProps) => {
  const [summary, setSummary] = useState<HOSSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [plannedDriveHours, setPlannedDriveHours] = useState(2);
  const [plannedOnDutyHours, setPlannedOnDutyHours] = useState(0.5);
  const [plannedBreakMinutes, setPlannedBreakMinutes] = useState(30);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await getDriverHOSSummary(driverId);
      setSummary(data);
    } catch {
      toast('Failed to load HOS summary', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 60000);
    return () => clearInterval(interval);
  }, [driverId]);

  const handleUpdateStatus = async (status: HOSSummary['current_status']) => {
    try {
      await updateDriverHOS(driverId, { status });
      toast('Status updated', 'success');
      fetchSummary();
    } catch {
      toast('Failed to update HOS status', 'error');
    }
  };

  const calculation = useMemo(() => {
    if (!summary) return null;

    const driveHours = clampNumber(plannedDriveHours);
    const onDutyHours = clampNumber(plannedOnDutyHours);
    const breakHours = clampNumber(plannedBreakMinutes, 0, 240) / 60;
    const plannedDriveMinutes = driveHours * 60;
    const breakWindowMinutes = Math.max(0, summary.time_until_break_required_minutes);
    const hasThirtyMinuteBreak = plannedBreakMinutes >= 30;
    const breakRequired = plannedDriveMinutes > breakWindowMinutes;
    const breakCovered =
      !breakRequired ||
      (hasThirtyMinuteBreak && plannedDriveMinutes <= breakWindowMinutes + 8 * 60);

    const projectedDrivingRemaining = summary.driving_hours_remaining - driveHours;
    const projectedOnDutyRemaining =
      summary.on_duty_hours_remaining - driveHours - onDutyHours - breakHours;
    const projectedCycleRemaining =
      summary.cycle_hours_remaining - driveHours - onDutyHours;

    const issues: string[] = [];
    if (projectedDrivingRemaining < 0) issues.push('Not enough 11-hour driving time.');
    if (projectedOnDutyRemaining < 0) issues.push('Not enough 14-hour shift time.');
    if (projectedCycleRemaining < 0) issues.push('Not enough 70-hour cycle time.');
    if (!breakCovered) {
      issues.push(
        hasThirtyMinuteBreak
          ? 'Add another 30-minute break for this much driving.'
          : 'Plan a 30-minute break before the drive is complete.'
      );
    }

    return {
      breakRequired,
      breakCovered,
      projectedDrivingRemaining,
      projectedOnDutyRemaining,
      projectedCycleRemaining,
      issues,
    };
  }, [plannedBreakMinutes, plannedDriveHours, plannedOnDutyHours, summary]);

  if (loading && !summary) {
    return <div className="h-36 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />;
  }

  if (!summary || !calculation) return null;

  const isCompliant = calculation.issues.length === 0;
  const statusClassName = isCompliant
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900'
    : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900';

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsExpanded(true);
          }
        }}
        className="cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <CardContent className="p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Clock className="h-4 w-4 text-blue-500" />
                HOS Calculator
              </h3>
              <div className="mt-1 text-xs text-muted-foreground">{formatStatus(summary.current_status)}</div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(event) => {
                event.stopPropagation();
                fetchSummary();
              }}
              title="Refresh HOS summary"
              className="h-8 w-8 shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Drive</div>
              <div className="text-lg font-bold text-foreground">{formatHours(summary.driving_hours_remaining)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Shift</div>
              <div className="text-lg font-bold text-foreground">{formatHours(summary.on_duty_hours_remaining)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Break</div>
              <div className="text-lg font-bold text-foreground">
                {formatHours(summary.time_until_break_required_minutes / 60)}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <div className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClassName}`}>
              {isCompliant ? 'Plan OK' : 'Check plan'}
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-300">
              Open full view
              <Calculator className="h-4 w-4" />
            </div>
          </div>
        </CardContent>
      </Card>

      {isExpanded &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Hours of Service Calculator"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setIsExpanded(false);
            }}
          >
          <div
            className="flex max-h-[84dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-lg bg-background shadow-2xl sm:max-h-[82dvh] sm:rounded-lg"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border p-4 sm:p-5">
              <div>
                <h3 className="flex items-center gap-2 text-base font-semibold text-foreground sm:text-lg">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Hours of Service Calculator
                </h3>
                <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
                  Current FMCSA limits with a quick plan check for the next leg.
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)} title="Close">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="overflow-y-auto p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 sm:text-sm">
                  {formatStatus(summary.current_status)}
                </span>
                <Button variant="outline" size="sm" onClick={fetchSummary}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>

        <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-5 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-lg border border-border bg-gray-50 p-3 dark:bg-gray-800/50 sm:p-4">
            <div className="text-xs text-muted-foreground sm:text-sm">Driving Remaining</div>
            <div className="mt-1 text-xl font-bold text-foreground sm:text-2xl">{formatHours(summary.driving_hours_remaining)}</div>
            <div className="text-xs text-muted-foreground">11h limit</div>
          </div>
          <div className="rounded-lg border border-border bg-gray-50 p-3 dark:bg-gray-800/50 sm:p-4">
            <div className="text-xs text-muted-foreground sm:text-sm">Shift Remaining</div>
            <div className="mt-1 text-xl font-bold text-foreground sm:text-2xl">{formatHours(summary.on_duty_hours_remaining)}</div>
            <div className="text-xs text-muted-foreground">14h window</div>
          </div>
          <div className="rounded-lg border border-border bg-gray-50 p-3 dark:bg-gray-800/50 sm:p-4">
            <div className="text-xs text-muted-foreground sm:text-sm">Cycle Remaining</div>
            <div className="mt-1 text-xl font-bold text-foreground sm:text-2xl">{formatHours(summary.cycle_hours_remaining)}</div>
            <div className="text-xs text-muted-foreground">70h / 8d</div>
          </div>
          <div className="rounded-lg border border-border bg-gray-50 p-3 dark:bg-gray-800/50 sm:p-4">
            <div className="text-xs text-muted-foreground sm:text-sm">Break Due In</div>
            <div className="mt-1 text-xl font-bold text-foreground sm:text-2xl">
              {formatHours(summary.time_until_break_required_minutes / 60)}
            </div>
            <div className="text-xs text-muted-foreground">8h driving rule</div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(240px,0.85fr)]">
          <section className="rounded-lg border border-border p-3 sm:p-4">
            <div className="mb-4 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-cyan-600" />
              <h4 className="font-semibold text-foreground">Plan Next Leg</h4>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Drive Hours</span>
                <Input
                  type="number"
                  min="0"
                  max="24"
                  step="0.25"
                  value={plannedDriveHours}
                  onChange={(event) => setPlannedDriveHours(clampNumber(event.target.valueAsNumber, 0, 24))}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">On-Duty Hours</span>
                <Input
                  type="number"
                  min="0"
                  max="24"
                  step="0.25"
                  value={plannedOnDutyHours}
                  onChange={(event) => setPlannedOnDutyHours(clampNumber(event.target.valueAsNumber, 0, 24))}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Planned Break (min)</span>
                <Input
                  type="number"
                  min="0"
                  max="240"
                  step="15"
                  value={plannedBreakMinutes}
                  onChange={(event) => setPlannedBreakMinutes(clampNumber(event.target.valueAsNumber, 0, 240))}
                />
              </label>
            </div>

            <div className="mt-3 grid gap-2 sm:mt-4 sm:grid-cols-3 sm:gap-3">
              <div className="rounded-md bg-muted p-2.5 sm:p-3">
                <div className="text-xs text-muted-foreground">After Plan Driving</div>
                <div className="text-base font-semibold text-foreground sm:text-lg">
                  {formatHours(calculation.projectedDrivingRemaining)}
                </div>
              </div>
              <div className="rounded-md bg-muted p-2.5 sm:p-3">
                <div className="text-xs text-muted-foreground">After Plan Shift</div>
                <div className="text-base font-semibold text-foreground sm:text-lg">
                  {formatHours(calculation.projectedOnDutyRemaining)}
                </div>
              </div>
              <div className="rounded-md bg-muted p-2.5 sm:p-3">
                <div className="text-xs text-muted-foreground">After Plan Cycle</div>
                <div className="text-base font-semibold text-foreground sm:text-lg">
                  {formatHours(calculation.projectedCycleRemaining)}
                </div>
              </div>
            </div>

            <div className={`mt-4 rounded-lg border p-3 ${statusClassName}`}>
              <div className="flex items-start gap-2">
                {isCompliant ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                )}
                <div>
                  <div className="font-semibold">
                    {isCompliant ? 'Legal for planned leg' : 'Plan needs attention'}
                  </div>
                  <div className="mt-1 text-sm">
                    {isCompliant
                      ? calculation.breakRequired
                        ? 'The planned 30-minute break covers the 8-hour driving rule.'
                        : 'No break or reset is required for this plan.'
                      : calculation.issues.join(' ')}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border p-3 sm:p-4">
            <div className="mb-4 flex items-center gap-2">
              <Gauge className="h-5 w-5 text-emerald-600" />
              <h4 className="font-semibold text-foreground">Update Duty Status</h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={summary.current_status === 'DRIVING' ? 'default' : 'outline'}
                className="w-full"
                onClick={() => handleUpdateStatus('DRIVING')}
              >
                <Activity className="mr-2 h-4 w-4" />
                Driving
              </Button>
              <Button
                variant={summary.current_status === 'ON_DUTY_NOT_DRIVING' ? 'default' : 'outline'}
                className="w-full"
                onClick={() => handleUpdateStatus('ON_DUTY_NOT_DRIVING')}
              >
                On Duty
              </Button>
              <Button
                variant={summary.current_status === 'OFF_DUTY' ? 'default' : 'outline'}
                className="w-full"
                onClick={() => handleUpdateStatus('OFF_DUTY')}
              >
                <Coffee className="mr-2 h-4 w-4" />
                Off Duty
              </Button>
              <Button
                variant={summary.current_status === 'SLEEPER' ? 'default' : 'outline'}
                className="w-full"
                onClick={() => handleUpdateStatus('SLEEPER')}
              >
                <Moon className="mr-2 h-4 w-4" />
                Sleeper
              </Button>
            </div>
            <div className="mt-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">
              Time in current status: {Math.floor(summary.time_in_current_status_minutes / 60)}h{' '}
              {summary.time_in_current_status_minutes % 60}m
            </div>
          </section>
        </div>
            </div>
          </div>
          </div>,
          document.body
        )}
    </>
  );
};
