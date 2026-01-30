/**
 * Shared components - barrel export
 *
 * Components remain in the original /components location for now.
 * This file provides a convenient import path from the new structure.
 */

// UI components
export * from '@/components/ui/button';
export * from '@/components/ui/card';
export * from '@/components/ui/checkbox';
export * from '@/components/ui/currency-input';
export * from '@/components/ui/dialog';
export * from '@/components/ui/input';
export * from '@/components/ui/select';
export * from '@/components/ui/table';

// Common components
export { ModuleRenderer } from '@/components/ModuleRenderer';
export { ModuleErrorBoundary } from '@/components/ModuleErrorBoundary';
