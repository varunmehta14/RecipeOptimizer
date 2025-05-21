import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader } from '@/components/Loader'
import { ActiveProcessingFlow } from '@/components/ProcessingFlow' 
import { processRecipe } from '@/lib/api'
import type { ProcessRequest, ProcessResponse } from '@/lib/api'

// Predefined optimization goals for users to choose from
const EXAMPLE_GOALS = [
  { label: 'Make gluten-free', color: 'bg-yellow-500' },
  { label: 'Reduce sugar', color: 'bg-blue-500' },
  { label: 'Make vegan', color: 'bg-green-500' },
  { label: 'Low-carb version', color: 'bg-purple-500' },
  { label: 'Add more protein', color: 'bg-red-500' },
  { label: 'Cut calories', color: 'bg-indigo-500' },
];

export function Home() {
  const navigate = useNavigate()
  const [recipeText, setRecipeText] = useState('')
  const [goal, setGoal] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  
  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: processRecipe,
    onSuccess: (data: ProcessResponse) => {
      // Store result in sessionStorage to pass to Result page
      sessionStorage.setItem('recipeResult', JSON.stringify(data))
      navigate('/result')
    }
  })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!recipeText.trim() || !goal.trim()) {
      return
    }
    
    const request: ProcessRequest = {
      recipe_text: recipeText,
      goal: goal
    }
    
    mutate(request)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Only accept PDF files
    if (file.type !== 'application/pdf') {
      setUploadError('Please upload a PDF file')
      return
    }

    try {
      setIsUploading(true)
      setUploadError(null)
      
      // Create FormData to send file
      const formData = new FormData()
      formData.append('file', file)

      // Send to backend endpoint
      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload PDF')
      }

      const data = await response.json()
      setRecipeText(data.text || '')
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload PDF')
    } finally {
      setIsUploading(false)
    }
  }
  
  const selectGoal = (goalText: string) => {
    setGoal(goalText);
  };
  
  return (
    <div className="space-y-8">
      {/* Colorful gradient header */}
      <div className="relative rounded-lg bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 p-6 mb-8 text-white shadow-lg">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-2">Recipe Optimizer</h1>
          <p className="text-lg opacity-90">Transform your favorite recipes to meet your dietary goals while preserving flavor and culinary intent.</p>
        </div>
        <div className="absolute bottom-0 right-0 p-6 opacity-20">
          <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 11h.01"></path>
            <path d="M11 15h.01"></path>
            <path d="M16 16h.01"></path>
            <path d="M2 12a10 10 0 0 0 20 0 10 10 0 0 0-20 0Z"></path>
            <path d="M5 10a7 7 0 0 0 14 0 7 7 0 0 0-14 0Z"></path>
            <path d="M7 8a5 5 0 0 0 10 0 5 5 0 0 0-10 0Z"></path>
          </svg>
        </div>
      </div>
    
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <form onSubmit={handleSubmit}>
            <Card className="shadow-md border-t-4 border-t-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-2xl">Your Recipe</CardTitle>
                <CardDescription>
                  Paste your recipe or upload a PDF to get started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipe" className="text-base font-medium">Recipe Text</Label>
                  <div className="mb-2 p-3 bg-blue-50 border border-blue-100 rounded-md">
                    <h4 className="text-sm font-semibold text-blue-700 mb-1">Format Guidelines:</h4>
                    <p className="text-xs text-slate-600 mb-2">Please format your recipe with these distinct sections for best results:</p>
                    <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                      <li><span className="font-medium">Title:</span> Start with the recipe name on its own line</li>
                      <li><span className="font-medium">Ingredients:</span> List each ingredient on a separate line with quantities</li>
                      <li><span className="font-medium">Instructions:</span> Number each step or put each step on a new line</li>
                      <li><span className="font-medium">Serving/Time:</span> Include cooking time and number of servings if known</li>
                    </ul>
                    <div className="text-xs px-2 py-1 bg-amber-50 border border-amber-100 rounded mt-2 text-amber-700">
                      <strong>Note:</strong> Following this format is important for successful recipe parsing. Incorrect formatting may cause errors.
                    </div>
                    <details className="mt-2">
                      <summary className="text-xs text-blue-600 cursor-pointer font-medium">View Example Recipe Format</summary>
                      <pre className="text-xs bg-white p-2 mt-1 rounded border border-slate-200 overflow-auto max-h-32 whitespace-pre-wrap">
{`Chocolate Chip Cookies

Ingredients:
2 cups all-purpose flour
1/2 tsp baking soda
1/2 tsp salt
3/4 cup unsalted butter, melted
1 cup brown sugar
1/2 cup white sugar
1 tbsp vanilla extract
1 egg
1 egg yolk
2 cups chocolate chips

Instructions:
1. Preheat oven to 325°F (165°C)
2. Mix flour, baking soda, and salt in a bowl
3. Cream melted butter with brown and white sugar
4. Beat in vanilla, egg, and egg yolk
5. Mix in the dry ingredients until just blended
6. Stir in chocolate chips
7. Drop cookie dough onto baking sheets
8. Bake for 15-17 minutes

Serves: 24 cookies
Cooking time: 15 minutes`}
                      </pre>
                    </details>
                  </div>
                  <Textarea
                    id="recipe"
                    placeholder="Paste your recipe ingredients and instructions here..."
                    className="min-h-[300px] border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={recipeText}
                    onChange={(e) => setRecipeText(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pdf-upload" className="text-base font-medium">Upload Recipe PDF</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="pdf-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      disabled={isUploading}
                    />
                    {isUploading && <Loader />}
                  </div>
                  {uploadError && (
                    <p className="text-sm text-red-500 mt-1">{uploadError}</p>
                  )}
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="goal" className="text-base font-medium">Optimization Goal</Label>
                  <Input
                    id="goal"
                    placeholder="e.g., 'make gluten-free' or 'reduce sugar'"
                    className="border-slate-300"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    required
                  />
                  
                  {/* Quick goal selection buttons */}
                  <div>
                    <p className="text-sm text-slate-500 mb-2">Or select a goal:</p>
                    <div className="flex flex-wrap gap-2">
                      {EXAMPLE_GOALS.map((exampleGoal, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`px-3 py-1.5 rounded-full text-white text-xs font-medium transition-all ${exampleGoal.color} hover:opacity-90 focus:ring-2 focus:ring-offset-2 focus:ring-${exampleGoal.color.replace('bg-', '')}`}
                          onClick={() => selectGoal(exampleGoal.label)}
                        >
                          {exampleGoal.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {isError && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {error instanceof Error ? error.message : 'An error occurred'}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="pt-2">
                <Button 
                  type="submit" 
                  disabled={isPending || !recipeText.trim() || !goal.trim()}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md w-full"
                  size="lg"
                >
                  {isPending ? <Loader className="mr-2" /> : null}
                  {isPending ? 'Optimizing Recipe...' : 'Optimize Recipe'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
        
        <div className="space-y-6">
          <Card className={`shadow-md transition-all duration-500 ${isPending ? 'border-t-4 border-t-purple-500' : 'border-t-4 border-t-green-500'}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl">
                {isPending ? 'Optimization in Progress' : 'Preview'}
              </CardTitle>
              <CardDescription>
                {isPending 
                  ? 'Our AI is hard at work optimizing your recipe...' 
                  : 'Submit your recipe to see the optimized version'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPending ? (
                <div className="space-y-6">
                  <div className="flex justify-center items-center p-4">
                    <div className="animate-pulse flex space-x-4 w-full max-w-md">
                      <div className="rounded-full bg-slate-200 h-12 w-12"></div>
                      <div className="flex-1 space-y-4 py-1">
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-200 rounded"></div>
                          <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Agent flow visualization */}
                  <ActiveProcessingFlow />
                  
                  <div className="text-center text-sm text-slate-500 mt-4">
                    This process typically takes 15-30 seconds depending on recipe length
                  </div>
                </div>
              ) : (
                <div className="border rounded-md p-4 min-h-[300px] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800">
                  <div className="text-center mb-6">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-16 w-16 text-green-500 mb-2" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-slate-500 text-lg">Add your recipe and goal to get started</p>
                  </div>
                  
                  <div className="w-full max-w-md px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-1">How it works:</h3>
                    <ol className="text-sm text-slate-700 space-y-1 list-decimal pl-5">
                      <li>Our AI analyzes your recipe's structure and ingredients</li>
                      <li>We determine nutrition and allergen information</li>
                      <li>The recipe is optimized based on your goal</li>
                      <li>Modifications are evaluated for taste and feasibility</li>
                      <li>You receive a complete optimized recipe with highlighted changes</li>
                    </ol>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {!isPending && (
            <Card className="shadow-sm border-l-4 border-l-indigo-500 bg-indigo-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-indigo-800 mb-1">Database Operations</h3>
                <p className="text-sm text-slate-700">Recipes are saved to a SQLite database and their embeddings stored in a vector database for similarity search and future reference.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 