import { useSignal, useComputed } from '@preact/signals';
import { useEffect } from 'preact/hooks';

interface RatingDisplayProps {
  recipeSlug: string;
}

interface RatingData {
  averageRating: number;
  totalRatings: number;
  ratings: { [key: string]: number };
}

export default function RatingDisplay({ recipeSlug }: RatingDisplayProps) {
  const ratingData = useSignal<RatingData | null>(null);
  const isLoading = useSignal<boolean>(true);

  // Fetch rating data
  useEffect(() => {
    const fetchRatingData = async () => {
      try {
        const response = await fetch(`/.netlify/functions/get-rating?recipeSlug=${recipeSlug}`);
        if (response.ok) {
          const data = await response.json();
          ratingData.value = data;
        }
      } catch (error) {
        console.error('Error fetching rating data:', error);
      } finally {
        isLoading.value = false;
      }
    };

    fetchRatingData();
  }, [recipeSlug]);

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

  if (isLoading.value) {
    return (
      <div class="flex items-center gap-2 py-4">
        <div class="animate-pulse flex items-center gap-2">
          <div class="h-6 w-24 bg-gray-200 rounded"></div>
          <div class="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!ratingData.value || ratingData.value.totalRatings === 0) {
    return (
      <div class="flex items-center gap-2 text-gray-500">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <span class="text-sm">Noch keine Bewertungen</span>
      </div>
    );
  }

  return (
    <div class="flex items-center gap-3 bg-gradient-to-r from-accent/5 to-transparent rounded-lg px-6 py-3">
      {/* Star Display */}
      <div class="flex gap-0.5">
        {starPercentages.value.map((percentage, index) => (
          <div key={index} class="relative w-5 h-5">
            {/* Empty star */}
            <svg
              class="absolute inset-0 w-5 h-5 text-gray-300"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {/* Filled star with clip-path */}
            <svg
              class="absolute inset-0 w-5 h-5 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 24 24"
              style={{ clipPath: `inset(0 ${100 - percentage}% 0 0)` }}
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        ))}
      </div>

      {/* Rating Text */}
      <div class="flex items-baseline gap-2">
        <span class="text-xl font-bold text-gray-900">{displayRating.value}</span>
        <span class="text-sm text-gray-600">
          ({ratingData.value.totalRatings} {ratingData.value.totalRatings === 1 ? 'Bewertung' : 'Bewertungen'})
        </span>
      </div>
    </div>
  );
}
