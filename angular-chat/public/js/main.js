angular.module("myApp", ["ngRoute", "angularMoment"]).run(function ($window, $rootScope, $http, $location) {
    $window.moment.locale("zh-cn");
    $http({
        url: "/api/validate",
        method: "GET"
    }).success(function (user) {
        $rootScope.me = user;
        $location.path("/");
    }).error(function (data) {
        $location.path("/login");
    });
    $rootScope.logout = function () {
        $http({
            url: "/api/logout",
            method: "GET"
        }).success(function () {
            $rootScope.me = null;
            $location.path("/login");
        });
    };
    $rootScope.$on("login", function (event, me) {
        $rootScope.me = me;
    })
}).config(function ($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    $routeProvider.when("/", {
        templateUrl: "/pages/room.html",
        controller: "RoomCtrl"
    }).when("/login", {
        templateUrl: "/pages/login.html",
        controller: "LoginCtrl"
    }).otherwise({
        redirectTo: "/login"
    });
}).factory("socket", function ($rootScope) {
    var socket = io.connect("/");
    return {
        on: function (eventName, cb) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    cb.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, cb) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (cb) {
                        cb.apply(socket, args);
                    }
                });
            });
        }
    }
}).directive("autoScrollToBottom", function () {
    return {
        link: function (scope, element, attrs) {
            scope.$watch(
                function () {
                    return element.children().length;
                },
                function () {
                    element.animate({
                        scrollTop: element.prop("scrollHeight")
                    }, 100);
                }
            );
        }
    }
}).directive("ctrlEnterBreakLine", function () {
    return function (scope, element, attrs) {
        var ctrlDown = false;
        element.bind("keydown", function (event) {
            if (event.which === 17) {
                ctrlDown = true;
                setTimeout(function () {
                    ctrlDown = false;
                }, 1000);
            }
            if (event.which === 13) {
                if (!ctrlDown) {
                    element.val(element.val() + "\n");
                } else {
                    scope.$apply(function () {
                        scope.$eval(attrs.ctrlEnterBreakLine);
                    });
                    event.preventDefault();
                }
            }
        });
    }
}).controller("RoomCtrl", function ($scope, socket) {
    console.log($scope.me);
    socket.emit("getRoom", $scope.me);
    socket.on("roomData", function (room) {
        $scope.room = room;
    });
    socket.on("messageAdded", function (message) {
        $scope.room.messages.push(message);
    });
    socket.on("online", function (user) {
        var _userId = user._id;
        if ($scope.room.users.some(function (user, index) {
            if (user._id === _userId) {
                return true;
            }
        })) {
            return;
        }
        $scope.room.users.push(user);
    });
    socket.on("offline", function (user) {
        var _userId = user._id;
        $scope.room.users = $scope.room.users.filter(function (user) {
            return user._id !== _userId
        })
    })
    socket.on("error", function (data) {
        console.error(data);
    })

}).controller("MessageCreatorCtrl", function ($scope, socket) {
    $scope.newMessage = "";
    $scope.createMessage = function () {
        if ($scope.newMessage === "") {
            return;
        }
        socket.emit("createMessage", {
            content: $scope.newMessage,
            creator: $scope.me
        });
        $scope.newMessage = "";
    }
}).controller("LoginCtrl", function ($scope, $http, $location) {
    $scope.login = function () {
        $http({
            url: "/api/login",
            method: "POST",
            data: {
                email: $scope.email
            }
        }).success(function (user) {
            $scope.$emit("login", user);
            $location.path("/");
        }).error(function (data) {
            $location.path("/login");
        });
    };
});
