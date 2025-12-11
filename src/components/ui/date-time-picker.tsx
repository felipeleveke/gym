"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimePickerProps {
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  id?: string
  showTimeSelect?: boolean
}

export function DateTimePicker({
  value,
  onChange,
  disabled,
  placeholder = "Selecciona fecha y hora",
  className,
  id,
  showTimeSelect = true,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  
  // Parse the value to get date and time
  const dateValue = value ? new Date(value) : undefined
  const hours = dateValue ? dateValue.getHours().toString().padStart(2, '0') : '12'
  const minutes = dateValue ? dateValue.getMinutes().toString().padStart(2, '0') : '00'

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return
    
    const newDate = new Date(selectedDate)
    if (dateValue) {
      newDate.setHours(dateValue.getHours())
      newDate.setMinutes(dateValue.getMinutes())
    } else {
      newDate.setHours(12)
      newDate.setMinutes(0)
    }
    
    // Format as datetime-local compatible string
    const formatted = formatToLocalDateTime(newDate)
    onChange?.(formatted)
  }

  const handleTimeChange = (type: 'hours' | 'minutes', newValue: string) => {
    const date = dateValue || new Date()
    const num = parseInt(newValue, 10)
    
    if (type === 'hours' && num >= 0 && num <= 23) {
      date.setHours(num)
    } else if (type === 'minutes' && num >= 0 && num <= 59) {
      date.setMinutes(num)
    }
    
    const formatted = formatToLocalDateTime(date)
    onChange?.(formatted)
  }

  const formatToLocalDateTime = (date: Date): string => {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const displayValue = dateValue
    ? format(dateValue, showTimeSelect ? "PPP 'a las' HH:mm" : "PPP", { locale: es })
    : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !dateValue && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleDateSelect}
          initialFocus
        />
        {showTimeSelect && (
          <div className="border-t p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Hora:</span>
              <div className="flex items-center gap-1">
                <TimeInput
                  value={hours}
                  onChange={(val) => handleTimeChange('hours', val)}
                  max={23}
                  disabled={disabled}
                />
                <span className="text-lg font-semibold">:</span>
                <TimeInput
                  value={minutes}
                  onChange={(val) => handleTimeChange('minutes', val)}
                  max={59}
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        )}
        <div className="border-t p-2">
          <Button 
            size="sm" 
            className="w-full"
            onClick={() => setOpen(false)}
          >
            Confirmar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface TimeInputProps {
  value: string
  onChange: (value: string) => void
  max: number
  disabled?: boolean
}

function TimeInput({ value, onChange, max, disabled }: TimeInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.replace(/\D/g, '')
    
    if (newValue.length > 2) {
      newValue = newValue.slice(-2)
    }
    
    const num = parseInt(newValue, 10)
    if (!isNaN(num) && num <= max) {
      onChange(newValue.padStart(2, '0'))
    } else if (newValue === '') {
      onChange('00')
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const current = parseInt(value, 10)
    if (e.deltaY < 0) {
      // Scroll up - increment
      const newVal = current >= max ? 0 : current + 1
      onChange(newVal.toString().padStart(2, '0'))
    } else {
      // Scroll down - decrement
      const newVal = current <= 0 ? max : current - 1
      onChange(newVal.toString().padStart(2, '0'))
    }
  }

  const increment = () => {
    const current = parseInt(value, 10)
    const newVal = current >= max ? 0 : current + 1
    onChange(newVal.toString().padStart(2, '0'))
  }

  const decrement = () => {
    const current = parseInt(value, 10)
    const newVal = current <= 0 ? max : current - 1
    onChange(newVal.toString().padStart(2, '0'))
  }

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={increment}
        disabled={disabled}
        className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
        tabIndex={-1}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 3L10 7H2L6 3Z" fill="currentColor"/>
        </svg>
      </button>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        onWheel={handleWheel}
        disabled={disabled}
        className="w-10 h-10 text-center text-lg font-semibold border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      />
      <button
        type="button"
        onClick={decrement}
        disabled={disabled}
        className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
        tabIndex={-1}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 9L2 5H10L6 9Z" fill="currentColor"/>
        </svg>
      </button>
    </div>
  )
}

// DatePicker for date-only selection (without time)
interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  id?: string
}

export function DatePicker({
  value,
  onChange,
  disabled,
  placeholder = "Selecciona una fecha",
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  
  // Parse the value to get date (YYYY-MM-DD format)
  const dateValue = value ? new Date(value + 'T00:00:00') : undefined

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return
    
    // Format as YYYY-MM-DD
    const year = selectedDate.getFullYear()
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0')
    const day = selectedDate.getDate().toString().padStart(2, '0')
    const formatted = `${year}-${month}-${day}`
    
    onChange?.(formatted)
    setOpen(false)
  }

  const displayValue = dateValue
    ? format(dateValue, "PPP", { locale: es })
    : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !dateValue && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleDateSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
