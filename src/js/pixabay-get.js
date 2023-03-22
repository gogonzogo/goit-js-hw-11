import axios from 'axios';

axios.defaults.baseURL = `https://pixabay.com/api/`;
const API_KEY = `34304009-b05b832d2d75edba0ab9ad9ee`;


async function handlePixabayGet(userInput, perPage, page) {
  const response = await axios.get(`?key=${API_KEY}&q=${userInput}&image_type=image&orientation=horizontal&safesearch=true&per_page=${perPage}&page=${page}`
  );
  return response;
};


export { handlePixabayGet };
