import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center space-y-6">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-8">
          <FileQuestion className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
          Page Not Found
        </h1>
        <p className="text-base text-muted-foreground max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        <div className="mt-8">
          <Link to="/dashboard">
            <Button size="lg">Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
