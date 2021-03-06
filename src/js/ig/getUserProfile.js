/* globals alert, axios, instaDefOptions, instaMessages, instaTimeout, instaCountdown */
/* jshint -W106 */

const igUserProfileRegularExpression = /window._sharedData = (.*);<\/script>/i;

const instaUserInfo = function () {
};

instaUserInfo.getUserProfile = function (settings) {
  'use strict';

  const {
    username, userId, updateStatusDiv, silient, vueStatus,
  } = settings;

  return new Promise(((resolve, reject) => {
    getUserProfile(username, resolve, reject);
  }));

  function promiseGetUsernameById(userId) {
    return new Promise(((resolve, reject) => {
      getUsernameById(userId, resolve, reject);
    }));
  }

  function getUsernameById(userId, resolve, reject) {
    const link = `https://www.instagram.com/web/friendships/${userId}/follow/`;
    axios.get(link, {}, {})
      .then(
        (response) => {
          const arr = response.data.match(instaDefOptions.regFindUser);
          if ((arr || []).length > 0) {
            resolve(arr[1]);
          } else {
            reject();
          }
        },
        error => function (error) {
          console.log(error); // eslint-disable-line no-console
          const errorCode = error.response ? error.response.status : 0;

          if (errorCode > 0) {
            console.log(`error response data - ${error.response.data}/${errorCode}`); // eslint-disable-line no-console
          }
          console.log(`Error making http request to get ${userId} profile, status - ${errorCode}`); // eslint-disable-line no-console
          console.log(arguments); // eslint-disable-line no-console
          reject();
        },
      );
  }

  function isJson(str) {
    try {
      JSON.parse(JSON.stringify(str));
    } catch (e) {
      return false;
    }
    return true;
  }

  function successGetUserProfile(data, link, resolve) {
    // handle the content is temporary not available
    const json = JSON.parse(igUserProfileRegularExpression.exec(data)[1]);
    if ((json.entry_data.ProfilePage) && (isJson(json.entry_data.ProfilePage[0].graphql.user))) {
      // console.log(json);
      let {
        id,
        username,
        full_name,
        profile_pic_url_hd,
        biography,
        connected_fb_page,
        external_url,
        followed_by_viewer,
        follows_viewer,
        is_private,
        has_requested_viewer,
        blocked_by_viewer,
        requested_by_viewer,
        has_blocked_viewer,
        is_verified,
        is_business_account,
        business_category_name,
        business_email,
        business_phone_number,
      } = json.entry_data.ProfilePage[0].graphql.user;
      const follows_count = json.entry_data.ProfilePage[0].graphql.user.edge_follow.count;
      const followed_by_count = json.entry_data.ProfilePage[0].graphql.user.edge_followed_by.count;
      const media_count = json.entry_data.ProfilePage[0].graphql.user.edge_owner_to_timeline_media.count;

      let latestPostDate;
      if (media_count > 0) { // get the date of the latest post
        if (json.entry_data.ProfilePage[0].graphql.user.edge_owner_to_timeline_media.edges[0]) {
          latestPostDate = new Date(json.entry_data.ProfilePage[0].graphql.user.edge_owner_to_timeline_media.edges[0].node.taken_at_timestamp * 1000);
          // .toLocaleDateString();
        }
      }

      followed_by_viewer = requested_by_viewer ? null : followed_by_viewer;
      follows_viewer = has_requested_viewer ? null : follows_viewer;

      const obj = {};
      Object.assign(obj, {
        id,
        username,
        full_name,
        profile_pic_url_hd,
        biography,
        connected_fb_page,
        external_url,
        followed_by_viewer,
        follows_viewer,
        is_private,
        has_requested_viewer,
        blocked_by_viewer,
        requested_by_viewer,
        has_blocked_viewer,
        follows_count,
        followed_by_count,
        media_count,
        latestPostDate,
        is_verified,
        is_business_account,
        business_category_name,
        business_email,
        business_phone_number,
      });
      resolve(obj);
    } else {
      console.log(`returned data in getUserProfile is not JSON - ${userId}/${link}`); // eslint-disable-line no-console
      console.log(data); // eslint-disable-line no-console
      resolve({ // such user should be removed from result list?
        username: instaDefOptions.you,
        full_name: 'NA',
        biography: 'The detailed user info was not returned by instagram',
        is_private: true,
        followed_by_viewer: false,
        follows_viewer: false,
        follows_count: 0,
        followed_by_count: 0,
        media_count: 0,
      });
    }
  }

  function retryError(message, errorNumber, resolve, reject) {
    updateStatusDiv(message, 'red');
    instaTimeout.setTimeout(3000)
      .then(() => instaCountdown.doCountdown('status', errorNumber, 'Getting users profiles', +(new Date()).getTime() + instaDefOptions.retryInterval, vueStatus))
      .then(() => {
        console.log('Continue execution after HTTP error', errorNumber, new Date()); // eslint-disable-line no-console
        getUserProfile(username, resolve, reject);
      });
  }

  function errorGetUserProfile(error, resolve, reject) {
    console.log(error); // eslint-disable-line no-console
    const errorCode = error.response ? error.response.status : 0;
    if (errorCode > 0) {
      console.log(`error response data - ${error.response.data}/${errorCode}`); // eslint-disable-line no-console
    }
    console.log(`Error making http request to get user profile ${username}, status - ${errorCode}`); // eslint-disable-line no-console

    if (errorCode === 404) {
      console.log('>>>HTTP404 error getting the user profile.', username, new Date()); // eslint-disable-line no-console
      if (userId) {
        console.log(`>>>user id is defined - ${userId}`); // eslint-disable-line no-console
        promiseGetUsernameById(userId).then((username) => {
          console.log('>>>', userId, username); // eslint-disable-line no-console
          getUserProfile(username, resolve, reject);
        }).catch(() => {
          alert(`The error trying to find a new username for - ${userId}`);
        });
      } else {
        if (!silient) {
          alert('404 error trying to retrieve user profile, userid is not specified, check if username is correct');
        }
        reject();
      }
    } else if (instaDefOptions.httpErrorMap.hasOwnProperty(errorCode)) {
      console.log(`HTTP${errorCode} error trying to get the user profile.`, new Date()); // eslint-disable-line no-console
      const message = instaMessages.getMessage(instaDefOptions.httpErrorMap[errorCode], errorCode, +instaDefOptions.retryInterval / 60000);
      retryError(message, errorCode, resolve, reject);
    } else {
      alert(instaMessages.getMessage('ERRGETTINGUSER', username, errorCode));
      reject();
    }
  }

  function getUserProfile(username, resolve, reject) {
    const link = `https://www.instagram.com/${username}/`;

    const config = {
      headers: {
        'x-instagram-ajax': 1,
        eferer: 'https://www.instagram.com/',
      },
    };
    axios.get(link, {}, config)
      .then(
        (response) => {
          successGetUserProfile(response.data, link, resolve);
        },
        error => errorGetUserProfile(error, resolve, reject),
      );
  }
};
