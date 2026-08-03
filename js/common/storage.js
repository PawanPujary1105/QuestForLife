/*************
 * LOAD DATA
 *************/
const QUEST_KEY = "QuestForLife_Data";
const DEFAULT_QFL_DATA = {
  movies: [],
  watchedMovies: [],
  movieLogs: [],
  exercises: [],
  recipes: [],
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
    if (!storedQFLData.exercises) storedQFLData.exercises = [];
    if (!storedQFLData.recipes) storedQFLData.recipes = [];
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
