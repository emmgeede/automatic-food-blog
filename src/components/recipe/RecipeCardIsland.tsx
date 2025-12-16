import { useSignal, useComputed } from '@preact/signals';

interface Ingredient {
  name?: string;
  ingredient?: string;
  amount?: string;
  quantity?: string;
  unit?: string;
  note?: string;
  group?: string | null;
}

interface Step {
  number: number;
  title?: string;
  shortText?: string;
  text: string;
}

interface Timing {
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
}

interface Nutrition {
  servings?: number;
  calories?: string;
}

interface Props {
  title: string;
  description?: string;
  ingredients: Ingredient[];
  steps: Step[];
  timing?: Timing;
  nutrition?: Nutrition;
  recipeSlug: string;
  featuredImage?: string;
}

// Helper function to format ISO 8601 duration
function formatDuration(duration?: string): string {
  if (!duration) return '';

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return '';

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;

  if (hours && minutes) return `${hours} Std ${minutes} Min`;
  if (hours) return `${hours} Std`;
  if (minutes) return `${minutes} Min`;
  return '';
}

// Normalize units (kg → g, L → ml)
function normalizeUnit(unit: string, amount: number): { amount: number; unit: string } {
  const lowerUnit = unit.toLowerCase();

  if (lowerUnit === 'kg') {
    return { amount: Math.ceil(amount * 1000), unit: 'g' };
  }
  if (lowerUnit === 'l') {
    return { amount: Math.ceil(amount * 1000), unit: 'ml' };
  }

  return { amount: Math.ceil(amount), unit };
}

