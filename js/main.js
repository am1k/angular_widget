var app = angular.module('app', ['ngCollection', 'ui.router']);


app.config(['$stateProvider', function($stateProvider){
    $stateProvider
        .state("navigation", {
            url: ':name',
            templateUrl: 'application.html',
            controller: 'applicationCtrl'
        });
}]);

app.service('socket', function(){

    var socket = io.connect('http://localhost:3000');
    return socket;
});

app.controller('applicationCtrl',
    [   '$scope',
        'InfoCollection',
        '$location',
        'socket',
        'Mediator', function($scope, InfoCollection, $location, socket, Mediator){

    socket.on('basicData', function(data){
        InfoCollection.addAll(data);
        $scope.updateData();
    });


    $scope.updateData = function(){
        socket.on('sentData', function(data){
            console.log(data);
            InfoCollection.update( data );
            $scope.addActive();
        });
    };

    $scope.addActive = function(){
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
        var current = InfoCollection.at(ind);

        if(current !== undefined){
            $scope.current = current.id;
            InfoCollection.update({id: current.id, active: true});

            function sendData(){

                var currentModel = InfoCollection.get(current.id);
                Mediator.publish('sellRatio:refresh', {
                    sell: currentModel.sell,
                    buy: currentModel.buy,
                    ratio: currentModel.ratio,
                    prevBuy: currentModel.prevBuy,
                    prevSell: currentModel.prevSell
                });
            }
            sendData();
        }
    };

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

app.directive('list', function(){
    return {
        scope: {
            name: '=',
            sellratio: '=',
            buyratio: '=',
            active: '=',
            items: '=',
            id: '=',
            sell: '=',
            ratio: '=',
            buy: '=',
            changeactive: '='
        },
        restrict: 'E',
        templateUrl: 'js/templates/list-item.html'
    }
});

app.factory('InfoCollection', function($collection){

    var InfoCollection = $collection;

    var info = InfoCollection.getInstance();

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



