import axios from 'axios';
const axios = require('axios').default;



axios.defaults.baseURL = `https://pixabay.com/api/`;
const API_KEY = `34304009-b05b832d2d75edba0ab9ad9ee`;


async function getPixabayImages(userInput, page) {
  const response = await axios.get(`?key=${API_KEY}&q=${userInput}&image_type=photo&orientation=horizontal&safesearch=true&per_page=40&page=${page}`
  );
  return response;
};


export { getPixabayImages };
