import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  caption: string;
  columns: Array<Column<T>>;
  rows: readonly T[];
  emptyMessage?: string;
}

export function DataTable<T>({ caption, columns, rows, emptyMessage }: DataTableProps<T>) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-600">{emptyMessage ?? 'Nothing to show yet.'}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-3 py-2 font-medium text-slate-700 ${column.className ?? ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-slate-100 last:border-0">
              {columns.map((column) => (
                <td key={column.key} className={`px-3 py-2 text-slate-800 ${column.className ?? ''}`}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
