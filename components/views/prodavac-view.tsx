'use client';

import { Package } from 'lucide-react';
import { RoleView } from './RoleView';

interface ProdavacViewProps {
  isWarehouse: boolean;
}

export function ProdavacView({ isWarehouse }: ProdavacViewProps) {
  // Warehouse mode shows special content
  if (isWarehouse) {
    return (
      <RoleView
        showAbsenceFullView
        showShiftsFullView
        showTasksFullView
        isWarehouse
        customContent={
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center space-x-3 text-slate-400">
              <Package className="w-8 h-8" />
              <span className="text-xl font-medium">Sklad neeviduje tržby.</span>
            </div>
          </div>
        }
      />
    );
  }

  return <RoleView showAbsenceFullView showShiftsFullView showTasksFullView isWarehouse={false} className="" />;
}
