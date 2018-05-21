
/**
 * Module definition and dependencies
 */
angular.module('DuplicateRequestsFilter.Decorator', [])

/**
 * Config
 */
.config(function($provide) {

  /**
   * Decorator for the $http service
   */
  $provide.decorator('$http', function($delegate, $q) {

    //Pending requests and local $http let for natural reference
    let pendingRequests = {};
    let $http = $delegate;

    /**
     * Hash generator
     */
    function hash(str) {
      let h = 0;
      let strlen = str.length;
      if (strlen === 0) {
        return h;
      }
      for (let i = 0, n; i < strlen; ++i) {
        n = str.charCodeAt(i);
        h = ((h << 5) - h) + n;
        h = h & h;
      }
      return h >>> 0;
    }

    /**
     * Helper to generate a unique identifier for a request
     */
    function getRequestIdentifier(config) {
      let str = config.method + config.url;
      if (config.params && typeof config.params === 'object') {
        str += angular.toJson(config.params);
      }
      if (config.data && typeof config.data === 'object') {
        str += angular.toJson(config.data);
      }
      return hash(str);
    }

    /**
     * Modified $http service
     */
    function $duplicateRequestsFilter(config) {

      //Ignore for this request?
      if (config.ignoreDuplicateRequest) {
        return $http(config);
      }

      //Get unique request identifier
      let identifier = getRequestIdentifier(config);

      //Check if such a request is pending already
      if (pendingRequests[identifier]) {
        if (config.rejectDuplicateRequest) {
          return $q.reject({
            data: '',
            headers: {},
            status: config.rejectDuplicateStatusCode || 400,
            config: config,
          });
        }
        return pendingRequests[identifier];
      }

      //Create promise using $http and make sure it's reset when resolved
      pendingRequests[identifier] = $http(config).finally(() => {
        delete pendingRequests[identifier];
      });

      //Return promise
      return pendingRequests[identifier];
    }

    //Map rest of methods
    Object
      .keys($http)
      .filter(key => (typeof $http[key] === 'function'))
      .forEach(key => $duplicateRequestsFilter[key] = $http[key]);

    //Map defaults
    $duplicateRequestsFilter.defaults = $http.defaults;

    //Return it
    return $duplicateRequestsFilter;
  });
});
