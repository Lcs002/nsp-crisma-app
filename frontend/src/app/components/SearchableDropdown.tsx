'use client';

import { useState } from 'react';
import { Combobox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

// This is now a generic interface. T is a placeholder for any object type.
// We require that the object must have `id` and `name` properties.
interface ItemWithIdAndName {
  id: number | string;
  name: string;
}

// The component is now generic over a type T that extends our base interface.
interface SearchableDropdownProps<T extends ItemWithIdAndName> {
  items: T[];
  selected: T | null;
  setSelected: (item: T | null) => void;
  placeholder?: string;
}

export default function SearchableDropdown<T extends ItemWithIdAndName>({
  items,
  selected,
  setSelected,
  placeholder = "Select...",
}: SearchableDropdownProps<T>) {
  const [query, setQuery] = useState('');

  const filteredItems =
    query === ''
      ? items
      : items.filter((item) => {
          return item.name.toLowerCase().includes(query.toLowerCase());
        });

  return (
    // The `by="id"` prop is crucial for Headless UI to correctly compare objects
    <Combobox value={selected} onChange={setSelected} by="id">
      <div className="relative mt-1">
        <Combobox.Input
          className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          onChange={(event) => setQuery(event.target.value)}
          displayValue={(item: T | null) => item?.name || ''}
          placeholder={placeholder}
        />
        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
          <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </Combobox.Button>

        {filteredItems.length > 0 && (
          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border dark:border-gray-600">
            {filteredItems.map((item) => (
              <Combobox.Option
                key={item.id}
                value={item}
                className={({ active }) =>
                  `relative cursor-default select-none py-2 pl-3 pr-9 ${
                    active ? 'bg-indigo-600 text-white' : 'text-gray-900 dark:text-gray-200'
                  }`
                }
              >
                {({ active, selected }) => (
                  <>
                    <span className={`block truncate ${selected ? 'font-semibold' : ''}`}>{item.name}</span>
                    {selected && (
                      <span
                        className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                          active ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'
                        }`}
                      >
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                  </>
                )}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        )}
      </div>
    </Combobox>
  );
}