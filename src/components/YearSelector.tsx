import { CalendarDays } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface YearSelectorProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  availableYears?: number[];
}

const currentYear = new Date().getFullYear();
const defaultYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

export function YearSelector({ selectedYear, onYearChange, availableYears }: YearSelectorProps) {
  const years = availableYears && availableYears.length > 0 ? availableYears : defaultYears;

  return (
    <Select value={String(selectedYear)} onValueChange={(v) => onYearChange(Number(v))}>
      <SelectTrigger className="w-[130px] h-9">
        <CalendarDays className="h-4 w-4 mr-1.5 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {years.map((year) => (
          <SelectItem key={year} value={String(year)}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
