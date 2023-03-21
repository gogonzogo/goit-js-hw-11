import { getPixabayImages } from "./js/pixabay-get";
import { Notify } from "notiflix";
import SimpleLightbox from "simplelightbox";
import "simplelightbox/dist/simple-lightbox.min.css";
import debounce from "lodash.debounce";

const refs = {
  body: document.querySelector('body'),
  form: document.querySelector('.search-form'),
  input: document.querySelector('input'),
  searchBtn: document.querySelector('.search-form button'),
  gallery: document.querySelector('.gallery'),
  photoCardContainer: document.querySelector('.gallery__photo-card-container'),
  searchHistoryContainer: document.querySelector('.search-history__container'),
  searchHistoryList: document.querySelector('.search-history__list'),
  clearHistoryBtn: document.querySelector('.clear-history__btn'),
  scrollToTopBtn: document.querySelector('.back-to-top__btn'),
  loading: document.querySelector('.loading'),
  lightDarkModeBtn: document.querySelector('.mode-switch__btn'),
  lightDarkIconContainer: document.querySelector('.mode-icon__container'),
};

Notify.init({
  position: 'center-bottom',
  width: '600px',
  height: '100px',
  fontSize: '20px'
});

refs.searchBtn.disabled = true;
let previousSearchQuery = refs.input.value;
let searchHistory = JSON.parse(localStorage.getItem('queries')) || [];
let page = 1;
let perPage = 40;
let newLightBox;


function handleAxiosGet(userInput, perPage, page) {
  newLightBox = new SimpleLightbox('.gallery a');
  getPixabayImages(userInput, perPage, page)
    .then(({ data }) => {
      let totalPages = Math.ceil(data.totalHits / 40);
      if (page === totalPages) {
        Notify.info(`We're sorry, but you've reached the end of search results.`);
        refs.loading.classList.remove('show');
        return;
      };
      console.log('test 2');
      const imageGalleryMarkup = createImageCardMarkup(data.hits);
      refs.photoCardContainer.insertAdjacentHTML('beforeend', imageGalleryMarkup);
      refs.loading.classList.remove('show');
      if (data.totalHits === 0) {
        Notify.failure('Sorry, there are no images matching your search query. Please try again.');
      } else if (page === 1) {
        Notify.success(`Hooray! We found ${data.totalHits} images.`);
      };

    })
    .catch((error) => {
      console.log(error);
    });
};

function updateSearchHistory(add, remove) {
  if (remove !== undefined) {
    searchHistory.splice(searchHistory.indexOf(remove), 1);
    localStorage.setItem('queries', JSON.stringify(searchHistory));
    createSearchHistoryMarkup();
  } else if (add !== undefined && searchHistory.includes(add)) {
    searchHistory.splice(searchHistory.indexOf(add), 1);
    searchHistory.push(add);
    localStorage.setItem('queries', JSON.stringify(searchHistory));
    createSearchHistoryMarkup();
  } else {
    searchHistory.push(add);
    localStorage.setItem('queries', JSON.stringify(searchHistory));
    createSearchHistoryMarkup();
  };
};

function clearSearchHistory(e) {
  if (e.target.nodeName !== 'BUTTON') {
    return;
  } else {
    refs.input.value = '';
    refs.searchBtn.disabled = true;
    refs.photoCardContainer.innerHTML = '';
    searchHistory = [];
    hideSearchHistory(e);
    createSearchHistoryMarkup();
  };
};

function deleteOrSelectSearchItem(e) {
  if (e.target.nodeName === 'BUTTON') {
    const itemToDelete = e.target.previousSibling.textContent;
    updateSearchHistory(undefined, itemToDelete);
  } else if (e.target.nodeName === 'P') {
    const itemToSearch = e.target.firstChild.textContent;
    refs.input.value = '';
    updateSearchHistory(itemToSearch, undefined);
    refs.searchBtn.disabled = true;
    refs.photoCardContainer.innerHTML = '';
    handleAxiosGet(itemToSearch, perPage, page);
    refs.searchHistoryContainer.classList.remove('is-visible');
    refs.searchHistoryContainer.classList.add('is-hidden');
  };
};

function hideSearchHistory(e) {
  // console.log(e.currentTarget);
  const clearHistoryBtn = document.querySelector('.clear-history__btn');
  if (!refs.searchHistoryContainer.contains(e.target) && e.target !== refs.input && e.currentTarget !== clearHistoryBtn) {
    refs.searchHistoryContainer.classList.remove('is-visible');
    refs.searchHistoryContainer.classList.add('is-hidden');
    // } else if (refs.searchHistoryContainer.contains(e.target) && e.target !== clearHistoryBtn) {
    //   refs.searchHistoryContainer.classList.remove('is-hidden');
    //   refs.searchHistoryContainer.classList.add('is-visible');
    // };
  };
};

