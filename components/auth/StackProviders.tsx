'use client'

import { StackProvider, StackTheme } from "@stackframe/stack"
import { stackClientApp } from "@/stack/client"
import { type ReactNode } from "react"

export function StackProviders({ children }: { children: ReactNode }) {
  return (
    <StackProvider app={stackClientApp}>
      <StackTheme>
        {children}
      </StackTheme>
    </StackProvider>
  )
}
