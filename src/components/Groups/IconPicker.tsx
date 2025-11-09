'use client';

import { useState } from 'react';
import * as LucideIcons from 'lucide-react';

// Define available icons for groups
export const AVAILABLE_GROUP_ICONS = [
  { name: 'Users', label: 'Users' },
  { name: 'Home', label: 'Home' },
  { name: 'Briefcase', label: 'Work' },
  { name: 'Heart', label: 'Family' },
  { name: 'Coffee', label: 'Coffee' },
  { name: 'Music', label: 'Music' },
  { name: 'Gamepad2', label: 'Gaming' },
  { name: 'Plane', label: 'Travel' },
  { name: 'ShoppingBag', label: 'Shopping' },
  { name: 'Utensils', label: 'Dining' },
  { name: 'GraduationCap', label: 'Education' },
  { name: 'Car', label: 'Transportation' },
  { name: 'Building', label: 'Building' },
  { name: 'TreePine', label: 'Nature' },
  { name: 'Dumbbell', label: 'Fitness' },
  { name: 'Film', label: 'Entertainment' },
  { name: 'Gift', label: 'Gifts' },
  { name: 'Lightbulb', label: 'Ideas' },
  { name: 'Palette', label: 'Creative' },
  { name: 'Pizza', label: 'Food' },
] as const;

export type GroupIconName = (typeof AVAILABLE_GROUP_ICONS)[number]['name'];

interface IconPickerProps {
  selectedIcon: string;
  onIconSelect: (icon: string) => void;
  className?: string;
}

export default function IconPicker({
  selectedIcon,
  onIconSelect,
  className = '',
}: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || LucideIcons.Users;
  };

  const SelectedIcon = getIconComponent(selectedIcon);

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">Group Icon</label>

      {/* Selected icon display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:border-emerald-500 transition-colors bg-white"
      >
        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <SelectedIcon className="w-5 h-5 text-emerald-600" />
        </div>
        <span className="text-gray-700 flex-1 text-left">
          {AVAILABLE_GROUP_ICONS.find((i) => i.name === selectedIcon)?.label || 'Select Icon'}
        </span>
        <LucideIcons.ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Icon picker dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
            <div className="grid grid-cols-4 gap-2 p-3">
              {AVAILABLE_GROUP_ICONS.map((icon) => {
                const IconComponent = getIconComponent(icon.name);
                const isSelected = selectedIcon === icon.name;

                return (
                  <button
                    key={icon.name}
                    type="button"
                    onClick={() => {
                      onIconSelect(icon.name);
                      setIsOpen(false);
                    }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all hover:bg-emerald-50 ${
                      isSelected ? 'bg-emerald-100 ring-2 ring-emerald-500' : 'bg-gray-50'
                    }`}
                    title={icon.label}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-emerald-200' : 'bg-white'
                      }`}
                    >
                      <IconComponent
                        className={`w-5 h-5 ${isSelected ? 'text-emerald-600' : 'text-gray-600'}`}
                      />
                    </div>
                    <span className="text-xs text-gray-600 text-center leading-tight">
                      {icon.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Helper function to get icon component by name
export function getGroupIcon(iconName: string) {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || LucideIcons.Users;
}
