/* globals chrome, document, instaDefOptions, _gaq */

(function () {

  'use strict';

  var defPageSize = instaDefOptions.defPageSize;
  var defDelay = instaDefOptions.defDelay;
  var defFollowDelay = instaDefOptions.defFollowDelay;
  var defLikeDelay = instaDefOptions.defLikeDelay;
  var defPageSizeForFeed = instaDefOptions.defPageSizeForFeed; //and also page size for user profile
  var maxPageSize = instaDefOptions.maxPageSize;
  var maxPageSizeForFeed = instaDefOptions.maxPageSizeForFeed;

  var onKeyUpFunc = function () {
    if (+this.value > +this.max) {
      this.value = this.max;
    }
    if (+this.value < +this.min) {
      this.value = this.min;
    }
  }

  document.getElementById('pageSizeForFeed').onkeyup = onKeyUpFunc;
  document.getElementById('pageSize').onkeyup = onKeyUpFunc;

  function saveOptions() {
    const pageSize = document.getElementById('pageSize').value;
    const delay = document.getElementById('delay').value;
    const followDelay = document.getElementById('followDelay').value;
    const likeDelay = document.getElementById('likeDelay').value;
    const pageSizeForFeed = document.getElementById('pageSizeForFeed').value;
    chrome.storage.sync.set({
      pageSize,
      delay,
      followDelay,
      likeDelay,
      pageSizeForFeed
    }, function () {
      // Update status to let user know that the options were saved.
      var status = document.getElementById('status');
      status.textContent = 'Options were saved.';
      setTimeout(function () {
        status.textContent = '';
      }, 1000);
    });
  }

  function restoreOptions() {
    chrome.storage.sync.get({
      pageSize: defPageSize,
      delay: defDelay,
      followDelay: defFollowDelay,
      likeDelay: defLikeDelay,
      pageSizeForFeed: defPageSizeForFeed
    }, function (items) {
      document.getElementById('pageSize').value = Math.min (items.pageSize, maxPageSize);
      document.getElementById('delay').value = items.delay;
      document.getElementById('followDelay').value = items.followDelay;
      document.getElementById('likeDelay').value = items.likeDelay;
      document.getElementById('pageSizeForFeed').value = Math.min (items.pageSizeForFeed, maxPageSizeForFeed);
    });
  }

  function restoreDefaults() {
    chrome.storage.sync.set({
      pageSize: defPageSize,
      delay: defDelay,
      followDelay: defFollowDelay,
      likeDelay: defLikeDelay,
      pageSizeForFeed: defPageSizeForFeed
    }, function () {
      restoreOptions();
      var status = document.getElementById('status');
      status.textContent = 'Default options were restored.';
      setTimeout(function () {
        status.textContent = '';
      }, 1000);
    });
  }

  document.getElementById('pageSize').setAttribute('max', maxPageSize);
  document.getElementById('emPageSize').innerText =
    document.getElementById('emPageSize').innerText.replace('%x%', maxPageSize);
  document.getElementById('pageSizeForFeed').setAttribute('max', maxPageSizeForFeed);
  document.getElementById('emPageSizeForFeed').innerText =
    document.getElementById('emPageSizeForFeed').innerText.replace('%x%', maxPageSizeForFeed);

  document.addEventListener('DOMContentLoaded', restoreOptions);
  document.getElementById('save').addEventListener('click', saveOptions);
  document.getElementById('restoreDefaults').addEventListener('click', restoreDefaults);

})();

window.onload = function () {
  _gaq.push(['_trackPageview']);
};
