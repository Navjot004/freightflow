import { useEffect, useState } from 'react';
import api from '../../../core/api';
import { Card, CardContent } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Skeleton } from '../../../components/ui/Skeleton';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/audit-logs').then(res => {
      setLogs(res.data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">System Audit Logs</h2>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Admin ID</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target Entity</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-4">
                    <div className="space-y-3">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">{new Date(log.created_at).toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs">{log.admin_user_id.split('-')[0]}</TableCell>
                    <TableCell><span className="font-semibold text-xs px-2 py-1 bg-gray-100 rounded">{log.action}</span></TableCell>
                    <TableCell className="font-mono text-xs">{log.target_entity_id?.split('-')[0] || 'N/A'}</TableCell>
                    <TableCell className="text-xs font-mono max-w-[200px] truncate">{JSON.stringify(log.details)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
