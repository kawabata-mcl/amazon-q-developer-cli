'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SettingsPanel } from '@/components/settings/settings-panel';

export default function SettingsPage() {
  const router = useRouter();
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  const handleClose = () => {
    setIsPanelOpen(false);
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Application Settings</h1>
          
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Configure your Amazon Q Desktop application preferences
            </p>
            <Button onClick={() => setIsPanelOpen(true)}>
              Open Settings Panel
            </Button>
          </div>
        </div>
      </div>

      <SettingsPanel
        isOpen={isPanelOpen}
        onClose={handleClose}
      />
    </div>
  );
}