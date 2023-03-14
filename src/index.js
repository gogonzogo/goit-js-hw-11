import { getPixabayImages } from "./js/pixabay-get";
import { Notify } from "notiflix";
import SimpleLightbox from "simplelightbox";
import "simplelightbox/dist/simple-lightbox.min.css";

const refs = {
  body: document.querySelector('body'),
  form: document.querySelector('.search-form'),
  input: document.querySelector('input'),
  searchBtn: document.querySelector('.search-form button'),
  gallery: document.querySelector('.gallery'),
  photoCardContainer: document.querySelector('.gallery__photo-card-container'),
  loadMoreBtn: document.querySelector('.gallery button'),
  searchHistoryContainer: document.querySelector('.search-history__container'),
  searchHistoryList: document.querySelector('.search-history__list'),
  clearHistoryBtn: document.querySelector('.clear-history__btn'),
  scrollToTopBtn: document.querySelector("#myBtn"),
};

refs.searchBtn.disabled = true;
let previousSearchQuery = refs.input.value;
let searchHistory = JSON.parse(localStorage.getItem('queries')) || [];
let page = 1;

function handleAxiosGet(userInput, page) {
  getPixabayImages(userInput, page)
    .then(({ data }) => {
      refs.photoCardContainer.innerHTML += createImageCardMarkup(data.hits);
      new SimpleLightbox('.gallery a').refresh();
      const totalPages = Math.ceil(data.totalHits / 40);
      smoothScrollOnGalleryLoad();
      showLoadMoreBtn();
      if (data.totalHits === 0) {
        Notify.failure('Sorry, there are no images matching your search query. Please try again.');
      } else if (page === 1) {
        Notify.success(`Hooray! We found ${data.totalHits} images.`);
      };

      if (page === totalPages) {
        Notify.info(`We're sorry, but you've reached the end of search results.`);
        hideLoadMoreBtn();
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
  } else if (add !== undefined) {
    searchHistory.splice(searchHistory.indexOf(add), 1);
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
    refs.searchHistoryContainer.classList.remove('is-visible');
    refs.searchHistoryContainer.classList.add('is-hidden');
    createSearchHistoryMarkup();
    hideLoadMoreBtn();
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
    handleAxiosGet(itemToSearch, page);
    refs.searchHistoryContainer.classList.remove('is-visible');
    refs.searchHistoryContainer.classList.add('is-hidden');
    hideLoadMoreBtn();
  };
};

function hideSearchHistory(e) {
  const clearHistoryBtn = document.querySelector('.clear-history__btn');
  if (!refs.searchHistoryContainer.contains(e.target) && e.target !== refs.input) {
    refs.searchHistoryContainer.classList.remove('is-visible');
    refs.searchHistoryContainer.classList.add('is-hidden');
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
  if (userInput.trim() === '') {
    Notify.failure('The search field must not be empty.');
    refs.photoCardContainer.innerHTML = '';
  } else if (!searchHistory.includes(userInput)) {
    refs.input.value = '';
    handleAxiosGet(userInput, page);
    searchHistory.push(userInput);
    localStorage.setItem('queries', JSON.stringify(searchHistory));
    createSearchHistoryMarkup();
    hideSearchHistory(e);
    refs.searchBtn.disabled = true;
    refs.input.blur();
    hideLoadMoreBtn();
  } else {
    refs.input.value = '';
    handleAxiosGet(userInput);
    updateSearchHistory(userInput, undefined);
    hideSearchHistory(e);
    refs.searchBtn.disabled = true;
    refs.input.blur();
    hideLoadMoreBtn();
  };
};

function handleInput(e) {
  let userInput = e.currentTarget.searchQuery.value;
  const currentSearchQuery = userInput;
  if (currentSearchQuery === previousSearchQuery || userInput.trim() === '') {
    refs.searchBtn.disabled = true;
    refs.photoCardContainer.innerHTML = '';
    hideLoadMoreBtn();
  } else {
    previousSearchQuery = currentSearchQuery;
    refs.searchBtn.disabled = false;
  };
};

function createImageCardMarkup(images) {
  return images.map(image => {
    return `<div class="photo-card col">
      <a href="${image.largeImageURL}" data-lightbox="gallery">
      <img src="${image.webformatURL}" alt="${image.tags}" loading="lazy" />
      <div class="info">
        <p class="info-item"><b>Likes</b>${image.likes}</p>
        <p class="info-item"><b>Views</b>${image.views}</p>
        <p class="info-item"><b>Comments</b>${image.comments}</p>
        <p class="info-item"><b>Downloads</b>${image.downloads}</p>
      </div>
      </a>
    </div>`
  }).join('');
};

function showLoadMoreBtn() {
  refs.loadMoreBtn.classList.remove('no.display');
  refs.loadMoreBtn.classList.add('load-more');
};

function hideLoadMoreBtn() {
  refs.loadMoreBtn.classList.remove('load-more');
  refs.loadMoreBtn.classList.add('no.display');
};

function handleLoadMoreBtnClick() {
  page++;
  handleAxiosGet(searchHistory[searchHistory.length - 1], page);
  smoothScrollOnGalleryLoad();
};

function smoothScrollOnGalleryLoad() {
  const { height: cardHeight } = document
    .querySelector(".gallery")
    .firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: 50,
    behavior: "smooth",
  });
};

function scrollToTop() {
  if (document.body.scrollTop > 2000 || document.documentElement.scrollTop > 2000) {
    refs.scrollToTopBtn.style.display = "block";
  } else {
    refs.scrollToTopBtn.style.display = "none";
  }
}

function topFunction() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

window.onscroll = function () { scrollToTop() };
createSearchHistoryMarkup();

refs.scrollToTopBtn.addEventListener('click', topFunction);
refs.loadMoreBtn.addEventListener('click', handleLoadMoreBtnClick);
refs.body.addEventListener('mousedown', hideSearchHistory);
refs.input.addEventListener('blur', hideSearchHistory);
refs.clearHistoryBtn.addEventListener('click', clearSearchHistory);
refs.searchHistoryContainer.addEventListener('click', deleteOrSelectSearchItem);
refs.input.addEventListener('focus', showSearchHistory);
refs.form.addEventListener('input', handleInput);
refs.form.addEventListener('submit', handleSubmit);
