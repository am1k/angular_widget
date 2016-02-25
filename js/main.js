var app = angular.module('app', ['ngCollection', 'ui.router']);


app.config(['$stateProvider', function($stateProvider){
    $stateProvider
        .state("navigation", {
            url: ':name',
            templateUrl: 'application.html',
            controller: 'applicationCtrl'
        });
}]);

app.controller('applicationCtrl', ['$scope', 'InfoCollection', '$location', function($scope, InfoCollection, $location){

    var hash = $location.hash(),
        ind = 0;
    $scope.currentName = hash;
    $scope.items = InfoCollection.all();

    if(hash){
        for(var i = 0; i < $scope.items.length; i++){
            if($scope.items[i].name == hash){
                ind = i;
                break;
            }
        }
    }
    $scope.current = InfoCollection.at(ind).id;

    $scope.changeActive = function(id){
        var currentModel = InfoCollection.get({id:id});
        $scope.currentName = currentModel.name;
        $location.hash(currentModel.name);
        InfoCollection.update( {id: $scope.current, active: false} );
        InfoCollection.update( {id: id, active: true} );
        $scope.current = id;
    };

}]);

app.directive('clock', function($timeout){
    return {
        restrict: 'E',
        scope: {
            time: '=',
            data: '='
        },
        templateUrl: 'js/templates/clock.html',
        link: function(scope){

            this.updateTime = function(){

                scope.data = this.setDate();
                scope.time = this.setTime();

                $timeout(this.updateTime.bind(this),1000);
            };

            this.setDate = function(){
                var date = moment().format('MM/DD/YYYY');
                return date;
            };

            this.setTime = function(){
                var getTime = moment().format('HH:mm:ss');
                return getTime;
            };

            this.updateTime();
        }
    }
});

app.directive('info', function($timeout,Mediator){
    return {
        restrict: 'E',
        templateUrl: 'js/templates/info.html',
        controller: function($scope){

            Mediator.subscribe('sellRatio:refresh', function(data){
                data.arrowBuy = data.buy > data.prevBuy;
                data.arrowSell = data.sell > data.prevSell;
                Object.assign($scope, data);
            });
        }
    }
});

app.directive('list', function($timeout, generateRandom, Mediator){
    return {
        scope: {
            min: '=',
            max: '=',
            name: '=',
            delay: '=',
            active: '=',
            items: '=',
            id: '=',
            changeactive: '='
        },
        restrict: 'E',
        templateUrl: 'js/templates/list-item.html',


        controller: function ($scope) {

            console.log($scope);

            function updateList(){
                var buyRatio = generateRandom($scope.min, $scope.max);
                $scope.prevBuy = $scope.buy || 0;
                $scope.prevSell = $scope.sell || 0;
                $scope.sellRatio = 100 - buyRatio;
                $scope.buyRatio = buyRatio;
                $scope.sell = generateRandom($scope.min, $scope.max);
                $scope.buy = generateRandom($scope.min, $scope.max);
                $scope.ratio = generateRandom($scope.min, $scope.max);

                if($scope.active) {
                    sendData();
                }

                $timeout(updateList, $scope.delay);
            }

            updateList();

            function sendData(){
                Mediator.publish('sellRatio:refresh', {
                    sell: $scope.sell,
                    buy: $scope.buy,
                    ratio: $scope.ratio,
                    prevBuy: $scope.prevBuy,
                    prevSell: $scope.prevSell
                });
            }
        },

        link: function(scope, elem){
        }
    }
});

app.factory('InfoCollection', function($collection){

    var InfoCollection = $collection;

    var info = InfoCollection.getInstance();

    info.add(
        {min:1, max:5, name:'usa/rus', delay: 3000, active: false}
    );
    info.add(
        {min:5, max:10, name:'usa/gbr', delay: 2000, active: false}
    );
    info.add(
        {min:10, max:50, name:'usa/chi', delay: 4000, active: false}
    );

    return info;
});


app.service('generateRandom', function(){
    return function(min, max){
        return (Math.random() * (min, max)).toFixed();
    };
});

app.service('Mediator', function(){

    var channels = {}; // Associative object.

    this.publish = function(channel, data) {
        if (! channels[channel]) {
            return;
        }
        var args = Array.prototype.slice.call(arguments, 1);
        var subscribers = channels[channel];
        for( var i = 0; i < subscribers.length; i++) {
            var subscriber = subscribers[i];
            subscriber.apply(subscriber.context, args);
        }

    };

    this.subscribe = function(channel, cb) {
        if (! channels[channel]) {
            channels[channel] = [];
        }
        return channels[channel].push(cb);
    };

    this.unsubscribe = function (channel) {
        if (! channels[channel]) {
            return false;
        }
        if (channels[channel]) {
            var removed = channels[channel].splice(arguments, 1);
            return (removed.length > 0);
        }

        return false;
    };

});