export default function RecipeCardIsland({ title, description, ingredients, steps, timing, nutrition, recipeSlug, featuredImage }: Props) {
  const baseServings = nutrition?.servings || 1;
  const currentServings = useSignal(baseServings);

  // Calculate scaled ingredients
  const scaledIngredients = useComputed(() => {
    const scale = currentServings.value / baseServings;

    return ingredients.map((ing) => {
      const ingredientName = ing.name || ing.ingredient || '';
      const rawAmount = ing.amount || ing.quantity || '';
      const originalUnit = ing.unit || '';

      // If no amount, return as-is
      if (!rawAmount || isNaN(parseFloat(rawAmount))) {
        return {
          name: ingredientName,
          amount: rawAmount,
          unit: originalUnit,
          note: ing.note,
        };
      }

      const numericAmount = parseFloat(rawAmount);
      const scaledAmount = numericAmount * scale;

      // Normalize units and round up
      const { amount: finalAmount, unit: finalUnit } = normalizeUnit(originalUnit, scaledAmount);

      return {
        name: ingredientName,
        amount: finalAmount.toString(),
        unit: finalUnit,
        note: ing.note,
      };
    });
  });

  const handlePrint = () => {
    if (typeof window !== 'undefined' && window._paq) {
      window._paq.push(['trackEvent', 'Recipe', 'Print', 'Recipe Card']);
    }

    // Create print-specific content
    const recipeCard = document.getElementById('recipe-card');
    if (!recipeCard) return;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Rezept: ' + title + '</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
      @page { margin: 1.5cm; size: A4; }
      body { font-family: Ubuntu, Arial, sans-serif; margin: 0; padding: 20px; }
      .recipe-card { max-width: 100%; }
      .featured-image { width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 20px; }
      h2 { font-size: 24px; margin-bottom: 10px; }
      h3 { font-size: 18px; margin-top: 20px; margin-bottom: 10px; }
      .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 20px 0; }
      .meta-item { text-align: center; padding: 10px; border: 1px solid #ccc; }
      .meta-label { font-size: 11px; color: #666; }
      .meta-value { font-size: 13px; font-weight: bold; }
      ul { list-style: none; padding: 0; }
      ul li { margin: 8px 0; }
      ol { padding-left: 0; }
      ol li { margin: 15px 0; display: flex; gap: 10px; }
      .step-number { flex-shrink: 0; width: 24px; height: 24px; background: #008b8b; color: white;
                      border-radius: 50%; display: flex; align-items: center; justify-content: center;
                      font-weight: bold; font-size: 13px; }
      .step-content { flex: 1; }
      .step-title { font-weight: 600; margin-bottom: 5px; }
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write('<div class="recipe-card">');

    // Add featured image if available
    if (featuredImage) {
      printWindow.document.write('<img src="' + featuredImage + '" alt="' + title + '" class="featured-image" />');
    }

    printWindow.document.write('<h2>' + title + '</h2>');
    if (description) {
      printWindow.document.write('<p>' + description + '</p>');
    }

    // Meta info
    printWindow.document.write('<div class="meta-grid">');
    if (timing?.prepTime) {
      printWindow.document.write('<div class="meta-item"><div class="meta-label">Vorbereitung</div><div class="meta-value">' + formatDuration(timing.prepTime) + '</div></div>');
    }
    if (timing?.cookTime) {
      printWindow.document.write('<div class="meta-item"><div class="meta-label">Kochzeit</div><div class="meta-value">' + formatDuration(timing.cookTime) + '</div></div>');
    }
    if (timing?.totalTime) {
      printWindow.document.write('<div class="meta-item"><div class="meta-label">Gesamt</div><div class="meta-value">' + formatDuration(timing.totalTime) + '</div></div>');
    }
    if (nutrition?.servings) {
      printWindow.document.write('<div class="meta-item"><div class="meta-label">Portionen</div><div class="meta-value">' + currentServings.value + '</div></div>');
    }
    printWindow.document.write('</div>');

    // Ingredients
    printWindow.document.write('<h3>Zutaten</h3>');
    printWindow.document.write('<ul>');
    scaledIngredients.value.forEach(ing => {
      let line = '• ';
      if (ing.amount) line += ing.amount + ' ';
      if (ing.unit) line += ing.unit + ' ';
      line += ing.name;
      if (ing.note) line += ' (' + ing.note + ')';
      printWindow.document.write('<li>' + line + '</li>');
    });
    printWindow.document.write('</ul>');

    // Steps
    printWindow.document.write('<h3>Zubereitung</h3>');
    printWindow.document.write('<ol>');
    steps.forEach(step => {
      printWindow.document.write('<li>');
      printWindow.document.write('<span class="step-number">' + step.number + '</span>');
      printWindow.document.write('<div class="step-content">');
      if (step.title) {
        printWindow.document.write('<div class="step-title">' + step.title + '</div>');
      }
      printWindow.document.write('<div>' + (step.shortText || step.text) + '</div>');
      printWindow.document.write('</div>');
      printWindow.document.write('</li>');
    });
    printWindow.document.write('</ol>');

    printWindow.document.write('<hr style="margin: 20px 0; border: none; border-top: 1px solid #ccc;">');
    printWindow.document.write('<p style="text-align: center; font-size: 12px; color: #666;">Rezept von Die Mama kocht</p>');
    printWindow.document.write('</div></body></html>');

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  let wakeLock: WakeLockSentinel | null = null;
  const isWakeLockActive = useSignal(false);

  const toggleWakeLock = async () => {
    if (isWakeLockActive.value) {
      // Release wake lock
      if (wakeLock) {
        await wakeLock.release();
        wakeLock = null;
        isWakeLockActive.value = false;

        if (typeof window !== 'undefined' && window._paq) {
          window._paq.push(['trackEvent', 'Recipe', 'Wake Lock Disabled', 'Recipe Card']);
        }
      }
    } else {
      // Request wake lock
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
          isWakeLockActive.value = true;

          if (typeof window !== 'undefined' && window._paq) {
            window._paq.push(['trackEvent', 'Recipe', 'Wake Lock Enabled', 'Recipe Card']);
          }

          wakeLock.addEventListener('release', () => {
            isWakeLockActive.value = false;
          });
        } else {
          alert('Screen Wake Lock wird von deinem Browser nicht unterstützt.');
        }
      } catch (err) {
        console.error('Wake Lock error:', err);
        alert('Bildschirm-Wachhalten konnte nicht aktiviert werden.');
      }
    }
  };

  return (
    <div class="recipe-card bg-white rounded-xl shadow-lg border-2 border-accent/20 p-8 mb-8 print:shadow-none print:border print:border-gray-300" id="recipe-card">
      {/* Header */}
      <div class="recipe-card-header mb-6 pb-6 border-b-2 border-accent/10 print:border-gray-300">
        <h2 class="text-3xl font-bold text-gray-900 mb-3 print:text-2xl">{title}</h2>
        {description && (
          <p class="text-gray-700 leading-relaxed print:text-sm">{description}</p>
        )}
      </div>

      {/* Meta Information */}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 print:grid-cols-4 print:gap-2">
        {timing?.prepTime && (
          <div class="flex flex-col items-center p-4 bg-accent/5 rounded-lg print:bg-transparent print:border print:border-gray-300">
            <svg class="w-6 h-6 text-accent mb-2 print:w-5 print:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-xs text-gray-600 mb-1 print:text-[10px]">Vorbereitung</span>
            <span class="text-sm font-semibold text-gray-900 print:text-xs">{formatDuration(timing.prepTime)}</span>
          </div>
        )}

        {timing?.cookTime && (
          <div class="flex flex-col items-center p-4 bg-accent/5 rounded-lg print:bg-transparent print:border print:border-gray-300">
            <svg class="w-6 h-6 text-accent mb-2 print:w-5 print:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
            <span class="text-xs text-gray-600 mb-1 print:text-[10px]">Kochzeit</span>
            <span class="text-sm font-semibold text-gray-900 print:text-xs">{formatDuration(timing.cookTime)}</span>
          </div>
        )}

        {timing?.totalTime && (
          <div class="flex flex-col items-center p-4 bg-accent/5 rounded-lg print:bg-transparent print:border print:border-gray-300">
            <svg class="w-6 h-6 text-accent mb-2 print:w-5 print:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-xs text-gray-600 mb-1 print:text-[10px]">Gesamt</span>
            <span class="text-sm font-semibold text-gray-900 print:text-xs">{formatDuration(timing.totalTime)}</span>
          </div>
        )}

        {nutrition?.servings && (
          <div class="flex flex-col items-center p-4 bg-accent/5 rounded-lg print:bg-transparent print:border print:border-gray-300">
            <svg class="w-6 h-6 text-accent mb-2 print:w-5 print:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span class="text-xs text-gray-600 mb-1 print:text-[10px]">Portionen</span>
            <span class="text-sm font-semibold text-gray-900 print:text-xs">{currentServings.value}</span>
          </div>
        )}
      </div>

      {/* Servings Adjuster */}
      {nutrition?.servings && (
        <div class="mb-6 print:hidden">
          <div class="flex items-center justify-center gap-4 bg-gradient-to-r from-accent/10 to-accent/5 rounded-lg p-4 border border-accent/20">
            <span class="text-sm font-medium text-gray-700">Portionen anpassen:</span>
            <div class="flex items-center gap-3">
              <button
                onClick={() => currentServings.value = Math.max(1, currentServings.value - 1)}
                class="w-8 h-8 flex items-center justify-center bg-white border-2 border-accent text-accent rounded-full hover:bg-accent hover:text-white transition-colors font-bold text-lg"
                aria-label="Portionen reduzieren"
              >
                −
              </button>
              <span class="text-2xl font-bold text-accent min-w-[3rem] text-center">
                {currentServings.value}
              </span>
              <button
                onClick={() => currentServings.value = currentServings.value + 1}
                class="w-8 h-8 flex items-center justify-center bg-white border-2 border-accent text-accent rounded-full hover:bg-accent hover:text-white transition-colors font-bold text-lg"
                aria-label="Portionen erhöhen"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div class="flex flex-wrap gap-3 mb-6 print:hidden">
        <button
          onClick={handlePrint}
          class="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-dark text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
          aria-label="Rezept drucken"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>Drucken</span>
        </button>

        <button
          onClick={toggleWakeLock}
          class={`flex items-center gap-2 px-4 py-2.5 font-medium rounded-lg transition-colors ${
            isWakeLockActive.value
              ? 'bg-green-500 hover:bg-green-600 text-white border-green-600'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300'
          } border`}
          aria-label="Bildschirm aktiv halten"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>{isWakeLockActive.value ? 'Bildschirm aktiv ✓' : 'Bildschirm aktiv'}</span>
        </button>
      </div>

      {/* Ingredients */}
      <div class="mb-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 print:text-lg">
          <svg class="w-5 h-5 text-accent print:w-4 print:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Zutaten
        </h3>
        <ul class="space-y-2 print:space-y-1">
          {scaledIngredients.value.map((ingredient, index) => (
            <li key={index} class="flex items-start gap-2 print:text-sm">
              <span class="text-accent mt-1.5 print:mt-1">•</span>
              <span class="text-gray-900">
                {ingredient.amount && <span class="font-medium">{ingredient.amount} </span>}
                {ingredient.unit && <span>{ingredient.unit} </span>}
                <span>{ingredient.name}</span>
                {ingredient.note && <span class="text-gray-600 text-sm"> ({ingredient.note})</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Instructions */}
      <div class="mb-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 print:text-lg">
          <svg class="w-5 h-5 text-accent print:w-4 print:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          Zubereitung
        </h3>
        <ol class="space-y-4 print:space-y-2">
          {steps.map((step) => (
            <li key={step.number} class="flex gap-3 print:gap-2">
              <span class="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-accent text-white rounded-full font-bold text-sm print:w-6 print:h-6 print:text-xs">
                {step.number}
              </span>
              <div class="flex-1 pt-0.5">
                {step.title && <h4 class="font-semibold text-gray-900 mb-1 print:text-sm">{step.title}</h4>}
                <p class="text-gray-700 leading-relaxed print:text-sm">
                  {step.shortText || step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Footer (Only visible on screen) */}
      <div class="mt-6 pt-6 border-t-2 border-accent/10 text-center text-sm text-gray-600 print:hidden">
        <p>Rezept von <a href="/" class="text-accent hover:underline font-medium">Die Mama kocht</a></p>
      </div>
    </div>
  );
}

// Type declaration for Matomo and Wake Lock
declare global {
  interface Window {
    _paq?: any[];
  }
  interface Navigator {
    wakeLock?: {
      request(type: 'screen'): Promise<WakeLockSentinel>;
    };
  }
  interface WakeLockSentinel {
    release(): Promise<void>;
    addEventListener(type: 'release', listener: () => void): void;
  }
}
