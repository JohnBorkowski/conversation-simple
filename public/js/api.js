// The Api module is designed to handle all interactions with the server

var Api = (function() {
  var requestPayload;
  var responsePayload;
  var messageEndpoint = '/api/message';
  var convThreads = [];
  var lastContext = {};

  // Publicly accessible methods defined
  return {
    sendRequest: sendRequest,

    // The request/response getters/setters are defined here to prevent internal methods
    // from calling the methods without any of the callbacks that are added elsewhere.
    getRequestPayload: function() {
      return requestPayload;
    },
    setRequestPayload: function(newPayloadStr) {
      requestPayload = JSON.parse(newPayloadStr);
    },
    getResponsePayload: function() {
      return responsePayload;
    },
    setResponsePayload: function(newPayloadStr) {
      responsePayload = JSON.parse(newPayloadStr);
    }
  };

  function promptToContinue() {

  }

  // Send a message request to the server
  function sendRequest(text, context, intents) {
    // Build request payload
    var payloadToWatson = {};
    if (text) {
      payloadToWatson.input = {
        text: text
      };
    }
    if (context) {
      payloadToWatson.context = context;
    }

    if (intents) {
        payloadToWatson.intents = intents;
    }

    // Built http request
    var http = new XMLHttpRequest();
    http.open('POST', messageEndpoint, true);
    http.setRequestHeader('Content-type', 'application/json');
    http.onreadystatechange = function() {
      if (http.readyState === 4 && http.status === 200 && http.responseText) {
        Api.setResponsePayload(http.responseText);

        var responseObj = JSON.parse(http.responseText);

          if (convThreads.length === 0 && (payloadToWatson.input && payloadToWatson.context)) {
              console.log('new');
              convThreads.push(payloadToWatson);
          }
          else if (payloadToWatson.context) {
              if (responseObj.context.previousThread) {
                console.log(convThreads);
                  sendRequest(convThreads[convThreads.length - 1].input.text, convThreads[convThreads.length - 1].context);
              }
              if (payloadToWatson.context.thread) {
                  if (!convThreads[convThreads.length - 1].context.thread || payloadToWatson.context.thread === responseObj.context.thread) {
                      // Update current thread
                      console.log('update');
                      convThreads[convThreads.length - 1] = payloadToWatson;
                  }
                  else if (payloadToWatson.context.thread !== responseObj.context.thread) {
                      // Thread switch
                      console.log('new thread');
                      convThreads.push(payloadToWatson);
                  }

                  if (responseObj.context.completionPct) {
                    if (responseObj.context.completionPct === 100) {
                      console.log('complete');
                      convThreads.pop();

                      if (convThreads.length > 0) {
                        var newContext = {};

                        newContext.showContinue = true;
                        newContext.continuePrompt = convThreads[convThreads.length - 1].context.continuePrompt;

                          console.log(convThreads);
                          convThreads[convThreads.length - 1].context.showContinue = true;
                          setTimeout(function() { sendRequest('', newContext) }, 2000);
                      }
                    }
                  }
              }
          }
      }
    };

    var params = JSON.stringify(payloadToWatson);
    // Stored in variable (publicly visible through Api.getRequestPayload)
    // to be used throughout the application
    if (Object.getOwnPropertyNames(payloadToWatson).length !== 0) {
      Api.setRequestPayload(params);
    }

    // Send request
    http.send(params);
  }
}());
