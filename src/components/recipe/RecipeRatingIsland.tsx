import { useSignal, useComputed } from '@preact/signals';
import { useEffect } from 'preact/hooks';

interface RecipeRatingIslandProps {
  recipeSlug: string;
}

interface RatingData {
  averageRating: number;
  totalRatings: number;
  ratings: { [key: string]: number };
}

export default function RecipeRatingIsland({ recipeSlug }: RecipeRatingIslandProps) {
  const ratingData = useSignal<RatingData | null>(null);
  const userRating = useSignal<number>(0);
  const hoveredStar = useSignal<number>(0);
  const isSubmitting = useSignal<boolean>(false);
  const errorMessage = useSignal<string>('');
  const successMessage = useSignal<string>('');

  // Check if user has already rated this recipe
  useEffect(() => {
    const storedRating = localStorage.getItem(`rating_${recipeSlug}`);
    if (storedRating) {
      userRating.value = parseInt(storedRating, 10);
    }
  }, [recipeSlug]);

  // Fetch current rating data
  useEffect(() => {
    fetchRatingData();
  }, [recipeSlug]);

  const fetchRatingData = async () => {
    try {
      const response = await fetch(`/.netlify/functions/get-rating?recipeSlug=${recipeSlug}`);
      if (response.ok) {
        const data = await response.json();
        ratingData.value = data;
      }
    } catch (error) {
      console.error('Error fetching rating data:', error);
    }
  };

  const submitRating = async (rating: number) => {
    if (userRating.value > 0) {
      errorMessage.value = 'Du hast dieses Rezept bereits bewertet.';
      return;
    }

    isSubmitting.value = true;
    errorMessage.value = '';
    successMessage.value = '';

    try {
      const response = await fetch('/.netlify/functions/submit-rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipeSlug,
          rating,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        ratingData.value = data;
        userRating.value = rating;
        localStorage.setItem(`rating_${recipeSlug}`, rating.toString());
        successMessage.value = 'Vielen Dank für deine Bewertung!';

        // Track rating submission in Matomo
        if (typeof window !== 'undefined' && window._paq) {
          window._paq.push(['trackEvent', 'Recipe', 'Rating Submitted', `${rating} stars`, rating]);
        }
      } else {
        errorMessage.value = 'Fehler beim Speichern der Bewertung. Bitte versuche es später erneut.';
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      errorMessage.value = 'Fehler beim Speichern der Bewertung. Bitte versuche es später erneut.';
    } finally {
      isSubmitting.value = false;
    }
  };

  const displayRating = useComputed(() => {
    if (ratingData.value && ratingData.value.totalRatings > 0) {
      return ratingData.value.averageRating.toFixed(1);
    }
    return '0.0';
  });

  const starPercentages = useComputed(() => {
    const avg = ratingData.value?.averageRating || 0;
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1;
      if (avg >= starValue) return 100;
      if (avg > starValue - 1) return (avg - (starValue - 1)) * 100;
      return 0;
    });
  });

  return (
    <div class="bg-gradient-to-r from-accent/5 to-transparent rounded-lg p-6 border border-accent/20">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 class="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
            <svg class="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Rezept bewerten
          </h3>
          {ratingData.value && ratingData.value.totalRatings > 0 && (
            <div class="flex items-center gap-3">
              <span class="text-3xl font-bold text-accent">{displayRating.value}</span>
              <div class="text-sm text-gray-600">
                <div>von 5 Sternen</div>
                <div>({ratingData.value.totalRatings} {ratingData.value.totalRatings === 1 ? 'Bewertung' : 'Bewertungen'})</div>
              </div>
            </div>
          )}
          {(!ratingData.value || ratingData.value.totalRatings === 0) && (
            <p class="text-gray-600">Noch keine Bewertungen</p>
          )}
        </div>

        {/* Star Display */}
        {ratingData.value && ratingData.value.totalRatings > 0 && (
          <div class="flex gap-1">
            {starPercentages.value.map((percentage, index) => (
              <div key={index} class="relative w-8 h-8">
                {/* Empty star */}
                <svg
                  class="absolute inset-0 w-8 h-8 text-gray-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                {/* Filled star with clip-path */}
                <svg
                  class="absolute inset-0 w-8 h-8 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  style={{ clipPath: `inset(0 ${100 - percentage}% 0 0)` }}
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Rating Input */}
      {userRating.value === 0 && (
        <div class="border-t border-accent/10 pt-4">
          <p class="text-sm text-gray-700 mb-3 font-medium">Wie hat dir das Rezept geschmeckt?</p>
          <div class="flex gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => submitRating(star)}
                onMouseEnter={() => (hoveredStar.value = star)}
                onMouseLeave={() => (hoveredStar.value = 0)}
                disabled={isSubmitting.value}
                class="transition-all duration-150 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded"
                aria-label={`${star} ${star === 1 ? 'Stern' : 'Sterne'} vergeben`}
              >
                <svg
                  class={`w-10 h-10 ${
                    (hoveredStar.value >= star || (hoveredStar.value === 0 && userRating.value >= star))
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
          </div>
          {isSubmitting.value && (
            <p class="text-sm text-gray-600">Bewertung wird gespeichert...</p>
          )}
        </div>
      )}

      {/* User has already rated */}
      {userRating.value > 0 && (
        <div class="border-t border-gray-200 pt-4">
          <p class="text-sm text-gray-700 mb-2">Deine Bewertung:</p>
          <div class="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                class={`w-8 h-8 ${star <= userRating.value ? 'text-yellow-400' : 'text-gray-300'}`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {errorMessage.value && (
        <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {errorMessage.value}
        </div>
      )}
      {successMessage.value && (
        <div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          {successMessage.value}
        </div>
      )}
    </div>
  );
}

// Type declaration for Matomo
declare global {
  interface Window {
    _paq?: any[];
  }
}
