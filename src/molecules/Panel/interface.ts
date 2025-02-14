// src/components/Panel/interface.ts
import { ColorType } from '@common/interfaces'

export interface IconObject {
  icon: string
  color?: string
  hoverColor?: string
  text?: string
  title?: string
  onClick?: () => void
}

export interface PanelProps {
  /** Title of the panel */
  title?: string
  /** Content inside the panel */
  children: React.ReactNode
  /** Left icon object */
  leftIcon?: IconObject
  /** Array of right icons */
  rightIcons?: IconObject[]
  /** Panel theme color */
  color?: ColorType
  /** Disable panel interaction */
  disabled?: boolean
}
