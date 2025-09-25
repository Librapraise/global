"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronUp, Search, Filter, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface Column {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, row: any) => React.ReactNode
}

interface EnhancedTableProps {
  data: any[]
  columns: Column[]
  searchable?: boolean
  filterable?: boolean
  actions?: (row: any) => React.ReactNode
  onRowClick?: (row: any) => void
  loading?: boolean
  emptyMessage?: string
}

export function EnhancedTable({
  data,
  columns,
  searchable = true,
  filterable = true,
  actions,
  onRowClick,
  loading = false,
  emptyMessage = "No data available",
}: EnhancedTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "asc" | "desc"
  } | null>(null)

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const filteredData = data.filter(
    (row) =>
      searchTerm === "" ||
      Object.values(row).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const sortedData = sortConfig
    ? [...filteredData].sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1
        }
        return 0
      })
    : filteredData

  if (loading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b">
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center space-x-4">
              {columns.map((_, j) => (
                <div key={j} className="h-4 bg-gray-200 rounded flex-1 animate-pulse"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      {/* Table Header with Search and Filters */}
      {(searchable || filterable) && (
        <div className="p-4 border-b bg-gray-50/50">
          <div className="flex items-center justify-between gap-4">
            {searchable && (
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>
            )}
            {filterable && (
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                    column.sortable && "cursor-pointer hover:bg-gray-100 transition-colors",
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && (
                      <div className="flex flex-col">
                        {sortConfig?.key === column.key ? (
                          sortConfig.direction === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-gray-300" />
                    <p>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => (
                <tr
                  key={index}
                  className={cn("hover:bg-gray-50 transition-colors", onRowClick && "cursor-pointer")}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-4 whitespace-nowrap text-sm">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                  {actions && <td className="px-4 py-4 whitespace-nowrap text-right text-sm">{actions(row)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Pagination Info */}
      {sortedData.length > 0 && (
        <div className="px-4 py-3 border-t bg-gray-50/50">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              Showing {sortedData.length} of {data.length} results
              {searchTerm && ` for "${searchTerm}"`}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
