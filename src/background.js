/* jshint esnext: true */
/* globals chrome */

(function () {
	"use strict";
	chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

		let promiseChrome = new PromiseChrome();
		let url;

		function sendModifyResultPage(tabId, changeInfo, tab) {
			if (tab.url === url && changeInfo.status === 'complete') {
				chrome.tabs.sendMessage(tab.id, request);
				chrome.tabs.onUpdated.removeListener(sendModifyResultPage);
			}
		}
			
		if (request.action == "show") {
			promiseChrome.promiseQuery({
				active: true,
				currentWindow: true
			}).then(function (tabs) {
				chrome.pageAction.show(tabs[0].id);
			});
		} else if (("get_insta_users" === request.action) || ("get_common_users" === request.action)) {
			
			url = chrome.extension.getURL(request.page);

			promiseChrome.promiseCreateTab({
				'url': url,
				'selected': true
			}).then(function (tab) {
				chrome.tabs.onUpdated.addListener(sendModifyResultPage);
			});
		}

	});

	chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {

		var headers = details.requestHeaders;
		//modify Referer to make instagram happier
		for (var header in headers) {
			if (headers[header].name === "eferer") {
				headers[header].name = "Referer";
				break;
			}
		}
		return {
			requestHeaders: details.requestHeaders
		};

	}, {
		urls: ["https://www.instagram.com/query/"]
	},
		['blocking', "requestHeaders"]);
})();
