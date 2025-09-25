"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Search, Download, RefreshCw } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { EmptyState } from "@/components/empty-state"

interface Column<T> {
  key: keyof T | string
  label: string
  render?: (value: any, row: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  onPageChange?: (page: number) => void
  onLimitChange?: (limit: number) => void
  onSort?: (column: string, direction: "asc" | "desc") => void
  onRefresh?: () => void
  searchable?: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
  filterable?: boolean
  filters?: React.ReactNode
  actions?: React.ReactNode
  emptyState?: {
    icon: React.ComponentType<{ className?: string }>
    title: string
    description: string
    action?: {
      label: string
      onClick: () => void
    }
  }
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  onPageChange,
  onLimitChange,
  onSort,
  onRefresh,
  searchable = false,
  searchValue = "",
  onSearchChange,
  filterable = false,
  filters,
  actions,
  emptyState,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string>("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const handleSort = (column: string) => {
    if (!onSort) return

    const newDirection = sortColumn === column && sortDirection === "asc" ? "desc" : "asc"
    setSortColumn(column)
    setSortDirection(newDirection)
    onSort(column, newDirection)
  }

  const renderPagination = () => {
    if (!pagination) return null

    const { page, totalPages, hasNext, hasPrev, total, limit } = pagination

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Show</span>
          <Select value={limit.toString()} onValueChange={(value) => onLimitChange?.(Number.parseInt(value))}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span>of {total} results</span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(page - 1)}
            disabled={!hasPrev}
            className="h-8"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange?.(pageNum)}
                  className="h-8 w-8 p-0"
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(page + 1)}
            disabled={!hasNext}
            className="h-8"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card className="shadow-sm">
      {/* Header with search and actions */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {searchable && (
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
            {filterable && filters}
          </div>
          <div className="flex items-center space-x-2">
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {actions}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" text="Loading data..." />
          </div>
        ) : data.length === 0 ? (
          emptyState ? (
            <div className="p-6">
              <EmptyState {...emptyState} />
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-gray-500">No data available</div>
          )
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  {columns.map((column) => (
                    <TableHead
                      key={column.key as string}
                      className={`font-semibold text-gray-900 ${column.width || ""} ${
                        column.sortable ? "cursor-pointer hover:bg-gray-100" : ""
                      }`}
                      onClick={() => column.sortable && handleSort(column.key as string)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.label}</span>
                        {column.sortable && sortColumn === column.key && (
                          <Badge variant="outline" className="text-xs">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </Badge>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index} className="hover:bg-gray-50 transition-colors">
                    {columns.map((column) => (
                      <TableCell key={column.key as string} className="py-4">
                        {column.render
                          ? column.render(row[column.key as keyof T], row)
                          : (row[column.key as keyof T] as React.ReactNode)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {renderPagination()}
      </CardContent>
    </Card>
  )
}
