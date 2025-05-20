import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { MacroDelta } from '@/lib/api'

interface BadgesProps {
  allergens: string[]
  macrosDelta: MacroDelta
}

export function Badges({ allergens, macrosDelta }: BadgesProps) {
  // Define helper for formatting delta values
  const formatDelta = (value: number): string => {
    if (value === 0) return "0";
    return value > 0 ? `+${value.toFixed(1)}` : `${value.toFixed(1)}`;
  };
  
  // Determine color based on whether a reduction is generally good
  const getDeltaColor = (key: keyof MacroDelta, value: number): string => {
    const positiveReduction = ['calories', 'fat_g', 'carbs_g', 'sugar_g', 'sodium_mg'];
    
    if (value === 0) return "text-slate-500";
    
    if (positiveReduction.includes(key)) {
      return value < 0 ? "text-green-600" : "text-red-600";
    } else {
      // For protein and fiber, increases are generally good
      return value > 0 ? "text-green-600" : "text-red-600";
    }
  };
  
  // Format display names for macros
  const macroDisplayNames: Record<keyof MacroDelta, string> = {
    calories: "Calories",
    protein_g: "Protein",
    fat_g: "Fat",
    carbs_g: "Carbs",
    sugar_g: "Sugar",
    fiber_g: "Fiber",
    sodium_mg: "Sodium"
  };
  
  // Format units for macros
  const macroUnits: Record<keyof MacroDelta, string> = {
    calories: "kcal",
    protein_g: "g",
    fat_g: "g",
    carbs_g: "g",
    sugar_g: "g",
    fiber_g: "g",
    sodium_mg: "mg"
  };
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Allergens section */}
          <div>
            <h3 className="text-sm font-medium mb-2">Contains Allergens:</h3>
            <div className="flex flex-wrap gap-2">
              {allergens.length > 0 ? (
                allergens.map((allergen) => (
                  <Badge key={allergen} variant="secondary">
                    {allergen}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-slate-500">No common allergens detected</span>
              )}
            </div>
          </div>
          
          {/* Nutritional changes section */}
          <div>
            <h3 className="text-sm font-medium mb-2">Nutritional Changes:</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm">
              {Object.entries(macrosDelta).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span>{macroDisplayNames[key as keyof MacroDelta]}:</span>
                  <span className={getDeltaColor(key as keyof MacroDelta, value)}>
                    {formatDelta(value)}{macroUnits[key as keyof MacroDelta]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 