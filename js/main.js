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
        'socket', function($scope, InfoCollection, $location, socket){

    socket.on('basicList', function(data){
        InfoCollection.addAll(data);
        $scope.addActive();
        $scope.updateData();
    });

    socket.on('sentData', function(data){
        $scope.sell = data.sell;
        $scope.buy = data.buy;
        $scope.ratio = data.ratio;
        $scope.prevsell = data.prevsell;
        $scope.prevbuy = data.prevbuy;
        $scope.currentname = data.name;
        $scope.arrowbuy = $scope.buy > $scope.prevbuy;
        $scope.arrowsell = $scope.sell > $scope.prevsell;

    });

    $scope.updateData = function(){
        socket.on('changeList', function(data){
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

        socket.emit('changeCurrency', $scope.current);

        }
    };

    $scope.changeActive = function(id){
        var currentModel = InfoCollection.get({id:id});
        $scope.currentName = currentModel.name;
        $location.hash(currentModel.name);
        InfoCollection.update( {id: $scope.current, active: false} );
        InfoCollection.update( {id: id, active: true} );
        $scope.current = id;
        socket.emit('changeCurrency', $scope.current);
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

app.directive('info', function(){
    return {
        scope: {
            sell: '=',
            buy: '=',
            ratio: '=',
            prevsell: '=',
            prevbuy: '=',
            currentname: '=',
            arrowbuy: '=',
            arrowsell: '='
        },
        restrict: 'E',
        templateUrl: 'js/templates/info.html'
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




