import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badges } from '@/components/Badges';
import { RecipePanel } from '@/components/RecipePanel';
import { defaultPipelineSteps, ProcessingFlow, FlowStep } from '@/components/ProcessingFlow';
import type { ProcessResponse } from '@/lib/api';

export function Result() {
  const navigate = useNavigate();
  const [result, setResult] = useState<ProcessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('optimized');
  const [showFlowDetails, setShowFlowDetails] = useState<boolean>(false);
  
  // Generate completed pipeline steps to show 
  const completedSteps: FlowStep[] = defaultPipelineSteps.map(step => ({
    ...step,
    status: 'complete',
    duration: 2000 + Math.random() * 3000 // Simulated random durations
  }));
  
  useEffect(() => {
    const storedResult = sessionStorage.getItem('recipeResult');
    if (!storedResult) {
      setError('No recipe result found. Please go back and submit a recipe.');
      return;
    }
    try {
      const parsedResult = JSON.parse(storedResult) as ProcessResponse;
      setResult(parsedResult);
    } catch (e) {
      setError('Failed to parse recipe result. Please try again.');
      console.error("Error parsing recipe result:", e);
    }
  }, []);
  
  const handleNewRecipe = () => {
    sessionStorage.removeItem('recipeResult'); // Clear old result
    navigate('/');
  };
  
  const toggleFlowDetails = () => {
    setShowFlowDetails(prev => !prev);
  };
  
  if (error) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
          <Button variant="outline" className="mt-4" onClick={handleNewRecipe}>
            Optimize Another Recipe
          </Button>
        </Alert>
      </div>
    );
  }
  
  if (!result) {
    return <div className="text-center py-10">Loading recipe result...</div>;
  }
  
  return (
    <div className="space-y-8">
      {/* Header with banner */}
      <div className="bg-gradient-to-r from-green-600 to-teal-500 rounded-lg p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1"> 
            <h1 className="text-3xl font-bold mb-1">{result.optimized.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-white text-teal-700 hover:bg-white hover:text-teal-800">
                {result.diet_label}
              </Badge>
              <div className="flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>Optimized in 15s</span>
              </div>
            </div>
          </div>
          <Button 
            onClick={handleNewRecipe} 
            size="lg" 
            className="mt-2 sm:mt-0 bg-white text-teal-700 hover:bg-teal-50"
          >
            Optimize Another Recipe
          </Button>
        </div>
      </div>
      
      {/* Processing details section */}
      <Card className="border-l-4 border-indigo-500">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0019.586 6L14 0.414A2 2 0 0012.586 0H10zm7 7a1 1 0 00-1-1h-1V2.914L11.086 7H17z" clipRule="evenodd" />
              </svg>
              Processing Details
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleFlowDetails}
              className="text-sm text-indigo-700"
            >
              {showFlowDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>
        </CardHeader>
        {showFlowDetails && (
          <CardContent>
            <div className="space-y-4">
              {/* Agent pipeline visualization */}
              <ProcessingFlow steps={completedSteps} showTimings={true} />
              
              {/* Database usage visualization */}
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor" 
                    className="w-5 h-5 mr-2 text-indigo-500"
                  >
                    <path d="M10 2a8.75 8.75 0 00-7 14.2 7.25 7.25 0 010-2.4A6.25 6.25 0 0110 4.5a6.25 6.25 0 017 7.75 7.25 7.25 0 012.4 0A8.75 8.75 0 0010 2z" />
                    <path d="M14.596 15.657A1.344 1.344 0 0015.5 14.5a1.5 1.5 0 00-1.5-1.5 1.344 1.344 0 00-1.157.904 7.25 7.25 0 01-2.093 3.306 6.25 6.25 0 01-8.86-8.858 7.25 7.25 0 013.306-2.094A1.344 1.344 0 005.5 5.5 1.5 1.5 0 004 4a1.344 1.344 0 00-1.153.904A8.75 8.75 0 0010 19a8.75 8.75 0 004.596-3.343z" />
                  </svg>
                  Database Interactions
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded border border-slate-100 shadow-sm">
                    <h4 className="font-medium text-indigo-700 mb-1">SQL Database (SQLite)</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Original recipe stored</li>
                      <li>• Logging of AI processing pipeline steps</li>
                      <li>• Metrics tracking for optimization process</li>
                      <li>• Recipe metadata storage for querying</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-white rounded border border-slate-100 shadow-sm">
                    <h4 className="font-medium text-purple-700 mb-1">Vector Database (Chroma)</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Recipe embeddings for semantic search</li>
                      <li>• Similar recipe retrieval capability</li>
                      <li>• Improved recommendations over time</li>
                      <li>• Fast similarity-based matching</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
      
      <Badges 
        allergens={result.badges.allergens} 
        macrosDelta={result.badges.macros_delta} 
      />
      
      {/* Recipe tabs */}
      <Tabs 
        defaultValue="optimized" 
        className="w-full" 
        value={activeTab} 
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="optimized" className="text-base">
            <div className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Optimized Recipe
            </div>
          </TabsTrigger>
          <TabsTrigger value="original" className="text-base">
            <div className="flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              Original Recipe
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="optimized">
          <Card className="border-t-4 border-t-green-500 shadow-md">
            <CardHeader>
              <CardTitle className="text-green-700">{result.optimized.title}</CardTitle>
              {(result.optimized.cooking_time || result.optimized.servings) && (
                <CardDescription>
                  {result.optimized.cooking_time ? `${result.optimized.cooking_time} minutes` : ''}
                  {result.optimized.cooking_time && result.optimized.servings ? ' | ' : ''}
                  {result.optimized.servings ? `${result.optimized.servings} servings` : ''}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {/* Pass both original and optimized to RecipePanel for diffing */}
              <RecipePanel recipe={result.optimized} originalRecipe={result.original} />
              
              {result.optimized.improvements && result.optimized.improvements.length > 0 && (
                <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-md">
                  <h3 className="text-xl font-semibold mb-3 text-green-800 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Key Improvements Made:
                  </h3>
                  <ul className="list-none space-y-2 text-sm text-green-800">
                    {result.optimized.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block w-5 h-5 bg-green-100 rounded-full flex-shrink-0 flex items-center justify-center mr-2 mt-0.5 text-green-800 font-medium">{index + 1}</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="original">
          <Card className="border-t-4 border-t-blue-500 shadow-md">
            <CardHeader>
              <CardTitle className="text-blue-700">{result.original.title}</CardTitle>
              {(result.original.cooking_time || result.original.servings) && (
                <CardDescription>
                  {result.original.cooking_time ? `${result.original.cooking_time} minutes` : ''}
                  {result.original.cooking_time && result.original.servings ? ' | ' : ''}
                  {result.original.servings ? (
                    typeof result.original.servings === 'number' 
                      ? `${result.original.servings} servings` 
                      : `${result.original.servings}`
                  ) : ''}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <RecipePanel recipe={result.original} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Action buttons at bottom */}
      <div className="flex justify-center items-center gap-4 pt-4 border-t">
        <Button 
          onClick={handleNewRecipe} 
          variant="outline" 
          className="gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
          </svg>
          Back to Home
        </Button>
        <Button
          className="bg-gradient-to-r from-blue-600 to-indigo-600 gap-2"
          onClick={() => window.print()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
          </svg>
          Print Recipe
        </Button>
      </div>
    </div>
  );
}