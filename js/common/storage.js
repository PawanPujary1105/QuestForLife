/*************
 * LOAD DATA
 *************/
const QUEST_KEY = "QuestForLife_Data";
const DEFAULT_QFL_DATA = {
  movies: [],
  watchedMovies: [],
  movieLogs: [],
  exercises: [],
  workoutPlans: [],
  gymLogs: [],
  recipes: [],
  outfits: [],
  outfitLogs: [],
  outfitOccasions: ["Office", "Gym"],
  releasePulse: null,
};

export const questForLifeData = loadState();

export function loadState() {
  try {
    const storedQFLDataString = localStorage.getItem(QUEST_KEY);
    if (!storedQFLDataString) {
      localStorage.setItem(QUEST_KEY, JSON.stringify(DEFAULT_QFL_DATA));
      return structuredClone(DEFAULT_QFL_DATA);
    }
    const storedQFLData = JSON.parse(storedQFLDataString);
    // Basic shape sanity:
    if (!storedQFLData.movies) storedQFLData.movies = [];
    if (!storedQFLData.watchedMovies) storedQFLData.watchedMovies = [];
    if (!storedQFLData.movieLogs) storedQFLData.movieLogs = [];
    if (!Array.isArray(storedQFLData.exercises)) storedQFLData.exercises = [];
    if (!Array.isArray(storedQFLData.workoutPlans)) storedQFLData.workoutPlans = [];
    if (!Array.isArray(storedQFLData.gymLogs)) storedQFLData.gymLogs = [];
    if (!Array.isArray(storedQFLData.recipes)) storedQFLData.recipes = [];
    if (!storedQFLData.outfits) storedQFLData.outfits = [];
    if (!storedQFLData.outfitLogs) storedQFLData.outfitLogs = [];
    if (!Array.isArray(storedQFLData.outfitOccasions)) {
      storedQFLData.outfitOccasions = [...DEFAULT_QFL_DATA.outfitOccasions];
    }
    storedQFLData.outfitOccasions = [
      ...new Set([
        ...DEFAULT_QFL_DATA.outfitOccasions,
        ...storedQFLData.outfitOccasions,
        ...(storedQFLData.outfits || []).map((outfit) => outfit.occasion).filter(Boolean),
      ]),
    ];
    return storedQFLData;
  } catch (e) {
    console.warn("Data fetch from local storage: ", e);
    localStorage.setItem(QUEST_KEY, JSON.stringify(DEFAULT_QFL_DATA));
    return structuredClone(DEFAULT_QFL_DATA);
  }
}

export function saveState(tab = "unwatched") {
  localStorage.setItem(QUEST_KEY, JSON.stringify(questForLifeData));
}
