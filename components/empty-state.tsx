"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed border-2 border-gray-300">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <Icon className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6 max-w-sm">{description}</p>
        {action && (
          <Button onClick={action.onClick} className="bg-blue-600 hover:bg-blue-700">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