function showSearchHistory(e) {
  refs.searchHistoryContainer.classList.remove('is-hidden');
  refs.searchHistoryContainer.classList.add('is-visible');
};

function createSearchHistoryMarkup() {
  refs.searchHistoryList.innerHTML = '';
  searchHistory.map(item => {
    const searchItem = document.createElement('li');
    searchItem.classList.add('search-history__item');
    const itemText = document.createElement('p');
    itemText.classList.add('search-item__text');
    const itemDeleteBtn = document.createElement('button');
    itemDeleteBtn.classList.add('item-delete__btn', 'fa-regular', 'fa-square-minus');
    itemText.textContent = item;
    searchItem.appendChild(itemText);
    searchItem.appendChild(itemDeleteBtn);
    refs.searchHistoryList.prepend(searchItem);
  });
};

function handleSubmit(e) {
  e.preventDefault();
  let userInput = e.currentTarget.searchQuery.value;
  refs.photoCardContainer.innerHTML = '';
  handleAxiosGet(userInput, perPage, page);
  refs.input.value = '';
  updateSearchHistory(userInput, undefined);
  hideSearchHistory(e);
  refs.searchBtn.disabled = true;
  refs.input.blur();
};

function handleInput(e) {
  let userInput = e.currentTarget.searchQuery.value;
  const currentSearchQuery = userInput;
  if (currentSearchQuery === previousSearchQuery || userInput.trim() === '') {
    refs.searchBtn.disabled = true;
    refs.photoCardContainer.innerHTML = '';
  } else {
    previousSearchQuery = currentSearchQuery;
    refs.searchBtn.disabled = false;
  };
};

function createImageCardMarkup(images) {
  console.log('Create Images Markup function called');
  return images.map(image => {
    return `<div class="photo-card">
      <a href="${image.largeImageURL}" data-lightbox="gallery">
      <img src="${image.webformatURL}" alt="${image.tags}" loading="lazy" />
      <ul class="info">
        <p class="info-item"><b class="item-title">Likes</b>${image.likes}</p>
        <p class="info-item"><b class="item-title">Views</b>${image.views}</p>
        <p class="info-item"><b class="item-title">Comments</b>${image.comments}</p>
        <p class="info-item"><b class="item-title">Downloads</b>${image.downloads}</p>
      </ul>
      </a>
    </div>`
  }).join('');
};

function loadMoreImages() {
  newLightBox.destroy();
  page++;
  console.log(page);
  handleAxiosGet(searchHistory.at(-1), perPage, page);
};

function infiniteImageScroll(e) {
  e.preventDefault();
  const totalHeight = document.body.scrollHeight;
  const viewportHeight = window.innerHeight;
  const scrollPosition = (totalHeight - viewportHeight) * 0.8;
  if (window.scrollY >= scrollPosition) {
    refs.loading.classList.add('show');
    loadMoreImages();
  };
};

function smoothScrollOnGalleryLoad() {
  const { height: cardHeight } = document
    .querySelector(".gallery")
    .firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 4,
    behavior: "smooth",
  });
};

function showScrollToTopBtn() {
  if (document.body.scrollTop > 1200 || document.documentElement.scrollTop > 1200) {
    refs.scrollToTopBtn.style.display = "block";
  } else {
    refs.scrollToTopBtn.style.display = "none";
  };
};

function scrollToTop() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
};

window.onscroll = function () { showScrollToTopBtn() };
createSearchHistoryMarkup();
let rot = 360;
function toggleLightDarkMode(e) {
  refs.body.classList.toggle('dark-mode');
  const currentRotation = parseInt(getComputedStyle(refs.lightDarkIconContainer)
    .getPropertyValue('--rotation'));
  refs.lightDarkIconContainer.style.setProperty('--rotation', currentRotation + 180);
  console.log(e.currentTarget);
  e.currentTarget.style = 'transform: rotate(' + rot + 'deg)';
  rot += 180;
};

refs.lightDarkModeBtn.addEventListener('click', toggleLightDarkMode);
window.addEventListener('scroll', debounce(infiniteImageScroll, 500));
refs.scrollToTopBtn.addEventListener('click', scrollToTop);
refs.body.addEventListener('mousedown', hideSearchHistory);
refs.input.addEventListener('blur', hideSearchHistory);
refs.clearHistoryBtn.addEventListener('click', clearSearchHistory);
refs.searchHistoryContainer.addEventListener('click', deleteOrSelectSearchItem);
refs.input.addEventListener('focus', showSearchHistory);
refs.form.addEventListener('input', handleInput);
refs.form.addEventListener('submit', handleSubmit);
