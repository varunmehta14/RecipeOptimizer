import { cn } from '@/lib/utils';
import type { RecipeContent } from '@/lib/api';
import { DiffText } from './DiffText'; // Import the new DiffText component

interface RecipePanelProps {
  recipe: RecipeContent;
  originalRecipe?: RecipeContent; // Optional: for showing diffs against the original
}

export function RecipePanel({ recipe, originalRecipe }: RecipePanelProps) {
  const isDiffMode = !!originalRecipe;

  // Helper to create a comparable string for an ingredient
  const getIngredientString = (ing: RecipeContent['ingredients'][0]) => {
    return `${ing.quantity || ''} ${ing.unit || ''} ${ing.name}`.trim();
  };

  return (
    <div className={cn("prose prose-slate dark:prose-invert max-w-none", isDiffMode && "prose-sm")}> {/* Smaller text in diff mode */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
          </svg>
          Ingredients
        </h3>
        <ul className="list-disc pl-5 space-y-2 bg-white rounded-lg p-4 border border-slate-100 shadow-sm">
          {recipe.ingredients.map((ingredient, index) => {
            // For diff mode, try to find a matching original ingredient.
            // This simple name-based matching might not be perfect for complex changes.
            const originalIngredientMatch = isDiffMode
              ? originalRecipe?.ingredients.find(
                  (origIng) => origIng.name.toLowerCase() === ingredient.name.toLowerCase()
                )
              : undefined;

            const currentIngredientStr = getIngredientString(ingredient);
            const originalIngredientStr = originalIngredientMatch
              ? getIngredientString(originalIngredientMatch)
              : currentIngredientStr; // If no match, diff against itself (no changes) or if not diff mode

            return (
              <li key={index} className={cn(
                "leading-relaxed",
                !originalIngredientMatch && isDiffMode && "bg-green-50 -mx-2 px-2 py-1 rounded"
              )}>
                {isDiffMode ? (
                  <DiffText originalText={originalIngredientStr} optimizedText={currentIngredientStr} />
                ) : (
                  <span>
                    {ingredient.quantity && <span className="font-medium">{ingredient.quantity} </span>}
                    {ingredient.unit && <span>{ingredient.unit} </span>}
                    <span className="text-slate-800">{ingredient.name}</span>
                  </span>
                )}
                {ingredient.notes && (
                  <span className="text-slate-500 dark:text-slate-400 text-sm ml-1"> ({ingredient.notes})</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
          Instructions
        </h3>
        <ol className="list-decimal pl-5 space-y-4 bg-white rounded-lg p-4 border border-slate-100 shadow-sm">
          {recipe.steps.map((step, index) => {
            // For steps, diffing is typically done line by line based on index.
            // If steps are added/removed, this won't align perfectly but is a common approach.
            const originalStep = isDiffMode && originalRecipe?.steps[index]
              ? originalRecipe.steps[index]
              : step;

            const isNewStep = isDiffMode && !originalRecipe?.steps[index];

            return (
              <li key={index} className={cn(
                "py-1 leading-relaxed",
                isNewStep && "bg-green-50 -mx-2 px-2 py-1 rounded"
              )}>
                {isDiffMode ? (
                  <DiffText originalText={originalStep} optimizedText={step} />
                ) : (
                  step
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {recipe.nutrition && (
        <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-md not-prose border border-slate-200 shadow-sm"> {/* Opt-out of prose for custom grid */}
          <h3 className="text-lg font-medium mb-3 text-slate-900 dark:text-slate-100 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z" clipRule="evenodd" />
            </svg>
            Nutrition (per serving)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm text-slate-700 dark:text-slate-300">
            {recipe.nutrition.calories !== undefined && (
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
                <span className="font-semibold">Calories:</span> <span className="ml-1">{recipe.nutrition.calories} kcal</span>
              </div>
            )}
            {recipe.nutrition.protein_g !== undefined && (
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-400 mr-2"></div>
                <span className="font-semibold">Protein:</span> <span className="ml-1">{recipe.nutrition.protein_g}g</span>
              </div>
            )}
            {recipe.nutrition.fat_g !== undefined && (
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
                <span className="font-semibold">Fat:</span> <span className="ml-1">{recipe.nutrition.fat_g}g</span>
              </div>
            )}
            {recipe.nutrition.carbs_g !== undefined && (
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-orange-400 mr-2"></div>
                <span className="font-semibold">Carbs:</span> <span className="ml-1">{recipe.nutrition.carbs_g}g</span>
              </div>
            )}
            {recipe.nutrition.sugar_g !== undefined && (
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-pink-400 mr-2"></div>
                <span className="font-semibold">Sugar:</span> <span className="ml-1">{recipe.nutrition.sugar_g}g</span>
              </div>
            )}
            {recipe.nutrition.fiber_g !== undefined && (
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
                <span className="font-semibold">Fiber:</span> <span className="ml-1">{recipe.nutrition.fiber_g}g</span>
              </div>
            )}
            {recipe.nutrition.sodium_mg !== undefined && (
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
                <span className="font-semibold">Sodium:</span> <span className="ml-1">{recipe.nutrition.sodium_mg}mg</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}