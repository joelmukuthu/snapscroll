'use strict';

var scopeObject = {
  snapIndex: '=?',
  snapHeight: '=?',
  beforeSnap: '&',
  afterSnap: '&'
};

var controller = ['$scope', function ($scope) {
  this.setSnapHeight = function (height) {
    $scope.snapHeight = height;
  };
}];

var watchSnapHeight = function (scope, callback) {
  scope.$watch('snapHeight', function (snapHeight) {
    if (angular.isUndefined(snapHeight)) {
      scope.snapHeight = scope.defaultSnapHeight;
      return;
    }
    if (!angular.isNumber(snapHeight)) {
      scope.snapHeight = scope.defaultSnapHeight;
      return;
    }
    if (angular.isFunction(callback)) {
      callback(snapHeight);
    }
  });
};

var watchSnapIndex = function (scope, callback) {
  scope.$watch('snapIndex', function (snapIndex, oldSnapIndex) {
    if (angular.isUndefined(snapIndex)) {
      scope.snapIndex = 0;
      return;
    }
    if (!angular.isNumber(snapIndex)) {
      scope.snapIndex = 0;
      return;
    }
    if (scope.ignoreThisSnapIndexChange) {
      scope.ignoreThisSnapIndexChange = undefined;
      return;
    }
    if (!scope.snapIndexIsValid()) {
      scope.ignoreThisSnapIndexChange = true;
      scope.snapIndex = oldSnapIndex;
      return;
    }
    if (scope.beforeSnap({snapIndex: snapIndex}) === false) {
      scope.ignoreThisSnapIndexChange = true;
      scope.snapIndex = oldSnapIndex;
      return;
    }
    if (angular.isFunction(callback)) {
      callback(snapIndex, function () {
        scope.afterSnap({snapIndex: snapIndex});
      });
    }
  });
};

var snapscrollAsAnAttribute = ['$timeout',
  function ($timeout) {
    return {
      restrict: 'A',
      scope: scopeObject,
      controller: controller,
      link: function (scope, element, attributes) {
        var init,
            snapTo,
            onScroll,
            bindScroll,
            unbindScroll,
            scrollPromise = 0,
            scrollDelay = attributes.scrollDelay;
        
        snapTo = function (index) {
          unbindScroll();
          element[0].scrollTop = index * scope.snapHeight;
          bindScroll();
        };
        
        onScroll = function () {
          var snap = function () {
            var top = element[0].scrollTop,
                previousSnapIndex = scope.snapIndex,
                newSnapIndex = Math.round(top / scope.snapHeight);
            if (previousSnapIndex === newSnapIndex) {
              snapTo(newSnapIndex);
            } else {
              scope.$apply(function () {
                scope.snapIndex = newSnapIndex;
              });
            }
          };
          if (scrollDelay === false) {
            snap();
          } else {
            $timeout.cancel(scrollPromise);
            scrollPromise = $timeout(snap, scrollDelay);
          }
        };
        
        bindScroll = function () {
          element.on('scroll', onScroll);
        };
        
        unbindScroll = function () {
          element.off('scroll', onScroll);
        };
        
        init = function () {
          if (scrollDelay === 'false') {
            scrollDelay = false;
          } else {
            scrollDelay = parseInt(scrollDelay);
            if (isNaN(scrollDelay)) {
              scrollDelay = 250;
            }
          }
          
          scope.defaultSnapHeight = element[0].offsetHeight;

          scope.snapIndexIsValid = function () {
            return scope.snapIndex >= 0 && scope.snapIndex < element.children().length;
          };

          element.css('overflowY', 'auto');

          watchSnapHeight(scope, function () {
            var snaps = element.children();
            element.css('height', scope.snapHeight + 'px');
            if (snaps.length) {
              angular.forEach(snaps, function (snap) {
                angular.element(snap).css('height', scope.snapHeight + 'px');
              });
            }
            snapTo(scope.snapIndex);
          });

          watchSnapIndex(scope, function (snapIndex, afterSnap) {
            snapTo(snapIndex);
            if (angular.isFunction(afterSnap)) {
              afterSnap.call();
            }
          });

          bindScroll();
          scope.$on('$destroy', unbindScroll);
        };
        
        init();
      }
    };
  }
];

var snapscrollAsAnElement = [
  function () {
    return {
      restrict: 'E',
      scope: scopeObject,
      controller: controller,
      link: function (scope) {
        scope.defaultSnapHeight = 0;
        scope.snapIndexIsValid = function () {
          // TBD: return scope.snapIndex >= 0 && something else here..;
          return true;
        };
        watchSnapHeight(scope, function () {
          // TBD: element.css('height', scope.snapHeight + 'px');
        });
        watchSnapIndex(scope, function (snapIndex, afterSnap) {
          // TBD
          if (angular.isFunction(afterSnap)) {
            afterSnap.call();
          }
        });
      }
    };
  }
];

angular.module('snapscroll')
  .directive('snapscroll', snapscrollAsAnAttribute)
  .directive('snapscroll', snapscrollAsAnElement);